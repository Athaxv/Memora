"use client";

import { Player } from "@remotion/player";
import { IntegrationsFlowVisual } from "./remotion-integrations-flow";

export function IntegrationsSection() {
  const integrations = [
    {
      title: "Built for your workflow",
      description: "Memory OS has built-in connections to the apps you already use. Forward messages, save links, and sync documents without changing your habits.",
      mockup: (
        <div className="relative h-40 w-full overflow-hidden flex items-center justify-center">
           <Player
             component={IntegrationsFlowVisual}
             durationInFrames={120}
             compositionWidth={300}
             compositionHeight={160}
             fps={30}
             style={{ width: "100%", height: "100%" }}
             autoPlay={true}
             loop={true}
           />
        </div>
      )
    },
    {
      title: "Email Forwarding",
      description: "Forward newsletters, receipts, or long threads to your personal Memory inbox. The AI extracts the core text and links it instantly.",
      mockup: (
        <div className="relative h-40 w-full overflow-hidden flex items-center justify-center">
           <div className="flex flex-col items-center gap-3">
             <div className="text-[#FF694B] font-bold text-xs flex items-center gap-1">
               <div className="w-2 h-2 bg-[#FF694B]" /> dbt
             </div>
             <div className="w-32 h-16 bg-white border border-zinc-200 shadow-sm rounded flex items-center justify-center px-4">
                <div className="h-1 w-full bg-zinc-100 rounded-full" />
             </div>
           </div>
        </div>
      )
    },
    {
      title: "Two-way Sync",
      description: "Connect your existing Notion, Obsidian, or Google Drive. We don't lock your data—your memories stay synced across your ecosystem.",
      mockup: (
        <div className="relative h-40 w-full overflow-hidden flex items-center justify-center">
           <div className="flex flex-col items-center">
             <div className="flex gap-12 font-bold text-xs text-zinc-600 mb-6 relative">
                <span className="text-sky-500">Snowflake</span>
                <span className="text-blue-500">BigQuery</span>
             </div>
             <div className="flex gap-8">
                <div className="w-4 h-4 rounded-full border border-zinc-300 relative">
                  <div className="absolute top-4 left-1/2 w-px h-8 bg-zinc-300" />
                </div>
                <div className="w-4 h-4 rounded-full border border-zinc-300 relative">
                  <div className="absolute top-4 left-1/2 w-px h-8 bg-zinc-300" />
                </div>
                <div className="w-4 h-4 rounded-full border border-zinc-300 relative">
                  <div className="absolute top-4 left-1/2 w-px h-8 bg-zinc-300" />
                </div>
             </div>
             <div className="w-40 h-px bg-zinc-300 mt-8" />
           </div>
        </div>
      )
    },
    {
      title: "Browser Extension",
      description: "1-click save any highlight, article, or PDF directly from Chrome or Firefox while preserving the original source URL.",
      mockup: (
        <div className="relative h-40 w-full overflow-hidden flex items-center justify-center">
           <div className="flex flex-col items-center gap-4">
             <div className="flex gap-4 text-xs font-bold text-zinc-700">
               <span>GitHub</span>
               <span className="text-orange-500">GitLab</span>
             </div>
             {/* Git Branching Abstract Line */}
             <svg width="120" height="40" viewBox="0 0 120 40" stroke="#d4d4d8" fill="none" strokeWidth="2" strokeLinecap="round">
                <path d="M10 20 L40 20 C50 20, 60 10, 70 10 L110 10" />
                <path d="M40 20 C50 20, 60 30, 70 30 L90 30" />
                <circle cx="10" cy="20" r="3" fill="#fff" />
                <circle cx="110" cy="10" r="3" fill="#fff" />
                <circle cx="90" cy="30" r="3" fill="#fff" />
             </svg>
           </div>
        </div>
      )
    },
    {
      title: "Social Bookmarks",
      description: "Auto-sync your X/Twitter bookmarks, Reddit saves, and Readwise highlights directly into your knowledge graph.",
      mockup: (
        <div className="relative h-40 w-full overflow-hidden flex items-center justify-center">
           <div className="flex flex-col items-center gap-2">
             <div className="flex gap-3 text-[10px] font-bold text-zinc-600">
               <span className="text-teal-500">Airflow</span>
               <span className="text-purple-500">Dagster</span>
             </div>
             <div className="text-[10px] font-bold text-blue-500 mb-2">Prefect</div>
             {/* Graphical Nodes */}
             <div className="flex gap-3 items-center">
               <div className="w-5 h-5 rounded-full border-2 border-zinc-300 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-zinc-300 rounded-full"/></div>
               <div className="h-px w-6 bg-zinc-300" />
               <div className="w-5 h-5 rounded-full border-2 border-zinc-300 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-zinc-300 rounded-full"/></div>
               <div className="h-px w-6 bg-zinc-300" />
               <div className="w-5 h-5 rounded-full border-2 border-zinc-300 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-zinc-300 rounded-full"/></div>
             </div>
           </div>
        </div>
      )
    },
    {
      title: "Memory REST API",
      description: "Want to connect to an obscure tool we haven't thought of? Use our powerful public API to pipe data straight into your second brain.",
      mockup: (
        <div className="relative h-40 w-full overflow-hidden flex items-center justify-center">
           <div className="relative flex items-center gap-2 z-10">
             <span className="text-xl font-black tracking-tighter text-zinc-900">HEX</span>
             <span className="px-1 py-0.5 text-[10px] font-bold text-zinc-500 border border-zinc-200 rounded">API</span>
           </div>
           {/* Shockwaves */}
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
             <div className="w-24 h-48 rounded-full border border-zinc-400 [transform:rotate(45deg)] absolute" />
             <div className="w-24 h-48 rounded-full border border-zinc-400 [transform:rotate(-45deg)] absolute" />
             <div className="w-16 h-32 rounded-full border border-zinc-400 [transform:rotate(20deg)] absolute" />
             <div className="w-16 h-32 rounded-full border border-zinc-400 [transform:rotate(-20deg)] absolute" />
           </div>
        </div>
      )
    }
  ];

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
                 {item.mockup}
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
            Check out all of our plans to fit your team or organization.
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
