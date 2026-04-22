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
      className="ml-1 opacity-60 transition-transform group-hover:rotate-180"
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
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header className="fixed top-0 z-50 flex flex-col items-center w-full pointer-events-none">
      <nav
        className={cn(
          "w-full flex justify-center transition-all duration-500 pointer-events-auto",
          scrolled
            ? "border-b border-[#e4e4e7]/25 bg-[#ffffff]/85 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.06)]"
            : "border-b border-white/10 bg-transparent backdrop-blur-[2px]"
        )}
      >
        <div
          className={cn(
            "flex w-full max-w-[1200px] items-center justify-between px-6 md:px-10 lg:px-12 transition-all duration-300",
            scrolled ? "py-3" : "py-5"
          )}
        >
          {/* Left nav links */}
          <div
            className={cn(
              "hidden flex-1 items-center gap-7 text-[15px] font-medium transition-colors md:flex",
              scrolled ? "text-zinc-600" : "text-[#fafafa]/85"
            )}
          >
            <Link
              href="#features"
              className={cn(
                "group flex items-center transition-colors",
                scrolled ? "hover:text-zinc-950" : "hover:text-[#fafafa]"
              )}
            >
              Features
              <ChevronDown />
            </Link>
            <Link
              href="#use-cases"
              className={cn(
                "group flex items-center transition-colors",
                scrolled ? "hover:text-zinc-950" : "hover:text-[#fafafa]"
              )}
            >
              Use Cases
              <ChevronDown />
            </Link>
            <Link
              href="#pricing"
              className={cn(
                "transition-colors",
                scrolled ? "hover:text-zinc-950" : "hover:text-[#fafafa]"
              )}
            >
              Pricing
            </Link>
          </div>

          {/* Center logo */}
          <Link href="/" className="flex flex-shrink-0 items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1.5 font-bold tracking-tighter text-xl transition-colors",
                scrolled ? "text-zinc-900" : "text-[#fafafa] drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
              )}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
                <path d="M9 21h6" />
                <path d="M10 17v4" />
                <path d="M14 17v4" />
                <path d="M12 2v5" />
                <path d="M8 6l2 2" />
                <path d="M16 6l-2 2" />
              </svg>
              <span className="tracking-tight">Memora</span>
            </div>
          </Link>

          {/* Right nav links + CTA */}
          <div
            className={cn(
              "flex flex-1 items-center justify-end gap-7 text-[15px] font-medium transition-colors",
              scrolled ? "text-zinc-600" : "text-[#fafafa]/85"
            )}
          >
            <Link
              href="#resources"
              className={cn(
                "group hidden items-center transition-colors lg:flex",
                scrolled ? "hover:text-zinc-950" : "hover:text-[#fafafa]"
              )}
            >
              Resources
              <ChevronDown />
            </Link>
            <Link
              href="/login"
              className={cn(
                "hidden transition-colors md:block",
                scrolled ? "hover:text-zinc-950" : "hover:text-[#fafafa]"
              )}
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="group relative hidden md:inline-flex items-center justify-center bg-transparent px-5 py-2 text-[15px] font-bold transition-colors"
            >
              <span
                className={cn(
                  "absolute inset-0 backdrop-blur-sm transition-colors",
                  scrolled
                    ? "border border-zinc-900 bg-zinc-900 group-hover:bg-zinc-800"
                    : "border border-[#fafafa]/80 bg-[#fafafa]/15 group-hover:bg-[#fafafa]/25"
                )}
              />

              {/* Corner squares */}
              <span
                className={cn(
                  "absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border transition-colors",
                  scrolled ? "border-[#e4e4e7] bg-[#fafafa]" : "border-[#fafafa] bg-[#fafafa]"
                )}
              />
              <span
                className={cn(
                  "absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border transition-colors",
                  scrolled ? "border-[#e4e4e7] bg-[#fafafa]" : "border-[#fafafa] bg-[#fafafa]"
                )}
              />
              <span
                className={cn(
                  "absolute -left-[3px] -bottom-[3px] h-1.5 w-1.5 border transition-colors",
                  scrolled ? "border-[#e4e4e7] bg-[#fafafa]" : "border-[#fafafa] bg-[#fafafa]"
                )}
              />
              <span
                className={cn(
                  "absolute -right-[3px] -bottom-[3px] h-1.5 w-1.5 border transition-colors",
                  scrolled ? "border-[#e4e4e7] bg-[#fafafa]" : "border-[#fafafa] bg-[#fafafa]"
                )}
              />

              <span className={cn("relative z-10 tracking-tight", scrolled ? "text-[#fafafa]" : "text-[#fafafa]")}>
                Get started
              </span>
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn(
                "flex md:hidden items-center justify-center w-9 h-9 transition-colors",
                scrolled ? "text-zinc-700" : "text-[#fafafa]"
              )}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            "absolute top-full left-0 right-0 w-full overflow-hidden transition-all duration-300 ease-in-out md:hidden",
            mobileOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div
            className={cn(
              "flex flex-col gap-1 px-6 pb-6 pt-2 backdrop-blur-md border-t",
              scrolled
                ? "bg-[#ffffff]/95 border-zinc-100"
                : "bg-zinc-950/70 border-white/10"
            )}
          >
            {["Features", "Use Cases", "Pricing", "Resources"].map((label) => (
              <Link
                key={label}
                href={`#${label.toLowerCase().replace(" ", "-")}`}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "py-3 text-[15px] font-medium transition-colors",
                  scrolled ? "text-zinc-600 hover:text-zinc-900" : "text-[#fafafa]/85 hover:text-[#fafafa]"
                )}
              >
                {label}
              </Link>
            ))}
            <div className={cn("h-px my-2", scrolled ? "bg-zinc-200/80" : "bg-white/15")} />
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "py-3 text-[15px] font-medium transition-colors",
                scrolled ? "text-zinc-600 hover:text-zinc-900" : "text-[#fafafa]/85 hover:text-[#fafafa]"
              )}
            >
              Log In
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "mt-2 inline-flex items-center justify-center border px-5 py-2.5 text-[15px] font-bold transition-colors",
                scrolled
                  ? "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800"
                  : "border-[#fafafa] bg-[#fafafa]/15 text-[#fafafa] hover:bg-[#fafafa]/25"
              )}
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
