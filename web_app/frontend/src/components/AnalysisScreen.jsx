import { ChevronLeft, Zap, Target, Flame, TrendingUp, Clock } from 'lucide-react'

// Simple horizontal bar chart
function MethodBar({ label, rPct, bPct }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-textSecondary mb-1.5">
        <span className="text-redCorner">{rPct}%</span>
        <span>{label}</span>
        <span className="text-blueCorner">{bPct}%</span>
      </div>
      <div className="h-3 w-full bg-background flex overflow-hidden border border-border">
        <div className="h-full bg-redCorner transition-all duration-1000" style={{ width: `${rPct}%` }} />
        <div className="h-full bg-blueCorner transition-all duration-1000" style={{ width: `${bPct}%` }} />
      </div>
    </div>
  )
}

function RoundByRoundChart({ rFinishes, bFinishes, rounds }) {
  const maxRound = rounds || 3
  const roundData = []
  
  for (let r = 1; r <= maxRound; r++) {
    const rPct = Math.round((rFinishes[r] || 0) * 100)
    const bPct = Math.round((bFinishes[r] || 0) * 100)
    roundData.push({ round: r, rPct, bPct })
  }
  
  const maxPct = Math.max(...roundData.map(d => Math.max(d.rPct, d.bPct)), 10)
  
  return (
    <div className="space-y-4">
      {roundData.map(({ round, rPct, bPct }) => (
        <div key={round} className="flex items-center gap-3">
          <div className="text-xs font-bold text-textSecondary uppercase tracking-widest w-16">
            Round {round}
          </div>
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 flex justify-end">
              <div 
                className="h-8 bg-redCorner transition-all duration-1000 flex items-center justify-end pr-2"
                style={{ width: `${(rPct / maxPct) * 100}%` }}
              >
                {rPct > 0 && <span className="text-white text-xs font-bold">{rPct}%</span>}
              </div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex-1 flex justify-start">
              <div 
                className="h-8 bg-blueCorner transition-all duration-1000 flex items-center justify-start pl-2"
                style={{ width: `${(bPct / maxPct) * 100}%` }}
              >
                {bPct > 0 && <span className="text-white text-xs font-bold">{bPct}%</span>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatPanel({ title, rVal, bVal, isPercent, inverseGood }) {
  const rNum = parseFloat(rVal) || 0
  const bNum = parseFloat(bVal) || 0

  let rAdv = false
  let bAdv = false

  if (rNum !== bNum) {
    if (inverseGood) {
      rAdv = rNum < bNum; bAdv = bNum < rNum
    } else {
      rAdv = rNum > bNum; bAdv = bNum > rNum
    }
  }

  const format = (v) => isPercent ? `${Math.round(v * 100)}%` : Number(v).toFixed(2)

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className={`text-base font-heading font-black ${rAdv ? 'text-redCorner' : 'text-textPrimary'}`}>
        {format(rVal)}
      </div>
      <div className="text-[10px] text-textSecondary uppercase tracking-widest font-bold px-4 text-center">
        {title}
      </div>
      <div className={`text-base font-heading font-black ${bAdv ? 'text-blueCorner' : 'text-textPrimary'}`}>
        {format(bVal)}
      </div>
    </div>
  )
}

export default function AnalysisScreen({ prediction, onBack }) {
  if (!prediction) {
    return (
      <div className="p-10 text-center">
        <p className="text-textMuted font-heading font-bold uppercase">No prediction data available</p>
        <button onClick={onBack} className="mt-4 text-ufcRed hover:underline font-bold text-sm uppercase tracking-widest">← Return to Setup</button>
      </div>
    )
  }

  const p = prediction
  const pA = Math.round(p.p_Red * 100)
  const pB = Math.round(p.p_Blue * 100)
  const rFighter = p.R_fighter
  const bFighter = p.B_fighter

  return (
    <div className="w-full bg-background min-h-screen">
      
      {/* ─── RESULT HERO ─── */}
      <section className="bg-ufcBlack border-b-8 border-ufcRed text-white pt-8 pb-12 relative overflow-hidden">
        
        {/* Nav */}
        <div className="max-w-6xl mx-auto px-6 relative z-20 mb-8">
          <button onClick={onBack} className="flex items-center gap-2 text-textInverseMuted hover:text-white transition-all duration-300 transform hover:translate-x-[-4px] font-heading text-xs uppercase tracking-widest font-bold group">
            <ChevronLeft className="w-4 h-4 group-hover:animate-pulse" />
            New Simulation
          </button>
        </div>

        <div className="max-w-5xl mx-auto px-6 relative z-10 flex flex-col items-center">
          
          <div className="inline-block bg-ufcRed text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 mb-6">
            Simulation Results
          </div>

          {/* Win probability visual */}
          <div className="flex items-center justify-center gap-4 md:gap-12 w-full mb-8">
            <div className="flex-1 text-right">
              <div className="text-5xl md:text-8xl font-heading font-black tracking-tighter text-redCorner leading-none">
                {pA}%
              </div>
              <div className="text-xs md:text-sm text-textInverseMuted uppercase tracking-widest font-bold mt-2">
                {rFighter.split(' ').pop()}
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-center gap-2">
              <div className="w-px h-12 bg-borderDark" />
              <div className="font-heading font-black italic text-2xl text-ufcGrey">VS</div>
              <div className="w-px h-12 bg-borderDark" />
            </div>

            <div className="flex-1 text-left">
              <div className="text-5xl md:text-8xl font-heading font-black tracking-tighter text-blueCorner leading-none">
                {pB}%
              </div>
              <div className="text-xs md:text-sm text-textInverseMuted uppercase tracking-widest font-bold mt-2">
                {bFighter.split(' ').pop()}
              </div>
            </div>
          </div>

          <p className="text-textInverseMuted text-center max-w-xl text-sm font-bold leading-relaxed mb-4">
            {p.prediction_source === 'blended' 
              ? 'Powered by XGBoost ML model blended with live betting odds, validated through 10,000 Monte Carlo fight simulations.'
              : 'Based on 10,000 Monte Carlo simulations analyzing striking volume, grappling dominance, and historical finish rates.'
            }
          </p>

          {/* Probability Bar */}
          <div className="w-full max-w-2xl h-4 bg-ufcBlack border border-borderDark flex overflow-hidden mt-4">
            <div className="h-full bg-redCorner" style={{ width: `${pA}%` }} />
            <div className="h-full bg-blueCorner" style={{ width: `${pB}%` }} />
          </div>

        </div>
      </section>

      {/* ─── DATA DASHBOARD ─── */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Method of Victory */}
          <div className="bg-white border-2 border-background shadow-sm p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
              <Flame className="w-5 h-5 text-ufcRed" />
              <h3 className="font-heading font-black text-2xl uppercase tracking-tighter">Method of Victory</h3>
            </div>
            
            <div className="flex-1 flex flex-col justify-center space-y-6">
              <MethodBar label="Knockout (KO/TKO)" rPct={Math.round(p.simulation.R_KO * 100)} bPct={Math.round(p.simulation.B_KO * 100)} />
              <MethodBar label="Submission" rPct={Math.round(p.simulation.R_Sub * 100)} bPct={Math.round(p.simulation.B_Sub * 100)} />
              <MethodBar label="Decision" rPct={Math.round(p.simulation.R_Dec * 100)} bPct={Math.round(p.simulation.B_Dec * 100)} />
            </div>
          </div>

          {/* Tale of the Tape / Advanced Stats */}
          <div className="bg-white border-2 border-background shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
              <Target className="w-5 h-5 text-ufcBlack" />
              <h3 className="font-heading font-black text-2xl uppercase tracking-tighter">Advanced Metrics</h3>
            </div>

            <div className="flex flex-col">
              <StatPanel title="Strikes Landed / Min" rVal={p.stats.R.slpm} bVal={p.stats.B.slpm} />
              <StatPanel title="Grappling Accuracy" rVal={p.stats.R.td_rate} bVal={p.stats.B.td_rate} />
              <StatPanel title="Historical Wins" rVal={p.stats.R.wins} bVal={p.stats.B.wins} />
              <StatPanel title="Avg Match Rounds" rVal={p.simulation.avg_rounds} bVal={p.simulation.avg_rounds} inverseGood />
            </div>
          </div>

          {/* Round-by-Round Finish Probability */}
          <div className="col-span-1 lg:col-span-2 bg-white border-2 border-background shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
              <Clock className="w-5 h-5 text-ufcRed" />
              <h3 className="font-heading font-black text-2xl uppercase tracking-tighter">Round-by-Round Finish Probability</h3>
            </div>
            <p className="text-textSecondary text-xs mb-6 uppercase tracking-wider font-bold">
              Likelihood of fight ending by finish (KO/TKO or Submission) in each round
            </p>
            <RoundByRoundChart 
              rFinishes={p.simulation.R_finishes_by_round || {}} 
              bFinishes={p.simulation.B_finishes_by_round || {}} 
              rounds={p.simulation.avg_rounds > 3 ? 5 : 3}
            />
          </div>

          {/* Explanatory Note */}
          <div className="col-span-1 lg:col-span-2 bg-surfaceDark text-white p-6 border-l-4 border-ufcRed">
            <h4 className="font-heading font-bold uppercase tracking-widest text-xs text-ufcRed mb-2">Prediction Engine Details</h4>
            <p className="text-textInverseMuted text-sm leading-relaxed">
              {p.prediction_source === 'blended'
                ? `This prediction uses a hybrid AI pipeline. First, a trained XGBoost classifier analyzes 128 statistical features (striking volume, grappling accuracy, win streaks, physical attributes, rankings, and historical odds) to generate an independent win probability. This is then blended (60% ML / 40% market odds) to form the final prior, which feeds into 10,000 Monte Carlo fight simulations that model round-by-round KO, Submission, and Decision outcomes.`
                : 'The Monte Carlo engine generates outcomes by iterating through thousands of simulated rounds. It samples strike connections and takedown attempts from each fighter\'s historical distributions, then applies finish probability scaling to model KO and Submission outcomes on a round-by-round basis.'
              }
            </p>
          </div>

        </div>
      </section>

    </div>
  )
}
