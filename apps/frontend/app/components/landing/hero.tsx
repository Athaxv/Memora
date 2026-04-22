import Link from "next/link";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <Image
        src="/Hero.png"
        alt=""
        fill
        priority
        className="object-cover object-center"
      />

      {/* Gradient overlays for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-transparent to-zinc-950/30 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-[1200px] flex-col items-center px-6 pt-24 pb-32 text-center md:pt-32 lg:pt-36">
        {/* Headline — italic serif first line, sans-serif second line */}
        <h1 className="max-w-5xl relative">
          <div className="relative inline-block text-[clamp(2.5rem,5vw,5.35rem)] italic leading-[0.95] tracking-[-0.01em] font-serif subpixel-antialiased text-[#e4e4e7] drop-shadow-[0_2px_24px_rgba(0,0,0,0.5)]">
            The AI-Powered
            {/* Sparkle icon */}
            <svg viewBox="0 0 24 24" fill="none" className="absolute -right-8 -top-3 h-8 w-8 text-[#fafafa]/90 md:-right-12 md:-top-4 md:h-11 md:w-11 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
              <path d="M12 2v5M12 17v5M2 12h5M17 12h5M4.93 4.93l3.5 3.5M15.5 15.5l3.5 3.5M4.93 19.07l3.5-3.5M15.5 8.5l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="mt-1 block text-[clamp(2.5rem,5vw,5.15rem)] leading-[0.95] font-sans font-bold tracking-[-0.045em] subpixel-antialiased text-[#fafafa] drop-shadow-[0_2px_28px_rgba(0,0,0,0.55)]">
            Second Brain
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-8 max-w-[620px] text-[1.05rem] leading-[1.6] text-[#fff0e1]/85 font-medium md:mt-10 md:text-[1.2rem] drop-shadow-[0_1px_12px_rgba(0,0,0,0.45)]">
          Capture scattered ideas, links, and messages instantly. Retrieve everything with natural language. Build your personalized knowledge graph.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row md:mt-12">
          <Link
            href="/signup"
            className="group relative inline-flex items-center justify-center bg-transparent px-8 py-3.5 text-[15px] font-bold text-zinc-900 transition-colors"
          >
            {/* Cream fill with peachy hover */}
            <span className="absolute inset-0 border border-[#fafafa] bg-[#fafafa]/95 backdrop-blur-sm transition-colors group-hover:bg-[#fafafa]"></span>

            {/* Corner squares */}
            <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-[#e4e4e7] bg-[#fafafa] transition-colors group-hover:bg-[#e4e4e7]" />
            <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-[#e4e4e7] bg-[#fafafa] transition-colors group-hover:bg-[#e4e4e7]" />
            <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#e4e4e7] bg-[#fafafa] transition-colors group-hover:bg-[#e4e4e7]" />
            <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#e4e4e7] bg-[#fafafa] transition-colors group-hover:bg-[#e4e4e7]" />

            <span className="relative z-10 tracking-tight">Start building your memory</span>
          </Link>

          <Link
            href="/demo"
            className="group inline-flex items-center gap-1.5 px-4 py-3.5 text-[15px] font-medium text-[#fff0e1]/85 transition-colors hover:text-[#fafafa]"
          >
            <span className="underline underline-offset-4 decoration-[#fff0e1]/30 group-hover:decoration-[#fafafa]/60 transition-colors">See it in action</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
