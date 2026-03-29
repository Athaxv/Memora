import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

export const DataAppsVisual = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance animation
  const containerY = spring({ frame, fps, config: { damping: 14 } });
  
  // Toggle switch animation (flips at frame 50)
  const toggleProgress = spring({ frame: frame - 50, fps, config: { damping: 12 } });
  
  // Magic wand appearance
  const wandScale = spring({ frame: frame - 30, fps, config: { damping: 10 } });

  return (
    <AbsoluteFill className="bg-zinc-50 items-center justify-center p-8 border border-zinc-200/50">
      <div
        className="absolute inset-0 z-0 opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(#111 2px, transparent 2px)`,
          backgroundSize: '30px 30px'
        }}
      />

      <div 
        className="w-full h-full max-w-[500px] bg-white rounded-xl shadow-xl border border-zinc-200 flex flex-col overflow-hidden relative z-10"
        style={{ transform: `translateY(${interpolate(containerY, [0, 1], [50, 0])}px)`, opacity: containerY }}
      >
        {/* Header */}
        <div className="h-12 border-b border-zinc-200 flex justify-between items-center px-5 bg-zinc-50">
           <div className="text-sm font-bold text-zinc-500">Memory Feed Timeline</div>
           
           {/* Magic Wand Auto-Layout Toggle */}
           <div className="flex items-center gap-3">
             <div style={{ transform: `scale(${wandScale})` }} className="text-indigo-500 mr-1 text-lg">✨</div>
             <div className="w-10 h-5 rounded-full outline outline-1 outline-zinc-200 bg-zinc-100 flex items-center relative overflow-hidden">
                {/* Background color transition */}
                <div className="absolute inset-0 bg-indigo-500" style={{ opacity: toggleProgress }} />
                
                {/* Toggle Knob */}
                <div 
                  className="w-4 h-4 rounded-full bg-white shadow-sm absolute z-10 transition-colors"
                  style={{ left: interpolate(toggleProgress, [0, 1], [2, 22]) }}
                />
             </div>
           </div>
        </div>

        {/* Dashboard Body */}
        <div className="p-5 grid grid-cols-2 gap-5 flex-1 bg-[#fdfdfd]">
           {/* Widget 1 */}
           <div className="border border-zinc-200 rounded-lg p-4 flex flex-col gap-3 relative overflow-hidden bg-white shadow-sm">
             <div className="w-1/2 h-2.5 rounded bg-zinc-200" />
             <div className="text-3xl font-bold text-zinc-800 tracking-tight">2,461</div>
             
             {/* Progress bar animating after toggle */}
             <div className="w-full h-2.5 bg-zinc-100 rounded-full mt-auto overflow-hidden">
                <div className="h-full bg-emerald-400" style={{ width: `${interpolate(toggleProgress, [0, 1], [30, 84.2])}%` }} />
             </div>
           </div>

           {/* Widget 2 (Bar Chart) */}
           <div className="border border-zinc-200 rounded-lg p-4 flex items-end justify-between gap-1.5 bg-white shadow-sm">
             {[30, 50, 40, 70, 60, 90].map((h, i) => (
               <div key={i} className="w-full bg-indigo-500 rounded-t-sm opacity-90 shadow-sm" 
                    style={{ height: `${interpolate(toggleProgress, [0, 1], [h * 0.4, h])}%` }} />
             ))}
           </div>
           
           {/* Widget 3 (Wide List Item) */}
           <div className="border border-zinc-200 rounded-lg p-4 col-span-2 flex items-center gap-5 bg-white shadow-sm">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 text-2xl border border-indigo-100">🧠</div>
              <div className="flex flex-col gap-2.5 flex-1">
                 <div className="w-1/3 h-2.5 rounded bg-zinc-200" />
                 <div className="w-full h-2.5 rounded bg-zinc-100" />
                 <div className="w-5/6 h-2.5 rounded bg-zinc-100" />
              </div>
           </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
