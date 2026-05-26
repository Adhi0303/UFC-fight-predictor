import { useState, useEffect } from 'react'
import { ChevronLeft, User, Trophy, Flame, Shield, Target, Clock, Zap, Crown, TrendingUp, TrendingDown } from 'lucide-react'

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-background/40 border border-border rounded-lg p-3 flex flex-col items-center text-center">
      {Icon && <Icon className="w-4 h-4 text-gold mb-1.5" />}
      <span className="stat-value text-lg">{value}</span>
      <span className="text-[10px] text-textMuted uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  )
}

function CombatMetricBar({ label, value, maxVal = 100, suffix = '' }) {
  const pct = Math.min(100, (value / maxVal) * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-textSecondary w-36 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-background border border-border rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-gold/60 to-gold rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <span className="stat-value text-sm w-14 text-right">{typeof value === 'number' ? value.toFixed(value % 1 === 0 ? 0 : 1) : value}{suffix}</span>
    </div>
  )
}

export default function FighterProfile({ fighterName, onBack, onViewFighter }) {
  const [profile, setProfile] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!fighterName) return
    setLoading(true)

    Promise.all([
      fetch(`http://localhost:8000/api/fighters/${encodeURIComponent(fighterName)}/profile`).then(r => r.json()),
      fetch(`http://localhost:8000/api/fighters/${encodeURIComponent(fighterName)}/history`).then(r => r.json())
    ]).then(([profileData, historyData]) => {
      setProfile(profileData)
      setHistory(historyData.fights || [])
    }).catch(err => {
      console.error(err)
    }).finally(() => setLoading(false))
  }, [fighterName])

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center h-full">
        <div className="text-textMuted font-heading">Loading fighter profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-10 text-center">
        <p className="text-textMuted">Fighter not found</p>
        <button onClick={onBack} className="mt-4 text-gold hover:underline text-sm">← Go back</button>
      </div>
    )
  }

  const p = profile
  const rec = p.record
  const wm = p.win_methods
  const totalWinMethods = (wm.ko + wm.sub + wm.dec_unanimous + wm.dec_split + wm.dec_majority + wm.tko_doc) || 1
  const koPct = Math.round((wm.ko / totalWinMethods) * 100)
  const subPct = Math.round((wm.sub / totalWinMethods) * 100)
  const decPct = 100 - koPct - subPct

  const streakType = p.streaks.current_win > 0 ? 'win' : p.streaks.current_lose > 0 ? 'lose' : 'none'
  const streakCount = p.streaks.current_win || p.streaks.current_lose || 0

  // Auto-generate a fighter description
  const desc = generateDescription(p, koPct, subPct)

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">

      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 text-textSecondary hover:text-gold transition-colors font-heading text-sm">
        <ChevronLeft className="w-4 h-4" />
        Back to Roster
      </button>

      {/* ─── HERO BANNER ─── */}
      <div className="glass-panel border-glow-gold overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.04] via-transparent to-surface" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-8">
          {/* Fighter silhouette */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-surfaceLight border border-border flex items-center justify-center shrink-0 overflow-hidden">
            <FighterImage name={p.name} />
          </div>

          <div className="flex-1 text-center md:text-left">
            {/* Weight class badges */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-3">
              {p.weight_classes.map(wc => (
                <span key={wc} className="text-[10px] font-heading font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-goldDim text-gold border border-gold/20">
                  {wc}
                </span>
              ))}
            </div>

            <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase tracking-tight text-glow-gold">{p.name}</h1>

            {/* Record */}
            <div className="flex items-center gap-6 mt-3 justify-center md:justify-start">
              <div className="text-center">
                <span className="text-2xl font-heading font-bold text-green-400">{rec.wins}</span>
                <span className="text-[10px] text-textMuted block uppercase tracking-wider">Wins</span>
              </div>
              <div className="text-center">
                <span className="text-2xl font-heading font-bold text-redCorner">{rec.losses}</span>
                <span className="text-[10px] text-textMuted block uppercase tracking-wider">Losses</span>
              </div>
              <div className="text-center">
                <span className="text-2xl font-heading font-bold text-textSecondary">{rec.draws}</span>
                <span className="text-[10px] text-textMuted block uppercase tracking-wider">Draws</span>
              </div>
              {streakCount > 0 && (
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${
                  streakType === 'win' ? 'bg-green-500/10 text-green-400' : 'bg-redCorner/10 text-redCorner'
                }`}>
                  {streakType === 'win' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {streakCount} {streakType === 'win' ? 'Win' : 'Loss'} Streak
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── PHYSICAL SPECS + COMBAT METRICS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Physical Specs */}
        <div className="glass-panel p-5">
          <h3 className="font-heading font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-gold" /> Physical Specs
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Height" value={p.height_cm ? `${(p.height_cm / 2.54).toFixed(0)}"` : '—'} />
            <StatCard label="Reach" value={p.reach_cm ? `${(p.reach_cm / 2.54).toFixed(0)}"` : '—'} />
            <StatCard label="Weight" value={p.weight_lbs ? `${p.weight_lbs} lbs` : '—'} />
            <StatCard label="Stance" value={p.stance || '—'} />
            <StatCard label="Age" value={p.age || '—'} />
            <StatCard label="Title Bouts" value={p.career.title_bouts} icon={Crown} />
          </div>
        </div>

        {/* Combat Metrics */}
        <div className="glass-panel p-5">
          <h3 className="font-heading font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-gold" /> Combat Metrics
          </h3>
          <div className="space-y-4">
            <CombatMetricBar label="SLpM (Strikes/Min)" value={p.striking.slpm} maxVal={8} />
            <CombatMetricBar label="Str. Accuracy" value={p.striking.sig_str_pct * 100} maxVal={100} suffix="%" />
            <CombatMetricBar label="TD Landed/15m" value={p.grappling.td_landed} maxVal={5} />
            <CombatMetricBar label="TD Accuracy" value={p.grappling.td_pct * 100} maxVal={100} suffix="%" />
            <CombatMetricBar label="Sub Attempts/15m" value={p.grappling.sub_att} maxVal={3} />
          </div>
        </div>
      </div>

      {/* ─── METHOD OF VICTORY HEATMAP ─── */}
      <div className="glass-panel p-5">
        <h3 className="font-heading font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
          <Flame className="w-4 h-4 text-gold" /> Method of Victory
        </h3>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-3">
            {[
              { label: 'KO/TKO', pct: koPct, count: wm.ko },
              { label: 'Submission', pct: subPct, count: wm.sub },
              { label: 'Decision', pct: decPct, count: wm.dec_unanimous + wm.dec_split + wm.dec_majority }
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-textSecondary">{m.label}</span>
                  <span className="text-gold font-bold">{m.pct}%</span>
                </div>
                <div className="h-3 bg-background border border-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold/50 to-gold rounded-full transition-all duration-1000"
                    style={{ width: `${m.pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-textMuted">{m.count} wins</span>
              </div>
            ))}
          </div>
          <div className="flex-1 flex items-center">
            <p className="text-sm text-textSecondary leading-relaxed">{desc}</p>
          </div>
        </div>
      </div>

      {/* ─── CAREER STATS ROW ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Longest Win Streak" value={p.streaks.longest_win} icon={Trophy} />
        <StatCard label="Total Rounds" value={p.career.total_rounds} icon={Clock} />
        <StatCard label="Total Title Bouts" value={p.career.title_bouts} icon={Crown} />
        <StatCard label="Total Fights" value={rec.wins + rec.losses + rec.draws} icon={Zap} />
      </div>

      {/* ─── FIGHT HISTORY TABLE ─── */}
      <div className="glass-panel p-5">
        <h3 className="font-heading font-bold text-sm uppercase tracking-wider mb-4">Recent Fight History</h3>

        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-textMuted text-[10px] uppercase tracking-wider border-b border-border">
                  <th className="text-left py-2 px-2"></th>
                  <th className="text-left py-2 px-2">Opponent</th>
                  <th className="text-left py-2 px-2 hidden md:table-cell">Event</th>
                  <th className="text-left py-2 px-2">Method</th>
                  <th className="text-center py-2 px-2">Round</th>
                  <th className="text-center py-2 px-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((fight, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-2">
                      <span className={`inline-flex w-6 h-6 rounded-md items-center justify-center text-[10px] font-bold ${
                        fight.result === 'Win' ? 'bg-green-500/15 text-green-400' : 'bg-redCorner/15 text-redCorner'
                      }`}>
                        {fight.result === 'Win' ? 'W' : 'L'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => onViewFighter(fight.opponent)}
                        className="text-textPrimary hover:text-gold transition-colors font-medium"
                      >
                        {fight.opponent}
                      </button>
                      {fight.title_bout && <span className="ml-2 text-[9px] text-gold bg-goldDim px-1.5 py-0.5 rounded-full uppercase tracking-wider">Title</span>}
                    </td>
                    <td className="py-3 px-2 text-textMuted hidden md:table-cell">
                      {fight.weight_class} · {fight.date}
                    </td>
                    <td className="py-3 px-2 text-textSecondary">
                      {fight.method}
                      {fight.method_detail && <span className="text-textMuted"> ({fight.method_detail})</span>}
                    </td>
                    <td className="py-3 px-2 text-center font-heading font-bold">{fight.round}</td>
                    <td className="py-3 px-2 text-center text-textMuted">{fight.round_time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-textMuted text-sm text-center py-8">No fight history available</p>
        )}
      </div>

      <div className="h-8" />
    </div>
  )
}


// ─── FIGHTER IMAGE WITH FALLBACK ────────────────────────────
function FighterImage({ name }) {
  const [imgError, setImgError] = useState(false)
  const formattedName = name.replace(/ /g, '_')

  if (imgError) {
    return <User className="w-16 h-16 text-textMuted" />
  }

  return (
    <img
      src={`/fighters/${formattedName}.png`}
      alt={name}
      onError={() => setImgError(true)}
      className="w-full h-full object-cover object-top"
    />
  )
}


// ─── AUTO DESCRIPTION GENERATOR ─────────────────────────────
function generateDescription(profile, koPct, subPct) {
  const p = profile
  const name = p.name.split(' ').pop()
  const parts = []

  // Style based on win methods
  if (koPct >= 60) {
    parts.push(`A devastating knockout artist`)
  } else if (subPct >= 40) {
    parts.push(`A dangerous submission specialist`)
  } else if (koPct >= 30 && subPct >= 20) {
    parts.push(`A well-rounded finisher`)
  } else {
    parts.push(`A tactical decision fighter`)
  }

  // Volume
  if (p.striking.slpm >= 5) {
    parts.push(`known for high-volume striking (${p.striking.slpm.toFixed(1)} sig. strikes per minute)`)
  } else if (p.striking.slpm >= 3) {
    parts.push(`with a measured approach to striking`)
  } else {
    parts.push(`who relies more on grappling than striking`)
  }

  // Grappling
  if (p.grappling.td_landed >= 2) {
    parts.push(`Excellent takedown offense.`)
  } else if (p.grappling.sub_att >= 1) {
    parts.push(`Active submission hunter.`)
  }

  // Streak
  if (p.streaks.current_win >= 3) {
    parts.push(`Currently riding a ${p.streaks.current_win}-fight win streak.`)
  } else if (p.streaks.current_lose >= 2) {
    parts.push(`Looking to bounce back from a ${p.streaks.current_lose}-fight skid.`)
  }

  return parts.join(', ').replace(', Currently', '. Currently').replace(', Looking', '. Looking').replace(', Excellent', '. Excellent').replace(', Active', '. Active') + (parts[parts.length - 1].endsWith('.') ? '' : '.')
}
