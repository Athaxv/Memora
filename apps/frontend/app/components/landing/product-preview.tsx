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
            {/* Brain/knowledge icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h2 className="text-[2.15rem] italic font-serif leading-[1.05] text-[#111118] md:text-[2.65rem] text-balance">
            Your AI-powered knowledge engine, always learning
          </h2>
          <p className="mt-5 text-zinc-600 leading-[1.65] text-[1.05rem]">
            Every link, note, and message you save is instantly summarized, auto-tagged, and woven into your personal knowledge graph — building connections you'd never find manually.
          </p>
          <div className="mt-8">
            <a href="#features" className="inline-flex items-center justify-center rounded-[4px] border border-zinc-200 bg-white px-5 py-2.5 text-[14.5px] font-medium text-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-zinc-50">
              See how it works
            </a>
          </div>

          <div className="mt-14 border-t border-dashed border-zinc-200/80 pt-8">
            <p className="font-serif italic text-zinc-600 leading-[1.5] text-[1.15rem]">
              "I used to lose 50 links a week. Now my Memory OS resurfaces exactly what I need, right when I need it."
            </p>
            <div className="mt-5 flex items-center gap-3">
               <div className="flex items-center gap-1 text-[15px]">
                 <span className="font-bold tracking-tight text-zinc-800">STARTUP FOUNDER</span>
               </div>
               <div className="text-[13.5px] text-zinc-500 leading-tight">
                 <span className="block font-medium text-zinc-800">Priya S.</span>
                 <span className="block">CEO, Stealth</span>
               </div>
            </div>
          </div>
        </div>

        {/* Right video dialog mockup */}
        <div className="w-full flex-1">
           <HeroVideoDialog
             videoSrc="https://www.youtube.com/embed/dQw4w9WgXcQ"
             className="w-full max-w-[1000px] ml-auto"
           />
        </div>
      </div>
    </section>
  );
}
