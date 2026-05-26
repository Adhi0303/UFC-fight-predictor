import { ArrowLeft, Trophy, Activity, ChevronLeft } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'

export default function AnalysisScreen({ prediction, onBack }) {
  if (!prediction) return null

  const pRed = prediction.p_Red
  const pBlue = prediction.p_Blue
  const rStats = prediction.stats.R
  const bStats = prediction.stats.B
  const sim = prediction.simulation

  const donutData = [
    { name: 'Red', value: pRed, color: '#EF4444' },
    { name: 'Blue', value: pBlue, color: '#3B82F6' }
  ]

  // Normalize stats for radar chart (0-100 scale)
  const normalize = (val, max) => Math.min(100, Math.max(0, (val / max) * 100))
  
  const radarData = [
    {
      subject: 'Striking Vol',
      A: normalize(rStats.slpm, 10),
      B: normalize(bStats.slpm, 10),
      fullMark: 100,
    },
    {
      subject: 'Takedowns',
      A: normalize(rStats.td_rate, 5),
      B: normalize(bStats.td_rate, 5),
      fullMark: 100,
    },
    {
      subject: 'Accuracy',
      A: rStats.reach * 100,
      B: bStats.reach * 100,
      fullMark: 100,
    },
    {
      subject: 'Win Rate',
      A: normalize(rStats.wins, rStats.wins + rStats.losses || 1),
      B: normalize(bStats.wins, bStats.wins + bStats.losses || 1),
      fullMark: 100,
    },
    {
      subject: 'Finish Rate',
      A: normalize(rStats.ko_wins + rStats.sub_wins, rStats.wins || 1),
      B: normalize(bStats.ko_wins + bStats.sub_wins, bStats.wins || 1),
      fullMark: 100,
    }
  ]

  const rName = prediction.R_fighter.split(' ').pop()
  const bName = prediction.B_fighter.split(' ').pop()

  // Prepare Round-by-Round Data
  const rFinishes = sim.R_finishes_by_round || {}
  const bFinishes = sim.B_finishes_by_round || {}
  
  const roundData = Object.keys(rFinishes).map(roundStr => {
    const round = parseInt(roundStr)
    return {
      name: `Round ${round}`,
      [`${rName} Finish`]: parseFloat((rFinishes[round] * 100).toFixed(1)),
      [`${bName} Finish`]: parseFloat((bFinishes[round] * 100).toFixed(1))
    }
  })

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between glass-panel p-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-textSecondary hover:text-gold transition-colors font-heading font-bold uppercase tracking-wider"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Matchmaker
        </button>
        <div className="flex items-center gap-2 text-textPrimary font-heading font-bold text-xl uppercase tracking-widest">
          <Trophy className="w-6 h-6 text-gold" />
          Simulation Analysis
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">
        
        {/* Tale of the Tape (Radar Chart) */}
        <div className="glass-panel p-6 flex flex-col">
          <h2 className="text-center font-heading font-bold uppercase tracking-widest mb-6">Tale of the Tape</h2>
          <div className="flex-1 w-full relative min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <Radar name={prediction.R_fighter} dataKey="A" stroke="#EF4444" fill="#EF4444" fillOpacity={0.4} />
                <Radar name={prediction.B_fighter} dataKey="B" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.4} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(11, 12, 16, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win Probability & Methods */}
        <div className="glass-panel p-6 flex flex-col items-center">
          
          <div className="flex w-full justify-between items-center mb-4">
            <div className="text-left">
              <div className="text-2xl font-bold text-redCorner shadow-neon-red drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">{(pRed * 100).toFixed(1)}%</div>
              <div className="text-xs text-textSecondary uppercase font-heading">{rName}</div>
            </div>
            <div className="text-sm font-bold font-heading text-textSecondary uppercase">Win Prob</div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blueCorner shadow-neon-blue drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">{(pBlue * 100).toFixed(1)}%</div>
              <div className="text-xs text-textSecondary uppercase font-heading">{bName}</div>
            </div>
          </div>

          <div className="h-48 w-full relative mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-heading font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                {Math.max(pRed, pBlue) * 100 | 0}%
              </span>
              <span className="text-xs text-textSecondary uppercase tracking-widest font-heading">Favored</span>
            </div>
          </div>

          {/* Methods Bars */}
          <div className="w-full space-y-4">
            {['KO', 'Sub', 'Dec'].map((method) => {
              const rVal = sim[`R_${method}`]
              const bVal = sim[`B_${method}`]
              const total = rVal + bVal || 1
              return (
                <div key={method}>
                  <div className="flex justify-between text-[10px] text-textSecondary uppercase mb-1 font-heading tracking-wider">
                    <span>{method}</span>
                  </div>
                  <div className="flex h-2.5 rounded-full overflow-hidden bg-background border border-white/5">
                    <div className="bg-redCorner/80 transition-all" style={{width: `${(rVal / total) * 100}%`}}></div>
                    <div className="bg-blueCorner/80 transition-all flex-1"></div>
                  </div>
                  <div className="flex justify-between text-xs mt-1 font-bold">
                    <span className="text-redCorner">{(rVal * 100).toFixed(1)}%</span>
                    <span className="text-blueCorner">{(bVal * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Round by Round Breakdown */}
        <div className="glass-panel p-6 flex flex-col">
          <h2 className="text-center font-heading font-bold uppercase tracking-widest mb-2">Round Finishes</h2>
          <p className="text-center text-xs text-textSecondary mb-6">Probability of fight ending by round</p>
          
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roundData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(11, 12, 16, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '14px', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey={`${rName} Finish`} stackId="a" fill="#EF4444" radius={[0, 0, 4, 4]} />
                <Bar dataKey={`${bName} Finish`} stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center text-sm font-heading text-textSecondary">
            Avg Fight Length: <span className="text-white font-bold">{sim.avg_rounds.toFixed(2)} Rounds</span>
          </div>
        </div>
      </div>
    </div>
  )
}
