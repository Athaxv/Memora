import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';

export const HeroRemotionDemo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance animation for the main window (scale up smoothly)
  const windowScale = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });

  // Typewriter effect for AI Prompt
  const phrase = "What was that article I read three weeks ago about graph databases?";
  const typewriterProgress = Math.max(0, Math.floor((frame - 15) / 1.5));
  const textToShow = phrase.substring(0, typewriterProgress);

  // Chart pops in starting at frame 70
  const chartScale = spring({ frame: frame - 80, fps, config: { damping: 12, mass: 0.9 } });

  return (
    <AbsoluteFill className="bg-zinc-50 items-center justify-center font-sans p-8">
      {/* Abstract Grid Background for the video */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />
      
      <div 
        style={{ transform: `scale(${windowScale})` }} 
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col h-[500px] relative z-10"
      >
        {/* Top App Bar (macOS style) */}
        <div className="h-12 border-b border-zinc-200 flex items-center px-5 gap-2 bg-[#fdfdfd]">
          <div className="w-3 h-3 rounded-full bg-rose-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
          <div className="ml-4 flex-1 flex justify-center">
            <div className="w-48 h-6 bg-zinc-100 rounded-md border border-zinc-200/50" />
          </div>
        </div>
        
        <div className="flex-1 p-8 flex flex-col gap-6">
          {/* AI Prompter/Input Area */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 text-zinc-800 font-medium text-xl flex items-center shadow-inner relative overflow-hidden">
            {/* Pulsing AI icon */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center mr-4 shadow-sm relative">
               <div className="absolute inset-0 bg-white opacity-20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
               <span className="text-white text-sm">✦</span>
            </div>
            
            <span>{textToShow}</span>
            {/* Blinking cursor */}
            {frame % 30 < 15 && textToShow.length < phrase.length && (
              <span className="ml-[2px] w-0.5 h-6 bg-purple-500" />
            )}
          </div>

          {/* Chart Generation Area */}
          <div className="flex-1 flex gap-6">
            {/* Left Sidebar (Data Sources) */}
            <div className="w-1/4 h-full border border-zinc-200 rounded-xl bg-zinc-50/50 p-4 flex flex-col gap-3 opacity-0" style={{ opacity: spring({ frame: frame - 90, fps }) }}>
               <div className="w-full h-8 bg-zinc-200/60 rounded-md" />
               <div className="w-3/4 h-8 bg-zinc-200/40 rounded-md" />
               <div className="w-5/6 h-8 bg-zinc-200/40 rounded-md" />
            </div>

            {/* Main Chart Canvas */}
            <div 
              style={{ transform: `scale(${chartScale})`, opacity: chartScale }}
              className="flex-1 border border-zinc-200 rounded-xl bg-white shadow-sm flex items-end justify-around p-8 gap-4 relative overflow-hidden"
            >
              <div className="absolute top-4 left-6 text-sm font-bold text-zinc-800 tracking-tight">Semantic Matches: 42</div>
              <div className="absolute top-4 right-6 text-2xl font-sans text-emerald-500 font-bold">100% Relevance</div>
              
              {/* Grid lines behind bars */}
              <div className="absolute inset-x-0 bottom-8 top-16 flex flex-col justify-between px-8 z-0">
                 {[1, 2, 3, 4].map(l => <div key={l} className="w-full h-px bg-zinc-100" />)}
              </div>

              {[30, 45, 60, 45, 80, 50, 95].map((height, i) => {
                // Staggered bar growth
                const barHeight = spring({
                  frame: frame - 80 - (i * 4), 
                  fps,
                  config: { damping: 12, mass: 0.5 }
                });
                
                // Color gradient based on height
                const isHighest = height === 95;
                const bgClass = isHighest ? 'bg-indigo-500' : 'bg-slate-800';

                return (
                  <div 
                    key={i} 
                    className={`w-12 rounded-t-lg relative z-10 shadow-sm ${bgClass}`} 
                    style={{ height: `${height * barHeight}%` }} 
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
