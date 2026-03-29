import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';

export const IntegrationsFlowVisual = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });

  return (
    <AbsoluteFill className="bg-transparent items-center justify-center">
      {/* Abstract Perspective Grid representing Connections */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:1rem_1rem] [transform:rotateX(60deg)_scale(1.5)] opacity-40" />
      
      <div className="relative w-full h-full flex items-center justify-center z-10" style={{ transform: `scale(${entrance})` }}>
        
        {/* Nodes */}
        <div className="absolute top-[15%] left-[10%] text-[10px] font-bold text-emerald-500 bg-white px-2 py-1 border border-zinc-200 rounded shadow-sm z-20">WhatsApp</div>
        <div className="absolute bottom-[20%] left-[15%] text-[10px] font-bold text-rose-500 bg-white px-2 py-1 border border-zinc-200 rounded shadow-sm z-20">Chrome</div>
        
        <div className="absolute right-[10%] top-[30%] text-[10px] font-bold text-purple-500 bg-white px-2 py-1 border border-zinc-200 rounded shadow-sm z-20">Obsidian</div>

        {/* Central Hex */}
        <div className="absolute left-[50%] top-[45%] -translate-x-1/2 -translate-y-1/2 z-20 bg-zinc-900 text-white font-black tracking-tighter px-3 py-1.5 rounded shadow-lg text-lg flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          OS
        </div>

        {/* SVG Paths for Data Flow */}
        <svg className="absolute inset-0 w-full h-full" overflow="visible" viewBox="0 0 300 160">
          {/* Path from Snowflake to Hex */}
          <path d="M 60 35 Q 120 40 150 72" fill="none" stroke="#e5e7eb" strokeWidth="2" />
          <path d="M 60 35 Q 120 40 150 72" fill="none" stroke="#0ea5e9" strokeWidth="3" strokeDasharray="10 100" strokeDashoffset={-(frame * 1.5) % 110} />

          {/* Path from dbt to Hex */}
          <path d="M 65 115 Q 110 110 150 72" fill="none" stroke="#e5e7eb" strokeWidth="2" />
          <path d="M 65 115 Q 110 110 150 72" fill="none" stroke="#FF694B" strokeWidth="3" strokeDasharray="10 100" strokeDashoffset={-(frame * 2) % 110} />

          {/* Path from Hex to Airflow */}
          <path d="M 150 72 Q 210 70 260 55" fill="none" stroke="#e5e7eb" strokeWidth="2" />
          <path d="M 150 72 Q 210 70 260 55" fill="none" stroke="#a855f7" strokeWidth="3" strokeDasharray="10 100" strokeDashoffset={-(frame * 1.2) % 110} />
        </svg>

      </div>
    </AbsoluteFill>
  );
};
