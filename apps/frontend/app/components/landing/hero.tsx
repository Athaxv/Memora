"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Player } from "@remotion/player";
import { HeroRemotionDemo } from "./hero-remotion-demo";

export function HeroSection() {
  return (
    <section className="relative w-full border-b border-zinc-200/80 flex justify-center z-10 min-h-screen pb-20 overflow-hidden">
      <div className="flex w-full max-w-[1200px] flex-col items-center px-6 pt-24 text-center md:pt-32 lg:pt-36 relative z-10 isolate">
        
        {/* Bottom Fade Grid Background */}
        <div
          className="absolute inset-0 z-[-1] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e2e8f0 1px, transparent 1px),
              linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
            `,
            backgroundSize: "20px 30px",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 100%, #000 60%, transparent 100%)",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 100%, #000 60%, transparent 100%)",
          }}
        />

        {/* Headline — italic serif first line, sans-serif second line */}
        <h1 className="max-w-5xl text-zinc-900 relative z-10">
          <div className="relative inline-block text-[clamp(2.5rem,5vw,5.35rem)] italic leading-[0.95] tracking-[-0.01em] font-serif subpixel-antialiased text-[#111118]">
            The AI-Powered
            {/* Sparkle icon from the image */}
            <svg viewBox="0 0 24 24" fill="none" className="absolute -right-8 -top-3 h-8 w-8 text-rose-300/80 md:-right-12 md:-top-4 md:h-11 md:w-11">
              <path d="M12 2v5M12 17v5M2 12h5M17 12h5M4.93 4.93l3.5 3.5M15.5 15.5l3.5 3.5M4.93 19.07l3.5-3.5M15.5 8.5l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="mt-1 block text-[clamp(2.5rem,5vw,5.15rem)] leading-[0.95] font-sans font-bold tracking-[-0.045em] subpixel-antialiased text-[#111118]">
            Second Brain
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-8 max-w-[620px] text-[1.05rem] leading-[1.6] text-zinc-600 md:mt-10 md:text-[1.25rem]">
          Capture scattered ideas, links, and messages instantly. Retrieve everything with natural language. Build your personalized knowledge graph.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row md:mt-12">
          <Link
            href="/signup"
            className="group relative inline-flex items-center justify-center bg-transparent px-8 py-3.5 text-[15px] font-medium text-zinc-900 transition-colors"
          >
            {/* Decorative border effect matching Hex Get Started button */}
            <span className="absolute inset-0 border border-zinc-300 bg-[#fdfdfd]/80 backdrop-blur-sm transition-colors group-hover:bg-zinc-100"></span>

            {/* Corner squares (editing handle effect) */}
            <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white group-hover:border-zinc-400 transition-colors" />
            <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white group-hover:border-zinc-400 transition-colors" />
            <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white group-hover:border-zinc-400 transition-colors" />
            <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white group-hover:border-zinc-400 transition-colors" />

            <span className="relative z-10">Start building your memory</span>
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center px-8 py-3.5 text-[15px] font-medium text-zinc-600 transition-colors hover:text-zinc-900"
          >
            See it in action
          </Link>
        </div>

        {/* Programmable Remotion Video Player */}
        <div className="relative mt-16 w-full max-w-5xl md:mt-20 rounded-2xl overflow-hidden border border-zinc-200 shadow-2xl shadow-zinc-200/20 bg-white">
          <Player
            component={HeroRemotionDemo}
            durationInFrames={240}
            compositionWidth={1000}
            compositionHeight={562}
            fps={30}
            style={{ width: "100%", height: "100%", aspectRatio: "16/9" }}
            controls={true}
            autoPlay={true}
            loop={true}
          />
        </div>
      </div>
    </section>
  );
}
