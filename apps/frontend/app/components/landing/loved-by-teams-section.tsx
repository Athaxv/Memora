import Link from "next/link";
import type { ReactNode } from "react";

const roleIcons: Record<string, ReactNode> = {
  RESEARCHER: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  ),
  WRITER: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  ),
  FOUNDER: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  ),
  STUDENT: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  INVESTOR: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  DEVELOPER: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  ),
};

export function LovedByTeamsSection() {
  const testimonials = [
    {
      company: "RESEARCHER",
      author: "Arjun K.",
      role: "Graduate Student",
      quote: "I can track how my research topics connect over 100+ PDFs without manual tagging. The semantic graph is incredible."
    },
    {
      company: "WRITER",
      author: "Sarah T.",
      role: "Author",
      quote: "I used to lose an article a day. Now my memory OS just remembers it all for me and resurfaces exactly what I need."
    },
    {
      company: "FOUNDER",
      author: "Priya S.",
      role: "Startup CEO",
      quote: "When I need that one specific tweet I saw 3 weeks ago about pricing models, I just ask my AI and it's there."
    },
    {
      company: "STUDENT",
      author: "David L.",
      role: "Undergrad",
      quote: "My study notes are finally automatically organized and visually connected. It feels like absolute magic."
    },
    {
      company: "INVESTOR",
      author: "Elena M.",
      role: "Partner",
      quote: "Forwarding pitch decks from WhatsApp straight into my knowledge graph saves me hours of manual organization every week."
    },
    {
      company: "DEVELOPER",
      author: "James C.",
      role: "Software Engineer",
      quote: "The API lets me pipe all my GitHub issues and chaotic Slack threads right into my second brain."
    }
  ];

  return (
    <section className="relative w-full flex justify-center z-10 bg-transparent py-24 md:py-32">
      <div className="flex w-full max-w-[1200px] flex-col items-center px-6 md:px-10 lg:px-12 relative">

        <div className="text-center relative z-10 max-w-2xl mx-auto mb-16">
          <h2 className="text-[2.5rem] md:text-[4rem] tracking-tight text-zinc-900 leading-[1.05]">
            <span className="italic font-serif text-[#111118]">Loved </span>
            <span className="font-sans font-[700] tracking-tight text-[#111118]">by people who<br/>remember everything</span>
          </h2>
          <p className="mt-6 text-[1.1rem] text-zinc-600 max-w-[440px] mx-auto font-medium">
            Memory OS helps individuals and teams organize their knowledge effortlessly.
          </p>
        </div>

        {/* 6-Column Grid with Corner Markers */}
        <div className="relative w-full mt-8 max-w-[1000px]">

          {/* Top Left Marker */}
          <div className="absolute -top-[1.5rem] -left-[1.5rem] w-3 h-3 border-t-2 border-l-2 border-black" />
          {/* Top Right Marker */}
          <div className="absolute -top-[1.5rem] -right-[1.5rem] w-3 h-3 border-t-2 border-r-2 border-black" />

          {/* Bottom Left Marker */}
          <div className="absolute -bottom-[1.5rem] -left-[1.5rem] w-3 h-3 border-b-2 border-l-2 border-black" />
          {/* Bottom Right Marker */}
          <div className="absolute -bottom-[1.5rem] -right-[1.5rem] w-3 h-3 border-b-2 border-r-2 border-black" />

          {/* Grid Container */}
          <div className="w-full border-y border-zinc-200/80 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-zinc-200/80 relative">
             {/* Middle side tick marks */}
             <div className="absolute -left-[1.5rem] top-0 w-2 h-px bg-black hidden md:block" />
             <div className="absolute -right-[1.5rem] top-0 w-2 h-px bg-black hidden md:block" />

             {testimonials.map((c, i) => (
               <div key={i} className="flex-1 p-6 lg:p-8 flex flex-col items-start min-h-[220px]">
                  <div className="h-8 flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center">
                      {roleIcons[c.company] ?? <span className="text-xs font-bold text-zinc-400">{c.company[0]}</span>}
                    </div>
                    <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase">{c.company}</span>
                  </div>
                  <h3 className="font-bold text-[15px] tracking-tight text-zinc-900 mb-1 leading-snug">{c.author}</h3>
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">{c.role}</div>
                  <p className="text-[13px] text-zinc-600 leading-relaxed font-medium">
                    &ldquo;{c.quote}&rdquo;
                  </p>
               </div>
             ))}
          </div>
        </div>

        {/* Bottom Cards Row */}
        <div className="w-full max-w-[1000px] mt-16 flex flex-col md:flex-row gap-6 lg:gap-8">

           {/* Stats Card */}
           <div className="w-full md:w-1/3 border border-zinc-200 bg-white/50 p-6 lg:p-8 flex flex-col items-center text-center">
              <div className="flex flex-col items-center gap-6 mb-8">
                <div className="text-[3.5rem] font-bold tracking-tighter text-zinc-900 leading-none">10k+</div>
                <div className="text-[13px] font-medium text-zinc-500">Memories captured daily</div>
                <div className="w-16 h-px bg-zinc-200" />
                <div className="text-[3.5rem] font-bold tracking-tighter text-zinc-900 leading-none">4.9</div>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  ))}
                </div>
                <div className="text-[13px] font-medium text-zinc-500">Average user rating</div>
              </div>

              <h3 className="font-bold text-xl text-zinc-900 mb-2 tracking-tight">People love Memory OS</h3>
              <p className="text-[12px] text-zinc-600 font-medium">
                Join thousands building their second brain. <Link href="/signup" className="text-zinc-900 underline underline-offset-2 hover:text-rose-500 transition-colors whitespace-nowrap">Get started free &rarr;</Link>
              </p>
           </div>

           {/* Large Testimonial Card */}
           <div className="w-full md:w-2/3 border border-zinc-200/80 rounded-lg shadow-sm bg-white p-8 lg:p-12 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-8 h-8 bg-zinc-900 rounded mb-8 flex items-center justify-center text-white text-[15px] font-sans font-bold shadow-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
                    <path d="M9 21h6" />
                  </svg>
                </div>
                <div className="relative">
                  <span className="absolute -left-6 top-1 text-2xl text-zinc-300 font-serif leading-none">&ldquo;</span>
                  <p className="text-[1.125rem] md:text-[1.3rem] text-zinc-800 leading-relaxed font-medium tracking-tight">
                    Memory OS changed how I think about information. Instead of organizing files into folders, I just capture everything and the AI connects the dots. It&rsquo;s like having a research assistant that never forgets.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-200 shadow-inner overflow-hidden border border-zinc-100 flex items-center justify-center">
                   <div className="w-full h-full bg-gradient-to-tr from-indigo-400 to-violet-300 relative"><div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-indigo-800 rounded-t-full"/></div>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                  <span className="text-[12px] font-bold text-zinc-500 tracking-[0.2em]">LOVED BY THINKERS</span>
                  <span className="text-[13px] text-zinc-500 font-medium hidden md:block">&middot;</span>
                  <span className="text-[13px] text-zinc-500 font-medium tracking-tight">AI Researcher at Stanford</span>
                </div>
              </div>
           </div>

        </div>

      </div>
    </section>
  );
}
