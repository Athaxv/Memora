import Link from "next/link";

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
        
        {/* Abstract Architectural Corners (Top Left, Top Right) placed relative to the text but visually encompassing the grid */}
        
        <div className="text-center relative z-10 max-w-2xl mx-auto mb-16">
          <h2 className="text-[2.5rem] md:text-[4rem] tracking-tight text-zinc-900 leading-[1.05]">
            <span className="italic font-serif text-[#111118]">Loved </span>
            <span className="font-sans font-[700] tracking-tight text-[#111118]">by the<br/>best data teams</span>
          </h2>
          <p className="mt-6 text-[1.1rem] text-zinc-600 max-w-[400px] mx-auto font-medium">
            Hex helps companies of all sizes do more with their data.
          </p>
        </div>

        {/* 4-Column Grid with Corner Markers */}
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
                  <div className="h-8 font-bold tracking-tight text-zinc-900 flex items-center mb-6">
                    {c.company === "Notion" ? (
                      <div className="w-6 h-6 bg-black rounded flex items-center justify-center text-white text-[12px] font-sans">N</div>
                    ) : c.company === "MERCOR" ? (
                      <span className="text-indigo-600 tracking-wider">M MERCOR</span>
                    ) : c.company === "Figma" ? (
                      <div className="flex items-center gap-1.5"><div className="w-5 h-5 flex flex-wrap"><div className="w-2.5 h-2.5 bg-rose-500 rounded-tl-full rounded-bl-full"/><div className="w-2.5 h-2.5 bg-orange-500 rounded-tr-full rounded-br-full"/><div className="w-2.5 h-2.5 bg-purple-500 rounded-tl-full rounded-bl-full"/><div className="w-2.5 h-2.5 bg-sky-500 rounded-full"/></div>Figma</div>
                    ) : (
                      <span className="text-2xl tracking-tighter lowercase">neo</span>
                    )}
                  </div>
                  <h3 className="font-bold text-[15px] tracking-tight text-zinc-900 mb-1 leading-snug">{c.author}</h3>
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">{c.role}</div>
                  <p className="text-[13px] text-zinc-600 leading-relaxed font-medium">
                    "{c.quote}"
                  </p>
               </div>
             ))}
          </div>
        </div>

        {/* Bottom Cards Row */}
        <div className="w-full max-w-[1000px] mt-16 flex flex-col md:flex-row gap-6 lg:gap-8">
           
           {/* G2 Badges Card - Abstracted layout */}
           <div className="w-full md:w-1/3 border border-zinc-200 bg-white/50 p-6 lg:p-8 flex flex-col items-center text-center">
              <div className="grid grid-cols-3 gap-2 w-full max-w-[200px] mb-8">
                 <div className="aspect-[3/4] border border-zinc-200 relative flex flex-col items-center p-1 group hover:border-[#FF492C] transition-colors">
                   <div className="w-full h-1 bg-[#FF492C] absolute top-0 left-0 right-0"/>
                   <div className="mt-3 text-[7px] font-bold text-center leading-tight">High<br/>Performer</div>
                   <div className="absolute bottom-1 w-full flex justify-center"><div className="w-0 h-0 border-l-[12px] border-l-transparent border-t-[8px] border-t-[#FF492C] border-r-[12px] border-r-transparent"/></div>
                 </div>
                 <div className="aspect-[3/4] border border-zinc-200 relative flex flex-col items-center p-1 group hover:border-[#FF492C] transition-colors">
                   <div className="w-full h-1 bg-[#FF492C] absolute top-0 left-0 right-0"/>
                   <div className="mt-4 text-[7px] font-bold text-center leading-tight">Momentum<br/>Leader</div>
                 </div>
                 <div className="aspect-[3/4] border border-zinc-200 relative flex flex-col items-center p-1 group hover:border-[#FF492C] transition-colors">
                   <div className="w-full h-1 bg-[#FF492C] absolute top-0 left-0 right-0"/>
                   <div className="mt-4 text-[7px] font-bold text-center leading-tight">Best<br/>Est. ROI</div>
                   <div className="absolute bottom-1 w-full flex justify-center"><div className="w-0 h-0 border-l-[12px] border-l-transparent border-t-[8px] border-t-zinc-200 border-r-[12px] border-r-transparent"/></div>
                 </div>
                 <div className="aspect-[3/4] border border-zinc-200 relative flex flex-col items-center p-1 group hover:border-[#FF492C] transition-colors">
                   <div className="w-full h-1 bg-[#FF492C] absolute top-0 left-0 right-0"/>
                   <div className="mt-3 text-[7px] font-bold text-center leading-tight">Highest User<br/>Adoption</div>
                   <div className="absolute bottom-1 w-full flex justify-center"><div className="w-0 h-0 border-l-[12px] border-l-transparent border-t-[8px] border-t-[#FF492C] border-r-[12px] border-r-transparent"/></div>
                 </div>
                 <div className="aspect-[3/4] border border-zinc-200 relative flex flex-col items-center p-1 bg-zinc-50 group hover:border-[#FF492C] transition-colors">
                   <div className="w-full h-1 bg-[#FF492C] absolute top-0 left-0 right-0"/>
                   <div className="mt-3 text-[9px] font-black text-center leading-tight text-zinc-900">Users<br/>Love Us</div>
                   <div className="mt-1 flex gap-0.5 text-[#FF492C] text-[6px] tracking-tighter">♥♥♥</div>
                 </div>
                 <div className="aspect-[3/4] border border-zinc-200 relative flex flex-col items-center p-1 group hover:border-[#FF492C] transition-colors">
                   <div className="w-full h-1 bg-[#FF492C] absolute top-0 left-0 right-0"/>
                   <div className="mt-3 text-[7px] font-bold text-center leading-tight">Most<br/>Likely To<br/>Recommend</div>
                   <div className="absolute bottom-1 w-full flex justify-center"><div className="w-0 h-0 border-l-[12px] border-l-transparent border-t-[8px] border-t-[#FF492C] border-r-[12px] border-r-transparent"/></div>
                 </div>
              </div>

              <h3 className="font-bold text-xl text-zinc-900 mb-2 tracking-tight">Users love Hex</h3>
              <p className="text-[12px] text-zinc-600 font-medium">
                Rated on G2 as an industry leader based on customer reviews. <Link href="#" className="text-zinc-900 underline underline-offset-2 hover:text-[#FF492C] transition-colors whitespace-nowrap">Check them out →</Link>
              </p>
           </div>

           {/* Large Testimonial Card */}
           <div className="w-full md:w-2/3 border border-zinc-200/80 rounded-lg shadow-sm bg-white p-8 lg:p-12 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-8 h-8 bg-zinc-900 rounded mb-8 flex items-center justify-center text-white text-[15px] font-sans font-bold shadow-sm">N</div>
                <div className="relative">
                  <span className="absolute -left-6 top-1 text-2xl text-zinc-300 font-serif leading-none">"</span>
                  <p className="text-[1.125rem] md:text-[1.3rem] text-zinc-800 leading-relaxed font-medium tracking-tight">
                    Our vision for Notion's data team is that anyone, regardless of technical proficiency, is comfortable using data to answer their own questions — and Hex enables that.
                  </p>
                </div>
              </div>
              
              <div className="mt-8 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-200 shadow-inner overflow-hidden border border-zinc-100 flex items-center justify-center">
                   {/* Abstract Avatar */}
                   <div className="w-full h-full bg-gradient-to-tr from-zinc-500 to-zinc-300 relative"><div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-800 rounded-t-full"/></div>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                  <span className="text-[12px] font-bold text-zinc-500 tracking-[0.2em] mb-4">LOVED BY THINKERS</span>
                  <span className="text-[13px] text-zinc-500 font-medium hidden md:block">·</span>
                  <span className="text-[13px] text-zinc-500 font-medium tracking-tight">Software Engineer at Notion</span>
                </div>
              </div>
           </div>

        </div>

      </div>
    </section>
  );
}
