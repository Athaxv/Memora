import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

export const TwoWaySyncVisual = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const loopFrame = frame % 120;

  // Breathing central node
  const breathe = 1 + Math.sin(frame / 15) * 0.04;

  // Bidirectional packet flow
  const packet1 = spring({ frame: loopFrame, fps, config: { damping: 14, mass: 0.5 } });
  const packet2 = spring({ frame: Math.max(0, loopFrame - 40), fps, config: { damping: 14, mass: 0.5 } });

  const packet1X = interpolate(packet1, [0, 1], [35, 150]);
  const packet2X = interpolate(packet2, [0, 1], [265, 150]);

  return (
    <AbsoluteFill className="bg-transparent items-center justify-center">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ede9fe_1px,transparent_1px),linear-gradient(to_bottom,#ede9fe_1px,transparent_1px)] bg-[size:1.2rem_1.2rem] opacity-30" />

      <div className="relative w-full h-full flex items-center justify-center z-10" style={{ transform: `scale(${entrance})` }}>

        {/* Notion label */}
        <div className="absolute left-[5%] top-[38%] z-20">
          <div className="bg-white border border-zinc-200 rounded px-2 py-1 shadow-sm flex items-center gap-1">
            <div className="w-3 h-3 bg-zinc-900 rounded-[2px] flex items-center justify-center text-white text-[6px] font-bold">N</div>
            <span className="text-[8px] font-bold text-zinc-700">Notion</span>
          </div>
        </div>

        {/* Obsidian label */}
        <div className="absolute right-[5%] top-[38%] z-20">
          <div className="bg-white border border-purple-200 rounded px-2 py-1 shadow-sm flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-600 rounded-full" />
            <span className="text-[8px] font-bold text-purple-600">Obsidian</span>
          </div>
        </div>

        {/* Central sync node */}
        <div className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 z-20" style={{ transform: `translate(-50%, -50%) scale(${breathe})` }}>
          <div className="bg-zinc-900 text-white px-2.5 py-1 rounded shadow-lg flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round">
              <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            <span className="text-[8px] font-black tracking-tight">SYNC</span>
          </div>
        </div>

        {/* SVG flow paths + packets */}
        <svg className="absolute inset-0 w-full h-full" overflow="visible" viewBox="0 0 300 160">
          {/* Left → Center path */}
          <path d="M 55 75 Q 100 55 150 80" fill="none" stroke="#e5e7eb" strokeWidth="1.5" />
          <path d="M 55 75 Q 100 55 150 80" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeDasharray="8 100" strokeDashoffset={-(loopFrame * 1.5) % 108} />

          {/* Right → Center path */}
          <path d="M 245 75 Q 200 55 150 80" fill="none" stroke="#e5e7eb" strokeWidth="1.5" />
          <path d="M 245 75 Q 200 55 150 80" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeDasharray="8 100" strokeDashoffset={-(loopFrame * 1.2) % 108} />

          {/* Center → Left return path */}
          <path d="M 150 80 Q 100 105 55 85" fill="none" stroke="#e5e7eb" strokeWidth="1.5" />
          <path d="M 150 80 Q 100 105 55 85" fill="none" stroke="#6d28d9" strokeWidth="2" strokeDasharray="6 100" strokeDashoffset={-(loopFrame * 1.8) % 106} />

          {/* Center → Right return path */}
          <path d="M 150 80 Q 200 105 245 85" fill="none" stroke="#e5e7eb" strokeWidth="1.5" />
          <path d="M 150 80 Q 200 105 245 85" fill="none" stroke="#7c3aed" strokeWidth="2" strokeDasharray="6 100" strokeDashoffset={-(loopFrame * 1.4) % 106} />

          {/* Animated packets */}
          <circle cx={packet1X} cy={interpolate(packet1, [0, 1], [68, 78])} r="3" fill="#8b5cf6" opacity={packet1 < 0.95 ? 1 : 0} />
          <circle cx={packet2X} cy={interpolate(packet2, [0, 1], [68, 78])} r="3" fill="#a855f7" opacity={packet2 > 0.05 && packet2 < 0.95 ? 1 : 0} />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
