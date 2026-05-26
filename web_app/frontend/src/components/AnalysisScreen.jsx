import { ChevronLeft, Trophy, Zap } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'

export default function AnalysisScreen({ prediction, onBack }) {
  if (!prediction) {
    return (
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        <div className="text-center py-24 text-textMuted">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-heading text-lg">No simulation results yet</p>
          <p className="text-sm mt-1">Head to Fight Center to run a prediction</p>
          <button onClick={onBack} className="mt-6 px-6 py-2 rounded-lg bg-goldDim text-gold font-heading font-semibold text-sm hover:bg-gold hover:text-background transition-all">
            Go to Fight Center
          </button>
        </div>
      </div>
    )
  }

  const pRed = prediction.p_Red
  const pBlue = prediction.p_Blue
  const rStats = prediction.stats.R
  const bStats = prediction.stats.B
  const sim = prediction.simulation
  const rName = prediction.R_fighter
  const bName = prediction.B_fighter
  const rLast = rName.split(' ').pop()
  const bLast = bName.split(' ').pop()
  const winner = pRed >= pBlue ? 'red' : 'blue'

  const donutData = [
    { name: rLast, value: pRed, color: '#EF4444' },
    { name: bLast, value: pBlue, color: '#3B82F6' }
  ]

  const normalize = (val, max) => Math.min(100, Math.max(0, (val / (max || 1)) * 100))

  const radarData = [
    { subject: 'Striking Vol', A: normalize(rStats.slpm, 10), B: normalize(bStats.slpm, 10) },
    { subject: 'Takedowns',    A: normalize(rStats.td_rate, 5), B: normalize(bStats.td_rate, 5) },
    { subject: 'Accuracy',     A: (rStats.reach || 0) * 100, B: (bStats.reach || 0) * 100 },
    { subject: 'Win Rate',     A: normalize(rStats.wins, rStats.wins + rStats.losses), B: normalize(bStats.wins, bStats.wins + bStats.losses) },
    { subject: 'Finish Rate',  A: normalize(rStats.ko_wins + rStats.sub_wins, rStats.wins), B: normalize(bStats.ko_wins + bStats.sub_wins, bStats.wins) }
  ]

  const rFinishes = sim.R_finishes_by_round || {}
  const bFinishes = sim.B_finishes_by_round || {}
  const roundData = Object.keys(rFinishes).map(r => ({
    name: `R${r}`,
    [rLast]: parseFloat(((rFinishes[r] || 0) * 100).toFixed(1)),
    [bLast]: parseFloat(((bFinishes[r] || 0) * 100).toFixed(1))
  }))

  const methods = [
    { label: 'KO/TKO',     rKey: 'R_KO',  bKey: 'B_KO' },
    { label: 'Submission',  rKey: 'R_Sub', bKey: 'B_Sub' },
    { label: 'Decision',    rKey: 'R_Dec', bKey: 'B_Dec' },
  ]

  const tooltipStyle = {
    contentStyle: { backgroundColor: 'rgba(17,19,24,0.95)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px' },
    itemStyle: { fontWeight: 'bold' }
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-textSecondary hover:text-gold transition-colors font-heading text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Fight Center
        </button>
        <div className="flex items-center gap-2 text-gold font-heading font-bold text-sm uppercase tracking-wider">
          <Zap className="w-4 h-4" />
          Simulation Complete
        </div>
      </div>

      {/* ─── HERO BANNER ─── */}
      <div className="glass-panel border-glow-gold p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-redCorner/[0.04] via-transparent to-blueCorner/[0.04]" />
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-6 md:gap-12">
            <div className="flex-1 text-right">
              <p className="text-xs text-textSecondary uppercase tracking-wider mb-1">Red Corner</p>
              <h2 className={`text-2xl md:text-4xl font-heading font-bold uppercase tracking-tight ${winner === 'red' ? 'text-redCorner text-glow-red' : 'text-textSecondary'}`}>
                {rLast}
              </h2>
              <p className="text-3xl md:text-5xl font-heading font-bold text-redCorner mt-1">{(pRed * 100).toFixed(1)}%</p>
            </div>

            <div className="w-14 h-14 rounded-full border-2 border-gold/40 flex items-center justify-center bg-goldDim shrink-0">
              <span className="text-gold font-heading font-bold">VS</span>
            </div>

            <div className="flex-1 text-left">
              <p className="text-xs text-textSecondary uppercase tracking-wider mb-1">Blue Corner</p>
              <h2 className={`text-2xl md:text-4xl font-heading font-bold uppercase tracking-tight ${winner === 'blue' ? 'text-blueCorner text-glow-blue' : 'text-textSecondary'}`}>
                {bLast}
              </h2>
              <p className="text-3xl md:text-5xl font-heading font-bold text-blueCorner mt-1">{(pBlue * 100).toFixed(1)}%</p>
            </div>
          </div>

          <p className="text-xs text-textMuted mt-4 font-heading uppercase tracking-widest">
            Avg Fight Length: <span className="text-gold font-bold">{sim.avg_rounds.toFixed(2)} Rounds</span>
          </p>
        </div>
      </div>

      {/* ─── STATS PANELS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Red Corner Stats */}
        <div className="glass-panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-redCorner" />
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider">{rName}</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatRow label="SLpM (Strikes/Min)" value={rStats.slpm.toFixed(2)} />
            <StatRow label="Str. Accuracy" value={`${((rStats.reach || 0) * 100).toFixed(0)}%`} />
            <StatRow label="Takedown Rate" value={rStats.td_rate.toFixed(2)} />
            <StatRow label="Record" value={`${rStats.wins}-${rStats.losses}`} />
          </div>
        </div>

        {/* Blue Corner Stats */}
        <div className="glass-panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-blueCorner" />
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider">{bName}</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatRow label="SLpM (Strikes/Min)" value={bStats.slpm.toFixed(2)} />
            <StatRow label="Str. Accuracy" value={`${((bStats.reach || 0) * 100).toFixed(0)}%`} />
            <StatRow label="Takedown Rate" value={bStats.td_rate.toFixed(2)} />
            <StatRow label="Record" value={`${bStats.wins}-${bStats.losses}`} />
          </div>
        </div>
      </div>

      {/* ─── METHOD OF VICTORY ─── */}
      <div className="glass-panel p-6">
        <h3 className="font-heading font-bold text-sm uppercase tracking-wider mb-5">Method of Victory</h3>
        <div className="space-y-4">
          {methods.map(m => {
            const rVal = sim[m.rKey] || 0
            const bVal = sim[m.bKey] || 0
            const total = rVal + bVal || 1
            return (
              <div key={m.label}>
                <div className="flex justify-between text-xs text-textSecondary mb-1.5 font-heading">
                  <span>{rLast} <span className="text-redCorner font-bold">{(rVal * 100).toFixed(1)}%</span></span>
                  <span className="uppercase tracking-wider text-textMuted">{m.label}</span>
                  <span><span className="text-blueCorner font-bold">{(bVal * 100).toFixed(1)}%</span> {bLast}</span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-background border border-border">
                  <div className="bg-redCorner/70 transition-all duration-700" style={{ width: `${(rVal / total) * 100}%` }} />
                  <div className="bg-blueCorner/70 flex-1 transition-all duration-700" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── CHARTS ROW ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Radar - Tale of the Tape */}
        <div className="glass-panel p-6">
          <h3 className="font-heading font-bold text-sm uppercase tracking-wider mb-4 text-center">Tale of the Tape</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 11 }} />
                <Radar name={rLast} dataKey="A" stroke="#EF4444" fill="#EF4444" fillOpacity={0.25} strokeWidth={2} />
                <Radar name={bLast} dataKey="B" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.25} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Tooltip {...tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut + Round Finishes */}
        <div className="glass-panel p-6">
          <h3 className="font-heading font-bold text-sm uppercase tracking-wider mb-4 text-center">Round-by-Round Finishes</h3>
          {roundData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roundData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey={rLast} fill="#EF4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={bLast} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center">
              <div className="relative w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                      {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-heading font-bold text-glow-gold">{Math.max(pRed, pBlue) * 100 | 0}%</span>
                  <span className="text-[10px] text-textMuted uppercase tracking-widest">Favored</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="h-8" />
    </div>
  )
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between bg-background/40 rounded-lg px-3 py-2.5 border border-border">
      <span className="text-xs text-textSecondary">{label}</span>
      <span className="stat-value text-sm">{value}</span>
    </div>
  )
}
