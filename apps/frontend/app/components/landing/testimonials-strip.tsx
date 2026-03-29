const testimonials = [
  {
    company: "MERCOR",
    companyIcon: "M",
    quote: (
      <>
        &ldquo;If we didn&rsquo;t have Hex, we might&rsquo;ve left more than $100M
        on the table. <strong>That might even be an underestimate.</strong>&rdquo;
      </>
    ),
    name: "David F.",
    title: "Co-Founder & CEO",
  },
  {
    company: "nigidia",
    companyIcon: "◎",
    quote: (
      <>
        &ldquo;You can do almost everything for you in Hex.
        I use it to scaffold entire apps and help me
        debug SQL queries. <strong>It makes me 10x faster.</strong>&rdquo;
      </>
    ),
    name: "Lori T.",
    title: "Principal Engineer",
  },
];

export function TestimonialsStrip() {
  return (
    <section className="relative z-20 w-screen -ml-[calc((100vw-100%)/2)] border-y border-zinc-200/80 bg-[#fdfdfd]">
      <div className="grid grid-cols-1 divide-y divide-zinc-200/80 md:grid-cols-2 md:divide-x md:divide-y-0">
        {testimonials.map((t) => (
          <div key={t.name} className="flex flex-col items-center px-8 py-10 text-center md:px-16 md:py-12 lg:px-24">
            {/* Company logo/name */}
            <div className="mb-5 flex items-center gap-1.5 text-[15px] font-bold tracking-tight text-zinc-800">
              <span className="text-base font-black">{t.companyIcon}</span>
              <span className="uppercase tracking-wider">{t.company}</span>
            </div>

            {/* Quote */}
            <p className="max-w-md font-serif italic leading-[1.55] text-zinc-600 text-[1.05rem] md:text-[1.1rem] [&_strong]:font-sans [&_strong]:not-italic [&_strong]:font-semibold [&_strong]:text-zinc-900">
              {t.quote}
            </p>

            {/* Author */}
            <div className="mt-5 text-[13px] text-zinc-500">
              <span className="font-medium text-zinc-800">{t.name}</span>
              <span className="mx-1.5 text-zinc-300">·</span>
              <span>{t.title}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
