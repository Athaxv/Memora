"use client";

import { motion } from "motion/react";
import { Player } from "@remotion/player";
import { IntegrationsFlowVisual } from "./remotion-integrations-flow";
import { EmailForwardVisual } from "./remotion-email-forward";
import { TwoWaySyncVisual } from "./remotion-two-way-sync";
import { BrowserExtensionVisual } from "./remotion-browser-extension";
import { SocialBookmarksVisual } from "./remotion-social-bookmarks";
import { ApiVisual } from "./remotion-api-visual";
import type { ComponentType } from "react";

const playerConfig = {
  durationInFrames: 120,
  compositionWidth: 300,
  compositionHeight: 160,
  fps: 30,
  style: { width: "100%", height: "100%" } as const,
  autoPlay: true as const,
  loop: true as const,
};

const integrations: { title: string; description: string; component: ComponentType }[] = [
  {
    title: "Built for your workflow",
    description: "Memora connects to the apps you already use. Forward messages, save links, and sync documents without changing your habits.",
    component: IntegrationsFlowVisual,
  },
  {
    title: "Email Forwarding",
    description: "Forward newsletters, receipts, or long threads to your personal Memory inbox. The AI extracts the core text and links it instantly.",
    component: EmailForwardVisual,
  },
  {
    title: "Two-way Sync",
    description: "Connect Notion, Obsidian, or Google Drive. We don't lock your data — your memories stay synced across your ecosystem.",
    component: TwoWaySyncVisual,
  },
  {
    title: "Browser Extension",
    description: "1-click save any highlight, article, or PDF directly from Chrome or Firefox while preserving the original source URL.",
    component: BrowserExtensionVisual,
  },
  {
    title: "Social Bookmarks",
    description: "Auto-sync your X/Twitter bookmarks, Reddit saves, and Readwise highlights directly into your knowledge graph.",
    component: SocialBookmarksVisual,
  },
  {
    title: "Memory REST API",
    description: "Want to connect an app we haven't thought of? Use our powerful public API to pipe data straight into your second brain.",
    component: ApiVisual,
  },
];

export function IntegrationsSection() {
  return (
    <>
    <section className="relative w-full border-b border-zinc-200/80 flex justify-center z-10 bg-transparent">
      <div className="flex w-full max-w-[1200px] flex-col items-center px-6 py-24 md:px-10 lg:px-12 relative">
        {/* Architect limits */}
        <div className="absolute left-[33%] top-0 bottom-0 w-px border-l border-dashed border-zinc-200/80 pointer-events-none hidden lg:block z-0" />
        <div className="absolute left-[66%] top-0 bottom-0 w-px border-l border-dashed border-zinc-200/80 pointer-events-none hidden lg:block z-0" />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center relative z-10 max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-[2.5rem] md:text-[3.5rem] tracking-tight text-zinc-900">
            <span className="block italic font-serif leading-[1] text-[#09090b]">Connect your entire</span>
            <span className="block font-sans font-[700] tracking-tight leading-[1] text-[#09090b] mt-1">digital life</span>
          </h2>
          <p className="mt-6 text-[1.1rem] text-zinc-600 max-w-[400px] mx-auto leading-relaxed">
            Instantly sync from the apps you already use every day.
          </p>
        </motion.div>

        {/* 3x2 Grid */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl"
        >
          {integrations.map((item, index) => (
            <motion.div 
              key={index} 
              variants={{
                hidden: { opacity: 0, scale: 0.95, y: 20 },
                visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
              }}
              className="bg-[#ffffff]/60 group flex flex-col items-start text-left p-6 relative border border-[#e4e4e7]/20 hover:border-[#e4e4e7]/50 hover:bg-[#fafafa]/50 transition-colors"
            >
              <div className="w-full flex justify-center mb-6">
                <div className="relative h-40 w-full overflow-hidden flex items-center justify-center">
                  <Player component={item.component} {...playerConfig} />
                </div>
              </div>
              <h3 className="font-bold text-[15px] tracking-tight text-zinc-900 mb-2">{item.title}</h3>
              <p className="text-[13px] text-zinc-500 leading-relaxed font-medium">
                {item.description}
              </p>
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* Dark Sunset CTA Section */}
    <section 
      className="relative w-full flex justify-center z-10 overflow-hidden bg-zinc-950 bg-cover bg-center"
      style={{ backgroundImage: "url('/bg2.png')" }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      <div className="relative z-10 flex w-full max-w-[1200px] flex-col items-center px-6 py-16 md:px-10 lg:px-12 md:py-24 text-center">
        <h2 className="max-w-3xl">
          <span className="block text-[2.25rem] italic font-serif leading-[1] text-[#e4e4e7] tracking-tight md:text-[3rem] drop-shadow-[0_2px_20px_rgba(0,0,0,0.4)]">
            Start remembering
          </span>
          <span className="mt-2 block text-[2.25rem] font-sans font-bold leading-[1] text-[#fafafa] tracking-[-0.03em] md:text-[3rem] drop-shadow-[0_2px_24px_rgba(0,0,0,0.5)]">
            everything.
          </span>
        </h2>

        <p className="mt-6 max-w-lg text-[1.05rem] md:text-[1.15rem] text-[#fff0e1]/75 font-medium leading-relaxed">
          Connect your first source and watch your Mind Graph build itself.
        </p>

        <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row">
          <button className="group relative inline-flex items-center justify-center bg-transparent px-8 py-3.5 text-[15px] font-bold transition-colors">
            <span className="absolute inset-0 border border-[#fafafa] bg-[#fafafa]/95 backdrop-blur-sm transition-colors group-hover:bg-[#fafafa]" />
            <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-[#e4e4e7] bg-[#fafafa] transition-colors group-hover:bg-[#e4e4e7]" />
            <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-[#e4e4e7] bg-[#fafafa] transition-colors group-hover:bg-[#e4e4e7]" />
            <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#e4e4e7] bg-[#fafafa] transition-colors group-hover:bg-[#e4e4e7]" />
            <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-[#e4e4e7] bg-[#fafafa] transition-colors group-hover:bg-[#e4e4e7]" />
            <span className="relative z-10 text-zinc-900 tracking-tight">Get started for free</span>
          </button>

          <button className="group inline-flex items-center gap-1.5 px-4 py-3.5 text-[15px] font-medium text-[#fff0e1]/85 transition-colors hover:text-[#fafafa]">
            <span className="underline underline-offset-4 decoration-[#fff0e1]/30 group-hover:decoration-[#fafafa]/60 transition-colors">Talk to us</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="mt-16 pt-8 border-t border-dashed border-[#fafafa]/10 w-full max-w-md text-center">
          <p className="text-[13px] font-medium text-[#fff0e1]/60">
            Check out all of our plans to fit your team or personal workflow.{" "}
            <button className="text-[#e4e4e7] underline underline-offset-4 decoration-[#e4e4e7]/40 hover:decoration-[#e4e4e7] transition-colors">
              See our plans &rarr;
            </button>
          </p>
        </div>
      </div>
    </section>
    </>
  );
}
