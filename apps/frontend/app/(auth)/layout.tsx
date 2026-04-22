import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900,400i,500i,700i,900i&display=swap"
      />
      <div className="flex min-h-screen bg-zinc-50" style={{ fontFamily: "'Satoshi', sans-serif" }}>
        
        {/* Left Column - Form */}
        <div className="relative flex flex-1 flex-col justify-center px-6 py-20 lg:px-12 xl:px-16">
          {/* Subtle grid background for the left side */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, #e4e4e7 1px, transparent 1px),
                linear-gradient(to bottom, #e4e4e7 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
              WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, #000 40%, transparent 100%)",
              maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, #000 40%, transparent 100%)",
              opacity: 0.22,
            }}
          />

          {/* Back button */}
          <Link
            href="/"
            className="absolute top-8 left-8 flex items-center justify-center w-9 h-9 border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 transition-colors z-10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </Link>

          <div className="relative z-10 w-full max-w-[420px] mx-auto">{children}</div>
        </div>

        {/* Right Column - Image */}
        <div className="hidden lg:flex relative flex-1 bg-zinc-950 overflow-hidden border-l border-zinc-200/80 items-end p-12 xl:p-16">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 pointer-events-none" />
          <img 
            src="/bg3.png" 
            alt="Memora Context" 
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="relative z-20 max-w-xl">
            <p className="text-zinc-300/90 font-serif italic text-[1.5rem] xl:text-[1.75rem] leading-[1.4] tracking-tight">
              &ldquo;Memora automatically connects the dots between my research, notes, and ideas. It&rsquo;s like having a second brain with perfect recall.&rdquo;
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
