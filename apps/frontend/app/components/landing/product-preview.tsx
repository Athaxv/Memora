"use client";

import { motion } from "motion/react";
import { HeroVideoDialog } from "./hero-video-dialog";

export function ProductPreview() {
  return (
    <section id="product" className="relative w-full border-b border-zinc-200/80 flex justify-center z-10 font-sans bg-white overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-zinc-100/50 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="flex w-full max-w-[1200px] flex-col items-center justify-between gap-16 px-6 pb-24 pt-24 md:px-10 lg:flex-col lg:items-center lg:gap-20 lg:px-12 relative">

        {/* Text content - Centered */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center pt-2"
        >
          <div className="relative mb-8 inline-flex h-[56px] w-[56px] items-center justify-center border border-zinc-200 bg-zinc-50 shadow-sm rounded-xl">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h2 className="text-[2.25rem] md:text-[3.25rem] tracking-tight leading-[1.1] text-zinc-950 text-balance">
            <span className="text-zinc-500 font-serif italic font-normal">Your AI-powered knowledge engine,</span> <span className="font-bold font-sans">always learning.</span>
          </h2>
          <p className="mt-6 text-zinc-600 leading-[1.7] text-[1.15rem] max-w-2xl">
            Every link, note, and message you save is instantly summarized, auto-tagged, and woven into your personal knowledge graph — building connections you'd never find manually.
          </p>
        </motion.div>

        {/* Video mockup - Larger, Centered */}
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="w-full relative"
        >
           {/* Decorative elements behind video */}
           <div className="absolute -inset-4 bg-zinc-100 border border-zinc-200/50 rounded-3xl -z-10" />
           
           <HeroVideoDialog
             videoSrc="https://www.youtube.com/embed/dQw4w9WgXcQ"
             className="w-full max-w-[1000px] mx-auto rounded-2xl shadow-2xl shadow-black/10 ring-1 ring-zinc-900/5"
           />
        </motion.div>

        {/* Testimonial */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-4 border-t border-zinc-200 pt-10 flex flex-col items-center text-center w-full max-w-2xl"
        >
          <p className="font-serif italic text-zinc-600 leading-[1.6] text-[1.25rem]">
            "I used to lose 50 links a week. Now my Memora resurfaces exactly what I need, right when I need it."
          </p>
          <div className="mt-6 flex flex-col items-center gap-1">
             <span className="font-bold tracking-tight text-zinc-900 text-[15px]">STARTUP FOUNDER</span>
             <span className="text-[14px] text-zinc-500 font-medium">Priya S., CEO at Stealth</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
