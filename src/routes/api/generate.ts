import { createFileRoute } from "@tanstack/react-router";

type Body = {
  platform: string;
  types: string[];
  count: number;
  subject?: string;
  details?: string;
};

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const platform = String(body.platform || "").slice(0, 60);
        const types = Array.isArray(body.types) ? body.types.slice(0, 10).map(String) : [];
        const count = Math.max(1, Math.min(10, Number(body.count) || 3));
        const subject = String(body.subject || "").trim().slice(0, 600);
        const details = String(body.details || "").slice(0, 800);

        if (!platform || types.length === 0 || subject.length < 3) {
          return new Response(
            JSON.stringify({ error: "platform, types, and subject (min 3 chars) are required" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        const systemPrompt = `You are an expert social media marketing strategist. Generate professional, platform-specific marketing content optimized for the chosen platform's audience, format, and best practices. Every output MUST be directly grounded in the user's product/topic — never generic. Output ONLY valid JSON matching the requested schema — no commentary.`;

        const userPrompt = `Platform: ${platform}

PRODUCT / TOPIC TO PROMOTE:
"""
${subject}
"""

Generate exactly ${count} item(s) for EACH of the following categories: ${types.join(", ")}.
${details ? `Additional direction: ${details}` : ""}

Requirements:
- Every item must explicitly reference or speak to the product/topic above — no generic filler.
- Tone: professional, polished, on-brand.
- Tailor length & style to ${platform} (e.g. YouTube hooks longer & curiosity-driven; Instagram captions punchy with line breaks; TikTok hooks ultra-snappy; Facebook conversational; LinkedIn insight-led; X concise & sharp).
- "Hooks": scroll-stopping opening lines about this product/topic.
- "CTAs": clear, action-oriented calls-to-action for this product/topic.
- "UGC-style content": authentic, first-person creator-style scripts (2-4 sentences each) featuring the product/topic.
- "Captions": ready-to-post captions including 3-6 relevant hashtags where appropriate.

Return JSON of shape: { "results": { "<category>": ["item1", "item2", ...] } } using the EXACT category names provided.`;

        try {
          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              response_format: { type: "json_object" },
            }),
          });

          if (!aiRes.ok) {
            const txt = await aiRes.text();
            if (aiRes.status === 429) {
              return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
                status: 429,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (aiRes.status === 402) {
              return new Response(
                JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }),
                { status: 402, headers: { "Content-Type": "application/json" } },
              );
            }
            console.error("AI gateway error", aiRes.status, txt);
            return new Response(JSON.stringify({ error: "AI gateway error" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const data = (await aiRes.json()) as any;
          const content = data?.choices?.[0]?.message?.content ?? "{}";
          let parsed: any;
          try {
            parsed = JSON.parse(content);
          } catch {
            parsed = { results: {} };
          }

          return new Response(JSON.stringify(parsed), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          console.error("generate error", e);
          return new Response(JSON.stringify({ error: "Unexpected error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
