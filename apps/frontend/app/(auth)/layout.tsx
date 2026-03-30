import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#fdfdfd]">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 50% at 50% 50%, #000 40%, transparent 100%)",
          maskImage:
            "radial-gradient(ellipse 60% 50% at 50% 50%, #000 40%, transparent 100%)",
          opacity: 0.4,
        }}
      />

      {/* Logo */}
      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center gap-1.5 font-bold tracking-tighter text-zinc-900 text-lg z-10"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
          <path d="M9 21h6" />
          <path d="M10 17v4" />
          <path d="M14 17v4" />
        </svg>
        <span className="tracking-tight">Memory OS</span>
      </Link>

      <div className="relative z-10 w-full max-w-[420px] px-6">{children}</div>
    </div>
  );
}
