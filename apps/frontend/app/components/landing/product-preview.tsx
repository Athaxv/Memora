import { HeroVideoDialog } from "./hero-video-dialog";

export function ProductPreview() {
  return (
    <section id="product" className="relative w-full border-b border-zinc-200/80 flex justify-center z-10 font-sans bg-transparent">
      <div className="flex w-full max-w-[1200px] flex-col items-center justify-between gap-16 px-6 pb-24 pt-16 md:px-10 lg:flex-row lg:items-start lg:gap-12 lg:px-12 relative">
        
        {/* Decorative dashed boundary lines to simulate specific component structural grids */}
        <div className="absolute left-0 right-0 top-32 h-px border-t border-dashed border-zinc-200/80 pointer-events-none hidden lg:block z-0" />
        <div className="absolute left-[40%] top-0 bottom-0 w-px border-l border-dashed border-zinc-200/80 pointer-events-none hidden lg:block z-0" />
        
        {/* Left text content */}
        <div className="relative z-10 flex w-full max-w-[340px] flex-col justify-start pt-2 xl:max-w-[380px]">
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-gradient-to-b from-rose-50/50 to-rose-100/50 shadow-sm ring-1 ring-inset ring-rose-200/50 mb-7">
            {/* Custom Hex-like hexagon icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h2 className="text-[2.15rem] italic font-serif leading-[1.05] text-[#111118] md:text-[2.65rem] text-balance">
            Agentic data notebooks, for your most critical analyses
          </h2>
          <p className="mt-5 text-zinc-600 leading-[1.65] text-[1.05rem]">
            For in-depth work, Hex's powerful, collaborative notebooks give you superpowers — with cells for code, queries, and viz - and a built-in agent that can help you go deeper, faster.
          </p>
          <div className="mt-8">
            <a href="#notebooks" className="inline-flex items-center justify-center rounded-[4px] border border-zinc-200 bg-white px-5 py-2.5 text-[14.5px] font-medium text-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-zinc-50">
              Explore notebooks
            </a>
          </div>
          
          <div className="mt-14 border-t border-dashed border-zinc-200/80 pt-8">
            <p className="font-serif italic text-zinc-600 leading-[1.5] text-[1.15rem]">
              "With Hex's Notebook Agent, I never have to build another chart again? What a dream come true."
            </p>
            <div className="mt-5 flex items-center gap-3">
               <div className="flex items-center gap-[2px] font-bold tracking-tighter text-zinc-800 text-[15px]">
                 <span className="block h-[14px] w-[5px] bg-zinc-800"></span>
                 <span className="block h-[14px] w-[5px] bg-zinc-800"></span>
                 <span className="block h-[14px] w-[5px] bg-zinc-800"></span>
                 <span className="ml-[1px]">Figma</span>
               </div>
               <div className="text-[13.5px] text-zinc-500 leading-tight">
                 <span className="block font-medium text-zinc-800">Molly Jane N.</span> 
                 <span className="block">Senior Researcher</span>
               </div>
            </div>
          </div>
        </div>

        {/* Right video dialog mockup */}
        <div className="w-full flex-1">
           <HeroVideoDialog
             videoSrc="https://www.youtube.com/embed/qh3NGpYSUN3"
             className="w-full max-w-[1000px] ml-auto"
           />
        </div>
      </div>
    </section>
  );
}
