"use client";

import { ChevronRight } from "lucide-react";
import { Player } from "@remotion/player";
import { motion } from "motion/react";
import { ContextStudioVisual } from "./remotion-context-studio";
import { DataAppsVisual } from "./remotion-data-apps";

export function FeaturesSection() {
  return (
    <>
      {/* Section Heading */}
      <section id="features" className="relative w-full flex justify-center z-10 bg-transparent pt-32 pb-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center relative z-10 max-w-2xl mx-auto px-6"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#18181b] mb-4">
            Core Features
          </p>
          <h2 className="text-[2.5rem] md:text-[3.5rem] tracking-tight text-zinc-900 leading-[1.05]">
            <span className="italic font-serif text-zinc-500 font-normal">Superpowers for your </span>
            <span className="font-sans font-[700] tracking-tight text-[#09090b]">intellect</span>
          </h2>
        </motion.div>
      </section>

      <section className="relative w-full border-b border-zinc-200/80 flex justify-center z-10 bg-transparent">
        <div className="relative flex w-full max-w-[1200px] flex-col items-center justify-between gap-16 px-6 py-24 md:px-10 lg:flex-row lg:items-start lg:gap-16 lg:px-12">
          
          {/* Architectural structural line */}
          <div className="absolute left-[45%] top-0 bottom-0 w-px border-l border-dashed border-zinc-200/80 pointer-events-none hidden lg:block z-0" />

          {/* Left Text Box */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 flex w-full max-w-[420px] flex-col justify-start xl:max-w-[460px]"
          >
             <div className="relative mb-6 inline-flex h-10 w-10 items-center justify-center border border-[#e4e4e7]/50 bg-[#fafafa]/40">
                <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-[#e4e4e7] bg-white" />
                <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-[#e4e4e7] bg-white" />
                <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#e4e4e7] bg-white" />
                <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#e4e4e7] bg-white" />
                <div className="h-1.5 w-1.5 bg-[#18181b] rounded-full" />
             </div>
             
             <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">
               Data Capture
             </p>
             <h2 className="text-[2.15rem] italic font-serif leading-[1.05] text-[#09090b] md:text-[2.65rem] text-balance">
               Universal Capture from anywhere, directly to your graph
             </h2>
             
             <p className="mt-5 text-zinc-600 leading-[1.65] text-[#09090b]/80 text-[1.05rem]">
               Save from the Web, WhatsApp, PDFs, or write manual notes. Everything is instantly vectorized, summarized, and auto-tagged by AI.
             </p>

             <div className="mt-8">
               <button className="group relative inline-flex items-center justify-center bg-transparent px-5 py-2.5 text-[14px] font-bold text-zinc-900 transition-colors">
                 <span className="absolute inset-0 border border-zinc-200 bg-white transition-colors group-hover:bg-[#fafafa]/60" />
                 <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-[#e4e4e7] bg-white" />
                 <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-[#e4e4e7] bg-white" />
                 <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#e4e4e7] bg-white" />
                 <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#e4e4e7] bg-white" />
                 <span className="relative z-10 tracking-tight">Explore web capture</span>
               </button>
             </div>

             <div className="mt-16 pt-8 border-t border-dashed border-zinc-200">
                <p className="text-[0.95rem] italic font-serif leading-[1.6] text-zinc-600">
                  "I used to lose 50 links a week because my bookmarks were a mess. Now my Memora just remembers everything for me—and instantly fetches it when I ask."
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="font-bold text-[14px] tracking-tight">STARTUP FOUNDER</span>
                  <span className="text-[13px] text-zinc-500">Priya S.</span>
                </div>
             </div>
          </motion.div>

          {/* Right Image Placeholder (UI Canvas) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="relative z-10 flex w-full flex-1"
          >
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
          </motion.div>
        </div>
      </section>

      {/* Feature Block 2 (Mirrored Layout) */}
      <section className="relative w-full border-b border-zinc-200/80 flex justify-center z-10 bg-transparent">
        <div className="relative flex w-full max-w-[1200px] flex-col-reverse items-center justify-between gap-16 px-6 py-24 md:px-10 lg:flex-row lg:items-start lg:gap-16 lg:px-12">
          
          {/* Architectural structural line */}
          <div className="absolute left-[55%] top-0 bottom-0 w-px border-l border-dashed border-zinc-200/80 pointer-events-none hidden lg:block z-0" />

          {/* Left Image Placeholder */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="relative z-10 flex w-full flex-1"
          >
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
          </motion.div>

          {/* Right Text Box */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 flex w-full max-w-[420px] flex-col justify-start pt-8 xl:max-w-[460px]"
          >
             <div className="mb-6 flex gap-1">
                <div className="h-5 w-5 border border-[#e4e4e7]/60 bg-[#fafafa]/50" />
                <div className="h-5 w-5 border border-[#e4e4e7]/60 bg-[#fafafa]/50" />
             </div>
             
             <h2 className="text-[2.15rem] italic font-serif leading-[1.05] text-[#09090b] md:text-[2.65rem] text-balance">
               The Mind Graph connects ideas you forgot you had
             </h2>
             
             <p className="mt-5 text-zinc-600 leading-[1.65] text-[#09090b]/80 text-[1.05rem]">
               Explore your memories visually. The AI automatically traces connections between related nodes, surfacing breakthrough insights from data you saved months ago.
             </p>

             <div className="mt-8">
               <button className="group relative inline-flex items-center justify-center bg-transparent px-5 py-2.5 text-[14px] font-bold text-zinc-900 transition-colors">
                 <span className="absolute inset-0 border border-zinc-200 bg-white transition-colors group-hover:bg-[#fafafa]/60" />
                 <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-[#e4e4e7] bg-white" />
                 <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-[#e4e4e7] bg-white" />
                 <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#e4e4e7] bg-white" />
                 <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#e4e4e7] bg-white" />
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
          </motion.div>

        </div>
      </section>
    </>
  );
}
