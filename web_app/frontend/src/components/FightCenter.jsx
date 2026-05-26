import { useState, useMemo } from 'react'
import { Search, Zap, ChevronDown } from 'lucide-react'

const WEIGHT_CLASSES = [
  'All Classes', 'Flyweight', 'Bantamweight', 'Featherweight', 'Lightweight',
  'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight',
  "Women's Strawweight", "Women's Flyweight", "Women's Bantamweight"
]

const BOUT_WEIGHT_CLASSES = [
  'Flyweight', 'Bantamweight', 'Featherweight', 'Lightweight',
  'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight',
  "Women's Strawweight", "Women's Flyweight", "Women's Bantamweight"
]

export default function FightCenter({ fighters, onPredict, loading }) {
  const [rFighter, setRFighter] = useState('')
  const [bFighter, setBFighter] = useState('')
  const [rSearch, setRSearch] = useState('')
  const [bSearch, setBSearch] = useState('')
  const [rDropdownOpen, setRDropdownOpen] = useState(false)
  const [bDropdownOpen, setBDropdownOpen] = useState(false)
  const [rOdds, setROdds] = useState(-110)
  const [bOdds, setBOdds] = useState(-110)
  const [rounds, setRounds] = useState(3)
  const [rWeightFilter, setRWeightFilter] = useState('All Classes')
  const [bWeightFilter, setBWeightFilter] = useState('All Classes')
  const [boutWeightClass, setBoutWeightClass] = useState('Welterweight')

  const filterFighters = (query, weightClass) => {
    if (!fighters) return []
    let list = fighters
    if (weightClass && weightClass !== 'All Classes') {
      list = list.filter(f => f.weight_classes && f.weight_classes.includes(weightClass))
    }
    if (query) {
      list = list.filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
    }
    return list.slice(0, 25)
  }

  const rFiltered = useMemo(() => filterFighters(rSearch, rWeightFilter), [fighters, rSearch, rWeightFilter])
  const bFiltered = useMemo(() => filterFighters(bSearch, bWeightFilter), [fighters, bSearch, bWeightFilter])

  const selectR = (name) => { setRFighter(name); setRSearch(name); setRDropdownOpen(false) }
  const selectB = (name) => { setBFighter(name); setBSearch(name); setBDropdownOpen(false) }

  const handleFight = () => {
    if (rFighter && bFighter) onPredict(rFighter, bFighter, rOdds, bOdds, rounds, boutWeightClass)
  }

  const rLastName = rFighter ? rFighter.split(' ').pop().toUpperCase() : ''
  const bLastName = bFighter ? bFighter.split(' ').pop().toUpperCase() : ''

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Fight Center</h1>
        <p className="text-textSecondary text-sm mt-1">Set up your matchup and run 10,000 Monte Carlo simulations.</p>
      </div>

      {/* ─── VS HERO ─── */}
      <div className="glass-panel border-glow-gold overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='60,5 95,20 110,55 95,90 60,105 25,90 10,55 25,20' fill='none' stroke='%23D4A843' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: '120px 120px'
          }}
        />

        <div className="relative z-10 flex flex-col items-center py-10 px-6">
          {/* Bout Weight Class Badge */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span className="text-xs font-heading font-semibold uppercase tracking-[0.2em] text-gold">
              {boutWeightClass} Bout
            </span>
          </div>

          {/* Big VS names */}
          <div className="flex items-center justify-center gap-6 md:gap-12 mb-4 w-full max-w-3xl">
            <div className="flex-1 text-right">
              <span className={`text-3xl md:text-5xl font-heading font-bold uppercase tracking-tight transition-all duration-300 ${
                rFighter ? 'text-textPrimary text-glow-red' : 'text-textMuted'
              }`}>
                {rLastName || 'PLAYER 1'}
              </span>
            </div>

            <div className="shrink-0">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-gold/40 flex items-center justify-center bg-goldDim">
                <span className="text-gold font-heading font-bold text-lg md:text-xl">VS</span>
              </div>
            </div>

            <div className="flex-1 text-left">
              <span className={`text-3xl md:text-5xl font-heading font-bold uppercase tracking-tight transition-all duration-300 ${
                bFighter ? 'text-textPrimary text-glow-blue' : 'text-textMuted'
              }`}>
                {bLastName || 'PLAYER 2'}
              </span>
            </div>
          </div>

          {/* Full names */}
          <div className="flex items-center justify-center gap-16 text-sm text-textSecondary mb-6">
            <span className={rFighter ? 'text-redCorner' : ''}>{rFighter || '—'}</span>
            <span className={bFighter ? 'text-blueCorner' : ''}>{bFighter || '—'}</span>
          </div>

          {/* Bout Weight Class + Round selector row */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            {/* Bout Weight Class */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-textSecondary uppercase tracking-wider font-heading">Bout Class</span>
              <select
                value={boutWeightClass}
                onChange={e => setBoutWeightClass(e.target.value)}
                className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-gold font-heading font-bold outline-none focus:border-gold/40 transition-colors cursor-pointer"
              >
                {BOUT_WEIGHT_CLASSES.map(wc => (
                  <option key={wc} value={wc}>{wc}</option>
                ))}
              </select>
            </div>

            {/* Round selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-textSecondary uppercase tracking-wider font-heading">Rounds</span>
              <div className="flex rounded-lg overflow-hidden border border-border">
                {[3, 5].map(r => (
                  <button
                    key={r}
                    onClick={() => setRounds(r)}
                    className={`px-5 py-2 text-sm font-heading font-bold transition-all ${
                      rounds === r
                        ? 'bg-gold text-background'
                        : 'bg-surface text-textSecondary hover:text-textPrimary'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MATCHUP CONFIGURATION ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Red Corner */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-redCorner shadow-neon-red" />
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-redCorner">Red Corner</h3>
          </div>

          {/* Weight class filter */}
          <div>
            <label className="text-[10px] text-textSecondary uppercase tracking-widest font-heading block mb-1">Filter by Weight Class</label>
            <select
              value={rWeightFilter}
              onChange={e => setRWeightFilter(e.target.value)}
              className="w-full bg-background/60 border border-border rounded-lg px-4 py-2.5 text-sm text-textPrimary outline-none focus:border-redCorner/40 transition-colors cursor-pointer"
            >
              {WEIGHT_CLASSES.map(wc => (
                <option key={wc} value={wc}>{wc}</option>
              ))}
            </select>
          </div>

          {/* Search dropdown */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
            <input
              type="text"
              placeholder="Search fighter..."
              value={rSearch}
              onChange={(e) => { setRSearch(e.target.value); setRDropdownOpen(true); setRFighter('') }}
              onFocus={() => setRDropdownOpen(true)}
              className="w-full bg-background/60 border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-textPrimary placeholder:text-textMuted outline-none focus:border-redCorner/40 transition-colors"
            />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />

            {rDropdownOpen && (
              <div className="absolute z-20 w-full mt-1 glass-panel max-h-48 overflow-y-auto py-1">
                {rFiltered.length > 0 ? rFiltered.map(f => (
                  <button
                    key={f.name}
                    onClick={() => selectR(f.name)}
                    className="w-full text-left px-4 py-2 text-sm text-textSecondary hover:text-textPrimary hover:bg-white/[0.04] transition-colors flex items-center justify-between"
                  >
                    <span>{f.name}</span>
                    <span className="text-[10px] text-textMuted">{f.weight_classes?.[0] || ''}</span>
                  </button>
                )) : (
                  <div className="px-4 py-3 text-sm text-textMuted">No fighters found</div>
                )}
              </div>
            )}
          </div>

          {/* Odds */}
          <div>
            <label className="text-[10px] text-textSecondary uppercase tracking-widest font-heading block mb-1">Vegas Odds</label>
            <input
              type="number"
              value={rOdds}
              onChange={(e) => setROdds(e.target.value)}
              className="w-full bg-background/60 border border-border rounded-lg px-4 py-3 text-sm text-textPrimary outline-none focus:border-redCorner/40 transition-colors"
            />
          </div>
        </div>

        {/* Blue Corner */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-blueCorner shadow-neon-blue" />
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-blueCorner">Blue Corner</h3>
          </div>

          {/* Weight class filter */}
          <div>
            <label className="text-[10px] text-textSecondary uppercase tracking-widest font-heading block mb-1">Filter by Weight Class</label>
            <select
              value={bWeightFilter}
              onChange={e => setBWeightFilter(e.target.value)}
              className="w-full bg-background/60 border border-border rounded-lg px-4 py-2.5 text-sm text-textPrimary outline-none focus:border-blueCorner/40 transition-colors cursor-pointer"
            >
              {WEIGHT_CLASSES.map(wc => (
                <option key={wc} value={wc}>{wc}</option>
              ))}
            </select>
          </div>

          {/* Search dropdown */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
            <input
              type="text"
              placeholder="Search fighter..."
              value={bSearch}
              onChange={(e) => { setBSearch(e.target.value); setBDropdownOpen(true); setBFighter('') }}
              onFocus={() => setBDropdownOpen(true)}
              className="w-full bg-background/60 border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-textPrimary placeholder:text-textMuted outline-none focus:border-blueCorner/40 transition-colors"
            />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />

            {bDropdownOpen && (
              <div className="absolute z-20 w-full mt-1 glass-panel max-h-48 overflow-y-auto py-1">
                {bFiltered.length > 0 ? bFiltered.map(f => (
                  <button
                    key={f.name}
                    onClick={() => selectB(f.name)}
                    className="w-full text-left px-4 py-2 text-sm text-textSecondary hover:text-textPrimary hover:bg-white/[0.04] transition-colors flex items-center justify-between"
                  >
                    <span>{f.name}</span>
                    <span className="text-[10px] text-textMuted">{f.weight_classes?.[0] || ''}</span>
                  </button>
                )) : (
                  <div className="px-4 py-3 text-sm text-textMuted">No fighters found</div>
                )}
              </div>
            )}
          </div>

          {/* Odds */}
          <div>
            <label className="text-[10px] text-textSecondary uppercase tracking-widest font-heading block mb-1">Vegas Odds</label>
            <input
              type="number"
              value={bOdds}
              onChange={(e) => setBOdds(e.target.value)}
              className="w-full bg-background/60 border border-border rounded-lg px-4 py-3 text-sm text-textPrimary outline-none focus:border-blueCorner/40 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ─── PREDICT BUTTON ─── */}
      <button
        onClick={handleFight}
        disabled={!rFighter || !bFighter || loading}
        className={`w-full py-4 rounded-xl font-heading font-bold text-base uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-3
          ${!rFighter || !bFighter || loading
            ? 'bg-surface text-textMuted border border-border cursor-not-allowed'
            : 'bg-gold text-background hover:shadow-neon-gold animate-pulse-gold cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
          }
        `}
      >
        <Zap className="w-5 h-5" />
        {loading ? 'Running 10,000 Simulations...' : 'Predict Now'}
      </button>

      <div className="h-8" />
    </div>
  )
}
