export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
      />

      <div className="relative flex min-h-screen items-center justify-center bg-[#fef8f0]" style={{ fontFamily: "'Satoshi', sans-serif" }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #fbbf9b 1px, transparent 1px),
              linear-gradient(to bottom, #fbbf9b 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            WebkitMaskImage:
              "radial-gradient(ellipse 60% 50% at 50% 50%, #000 40%, transparent 100%)",
            maskImage:
              "radial-gradient(ellipse 60% 50% at 50% 50%, #000 40%, transparent 100%)",
            opacity: 0.22,
          }}
        />

        <div className="relative z-10 w-full max-w-[600px] px-6">{children}</div>
      </div>
    </>
  );
}
