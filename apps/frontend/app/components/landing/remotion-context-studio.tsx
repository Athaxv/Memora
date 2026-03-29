import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

export const ContextStudioVisual = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pulse animation that loops over 120 frames
  const loopFrame = frame % 120;
  
  // Progress of the data packet moving along the line
  const packetProgress1 = spring({ frame: loopFrame, fps, config: { damping: 14 } });
  const packetProgress2 = spring({ frame: loopFrame - 30, fps, config: { damping: 14 } });

  // Breathing effect for main node
  const scale = 1 + Math.sin(frame / 15) * 0.05;

  return (
    <AbsoluteFill className="bg-zinc-50 items-center justify-center p-8 border border-zinc-200/50">
      
      {/* Background blueprint dots */}
      <div
        className="absolute inset-0 z-0 opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(#111 2px, transparent 2px)`,
          backgroundSize: '30px 30px'
        }}
      />

      <div className="relative w-full h-full flex items-center justify-center z-10 max-w-[600px]">
        {/* Connecting Lines */}
        <svg className="absolute inset-0 w-full h-full" overflow="visible">
          {/* Line 1 */}
          <path d="M 100 150 C 200 150, 250 250, 400 250" fill="none" stroke="#e4e4e7" strokeWidth="4" strokeDasharray="8 8" />
          {/* Animated Packet 1 */}
          {packetProgress1 > 0 && (
            <circle cx={interpolate(packetProgress1, [0, 1], [100, 400])} 
                    cy={interpolate(packetProgress1, [0, 1], [150, 250])} 
                    r="6" fill="#8b5cf6" />
          )}

          {/* Line 2 */}
          <path d="M 100 350 C 200 350, 250 250, 400 250" fill="none" stroke="#e4e4e7" strokeWidth="4" strokeDasharray="8 8" />
          {/* Animated Packet 2 */}
          {packetProgress2 > 0 && (
            <circle cx={interpolate(packetProgress2, [0, 1], [100, 400])} 
                    cy={interpolate(packetProgress2, [0, 1], [350, 250])} 
                    r="6" fill="#06b6d4" />
          )}
        </svg>

        {/* Source Node 1 */}
        <div className="absolute left-[80px] top-[130px] w-10 h-10 bg-white border border-zinc-200 shadow-md rounded-lg flex items-center justify-center">
          <div className="w-5 h-5 bg-violet-500 rounded-sm" />
        </div>

        {/* Source Node 2 */}
        <div className="absolute left-[80px] top-[330px] w-10 h-10 bg-white border border-zinc-200 shadow-md rounded-lg flex items-center justify-center">
          <div className="w-5 h-5 bg-cyan-500 rounded-full" />
        </div>

        {/* Central "Context Studio" Brain Node */}
        <div 
           className="absolute right-[160px] top-[210px] w-20 h-20 bg-white border border-zinc-200 shadow-xl rounded-2xl flex items-center justify-center flex-col gap-1 z-20"
           style={{ transform: `scale(${scale})` }}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-inner flex items-center justify-center shadow-lg">
             <span className="text-white text-xs">✦</span>
          </div>
        </div>
        
        {/* Output Data Lines */}
        <svg className="absolute inset-0 w-full h-full" overflow="visible">
          <path d="M 440 250 L 520 250" fill="none" stroke="#a78bfa" strokeWidth="4" />
          {/* Flowing animated dash over the solid line */}
          <path d="M 440 250 L 520 250" fill="none" stroke="#8b5cf6" strokeWidth="4" 
                strokeDasharray="20 100" 
                strokeDashoffset={-frame * 2} />
        </svg>
      </div>

    </AbsoluteFill>
  );
};
