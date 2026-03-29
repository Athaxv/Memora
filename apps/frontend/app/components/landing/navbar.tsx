"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function ChevronDown() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      className="ml-1 opacity-40 transition-transform group-hover:rotate-180"
    >
      <path
        d="M2.5 3.75L5 6.25L7.5 3.75"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 flex flex-col items-center w-full shadow-none pointer-events-none">
      {/* Infinite Scroll Ticker Bar Constrained to 1200px Grid */}
      <div 
        className={cn(
          "w-full max-w-[1200px] border-x border-zinc-200/80 bg-[#fdfdfd] overflow-hidden flex relative transition-all duration-500 ease-in-out origin-top pointer-events-auto",
          scrolled ? "max-h-0 opacity-0 border-b-0 py-0" : "max-h-[44px] opacity-100 border-b pb-2.5 pt-2.5"
        )}
      >
        <div className="flex animate-marquee whitespace-nowrap w-max">
          {/* First set */}
          <div className="flex items-center justify-around w-[1200px] shrink-0 gap-8 px-4 text-[11px] font-medium text-zinc-600">
             <span className="flex items-center gap-1.5"><span className="text-[12px]">✨</span> It's just 'Hex' - not 'Q&A' or 'We can look'</span>
             <span className="flex items-center gap-1.5"><span className="text-[12px]">🪄</span> Bringing the magic of AI to data: agentic workflows</span>
             <span className="flex items-center gap-1.5"><span className="text-[12px]">📊</span> AI analytics use case: how Mercor unblocked 1,000s</span>
             <span className="flex items-center gap-1.5"><span className="text-[12px]">⚡</span> 40+ integrations out of the box</span>
          </div>
          {/* Duplicated set for seamless loop */}
          <div className="flex items-center justify-around w-[1200px] shrink-0 gap-8 px-4 text-[11px] font-medium text-zinc-600">
             <span className="flex items-center gap-1.5"><span className="text-[12px]">✨</span> It's just 'Hex' - not 'Q&A' or 'We can look'</span>
             <span className="flex items-center gap-1.5"><span className="text-[12px]">🪄</span> Bringing the magic of AI to data: agentic workflows</span>
             <span className="flex items-center gap-1.5"><span className="text-[12px]">📊</span> AI analytics use case: how Mercor unblocked 1,000s</span>
             <span className="flex items-center gap-1.5"><span className="text-[12px]">⚡</span> 40+ integrations out of the box</span>
          </div>
        </div>
      </div>

      <nav 
        className={cn(
          "w-full flex justify-center transition-all duration-300 pointer-events-auto backdrop-blur-sm",
          scrolled 
            ? "border-b border-zinc-200 bg-[#fdfdfd]/90 shadow-sm" 
            : "border-b border-zinc-200/80 bg-transparent"
        )}
      >
      <div 
        className={cn(
          "flex w-full max-w-[1200px] items-center justify-between px-6 md:px-10 lg:px-12 transition-all duration-300",
          scrolled ? "py-3" : "py-5"
        )}
      >
        {/* Left nav links */}
        <div className="hidden flex-1 items-center gap-7 text-[15px] font-medium text-zinc-600 md:flex">
          <Link
            href="#platform"
            className="group flex items-center transition-colors hover:text-zinc-950"
          >
            Platform
            <ChevronDown />
          </Link>
          <Link
            href="#solutions"
            className="group flex items-center transition-colors hover:text-zinc-950"
          >
            Solutions
            <ChevronDown />
          </Link>
          <Link
            href="#enterprise"
            className="transition-colors hover:text-zinc-950"
          >
            Enterprise
          </Link>
        </div>

        {/* Center logo */}
        <Link href="/" className="flex flex-shrink-0 items-center gap-2">
          {/* Hex style logo block */}
          <div className="flex items-center gap-0.5 font-bold tracking-tighter text-zinc-900 text-2xl">
            <span className="block h-6 w-2.5 bg-zinc-900"></span>
            <span className="block h-6 w-2.5 bg-zinc-900"></span>
            <span className="block h-6 w-2.5 bg-zinc-900"></span>
            <span className="ml-[1px] tracking-tight">Hex</span>
          </div>
        </Link>

        {/* Right nav links + CTA */}
        <div className="flex flex-1 items-center justify-end gap-7 text-[15px] font-medium text-zinc-600">
          <Link
            href="#resources"
            className="group hidden items-center transition-colors hover:text-zinc-950 lg:flex"
          >
            Resources
            <ChevronDown />
          </Link>
          <Link
            href="#pricing"
            className="hidden transition-colors hover:text-zinc-950 md:block"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="hidden transition-colors hover:text-zinc-950 md:block"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="group relative inline-flex items-center justify-center bg-transparent px-5 py-2 text-[15px] font-medium text-zinc-900 transition-colors"
          >
            {/* Cut/decorative border effect */}
            <span className="absolute inset-0 border border-zinc-200/80 bg-[#fdfdfd]/80 backdrop-blur-sm transition-colors group-hover:bg-zinc-100/60"></span>
            
            {/* Corner squares (editing handle effect) */}
            <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white group-hover:border-zinc-400 transition-colors" />
            <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white group-hover:border-zinc-400 transition-colors" />
            <span className="absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white group-hover:border-zinc-400 transition-colors" />
            <span className="absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border border-zinc-300 bg-white group-hover:border-zinc-400 transition-colors" />
            
            <span className="relative z-10">Get started</span>
          </Link>
        </div>
      </div>
    </nav>
    </header>
  );
}
