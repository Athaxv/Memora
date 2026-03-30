import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

export const EmailForwardVisual = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const loopFrame = frame % 120;

  // Envelope flies in from left
  const envelopeX = interpolate(
    spring({ frame: loopFrame, fps, config: { damping: 14, mass: 0.6 } }),
    [0, 1],
    [-40, 0]
  );

  // Content extraction animation
  const extractProgress = spring({ frame: Math.max(0, loopFrame - 25), fps, config: { damping: 12 } });

  // Flow to memory node
  const flowOffset = -(loopFrame * 1.8) % 110;

  return (
    <AbsoluteFill className="bg-transparent items-center justify-center">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#fce7f3_1px,transparent_1px),linear-gradient(to_bottom,#fce7f3_1px,transparent_1px)] bg-[size:1.2rem_1.2rem] opacity-30" />

      <div className="relative w-full h-full flex items-center justify-center z-10" style={{ transform: `scale(${entrance})` }}>

        {/* Envelope */}
        <div className="absolute left-[8%] top-[35%] z-20" style={{ transform: `translateX(${envelopeX}px)` }}>
          <div className="bg-white border border-rose-200 rounded px-2.5 py-1.5 shadow-sm flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.5">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <span className="text-[8px] font-bold text-rose-500">Email</span>
          </div>
        </div>

        {/* Extracted text lines */}
        <div className="absolute left-[32%] top-[25%] z-20 flex flex-col gap-1" style={{ opacity: extractProgress }}>
          <div className="h-[3px] bg-rose-200 rounded-full" style={{ width: `${interpolate(extractProgress, [0, 1], [0, 44])}px` }} />
          <div className="h-[3px] bg-rose-100 rounded-full" style={{ width: `${interpolate(extractProgress, [0, 1], [0, 32])}px` }} />
          <div className="h-[3px] bg-rose-100 rounded-full" style={{ width: `${interpolate(extractProgress, [0, 1], [0, 20])}px` }} />
        </div>

        {/* Central Memory node */}
        <div className="absolute right-[12%] top-[38%] z-20">
          <div className="bg-zinc-900 text-white font-black tracking-tighter px-2.5 py-1 rounded shadow-lg text-[11px] flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />
            OS
          </div>
        </div>

        {/* SVG flow paths */}
        <svg className="absolute inset-0 w-full h-full" overflow="visible" viewBox="0 0 300 160">
          <path d="M 85 75 Q 160 50 240 72" fill="none" stroke="#fce7f3" strokeWidth="2" />
          <path d="M 85 75 Q 160 50 240 72" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="8 100" strokeDashoffset={flowOffset} />

          <path d="M 85 75 Q 160 95 240 72" fill="none" stroke="#fce7f3" strokeWidth="2" />
          <path d="M 85 75 Q 160 95 240 72" fill="none" stroke="#fb7185" strokeWidth="2.5" strokeDasharray="8 100" strokeDashoffset={-(loopFrame * 1.3) % 110} />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
