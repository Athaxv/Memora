"use client";

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
    description: "Memory OS connects to the apps you already use. Forward messages, save links, and sync documents without changing your habits.",
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

        <div className="text-center relative z-10 max-w-2xl mx-auto mb-16">
          <h2 className="text-[2.5rem] md:text-[3.5rem] tracking-tight text-zinc-900">
            <span className="block italic font-serif leading-[1] text-[#111118]">Connect your entire</span>
            <span className="block font-sans font-[700] tracking-tight leading-[1] text-[#111118] mt-1">digital life</span>
          </h2>
          <p className="mt-6 text-[1.1rem] text-zinc-600 max-w-[400px] mx-auto leading-relaxed">
            Instantly sync from the apps you already use every day.
          </p>
        </div>

        {/* 3x2 Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
          {integrations.map((item, index) => (
            <div key={index} className="bg-zinc-50/80 group flex flex-col items-start text-left p-6 relative border border-zinc-100 hover:border-zinc-200 transition-colors">
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA Footer Section */}
    <section className="relative w-full border-b border-zinc-200/80 flex justify-center z-10 bg-transparent">
      <div className="flex w-full max-w-[1200px] flex-col md:flex-row items-center px-6 py-16 md:px-10 lg:px-12 md:py-24 relative border-t border-dashed border-zinc-200/80 mt-16">

        {/* Architect limits */}
        <div className="absolute left-[60%] top-0 bottom-0 w-px border-l border-dashed border-zinc-200/80 pointer-events-none hidden md:block z-0" />

        <div className="w-full md:w-[60%] md:pr-16 relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
          <h2 className="text-[1.85rem] md:text-[2.25rem] tracking-tight font-bold text-zinc-900 mb-3">
            Start remembering everything.
          </h2>
          <p className="text-[1.05rem] text-zinc-600 font-medium max-w-md mb-8">
            Connect your first source and watch your Mind Graph build itself.
          </p>
          <div className="flex items-center gap-4">
            <button className="group relative inline-flex items-center justify-center bg-transparent px-6 py-2.5 text-[14px] font-bold text-zinc-900 transition-colors">
              <span className="absolute inset-0 border border-zinc-300 bg-[#fdfdfd]/80 backdrop-blur-sm group-hover:bg-zinc-100 z-0"></span>
              <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white group-hover:border-zinc-400 transition-colors z-10" />
              <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white group-hover:border-zinc-400 transition-colors z-10" />
              <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white group-hover:border-zinc-400 transition-colors z-10" />
              <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white group-hover:border-zinc-400 transition-colors z-10" />
              <span className="relative z-20">Get started for free</span>
            </button>
            <button className="px-6 py-2.5 border border-zinc-200 text-[14px] font-bold text-zinc-600 hover:bg-zinc-50 transition-colors bg-white">
              Talk to us
            </button>
          </div>
        </div>

        <div className="w-full md:w-[40%] md:pl-16 relative z-10 flex flex-col items-center md:items-start text-center md:text-left mt-12 md:mt-0">
          <p className="text-[0.95rem] text-zinc-600 font-medium max-w-[240px] mb-6">
            Check out all of our plans to fit your team or personal workflow.
          </p>
          <button className="px-6 py-2 border border-zinc-200 text-[13px] font-bold text-zinc-900 hover:bg-zinc-50 transition-colors bg-white">
            See our plans
          </button>
        </div>

      </div>
    </section>
    </>
  );
}
