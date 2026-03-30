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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header className="sticky top-0 z-50 flex flex-col items-center w-full shadow-none pointer-events-none">
      {/* Full-Width Ticker Bar */}
      <div
        className={cn(
          "w-full bg-zinc-950 overflow-hidden flex relative transition-all duration-500 ease-in-out origin-top pointer-events-auto",
          scrolled ? "max-h-0 opacity-0 py-0" : "max-h-[38px] opacity-100 py-2"
        )}
      >
        {/* Left fade mask */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
        {/* Right fade mask */}
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee whitespace-nowrap w-max">
          {[0, 1].map((set) => (
            <div key={set} className="flex items-center shrink-0 gap-6 px-4 text-[12px] font-medium text-zinc-400 tracking-wide">
              <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />Your second brain, powered by AI</span>
              <span className="text-zinc-700">—</span>
              <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-rose-400 shrink-0" />Capture from anywhere — WhatsApp, Chrome, email, PDFs</span>
              <span className="text-zinc-700">—</span>
              <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-sky-400 shrink-0" />Find anything with natural language search</span>
              <span className="text-zinc-700">—</span>
              <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />Zero-effort organization — AI tags, links &amp; summarizes</span>
              <span className="text-zinc-700 mr-6">—</span>
            </div>
          ))}
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
            href="#features"
            className="group flex items-center transition-colors hover:text-zinc-950"
          >
            Features
            <ChevronDown />
          </Link>
          <Link
            href="#use-cases"
            className="group flex items-center transition-colors hover:text-zinc-950"
          >
            Use Cases
            <ChevronDown />
          </Link>
          <Link
            href="#pricing"
            className="transition-colors hover:text-zinc-950"
          >
            Pricing
          </Link>
        </div>

        {/* Center logo */}
        <Link href="/" className="flex flex-shrink-0 items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold tracking-tighter text-zinc-900 text-xl">
            {/* Brain/memory icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-900">
              <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
              <path d="M9 21h6" />
              <path d="M10 17v4" />
              <path d="M14 17v4" />
              <path d="M12 2v5" />
              <path d="M8 6l2 2" />
              <path d="M16 6l-2 2" />
            </svg>
            <span className="tracking-tight">Memory OS</span>
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
            href="/login"
            className="hidden transition-colors hover:text-zinc-950 md:block"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="group relative hidden md:inline-flex items-center justify-center bg-transparent px-5 py-2 text-[15px] font-medium text-zinc-900 transition-colors"
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

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex md:hidden items-center justify-center w-9 h-9 text-zinc-700"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h18" />
                <path d="M3 6h18" />
                <path d="M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <div
        className={cn(
          "w-full max-w-[1200px] overflow-hidden transition-all duration-300 ease-in-out md:hidden",
          mobileOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="flex flex-col gap-1 px-6 pb-6 pt-2 bg-[#fdfdfd]/95 backdrop-blur-sm border-t border-zinc-100">
          <Link href="#features" onClick={() => setMobileOpen(false)} className="py-3 text-[15px] font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Features</Link>
          <Link href="#use-cases" onClick={() => setMobileOpen(false)} className="py-3 text-[15px] font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Use Cases</Link>
          <Link href="#pricing" onClick={() => setMobileOpen(false)} className="py-3 text-[15px] font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Pricing</Link>
          <Link href="#resources" onClick={() => setMobileOpen(false)} className="py-3 text-[15px] font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Resources</Link>
          <div className="h-px bg-zinc-200/80 my-2" />
          <Link href="/login" onClick={() => setMobileOpen(false)} className="py-3 text-[15px] font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Log In</Link>
          <Link href="/signup" onClick={() => setMobileOpen(false)} className="mt-2 inline-flex items-center justify-center border border-zinc-300 bg-[#fdfdfd] px-5 py-2.5 text-[15px] font-medium text-zinc-900 hover:bg-zinc-100 transition-colors">Get started</Link>
        </div>
      </div>
    </nav>
    </header>
  );
}
