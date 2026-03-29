import Link from "next/link";

export function Footer() {
  const footerColumns = [
    {
      title: "Features",
      links: ["Memory Capture", "Mind Graph Explorer", "AI Search", "WhatsApp Bot", "Changelog", "Pricing"]
    },
    {
      title: "Use Cases",
      links: ["For Founders", "For Researchers", "For Students", "For Engineering", "For Writers"]
    },
    {
      title: "Resources",
      links: ["Documentation", "API Guide", "Community Discord", "Blog", "Compare to Notion"]
    },
    {
      title: "Legal",
      links: ["Terms of Service", "Privacy Policy", "Security", "Cookie Settings", "Data Export"]
    }
  ];

  return (
    <footer className="relative w-full border-t border-zinc-200/80 flex justify-center z-10 bg-transparent">
      <div className="flex w-full max-w-[1200px] flex-col px-6 py-16 md:px-10 lg:px-12 relative">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-x-8 gap-y-12">
          
          {/* Brand Column (Left) */}
          <div className="col-span-2 lg:col-span-1 flex flex-col items-start gap-4">
            <Link href="/" className="flex flex-shrink-0 items-center gap-2">
              <div className="flex items-center gap-0.5 font-bold tracking-tighter text-zinc-900 text-xl">
                <span className="block h-5 w-2 bg-zinc-900"></span>
                <span className="block h-5 w-2 bg-zinc-900"></span>
                <span className="block h-5 w-2 bg-zinc-900"></span>
                <span className="ml-[1px] tracking-tight">OS</span>
              </div>
            </Link>
            <p className="text-[12px] font-medium text-zinc-600 flex items-center gap-1.5 mt-2">
              Made with <span className="text-sm">🔥</span> on <span className="text-sm">🌎</span>.
            </p>
          </div>

          {/* Links Columns */}
          {footerColumns.map((col, idx) => (
            <div key={idx} className="flex flex-col">
              <h3 className="text-[11px] font-bold tracking-widest text-zinc-900 uppercase mb-5">
                {col.title}
              </h3>
              <ul className="flex flex-col gap-3">
                {col.links.map((linkName, jdx) => (
                  <li key={jdx}>
                    {/* Assuming links are just names and href will be '#' for now, or derived */}
                    <Link href="#" className="text-[13px] font-bold text-zinc-600 hover:text-zinc-900 transition-colors">
                      {linkName}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Status Column (Right) */}
          <div className="col-span-2 lg:col-span-1 flex flex-col items-start lg:items-end mt-4 lg:mt-0">
             <div className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 rounded text-[10px] font-mono tracking-wider font-bold text-zinc-600 cursor-pointer hover:bg-zinc-50 transition-colors">
                99.99% UPTIME
             </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-24 flex flex-col md:flex-row items-center justify-center gap-6 text-[11px] font-bold text-zinc-500">
            <span>© {new Date().getFullYear()} Memory OS, Inc.</span>
          <Link href="#" className="hover:text-zinc-900 transition-colors">Privacy policy</Link>
          <Link href="#" className="hover:text-zinc-900 transition-colors">Terms & conditions</Link>
          <Link href="#" className="hover:text-zinc-900 transition-colors">Modern slavery statement</Link>
        </div>
      </div>
    </footer>
  );
}
