import React, { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function FighterRadarChart({ rProfile, bProfile }) {
  const data = useMemo(() => {
    if (!rProfile || !bProfile) return [];

    const rMetrics = rProfile.octagon_metrics || {};
    const bMetrics = bProfile.octagon_metrics || {};

    return [
      {
        subject: 'Striking',
        Red: rMetrics.striking || 0,
        Blue: bMetrics.striking || 0,
        fullMark: 100,
      },
      {
        subject: 'Grappling',
        Red: rMetrics.grappling || 0,
        Blue: bMetrics.grappling || 0,
        fullMark: 100,
      },
      {
        subject: 'Cardio',
        Red: rMetrics.cardio || 0,
        Blue: bMetrics.cardio || 0,
        fullMark: 100,
      },
      {
        subject: 'Defense',
        Red: rMetrics.defense || 0,
        Blue: bMetrics.defense || 0,
        fullMark: 100,
      },
      {
        subject: 'Experience',
        Red: rMetrics.experience || 0,
        Blue: bMetrics.experience || 0,
        fullMark: 100,
      },
    ];
  }, [rProfile, bProfile]);

  if (!rProfile || !bProfile) return null;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surfaceDark border border-borderDark p-3 shadow-xl flex flex-col gap-2">
          <p className="text-white font-heading font-bold uppercase text-xs border-b border-borderDark pb-1 mb-1">
            {payload[0].payload.subject} Rating
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-redCorner font-bold text-sm">{payload[0].value}</span>
            <span className="text-textMuted text-[10px] uppercase tracking-widest">{rProfile.name}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-blueCorner font-bold text-sm">{payload[1].value}</span>
            <span className="text-textMuted text-[10px] uppercase tracking-widest">{bProfile.name}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-ufcBlack border-t border-borderDark py-10 relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-redCorner/10 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-blueCorner/10 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
        
        {/* Left Side Stats (Red) */}
        <div className="flex flex-col items-center md:items-end w-full md:w-1/4 text-center md:text-right hidden md:flex">
          <h3 className="text-redCorner font-heading font-black text-xl uppercase tracking-tighter mb-4 border-b-2 border-redCorner/30 pb-1 w-full">{rProfile.name}</h3>
          <div className="space-y-3 w-full">
            {data.map(d => (
              <div key={`r-${d.subject}`} className="flex flex-col">
                <span className="text-textMuted text-[9px] uppercase tracking-widest font-bold">{d.subject}</span>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <div className="h-1.5 bg-borderDark w-full max-w-[120px] ml-auto overflow-hidden">
                    <div className="h-full bg-redCorner" style={{ width: `${d.Red}%` }} />
                  </div>
                  <span className="text-white font-mono text-sm w-6">{d.Red}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Radar Chart */}
        <div className="w-full md:w-2/4 h-[350px] md:h-[450px]">
          <h2 className="text-center text-white font-heading font-black uppercase text-2xl tracking-tighter mb-2 md:hidden">Matchup Analysis</h2>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
              <PolarGrid stroke="#333" strokeDasharray="3 3" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: '#FFFFFF', fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold', textTransform: 'uppercase' }} 
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Radar 
                name={rProfile.name} 
                dataKey="Red" 
                stroke="#D22030" 
                fill="#D22030" 
                fillOpacity={0.5} 
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
                strokeWidth={3}
              />
              <Radar 
                name={bProfile.name} 
                dataKey="Blue" 
                stroke="#0055A4" 
                fill="#0055A4" 
                fillOpacity={0.5} 
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
                strokeWidth={3}
              />
              <Legend 
                wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px', textTransform: 'uppercase', color: '#FFF' }}
                iconType="circle"
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Right Side Stats (Blue) */}
        <div className="flex flex-col items-center md:items-start w-full md:w-1/4 text-center md:text-left hidden md:flex">
          <h3 className="text-blueCorner font-heading font-black text-xl uppercase tracking-tighter mb-4 border-b-2 border-blueCorner/30 pb-1 w-full">{bProfile.name}</h3>
          <div className="space-y-3 w-full">
            {data.map(d => (
              <div key={`b-${d.subject}`} className="flex flex-col">
                <span className="text-textMuted text-[9px] uppercase tracking-widest font-bold">{d.subject}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white font-mono text-sm w-6 text-right">{d.Blue}</span>
                  <div className="h-1.5 bg-borderDark w-full max-w-[120px] overflow-hidden">
                    <div className="h-full bg-blueCorner" style={{ width: `${d.Blue}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
