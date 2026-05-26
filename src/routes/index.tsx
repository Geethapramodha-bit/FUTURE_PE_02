import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Instagram,
  Facebook,
  Youtube,
  Music2,
  Linkedin,
  Twitter,
  Sparkles,
  Moon,
  Sun,
  Save,
  Download,
  Share2,
  Loader2,
  RefreshCcw,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "ContentForge — AI Marketing Content Generator" },
      {
        name: "description",
        content:
          "Generate scroll-stopping hooks, CTAs, UGC scripts, and captions tailored to Instagram, TikTok, YouTube, Facebook, LinkedIn, and X.",
      },
    ],
  }),
});

type Platform = {
  id: string;
  name: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
};

const PLATFORMS: Platform[] = [
  { id: "Instagram", name: "Instagram", Icon: Instagram, color: "from-pink-500 to-orange-400" },
  { id: "TikTok", name: "TikTok", Icon: Music2, color: "from-fuchsia-500 to-cyan-400" },
  { id: "YouTube", name: "YouTube", Icon: Youtube, color: "from-red-500 to-rose-400" },
  { id: "Facebook", name: "Facebook", Icon: Facebook, color: "from-blue-600 to-sky-400" },
  { id: "LinkedIn", name: "LinkedIn", Icon: Linkedin, color: "from-sky-700 to-blue-400" },
  { id: "X (Twitter)", name: "X / Twitter", Icon: Twitter, color: "from-zinc-700 to-zinc-400" },
];

const CONTENT_TYPES = [
  { id: "Hooks", desc: "Scroll-stopping openers" },
  { id: "CTAs", desc: "Action-driving prompts" },
  { id: "UGC-style content", desc: "Creator-style scripts" },
  { id: "Captions", desc: "Ready-to-post copy" },
];

function Index() {
  const [dark, setDark] = useState(false);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [count, setCount] = useState(3);
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, Record<string, string[]>> | null>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("cf-theme");
    const prefersDark = saved ? saved === "dark" : window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    setDark(!!prefersDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    if (typeof window !== "undefined") localStorage.setItem("cf-theme", dark ? "dark" : "light");
  }, [dark]);

  const togglePlatform = (id: string) =>
    setPlatforms((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const toggleType = (id: string) =>
    setTypes((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));

  const selectAllTypes = () =>
    setTypes(types.length === CONTENT_TYPES.length ? [] : CONTENT_TYPES.map((c) => c.id));

  async function generate() {
    if (platforms.length === 0) return toast.error("Select at least one platform");
    if (types.length === 0) return toast.error("Select at least one content type");
    if (subject.trim().length < 3)
      return toast.error("Describe your product, service, or topic (at least 3 characters)");
    setLoading(true);
    setResults(null);
    try {
      const all: Record<string, Record<string, string[]>> = {};
      await Promise.all(
        platforms.map(async (platform) => {
          const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ platform, types, count, subject, details }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || "Failed");
          all[platform] = data.results || {};
        }),
      );
      setResults(all);
      setTimeout(
        () => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }),
        50,
      );
    } catch (e: any) {
      toast.error(e?.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function flattenText() {
    if (!results) return "";
    const parts: string[] = [];
    for (const [platform, cats] of Object.entries(results)) {
      parts.push(`=== ${platform} ===\n`);
      for (const [cat, items] of Object.entries(cats)) {
        parts.push(`-- ${cat} --`);
        items.forEach((it, i) => parts.push(`${i + 1}. ${it}`));
        parts.push("");
      }
    }
    return parts.join("\n");
  }

  function onSave() {
    try {
      const stored = JSON.parse(localStorage.getItem("cf-saved") || "[]");
      stored.unshift({ at: new Date().toISOString(), platforms, types, results });
      localStorage.setItem("cf-saved", JSON.stringify(stored.slice(0, 20)));
      toast.success("Saved locally");
    } catch {
      toast.error("Could not save");
    }
  }

  function onExport() {
    const blob = new Blob([flattenText()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contentforge-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onShare() {
    const text = flattenText();
    if (navigator.share) {
      try {
        await navigator.share({ title: "ContentForge results", text });
      } catch {
        /* ignored */
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    }
  }

  async function copyItem(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  return (
    <div className="min-h-screen">
      <Toaster richColors position="top-center" />

      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur-md bg-background/60 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl grid place-items-center text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold tracking-tight">ContentForge</div>
              <div className="text-xs text-muted-foreground -mt-0.5">AI marketing copy, on tap</div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setDark((d) => !d)} aria-label="Toggle theme">
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-10 md:py-14">
        {/* Hero */}
        <section className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs text-muted-foreground mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Powered by Lovable AI
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Scroll-stopping content,{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              tailored per platform
            </span>
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Generate hooks, CTAs, UGC scripts, and captions optimized for each platform's audience and format —
            in seconds.
          </p>
        </section>

        {/* Platforms */}
        <Card className="border-border/60 shadow-[var(--shadow-card)] overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base font-semibold">1. Choose your platform(s)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {PLATFORMS.map(({ id, name, Icon, color }) => {
                const active = platforms.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => togglePlatform(id)}
                    className={`relative group rounded-xl border p-4 flex flex-col items-center gap-2 transition-all ${
                      active
                        ? "border-primary bg-accent/40 shadow-[var(--shadow-glow)]"
                        : "border-border hover:border-primary/60 hover:bg-accent/30"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg grid place-items-center text-white bg-gradient-to-br ${color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">{name}</span>
                    {active && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground grid place-items-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Subject */}
        <Card className="border-border/60 shadow-[var(--shadow-card)] mt-5">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              2. What are you promoting?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="subject" className="text-sm">
              Describe your product, service, app, or topic
            </Label>
            <Textarea
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. A meal-planning app that builds weekly grocery lists from your diet preferences and budget."
              rows={3}
              maxLength={600}
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>The AI tailors every hook, CTA, and caption to this.</span>
              <span>{subject.length}/600</span>
            </div>
          </CardContent>
        </Card>

        {/* Content types + count */}
        <div className="grid lg:grid-cols-2 gap-5 mt-5">
          <Card className="border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">3. What should we generate?</CardTitle>
              <Button variant="ghost" size="sm" onClick={selectAllTypes}>
                {types.length === CONTENT_TYPES.length ? "Clear" : "Select all"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {CONTENT_TYPES.map((c) => {
                const active = types.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      active ? "border-primary bg-accent/40" : "border-border hover:bg-accent/20"
                    }`}
                  >
                    <Checkbox checked={active} onCheckedChange={() => toggleType(c.id)} className="mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">{c.id}</div>
                      <div className="text-xs text-muted-foreground">{c.desc}</div>
                    </div>
                  </label>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base font-semibold">4. Tune your output</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">Outputs per category</Label>
                  <span className="text-sm font-semibold text-primary">{count}</span>
                </div>
                <Slider
                  value={[count]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(v) => setCount(v[0])}
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">
                  Additional direction <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="e.g. storytelling style, emotional tone, short-form, target audience: fitness coaches"
                  rows={4}
                  maxLength={800}
                />
                <div className="text-[11px] text-muted-foreground mt-1 text-right">{details.length}/800</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            onClick={generate}
            disabled={loading}
            className="text-base px-8 h-12 text-primary-foreground border-0 shadow-[var(--shadow-glow)]"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" /> Generate content
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {results && (
          <section id="results" className="mt-14 scroll-mt-24">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold tracking-tight">Your content</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onSave}>
                  <Save className="w-4 h-4 mr-1.5" /> Save
                </Button>
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="w-4 h-4 mr-1.5" /> Export
                </Button>
                <Button variant="outline" size="sm" onClick={onShare}>
                  <Share2 className="w-4 h-4 mr-1.5" /> Share
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {Object.entries(results).map(([platform, cats]) => {
                const meta = PLATFORMS.find((p) => p.id === platform);
                const Icon = meta?.Icon ?? Sparkles;
                return (
                  <Card key={platform} className="border-border/60 shadow-[var(--shadow-card)]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div
                          className={`w-8 h-8 rounded-lg grid place-items-center text-white bg-gradient-to-br ${
                            meta?.color ?? "from-primary to-primary"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {platform}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {Object.entries(cats).map(([cat, items]) => (
                        <div key={cat}>
                          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                            {cat}
                          </div>
                          <div className="grid sm:grid-cols-2 gap-3">
                            {items.map((item, i) => (
                              <button
                                key={i}
                                onClick={() => copyItem(item)}
                                className="text-left p-4 rounded-lg border border-border bg-card hover:border-primary/60 hover:bg-accent/30 transition-colors text-sm leading-relaxed"
                                title="Click to copy"
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Satisfaction */}
            <Card className="mt-8 border-border/60 shadow-[var(--shadow-card)] bg-accent/30">
              <CardContent className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">Are you satisfied with these results?</div>
                  <div className="text-sm text-muted-foreground">
                    Tweak your inputs and regenerate for a fresh take.
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => toast.success("Glad you liked it!")}>
                    <Check className="w-4 h-4 mr-1.5" /> Yes, love it
                  </Button>
                  <Button
                    onClick={generate}
                    disabled={loading}
                    className="text-primary-foreground border-0"
                    style={{ backgroundImage: "var(--gradient-primary)" }}
                  >
                    <RefreshCcw className="w-4 h-4 mr-1.5" /> Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        <footer className="mt-16 text-center text-xs text-muted-foreground">
          Built with ContentForge · Outputs are AI-generated — review before publishing.
        </footer>
      </main>
    </div>
  );
}
