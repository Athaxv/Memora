const testimonials = [
  {
    company: "RESEARCHER",
    companyIcon: "🔬",
    quote: (
      <>
        &ldquo;I saved over 200 papers last semester and Memora automatically mapped the connections between them.{" "}
        <strong>My literature review practically wrote itself.</strong>&rdquo;
      </>
    ),
    name: "Arjun K.",
    title: "PhD Candidate, MIT",
  },
  {
    company: "FOUNDER",
    companyIcon: "🚀",
    quote: (
      <>
        &ldquo;I forward every interesting thread from WhatsApp and Twitter straight into my graph.{" "}
        <strong>It&rsquo;s like having a second brain with perfect recall.</strong>&rdquo;
      </>
    ),
    name: "Priya S.",
    title: "CEO, Stealth Startup",
  },
];

export function TestimonialsStrip() {
  return (
    <section className="relative z-20 w-screen -ml-[calc((100vw-100%)/2)] border-y border-zinc-200/80 bg-gradient-to-br from-[#fdfdfd] via-[#fef8f0]/40 to-[#fdfdfd]">
      <div className="grid grid-cols-1 divide-y divide-zinc-200/80 md:grid-cols-2 md:divide-x md:divide-y-0">
        {testimonials.map((t) => (
          <div key={t.name} className="flex flex-col items-center px-8 py-10 text-center md:px-16 md:py-12 lg:px-24">
            {/* Company logo/name */}
            <div className="mb-5 flex items-center gap-1.5 text-[15px] font-bold tracking-tight text-zinc-800">
              <span className="text-base">{t.companyIcon}</span>
              <span className="uppercase tracking-wider text-[13px] text-[#d97706]">{t.company}</span>
            </div>

            {/* Quote */}
            <p className="max-w-md font-serif italic leading-[1.55] text-zinc-600 text-[1.05rem] md:text-[1.1rem] [&_strong]:font-sans [&_strong]:not-italic [&_strong]:font-semibold [&_strong]:text-zinc-900">
              {t.quote}
            </p>

            {/* Author */}
            <div className="mt-5 text-[13px] text-zinc-500">
              <span className="font-medium text-zinc-800">{t.name}</span>
              <span className="mx-1.5 text-zinc-300">&middot;</span>
              <span>{t.title}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
