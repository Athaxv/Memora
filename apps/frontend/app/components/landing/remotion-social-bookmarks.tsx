import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';

export const SocialBookmarksVisual = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const loopFrame = frame % 120;

  // Central node breathing
  const breathe = 1 + Math.sin(frame / 12) * 0.04;

  return (
    <AbsoluteFill className="bg-transparent items-center justify-center">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#fef3c7_1px,transparent_1px),linear-gradient(to_bottom,#fef3c7_1px,transparent_1px)] bg-[size:1.2rem_1.2rem] opacity-20" />

      <div className="relative w-full h-full flex items-center justify-center z-10" style={{ transform: `scale(${entrance})` }}>

        {/* X / Twitter node */}
        <div className="absolute left-[8%] top-[20%] z-20">
          <div className="bg-white border border-zinc-200 rounded px-2 py-1 shadow-sm flex items-center gap-1">
            <span className="text-[9px] font-black text-zinc-900">𝕏</span>
            <span className="text-[7px] font-bold text-zinc-600">Twitter</span>
          </div>
        </div>

        {/* Reddit node */}
        <div className="absolute left-[5%] bottom-[20%] z-20">
          <div className="bg-white border border-orange-200 rounded px-2 py-1 shadow-sm flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center text-white text-[5px] font-bold">r/</div>
            <span className="text-[7px] font-bold text-orange-500">Reddit</span>
          </div>
        </div>

        {/* Readwise node */}
        <div className="absolute right-[5%] top-[25%] z-20">
          <div className="bg-white border border-amber-200 rounded px-2 py-1 shadow-sm flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /></svg>
            <span className="text-[7px] font-bold text-amber-600">Readwise</span>
          </div>
        </div>

        {/* Central graph node */}
        <div className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 z-20" style={{ transform: `translate(-50%, -50%) scale(${breathe})` }}>
          <div className="bg-zinc-900 text-white font-black tracking-tighter px-3 py-1.5 rounded shadow-lg text-[11px] flex items-center gap-1">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            Graph
          </div>
        </div>

        {/* SVG flow paths — staggered */}
        <svg className="absolute inset-0 w-full h-full" overflow="visible" viewBox="0 0 300 160">
          {/* X → center */}
          <path d="M 55 40 Q 100 50 150 80" fill="none" stroke="#e5e7eb" strokeWidth="1.5" />
          <path d="M 55 40 Q 100 50 150 80" fill="none" stroke="#18181b" strokeWidth="2.5" strokeDasharray="8 100" strokeDashoffset={-(loopFrame * 1.5) % 108} />

          {/* Reddit → center */}
          <path d="M 50 120 Q 100 110 150 80" fill="none" stroke="#e5e7eb" strokeWidth="1.5" />
          <path d="M 50 120 Q 100 110 150 80" fill="none" stroke="#f97316" strokeWidth="2.5" strokeDasharray="8 100" strokeDashoffset={-(Math.max(0, loopFrame - 20) * 1.8) % 108} />

          {/* Readwise → center */}
          <path d="M 255 45 Q 200 55 150 80" fill="none" stroke="#e5e7eb" strokeWidth="1.5" />
          <path d="M 255 45 Q 200 55 150 80" fill="none" stroke="#18181b" strokeWidth="2.5" strokeDasharray="8 100" strokeDashoffset={-(Math.max(0, loopFrame - 40) * 1.3) % 108} />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
