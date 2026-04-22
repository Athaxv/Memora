"use client";

import { motion } from "motion/react";

const features = [
  "Universal Web Capture",
  "AI Auto-Tagging",
  "Semantic Mind Graph",
  "WhatsApp Integration",
  "Two-Way Notion Sync",
  "Automated Summaries",
  "PDF Vectorization",
  "Intelligent Search"
];

export function TestimonialsStrip() {
  return (
    <section className="relative z-20 w-screen -ml-[calc((100vw-100%)/2)] border-y border-zinc-200/80 bg-white py-6 overflow-hidden flex items-center">
      {/* Left/Right fading gradients for sleek effect */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      <motion.div
        className="flex whitespace-nowrap items-center w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
      >
        {/* Render list twice to ensure seamless looping */}
        {[...features, ...features].map((item, i) => (
          <div key={i} className="flex items-center gap-12 px-6">
             <span className="text-zinc-500 font-serif italic text-[1.25rem]">
               {item}
             </span>
             <span className="text-zinc-300 font-serif italic text-lg">&middot;</span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
