import { useState, useEffect } from 'react'
import { ChevronLeft, User, TrendingUp, TrendingDown, ArrowRight, Activity, Shield, Crosshair } from 'lucide-react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

// Advanced Spider Chart Heatmap
function OctagonHeatmap({ metrics }) {
  const [activeMetric, setActiveMetric] = useState(null);

  if (!metrics) return null;
  const data = [
    { subject: 'STRIKING', A: metrics.striking, fullMark: 100, desc: 'Evaluates volume of significant strikes landed combined with overall striking accuracy.' },
    { subject: 'GRAPPLING', A: metrics.grappling, fullMark: 100, desc: 'Measures takedown accuracy, volume, and submission attempts per 15 minutes.' },
    { subject: 'DEFENSE', A: metrics.defense, fullMark: 100, desc: 'Calculated using overall win rate and ability to win via decision while avoiding damage.' },
    { subject: 'CARDIO', A: metrics.cardio, fullMark: 100, desc: 'Derived from average fight time and total rounds survived over their career.' },
    { subject: 'EXPERIENCE', A: metrics.experience, fullMark: 100, desc: 'Evaluated by total professional fights, heavily boosted by championship title bouts.' },
  ];

  const selectedData = data.find(d => d.subject === activeMetric);

  return (
    <div className="w-full min-h-80 flex flex-col items-center">
      <h3 className="font-heading font-black text-xl text-white uppercase tracking-widest mb-6">Combat Analysis</h3>
      
      <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8 relative overflow-hidden transition-all duration-500">
        <div className={`transition-all duration-500 ease-in-out h-80 w-full md:w-[60%] ${activeMetric ? 'transform md:-translate-x-[15%]' : ''}`}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}
              onMouseMove={(state) => {
                if (state && state.activeLabel) setActiveMetric(state.activeLabel);
              }}
              onMouseLeave={() => setActiveMetric(null)}
              onClick={(state) => {
                if (state && state.activeLabel) setActiveMetric(state.activeLabel);
              }}
            >
              <PolarGrid stroke="#374151" strokeWidth={2} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#d1d5db', fontSize: 11, fontWeight: 'bold', fontFamily: 'Inter' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Fighter" dataKey="A" stroke="#d22030" strokeWidth={3} fill="#d22030" fillOpacity={0.5} className="animate-pulse cursor-pointer" />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Info Panel that appears when hovered/clicked */}
        <div className={`transition-all duration-500 ease-in-out absolute bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:right-[8%] w-[90%] md:w-[32%] bg-ufcBlack/90 md:bg-transparent p-6 border border-ufcRed/50 md:border-none rounded-lg md:rounded-none z-10 ${activeMetric ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-12 pointer-events-none'}`}>
          {selectedData && (
            <div className="flex flex-col">
              <div className="flex items-end gap-3 mb-2">
                <h4 className="font-heading font-black text-3xl text-white uppercase tracking-tighter">{selectedData.subject}</h4>
                <span className="font-heading font-black text-2xl text-ufcRed mb-0.5">{selectedData.A}<span className="text-sm text-textMuted">/100</span></span>
              </div>
              <p className="text-textSecondary text-sm md:text-base leading-relaxed">{selectedData.desc}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Big stat number for the dark hero section
function HeroStat({ value, label }) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <span className="text-5xl md:text-6xl font-heading font-black text-white tracking-tighter leading-none mb-2">{value}</span>
      <span className="text-[10px] md:text-xs text-textInverseMuted uppercase tracking-[0.15em] font-bold max-w-[100px] leading-tight">{label}</span>
    </div>
  )
}

// Circular Progress Component for Accuracy
function CircularProgress({ percent, title, children }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="bg-white border border-zinc-200 p-6 flex flex-col md:flex-row items-center gap-8 text-black shadow-sm">
      <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
        <svg className="transform -rotate-90 w-32 h-32" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} stroke="#e4e4e7" strokeWidth="16" fill="none" />
          <circle 
            cx="50" cy="50" r={radius} 
            stroke="#d22030" strokeWidth="16" fill="none" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="square"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute font-heading font-black text-3xl tracking-tighter text-black">{Math.round(percent)}%</div>
      </div>
      <div className="flex-1 w-full text-center md:text-left">
        <h4 className="font-heading font-black uppercase text-xl md:text-2xl tracking-tighter mb-4 text-black">{title}</h4>
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  )
}

function AccuracyStatRow({ label, value }) {
  return (
    <div className="flex flex-col border-b border-zinc-200 last:border-0 pb-2 mb-2 last:pb-0 last:mb-0">
      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{label}</span>
      <span className="text-black font-bold">{value}</span>
    </div>
  )
}

function GridStat({ value, label, subtext }) {
  return (
    <div className="flex flex-col text-left">
      <span className="font-heading font-black text-4xl tracking-tighter leading-none mb-1 text-black">{value}</span>
      <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-1">{label}</span>
      {subtext && <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest">{subtext}</span>}
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
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-ufcRed border-t-transparent rounded-full animate-spin mb-4" />
        <div className="font-heading font-bold tracking-widest text-textMuted uppercase text-sm">Loading Athlete...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-10 text-center">
        <p className="text-textMuted font-heading text-xl">Fighter not found</p>
        <button onClick={onBack} className="mt-4 text-ufcRed hover:underline font-bold uppercase tracking-widest text-sm">← Go back</button>
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
  const decWins = wm.dec_unanimous + wm.dec_split + wm.dec_majority

  const lastFight = history[0]

  return (
    <div className="w-full bg-background min-h-screen">
      
      {/* ─── DARK HERO SECTION ─── */}
      <section className="bg-ufcBlack text-white relative pt-8 pb-12 overflow-hidden border-b-8 border-ufcRed">
        
        {/* Back button */}
        <div className="max-w-7xl mx-auto px-6 relative z-20 mb-4">
          <button onClick={onBack} className="flex items-center gap-2 text-textInverseMuted hover:text-white transition-colors font-heading text-xs uppercase tracking-widest font-bold">
            <ChevronLeft className="w-4 h-4" />
            Back to Roster
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-10">
          
          {/* Left Column: Name & Hero Stats */}
          <div className="flex-1 text-center md:text-left z-20 pb-8 transition-all duration-700 ease-out translate-y-0 opacity-100">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <div className="inline-block bg-ufcGrey text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1">
                {p.weight_classes[0] || 'Fighter'}
              </div>
              {p.octagon_metrics && (
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-ufcRed to-red-700 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 shadow-[0_0_15px_rgba(210,32,48,0.6)] border border-red-400">
                  <Activity className="w-3 h-3" />
                  Octagon Rating: <span className="text-sm ml-1 font-heading">{p.octagon_metrics.overall}</span>
                </div>
              )}
            </div>
            
            <h1 className="text-5xl md:text-7xl font-heading font-black uppercase tracking-tighter leading-none mb-4 drop-shadow-lg">
              {p.name}
            </h1>
            
            <div className="font-heading font-bold text-lg text-textInverseMuted uppercase tracking-wider mb-8">
              {rec.wins}-{rec.losses}-{rec.draws} (W-L-D)
            </div>

            <div className="flex items-center justify-center md:justify-start gap-8 md:gap-12">
              <HeroStat value={wm.ko} label="Wins by Knockout" />
              <HeroStat value={wm.sub} label="Wins by Submission" />
              {p.career.title_bouts > 0 && <HeroStat value={p.career.title_bouts} label="Title Bouts Fought" />}
            </div>
          </div>

          {/* Center Column: Fighter Image */}
          <div className="w-64 h-80 md:w-96 md:h-[500px] shrink-0 relative z-10 -mb-12 md:-mb-12">
            <FighterImage name={p.name} imageUrl={p.image_url} />
          </div>

          {/* Right Column: Last Fight Card */}
          <div className="flex-1 w-full md:w-auto z-20 flex justify-center md:justify-end pb-8">
            {lastFight && (
              <div className="bg-ufcGrey/40 border border-ufcGrey p-6 w-full max-w-sm text-center">
                <h4 className="text-xs font-heading font-bold text-ufcRed uppercase tracking-widest mb-4">Last Fight</h4>
                
                <div className="flex justify-center items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-ufcBlack border border-borderDark overflow-hidden rounded">
                    <FighterImage name={p.name} imageUrl={p.image_url} fallbackIcon />
                  </div>
                  <div className="w-16 h-16 bg-ufcBlack border border-borderDark overflow-hidden rounded relative">
                    {lastFight.result === 'Loss' && <div className="absolute inset-0 bg-red-900/30" />}
                    <FighterImage name={lastFight.opponent} imageUrl={lastFight.opponent_image_url} fallbackIcon />
                  </div>
                </div>

                <div className="font-heading font-black text-xl tracking-tight uppercase mb-2">
                  {p.name.split(' ').pop()} <span className="text-textInverseMuted font-medium mx-1">VS</span> {lastFight.opponent.split(' ').pop()}
                </div>
                
                <div className="text-xs text-textInverseMuted uppercase tracking-widest font-bold mb-6">
                  {lastFight.date}
                </div>

                <button onClick={() => onViewFighter(lastFight.opponent)} className="btn-outline w-full py-3 text-sm">
                  View Opponent
                </button>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ─── COMBAT ANALYSIS SECTION ─── */}
      <section className="bg-ufcBlack border-b border-borderDark py-12">
        <div className="max-w-5xl mx-auto px-6">
          <OctagonHeatmap metrics={p.octagon_metrics} />
        </div>
      </section>

      {/* ─── STATS & RECORDS SECTION ─── */}
      <section className="bg-zinc-100 py-16 border-y border-zinc-200">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-heading font-black uppercase text-ufcRed tracking-tighter mb-6">Stats & Records</h2>
          
          {/* Top Banner */}
          <div className="bg-white border border-zinc-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-center mb-6 text-black">
            <div className="flex items-baseline gap-2 mb-4 md:mb-0">
              <span className="font-heading font-black text-4xl tracking-tighter leading-none text-black">{wm.ko}</span>
              <span className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Wins by Knockout</span>
            </div>
            <div className="hidden md:block w-px h-10 bg-zinc-200"></div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading font-black text-4xl tracking-tighter leading-none text-black">{wm.sub}</span>
              <span className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Wins by Submission</span>
            </div>
          </div>

          {/* Accuracy Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <CircularProgress percent={p.striking.sig_str_pct * 100} title="Striking Accuracy">
              <AccuracyStatRow label="Accuracy Percentage" value={`${(p.striking.sig_str_pct * 100).toFixed(0)}%`} />
            </CircularProgress>

            <CircularProgress percent={p.grappling.td_pct * 100} title="Takedown Accuracy">
              <AccuracyStatRow label="Accuracy Percentage" value={`${(p.grappling.td_pct * 100).toFixed(0)}%`} />
            </CircularProgress>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Box */}
            <div className="bg-white border border-zinc-200 shadow-sm p-8 grid grid-cols-2 gap-8">
              <GridStat value={p.striking.slpm.toFixed(2)} label="Sig. Str. Landed" subtext="Per Min" />
              <GridStat value={p.grappling.td_landed.toFixed(2)} label="Takedown Avg" subtext="Per 15 Min" />
            </div>

            {/* Right Box */}
            <div className="bg-white border border-zinc-200 shadow-sm p-8 grid grid-cols-2 gap-8">
              <GridStat value={p.grappling.sub_att.toFixed(1)} label="Submission Avg" subtext="Per 15 Min" />
              <GridStat value={p.career.avg_fight_time || "0:00"} label="Average Fight Time" />
            </div>

          </div>

          {/* Bottom Grid Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="md:col-span-1 bg-white border border-zinc-200 shadow-sm p-6 flex flex-col h-full text-black">
              <h4 className="font-heading font-black uppercase text-xl md:text-2xl tracking-tighter text-center mb-6 text-black">Win By Method</h4>
              <div className="flex-1 flex flex-col justify-center space-y-4">
                <AccuracyStatRow label={`KO/TKO (${koPct}%)`} value={wm.ko} />
                <AccuracyStatRow label={`DECISION (${decPct}%)`} value={decWins} />
                <AccuracyStatRow label={`SUBMISSION (${subPct}%)`} value={wm.sub} />
              </div>
            </div>

            <div className="md:col-span-2 bg-white border border-zinc-200 shadow-sm p-6 flex flex-col h-full text-black">
              <h4 className="font-heading font-black uppercase text-xl md:text-2xl tracking-tighter mb-6 text-center md:text-left text-black">Physical Attributes & Record</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Height</span>
                  <span className="font-heading font-black text-2xl tracking-tight text-black">{p.height_cm ? `${p.height_cm} cm` : '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Reach</span>
                  <span className="font-heading font-black text-2xl tracking-tight text-black">{p.reach_cm ? `${p.reach_cm} cm` : '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Stance</span>
                  <span className="font-heading font-black text-2xl tracking-tight text-black">{p.stance || '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Age</span>
                  <span className="font-heading font-black text-2xl tracking-tight text-black">{p.age || '—'}</span>
                </div>
                
                <div className="flex flex-col mt-4 md:mt-0">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Win Streak</span>
                  <span className="font-heading font-black text-2xl tracking-tight text-black">{p.streaks?.current_win || 0}</span>
                </div>
                <div className="flex flex-col mt-4 md:mt-0">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Longest Streak</span>
                  <span className="font-heading font-black text-2xl tracking-tight text-black">{p.streaks?.longest_win || 0}</span>
                </div>
                <div className="flex flex-col mt-4 md:mt-0">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Total Rounds</span>
                  <span className="font-heading font-black text-2xl tracking-tight text-black">{p.career?.total_rounds || 0}</span>
                </div>
                <div className="flex flex-col mt-4 md:mt-0">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Title Bouts</span>
                  <span className="font-heading font-black text-2xl tracking-tight text-black">{p.career?.title_bouts || 0}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── FIGHT HISTORY TABLE ─── */}
      <section className="bg-white py-16 border-t border-border">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-heading font-black uppercase tracking-tighter mb-10">Athlete Record</h2>

          {history.length > 0 ? (
            <div className="space-y-6">
              {history.map((fight, i) => (
                <div key={i} className="flex flex-col md:flex-row items-center border-b border-background pb-6 gap-6 group">
                  
                  {/* Avatars */}
                  <div className="flex items-end">
                    <div className="w-20 h-24 bg-background overflow-hidden relative">
                       {fight.result === 'Loss' && <div className="absolute inset-0 bg-redCorner/10 z-10" />}
                       <FighterImage name={p.name} imageUrl={p.image_url} />
                       <div className={`absolute bottom-0 left-0 w-full h-1 ${fight.result === 'Win' ? 'bg-ufcRed' : 'bg-borderDark'} z-20`} />
                    </div>
                    <div className="w-20 h-24 bg-background overflow-hidden relative">
                       {fight.result === 'Win' && <div className="absolute inset-0 bg-redCorner/10 z-10" />}
                       <FighterImage name={fight.opponent} imageUrl={fight.opponent_image_url} />
                       <div className={`absolute bottom-0 left-0 w-full h-1 ${fight.result === 'Loss' ? 'bg-ufcRed' : 'bg-borderDark'} z-20`} />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="font-heading font-black text-2xl uppercase tracking-tight mb-1">
                      {p.name.split(' ').pop()} <span className="text-textMuted font-medium text-lg mx-1">VS</span> {fight.opponent.split(' ').pop()}
                    </h3>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs text-textSecondary uppercase tracking-widest font-bold">
                      <span>{fight.date}</span>
                      <span className="text-borderDark">•</span>
                      <span>{fight.weight_class}</span>
                    </div>
                  </div>

                  {/* Result (New Column) */}
                  <div className="hidden md:flex flex-col items-center justify-center w-24">
                    <span className={`font-heading font-black text-3xl uppercase tracking-tighter ${fight.result === 'Win' ? 'text-green-600' : fight.result === 'Loss' ? 'text-ufcRed' : 'text-textMuted'}`}>
                      {fight.result}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-8 text-center">
                    <div>
                      <div className="text-[10px] text-textMuted uppercase font-bold tracking-widest mb-1">Round</div>
                      <div className="font-heading font-bold text-lg">{fight.round}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-textMuted uppercase font-bold tracking-widest mb-1">Time</div>
                      <div className="font-heading font-bold text-lg">{fight.round_time}</div>
                    </div>
                    <div className="w-32 text-right">
                      <div className="text-[10px] text-textMuted uppercase font-bold tracking-widest mb-1">Method</div>
                      <div className="font-heading font-bold text-sm leading-tight uppercase">
                        {fight.method}
                        {fight.method_detail && <span className="block text-[10px] text-textSecondary mt-0.5">{fight.method_detail}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex flex-col gap-2">
                    <button 
                      onClick={() => onViewFighter(fight.opponent)}
                      className="text-xs font-heading font-bold uppercase tracking-widest text-textPrimary hover:text-ufcRed transition-colors flex items-center justify-end gap-1"
                    >
                      View Profile <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-textMuted font-heading uppercase text-center py-10 tracking-widest">No fight history recorded</p>
          )}
        </div>
      </section>

    </div>
  )
}

// ─── FIGHTER IMAGE WITH SILHOUETTE FALLBACK ────────────────────────────
function FighterImage({ name, imageUrl, fallbackIcon = false }) {
  const [imgError, setImgError] = useState(false)

  if (imgError || !imageUrl) {
    if (fallbackIcon) {
      return <div className="w-full h-full flex items-center justify-center bg-background"><User className="w-8 h-8 text-textMuted" /></div>
    }
    // Render a silhouette-like placeholder that fits the UFC aesthetic better
    return (
      <div className="w-full h-full bg-gradient-to-t from-ufcBlack to-borderDark/20 flex flex-col items-center justify-end opacity-60">
        <div className="w-24 h-24 rounded-full bg-borderDark/50 -mb-4" />
        <div className="w-40 h-40 rounded-t-full bg-borderDark/80" />
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      onError={() => setImgError(true)}
      className="w-full h-full object-cover object-top drop-shadow-2xl"
    />
  )
}
