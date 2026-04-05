"use client";

import { ChevronRight } from "lucide-react";
import { Player } from "@remotion/player";
import { ContextStudioVisual } from "./remotion-context-studio";
import { DataAppsVisual } from "./remotion-data-apps";

export function FeaturesSection() {
  return (
    <>
      <section className="relative w-full border-b border-zinc-200/80 flex justify-center z-10 bg-transparent">
        <div className="relative flex w-full max-w-[1200px] flex-col items-center justify-between gap-16 px-6 py-24 md:px-10 lg:flex-row lg:items-start lg:gap-16 lg:px-12">
          
          {/* Architectural structural line */}
          <div className="absolute left-[45%] top-0 bottom-0 w-px border-l border-dashed border-zinc-200/80 pointer-events-none hidden lg:block z-0" />

          {/* Left Text Box */}
          <div className="relative z-10 flex w-full max-w-[420px] flex-col justify-start xl:max-w-[460px]">
             <div className="relative mb-6 inline-flex h-10 w-10 items-center justify-center border border-[#fbbf9b]/50 bg-[#fef2e4]/40">
                <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-white" />
                <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-white" />
                <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-white" />
                <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-white" />
                <div className="h-1.5 w-1.5 bg-[#d97706] rounded-full" />
             </div>
             
             <h2 className="text-[2.15rem] italic font-serif leading-[1.05] text-[#111118] md:text-[2.65rem] text-balance">
               Universal Capture from anywhere, directly to your graph
             </h2>
             
             <p className="mt-5 text-zinc-600 leading-[1.65] text-[#111118]/80 text-[1.05rem]">
               Save from the Web, WhatsApp, PDFs, or write manual notes. Everything is instantly vectorized, summarized, and auto-tagged by AI.
             </p>

             <div className="mt-8">
               <button className="group relative inline-flex items-center justify-center bg-transparent px-5 py-2.5 text-[14px] font-bold text-zinc-900 transition-colors">
                 <span className="absolute inset-0 border border-zinc-200 bg-white transition-colors group-hover:bg-[#fef2e4]/60" />
                 <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-white" />
                 <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-white" />
                 <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-white" />
                 <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-white" />
                 <span className="relative z-10 tracking-tight">Explore web capture</span>
               </button>
             </div>

             <div className="mt-16 pt-8 border-t border-dashed border-zinc-200">
                <p className="text-[0.95rem] italic font-serif leading-[1.6] text-zinc-600">
                  "I used to lose 50 links a week because my bookmarks were a mess. Now my memory OS just remembers everything for me—and instantly fetches it when I ask."
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="font-bold text-[14px] tracking-tight">STARTUP FOUNDER</span>
                  <span className="text-[13px] text-zinc-500">Priya S.</span>
                </div>
             </div>
          </div>

          {/* Right Image Placeholder (UI Canvas) */}
          <div className="relative z-10 flex w-full flex-1">
            <div className="h-[400px] md:h-[500px] lg:h-[600px] w-full bg-white rounded-2xl border border-zinc-200 shadow-xl overflow-hidden shadow-zinc-200/40">
               <Player
                 component={ContextStudioVisual}
                 durationInFrames={120}
                 compositionWidth={800}
                 compositionHeight={600}
                 fps={30}
                 style={{ width: "100%", height: "100%" }}
                 autoPlay={true}
                 loop={true}
               />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Block 2 (Mirrored Layout) */}
      <section className="relative w-full border-b border-zinc-200/80 flex justify-center z-10 bg-transparent">
        <div className="relative flex w-full max-w-[1200px] flex-col-reverse items-center justify-between gap-16 px-6 py-24 md:px-10 lg:flex-row lg:items-start lg:gap-16 lg:px-12">
          
          {/* Architectural structural line */}
          <div className="absolute left-[55%] top-0 bottom-0 w-px border-l border-dashed border-zinc-200/80 pointer-events-none hidden lg:block z-0" />

          {/* Left Image Placeholder */}
          <div className="relative z-10 flex w-full flex-1">
            <div className="h-[400px] md:h-[500px] lg:h-[600px] w-full bg-white rounded-2xl border border-zinc-200 shadow-xl overflow-hidden shadow-zinc-200/40">
               <Player
                 component={DataAppsVisual}
                 durationInFrames={150}
                 compositionWidth={800}
                 compositionHeight={600}
                 fps={30}
                 style={{ width: "100%", height: "100%" }}
                 autoPlay={true}
                 loop={true}
               />
            </div>
          </div>

          {/* Right Text Box */}
          <div className="relative z-10 flex w-full max-w-[420px] flex-col justify-start pt-8 xl:max-w-[460px]">
             <div className="mb-6 flex gap-1">
                <div className="h-5 w-5 border border-[#fbbf9b]/60 bg-[#fef2e4]/50" />
                <div className="h-5 w-5 border border-[#fbbf9b]/60 bg-[#fef2e4]/50" />
             </div>
             
             <h2 className="text-[2.15rem] italic font-serif leading-[1.05] text-[#111118] md:text-[2.65rem] text-balance">
               The Mind Graph connects ideas you forgot you had
             </h2>
             
             <p className="mt-5 text-zinc-600 leading-[1.65] text-[#111118]/80 text-[1.05rem]">
               Explore your memories visually. The AI automatically traces connections between related nodes, surfacing breakthrough insights from data you saved months ago.
             </p>

             <div className="mt-8">
               <button className="group relative inline-flex items-center justify-center bg-transparent px-5 py-2.5 text-[14px] font-bold text-zinc-900 transition-colors">
                 <span className="absolute inset-0 border border-zinc-200 bg-white transition-colors group-hover:bg-[#fef2e4]/60" />
                 <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-white" />
                 <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-white" />
                 <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-white" />
                 <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#fbbf9b] bg-white" />
                 <span className="relative z-10 tracking-tight">Explore the knowledge graph</span>
               </button>
             </div>

             <div className="mt-16 pt-8 border-t border-dashed border-zinc-200">
                <p className="text-[0.95rem] italic font-serif leading-[1.6] text-zinc-600">
                  "I can see how my research topics connect over time spanning 100+ PDFs and countless notes. The semantic linking without any manual tagging gives me superpowers."
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="font-bold text-[14px] tracking-tight">AI RESEARCHER</span>
                  <span className="text-[13px] text-zinc-500">Arjun K.</span>
                </div>
             </div>
          </div>

        </div>
      </section>
    </>
  );
}
