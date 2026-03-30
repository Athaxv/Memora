import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

export const BrowserExtensionVisual = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const loopFrame = frame % 120;

  // Highlight sweep
  const highlightWidth = interpolate(
    spring({ frame: Math.max(0, loopFrame - 10), fps, config: { damping: 18, mass: 0.6 } }),
    [0, 1],
    [0, 100]
  );

  // Save button appears
  const saveProgress = spring({ frame: Math.max(0, loopFrame - 45), fps, config: { damping: 12, mass: 0.6 } });

  // Flow to Memory OS
  const flowOffset = -(Math.max(0, loopFrame - 60) * 2) % 110;
  const flowOpacity = loopFrame > 55 ? 1 : 0;

  // Checkmark
  const checkProgress = spring({ frame: Math.max(0, loopFrame - 85), fps, config: { damping: 10 } });

  return (
    <AbsoluteFill className="bg-transparent items-center justify-center">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ecfdf5_1px,transparent_1px),linear-gradient(to_bottom,#ecfdf5_1px,transparent_1px)] bg-[size:1.2rem_1.2rem] opacity-30" />

      <div className="relative w-full h-full flex items-center justify-center z-10" style={{ transform: `scale(${entrance})` }}>

        {/* Browser tab mockup */}
        <div className="absolute top-[8%] left-[8%] right-[8%] z-20">
          <div className="bg-zinc-100 border border-zinc-200 rounded-t-md px-2 py-1 flex items-center gap-1.5">
            <div className="flex gap-[3px]">
              <div className="w-[5px] h-[5px] rounded-full bg-zinc-300" />
              <div className="w-[5px] h-[5px] rounded-full bg-zinc-300" />
              <div className="w-[5px] h-[5px] rounded-full bg-zinc-300" />
            </div>
            <div className="flex-1 bg-white rounded-sm px-2 py-[2px] text-[6px] text-zinc-400 font-medium">article.com/interesting-post</div>
          </div>

          {/* Page content with highlight */}
          <div className="bg-white border-x border-b border-zinc-200 px-3 py-2 flex flex-col gap-1.5">
            <div className="relative">
              <div className="h-[3px] w-[85%] bg-zinc-100 rounded-full" />
              <div className="absolute inset-y-0 left-0 bg-yellow-200/70 rounded-full h-[3px]" style={{ width: `${Math.min(highlightWidth, 85)}%` }} />
            </div>
            <div className="h-[3px] w-[70%] bg-zinc-100 rounded-full" />
            <div className="h-[3px] w-[60%] bg-zinc-100 rounded-full" />
          </div>
        </div>

        {/* Save button popup */}
        <div className="absolute right-[10%] top-[52%] z-30" style={{ transform: `scale(${saveProgress})`, opacity: saveProgress }}>
          <div className="bg-emerald-500 text-white text-[7px] font-bold px-2 py-1 rounded shadow-md flex items-center gap-1">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            </svg>
            Save
          </div>
        </div>

        {/* Memory OS target node */}
        <div className="absolute left-[50%] bottom-[8%] -translate-x-1/2 z-20">
          <div className="bg-zinc-900 text-white font-black tracking-tighter px-2.5 py-1 rounded shadow-lg text-[10px] flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            OS
            {/* Checkmark overlay */}
            {checkProgress > 0.1 && (
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" style={{ opacity: checkProgress }}>
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </div>
        </div>

        {/* Flow SVG */}
        <svg className="absolute inset-0 w-full h-full" overflow="visible" viewBox="0 0 300 160">
          <path d="M 230 85 Q 200 120 150 140" fill="none" stroke="#d1fae5" strokeWidth="2" opacity={flowOpacity} />
          <path d="M 230 85 Q 200 120 150 140" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="8 100" strokeDashoffset={flowOffset} opacity={flowOpacity} />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
