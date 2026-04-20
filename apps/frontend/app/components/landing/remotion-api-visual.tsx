import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

export const ApiVisual = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const loopFrame = frame % 120;

  // Typewriter for POST request
  const postText = 'POST /api/memories';
  const typeProgress = Math.min(Math.floor(Math.max(0, loopFrame - 5) / 2), postText.length);
  const visibleText = postText.substring(0, typeProgress);

  // Response appears after typing
  const responseProgress = spring({ frame: Math.max(0, loopFrame - 50), fps, config: { damping: 12, mass: 0.6 } });

  // Success pulse rings
  const pulseFrame = Math.max(0, loopFrame - 70);
  const ring1 = interpolate(pulseFrame, [0, 50], [0, 60], { extrapolateRight: 'clamp' });
  const ring2 = interpolate(Math.max(0, pulseFrame - 10), [0, 50], [0, 60], { extrapolateRight: 'clamp' });
  const ring1Opacity = interpolate(pulseFrame, [0, 50], [0.6, 0], { extrapolateRight: 'clamp' });
  const ring2Opacity = interpolate(Math.max(0, pulseFrame - 10), [0, 50], [0.6, 0], { extrapolateRight: 'clamp' });

  // Blinking cursor
  const showCursor = loopFrame % 20 < 10 && typeProgress < postText.length;

  return (
    <AbsoluteFill className="bg-transparent items-center justify-center">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f4f4f5_1px,transparent_1px),linear-gradient(to_bottom,#f4f4f5_1px,transparent_1px)] bg-[size:1.2rem_1.2rem] opacity-30" />

      <div className="relative w-full h-full flex items-center justify-center z-10" style={{ transform: `scale(${entrance})` }}>

        {/* Terminal mockup */}
        <div className="absolute inset-x-[8%] top-[10%] bottom-[25%] z-20">
          {/* Terminal header */}
          <div className="bg-zinc-800 rounded-t-md px-2.5 py-1 flex items-center gap-1.5">
            <div className="flex gap-[3px]">
              <div className="w-[5px] h-[5px] rounded-full bg-red-400" />
              <div className="w-[5px] h-[5px] rounded-full bg-yellow-400" />
              <div className="w-[5px] h-[5px] rounded-full bg-green-400" />
            </div>
            <span className="text-[6px] font-mono text-zinc-500 ml-1">terminal</span>
          </div>

          {/* Terminal body */}
          <div className="bg-zinc-900 rounded-b-md px-2.5 py-2 font-mono flex flex-col gap-1">
            {/* POST line */}
            <div className="flex items-center gap-1">
              <span className="text-emerald-400 text-[7px]">$</span>
              <span className="text-zinc-100 text-[7px]">{visibleText}</span>
              {showCursor && <span className="text-zinc-400 text-[7px]">▊</span>}
            </div>

            {/* Response */}
            {responseProgress > 0.1 && (
              <div className="flex flex-col gap-0.5 mt-1" style={{ opacity: responseProgress }}>
                <div className="flex items-center gap-1">
                  <span className="text-emerald-400 text-[7px] font-bold">201</span>
                  <span className="text-zinc-500 text-[6px]">Created</span>
                </div>
                <span className="text-zinc-500 text-[6px]">{'{ "id": "01HX...", "status": "ok" }'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Success pulse rings */}
        <svg className="absolute inset-0 w-full h-full z-10" overflow="visible" viewBox="0 0 300 160">
          {pulseFrame > 0 && (
            <>
              <circle cx="150" cy="130" r={ring1} fill="none" stroke="#10b981" strokeWidth="1.5" opacity={ring1Opacity} />
              <circle cx="150" cy="130" r={ring2} fill="none" stroke="#34d399" strokeWidth="1" opacity={ring2Opacity} />
            </>
          )}
        </svg>

        {/* Bottom Memora badge */}
        <div className="absolute bottom-[6%] left-[50%] -translate-x-1/2 z-20" style={{ opacity: responseProgress, transform: `translateX(-50%) scale(${interpolate(responseProgress, [0, 1], [0.8, 1])})` }}>
          <div className="bg-zinc-900 text-white font-black tracking-tighter px-2.5 py-1 rounded shadow-lg text-[9px] flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Memory saved
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
