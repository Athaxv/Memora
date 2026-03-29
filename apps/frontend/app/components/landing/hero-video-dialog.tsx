"use client";

import { useState, useEffect } from "react";
import { Play, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeroVideoDialog({
  videoSrc,
  thumbnailSrc,
  thumbnailAlt,
  className,
}: {
  videoSrc: string;
  thumbnailSrc?: string;
  thumbnailAlt?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <div className={cn("relative mx-auto w-full", className)}>
      <div 
        className="group relative cursor-pointer overflow-hidden rounded-md border border-zinc-200 bg-[#fdfdfd] p-1.5 shadow-sm transition-all duration-300 hover:border-zinc-300 hover:shadow-md"
        onClick={() => setIsOpen(true)}
      >
        <div className="relative overflow-hidden rounded-[4px] bg-zinc-50">
          <div className="absolute inset-0 z-10 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#111118] shadow-md transition-transform duration-300 group-hover:bg-zinc-800">
              <Play className="ml-1 h-6 w-6 text-white" fill="currentColor" />
            </div>
          </div>
          {thumbnailSrc ? (
            <img 
              src={thumbnailSrc} 
              alt={thumbnailAlt || "Video thumbnail"} 
              className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
          ) : (
             <div className="flex w-full aspect-[16/10] items-center justify-center bg-gradient-to-tr from-zinc-100 to-zinc-50 transition-transform duration-700 ease-out group-hover:scale-[1.02]">
                {/* Fallback pattern replacing the image */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                <div className="z-10 text-lg font-medium tracking-tight text-zinc-400">Interactive Preview</div>
             </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-12">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dialog */}
          <div className="relative z-10 w-full max-w-6xl aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 z-20 rounded-full bg-white/10 p-2 text-white/70 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <iframe
              src={videoSrc}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
