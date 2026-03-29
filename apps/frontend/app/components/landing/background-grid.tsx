import { cn } from "@/lib/utils";
import { DotPattern } from "@/components/ui/dot-pattern";

export function BackgroundGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-white text-zinc-900 overflow-hidden font-sans">
      
      {/* 1. Full screen diagonal stripes for the exterior margins */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-70"
        style={{
          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, #f3f4f6 2px, #f3f4f6 4px)",
        }}
      />

      {/* 2. Notion-style/Hex architectural structural borders defining the content column */}
      <div className="pointer-events-none fixed inset-0 z-0 flex justify-center w-full">
        <div className="w-full max-w-[1200px] h-full border-x border-zinc-200/80 bg-[#fdfdfd] relative isolate overflow-hidden">
          
          {/* MagicUI Animated Dot Pattern Background ONLY within 1200px bounds */}
          <DotPattern
            width={32}
            height={32}
            cx={1}
            cy={1}
            cr={1.5}
            glow={true}
            className={cn(
              "opacity-[0.25] text-zinc-900",
              "[mask-image:radial-gradient(100vh_circle_at_center,white,transparent)]"
            )}
          />
          
          {/* Subtle radial overlay for a soft vignette/focus effect in the center */}
          <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#fdfdfd_85%)]" />

        </div>
      </div>

      {/* 3. Content layer spans the entire width while internal elements manage their own constraints */}
      <div className="relative z-10 flex flex-col items-center w-full">{children}</div>
    </div>
  );
}
