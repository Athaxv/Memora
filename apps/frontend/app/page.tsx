import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   Background — warm ember atmosphere
   ───────────────────────────────────────────── */

function EmberBackground() {
  return (
    <div className="grain-overlay pointer-events-none fixed inset-0 overflow-hidden">
      {/* Base gradient — dark center, warm edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,_#431407_0%,_#0C0A09_60%)]" />

      {/* Bottom warm glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_110%,_rgba(194,65,12,0.15)_0%,_transparent_60%)]" />

      {/* Floating orbs */}
      <div
        className="animate-float absolute -left-32 top-[10%] h-[500px] w-[500px] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #f97316 0%, transparent 70%)" }}
      />
      <div
        className="animate-float absolute -right-32 top-[35%] h-[600px] w-[600px] rounded-full opacity-10 blur-3xl"
        style={{
          background: "radial-gradient(circle, #ea580c 0%, transparent 70%)",
          animationDelay: "2s",
          animationDuration: "8s",
        }}
      />
      <div
        className="animate-float absolute bottom-[10%] left-[40%] h-[400px] w-[400px] rounded-full opacity-15 blur-3xl"
        style={{
          background: "radial-gradient(circle, #fb923c 0%, transparent 70%)",
          animationDelay: "4s",
          animationDuration: "10s",
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(249,115,22,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249,115,22,0.3) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Constellation nodes */}
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        {[
          { cx: "10%", cy: "18%", r: 2, d: "0s" },
          { cx: "22%", cy: "32%", r: 1.5, d: "0.5s" },
          { cx: "38%", cy: "12%", r: 2.5, d: "1s" },
          { cx: "52%", cy: "42%", r: 1.8, d: "1.5s" },
          { cx: "68%", cy: "22%", r: 2, d: "0.3s" },
          { cx: "82%", cy: "38%", r: 1.5, d: "0.8s" },
          { cx: "28%", cy: "58%", r: 2, d: "1.2s" },
          { cx: "62%", cy: "62%", r: 1.5, d: "0.6s" },
          { cx: "78%", cy: "68%", r: 2.5, d: "1.8s" },
          { cx: "14%", cy: "72%", r: 1.8, d: "0.4s" },
          { cx: "48%", cy: "78%", r: 2, d: "1.1s" },
          { cx: "88%", cy: "14%", r: 1.5, d: "0.7s" },
        ].map((dot, i) => (
          <circle
            key={i}
            cx={dot.cx}
            cy={dot.cy}
            r={dot.r}
            fill="#fb923c"
            opacity="0.5"
            className="animate-pulse-glow"
            style={{ animationDelay: dot.d }}
          />
        ))}
        {/* Faint connection lines */}
        <line x1="10%" y1="18%" x2="22%" y2="32%" stroke="#f97316" strokeWidth="0.5" opacity="0.08" />
        <line x1="22%" y1="32%" x2="38%" y2="12%" stroke="#f97316" strokeWidth="0.5" opacity="0.06" />
        <line x1="38%" y1="12%" x2="68%" y2="22%" stroke="#f97316" strokeWidth="0.5" opacity="0.08" />
        <line x1="68%" y1="22%" x2="82%" y2="38%" stroke="#f97316" strokeWidth="0.5" opacity="0.05" />
        <line x1="52%" y1="42%" x2="62%" y2="62%" stroke="#f97316" strokeWidth="0.5" opacity="0.07" />
        <line x1="28%" y1="58%" x2="48%" y2="78%" stroke="#f97316" strokeWidth="0.5" opacity="0.06" />
        <line x1="14%" y1="72%" x2="28%" y2="58%" stroke="#f97316" strokeWidth="0.5" opacity="0.05" />
        <line x1="78%" y1="68%" x2="82%" y2="38%" stroke="#f97316" strokeWidth="0.5" opacity="0.07" />
        <line x1="62%" y1="62%" x2="78%" y2="68%" stroke="#f97316" strokeWidth="0.5" opacity="0.06" />
        <line x1="52%" y1="42%" x2="68%" y2="22%" stroke="#f97316" strokeWidth="0.5" opacity="0.05" />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Navbar
   ───────────────────────────────────────────── */

function Navbar() {
  return (
    <nav className="animate-fade-in relative z-10 flex items-center justify-between px-6 py-5 md:px-12 lg:px-20">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ember-500/10 backdrop-blur-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <circle cx="5" cy="6" r="1.5" />
            <circle cx="19" cy="6" r="1.5" />
            <circle cx="5" cy="18" r="1.5" />
            <circle cx="19" cy="18" r="1.5" />
            <line x1="9.5" y1="10" x2="6" y2="7" />
            <line x1="14.5" y1="10" x2="18" y2="7" />
            <line x1="9.5" y1="14" x2="6" y2="17" />
            <line x1="14.5" y1="14" x2="18" y2="17" />
          </svg>
        </div>
        <span className="text-lg tracking-tight text-stone-100">
          Memory<span className="font-semibold text-ember-400">OS</span>
        </span>
      </Link>

      <div className="hidden items-center gap-8 text-sm text-stone-400 md:flex">
        <a href="#features" className="transition-colors hover:text-ember-300">Features</a>
        <a href="#how-it-works" className="transition-colors hover:text-ember-300">How it works</a>
        <a href="#pricing" className="transition-colors hover:text-ember-300">Pricing</a>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "ghost" }), "text-stone-400 hover:text-ember-300 hover:bg-ember-500/10")}
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className={cn(buttonVariants(), "rounded-full bg-ember-500 px-5 text-white hover:bg-ember-400 hover:shadow-[0_0_24px_rgba(249,115,22,0.35)]")}
        >
          Get started
        </Link>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────────
   Hero
   ───────────────────────────────────────────── */

function HeroSection() {
  return (
    <section className="relative z-10 flex flex-col items-center px-6 pb-20 pt-16 text-center md:pb-32 md:pt-24 lg:pt-32">
      {/* Beta badge */}
      <Badge
        variant="outline"
        className="animate-fade-in-up mb-8 border-ember-500/25 bg-ember-500/5 text-ember-300 backdrop-blur-sm"
      >
        <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-ember-400" />
        Now in public beta
      </Badge>

      {/* Headline */}
      <h1 className="animate-fade-in-up delay-100 max-w-4xl">
        <span
          className="block text-5xl leading-[1.08] tracking-tight text-stone-100 md:text-7xl lg:text-[5.5rem]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Your mind,
        </span>
        <span
          className="mt-1 block text-5xl italic leading-[1.08] tracking-tight md:text-7xl lg:text-[5.5rem]"
          style={{
            fontFamily: "var(--font-display)",
            background: "linear-gradient(135deg, #fdba74 0%, #f97316 40%, #ea580c 70%, #fff7ed 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          beautifully mapped.
        </span>
      </h1>

      {/* Subheading */}
      <p className="animate-fade-in-up delay-300 mx-auto mt-8 max-w-xl text-lg leading-relaxed text-stone-400 md:text-xl">
        Capture thoughts, links, and notes. Memory OS weaves them into a living
        knowledge graph — so your ideas connect themselves.
      </p>

      {/* CTA buttons */}
      <div className="animate-fade-in-up delay-400 mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <Link
          href="/signup"
          className={cn(buttonVariants({ size: "lg" }), "group h-12 rounded-full bg-ember-500 px-8 text-base font-semibold text-white transition-all hover:bg-ember-400 hover:shadow-[0_0_40px_rgba(249,115,22,0.3)]")}
        >
          Start building your brain
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="ml-1 transition-transform group-hover:translate-x-0.5"
          >
            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <a
          href="#how-it-works"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 rounded-full border-stone-700 px-8 text-base text-stone-300 hover:border-ember-600 hover:text-ember-300 hover:bg-ember-500/5")}
        >
          See how it works
        </a>
      </div>

      {/* Social proof */}
      <div className="animate-fade-in-up delay-600 mt-16 flex items-center gap-6 text-sm text-stone-500">
        <div className="flex -space-x-2">
          {[
            "bg-gradient-to-br from-ember-400 to-ember-600",
            "bg-gradient-to-br from-amber-300 to-amber-500",
            "bg-gradient-to-br from-orange-300 to-orange-500",
            "bg-gradient-to-br from-rose-400 to-rose-600",
            "bg-gradient-to-br from-yellow-300 to-yellow-500",
          ].map((bg, i) => (
            <div key={i} className={`h-8 w-8 rounded-full border-2 border-stone-950 ${bg}`} />
          ))}
        </div>
        <span>
          Trusted by <span className="text-stone-300">2,400+</span> early thinkers
        </span>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Browser mockup
   ───────────────────────────────────────────── */

function BrowserMockup() {
  return (
    <section className="animate-fade-in-up delay-700 relative z-10 mx-auto max-w-5xl px-6 pb-24">
      <Card className="animate-glow-pulse overflow-hidden border-stone-800/60 bg-stone-900/80 shadow-2xl shadow-ember-950/30 backdrop-blur-xl">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-stone-800/60 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-stone-700" />
            <div className="h-3 w-3 rounded-full bg-stone-700" />
            <div className="h-3 w-3 rounded-full bg-stone-700" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded-md bg-stone-800/80 px-4 py-1 text-xs text-stone-500">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            app.memoryos.ai
          </div>
        </div>

        {/* App preview */}
        <CardContent className="relative aspect-[16/9] bg-stone-950 p-6">
          {/* Top bar */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-ember-500/10" />
              <div className="h-3 w-24 rounded bg-stone-800" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-32 rounded-lg bg-stone-800/60" />
              <div className="h-8 w-8 rounded-lg bg-ember-500/15" />
            </div>
          </div>

          <div className="flex gap-6">
            {/* Sidebar */}
            <div className="hidden w-48 space-y-3 md:block">
              {["Memories", "Graph", "Chat", "Tags", "Settings"].map((item, i) => (
                <div
                  key={item}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs ${
                    i === 0 ? "bg-ember-500/10 text-ember-300" : "text-stone-600"
                  }`}
                >
                  <div className={`h-3.5 w-3.5 rounded ${i === 0 ? "bg-ember-500/25" : "bg-stone-800"}`} />
                  {item}
                </div>
              ))}
            </div>

            {/* Memory cards preview */}
            <div className="flex-1 space-y-3">
              {[
                { title: "Neural network architectures", tag: "Research", color: "bg-ember-500/15 text-ember-300" },
                { title: "Meeting notes: Q1 planning", tag: "Work", color: "bg-amber-500/15 text-amber-300" },
                { title: "Book: Thinking, Fast and Slow", tag: "Reading", color: "bg-orange-500/15 text-orange-300" },
              ].map((card) => (
                <div
                  key={card.title}
                  className="flex items-center justify-between rounded-xl border border-stone-800/40 bg-stone-900/40 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-ember-400/50" />
                    <span className="text-xs text-stone-300">{card.title}</span>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] ${card.color}`}>{card.tag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom fade */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent" />
        </CardContent>
      </Card>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Features
   ───────────────────────────────────────────── */

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: "Capture anything",
    description: "Drop in text, URLs, notes, documents. Memory OS extracts the meaning and files it into your knowledge graph automatically.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <circle cx="5" cy="6" r="1.5" />
        <circle cx="19" cy="6" r="1.5" />
        <circle cx="5" cy="18" r="1.5" />
        <circle cx="19" cy="18" r="1.5" />
        <line x1="9.5" y1="10" x2="6" y2="7" />
        <line x1="14.5" y1="10" x2="18" y2="7" />
        <line x1="9.5" y1="14" x2="6" y2="17" />
        <line x1="14.5" y1="14" x2="18" y2="17" />
      </svg>
    ),
    title: "Knowledge graph",
    description: "Every memory connects to related ideas. Watch your personal web of knowledge grow and reveal patterns you'd never spot alone.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        <path d="M8 10h.01" />
        <path d="M12 10h.01" />
        <path d="M16 10h.01" />
      </svg>
    ),
    title: "Chat with your brain",
    description: "Ask questions in natural language. Memory OS searches your knowledge graph and synthesizes answers from everything you've saved.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
    title: "AI auto-tagging",
    description: "No manual organization. Our AI reads, summarizes, and tags every memory — building a taxonomy that adapts to how you think.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    title: "Semantic search",
    description: "Forget keyword matching. Search by meaning — find that article about 'cognitive load' even if you never used those words.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
    title: "Private by default",
    description: "Your memories are yours. End-to-end encryption, self-host option, and zero data training. Your second brain, your rules.",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="relative z-10 px-6 py-24 md:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block text-sm font-medium uppercase tracking-[0.2em] text-ember-400">
            Features
          </span>
          <h2
            className="text-4xl tracking-tight text-stone-100 md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Everything your brain
            <br />
            <em className="text-ember-300">wishes it could do</em>
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group border-stone-800/40 bg-stone-900/20 transition-all duration-300 hover:border-ember-500/20 hover:bg-stone-900/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.06)]"
            >
              <CardHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-ember-500/5 transition-colors group-hover:bg-ember-500/10">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg text-stone-100">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed text-stone-400">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   How It Works
   ───────────────────────────────────────────── */

const steps = [
  {
    number: "01",
    title: "Capture",
    description: "Drop anything in — a URL, a thought, a screenshot. Our ingestion pipeline extracts text, metadata, and meaning.",
  },
  {
    number: "02",
    title: "Understand",
    description: "AI reads your content, generates summaries, tags, and embeddings. Every piece of knowledge gets a place in your graph.",
  },
  {
    number: "03",
    title: "Connect",
    description: "Memories link to related ideas automatically. Your personal knowledge graph grows richer with every capture.",
  },
  {
    number: "04",
    title: "Recall",
    description: "Search semantically or chat with your brain. Surface the exact insight you need, when you need it.",
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative z-10 px-6 py-24 md:px-12 lg:px-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block text-sm font-medium uppercase tracking-[0.2em] text-ember-400">
            How it works
          </span>
          <h2
            className="text-4xl tracking-tight text-stone-100 md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Four steps to a
            <br />
            <em className="text-ember-300">perfect memory</em>
          </h2>
        </div>

        <div className="relative">
          {/* Vertical connecting line */}
          <div
            className="absolute left-8 top-0 hidden h-full w-px md:block"
            style={{ background: "linear-gradient(to bottom, #f97316 0%, rgba(249,115,22,0.2) 70%, transparent 100%)" }}
          />

          <div className="space-y-10">
            {steps.map((step) => (
              <div key={step.number} className="group flex gap-8">
                {/* Step number */}
                <div className="hidden shrink-0 md:block">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-800 bg-stone-900 text-lg font-bold text-ember-400 transition-all group-hover:border-ember-500/30 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                    {step.number}
                  </div>
                </div>
                {/* Step content */}
                <Card className="flex-1 border-stone-800/30 bg-stone-900/15 transition-all group-hover:border-ember-500/10 group-hover:bg-stone-900/30">
                  <CardHeader>
                    <span className="mb-1 text-sm text-ember-400 md:hidden">Step {step.number}</span>
                    <CardTitle
                      className="text-2xl text-stone-100"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed text-stone-400">
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   CTA
   ───────────────────────────────────────────── */

function CTASection() {
  return (
    <section className="relative z-10 px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <Card className="relative mx-auto max-w-4xl overflow-hidden border-stone-800/40 bg-stone-900/40 text-center">
        {/* Radial orange glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, rgba(249,115,22,0.08) 0%, transparent 70%)" }}
        />

        <CardContent className="relative px-8 py-16 md:px-16 md:py-24">
          <h2
            className="mb-6 text-4xl tracking-tight text-stone-100 md:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Ready to never
            <br />
            <em className="text-ember-300">forget again?</em>
          </h2>
          <p className="mx-auto mb-10 max-w-lg text-lg leading-relaxed text-stone-400">
            Join thousands of thinkers, builders, and learners who trust Memory OS
            to hold their most important ideas.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "group h-12 rounded-full bg-ember-500 px-8 text-base font-semibold text-white transition-all hover:bg-ember-400 hover:shadow-[0_0_40px_rgba(249,115,22,0.3)]")}
            >
              Get started for free
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="ml-1 transition-transform group-hover:translate-x-0.5"
              >
                <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <span className="text-sm text-stone-500">No credit card required</span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Footer
   ───────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="relative z-10 border-t border-stone-800/40 px-6 py-12 md:px-12 lg:px-20">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ember-500/10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <circle cx="5" cy="6" r="1.5" />
              <circle cx="19" cy="6" r="1.5" />
              <line x1="9.5" y1="10" x2="6" y2="7" />
              <line x1="14.5" y1="10" x2="18" y2="7" />
            </svg>
          </div>
          <span className="text-sm text-stone-500">
            Memory<span className="font-semibold text-stone-400">OS</span>
          </span>
        </div>

        <div className="flex gap-8 text-sm text-stone-500">
          <a href="#" className="transition-colors hover:text-ember-300">Privacy</a>
          <a href="#" className="transition-colors hover:text-ember-300">Terms</a>
          <a href="#" className="transition-colors hover:text-ember-300">GitHub</a>
          <a href="#" className="transition-colors hover:text-ember-300">Twitter</a>
        </div>

        <p className="text-xs text-stone-600">&copy; 2026 Memory OS. All rights reserved.</p>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────
   Landing Page
   ───────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#0C0A09] text-stone-100">
      <EmberBackground />
      <Navbar />
      <HeroSection />
      <BrowserMockup />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </div>
  );
}
