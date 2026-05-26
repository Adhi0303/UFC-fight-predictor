import { useState, useMemo } from 'react'
import { Search, Swords, User } from 'lucide-react'

const WEIGHT_CLASSES = ['All', 'Flyweight', 'Bantamweight', 'Featherweight', 'Lightweight', 'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight', "Women's Strawweight", "Women's Flyweight", "Women's Bantamweight"]

const FighterCard = ({ f, isRed, isBlue, isSelected, onClick }) => {
  const [imgError, setImgError] = useState(false)
  const formattedName = f.name.replace(/ /g, '_')

  return (
    <button
      onClick={onClick}
      disabled={isSelected}
      className={`relative aspect-[3/4] rounded-xl overflow-hidden group transition-all duration-300 ${
        isRed ? 'ring-2 ring-redCorner shadow-neon-red scale-105 z-10' :
        isBlue ? 'ring-2 ring-blueCorner shadow-neon-blue scale-105 z-10' :
        'glass-panel hover:scale-105 hover:ring-1 hover:ring-white/20'
      }`}
    >
      {/* Fighter Image */}
      {!imgError && (
        <img 
          src={`/fighters/${formattedName}.png`} 
          alt={f.name}
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent flex flex-col justify-end p-3 text-left">
        <span className="font-heading font-bold uppercase leading-tight line-clamp-2">
          {f.name}
        </span>
      </div>
      {isRed && <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-redCorner shadow-neon-red"></div>}
      {isBlue && <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blueCorner shadow-neon-blue"></div>}
      
      {/* Silhouette Fallback */}
      {imgError && (
        <div className="absolute inset-0 z-[-1] flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
          <User className="w-16 h-16" />
        </div>
      )}
    </button>
  )
}

export default function SelectionScreen({ fighters, onPredict, loading }) {
  const [activeWeightClass, setActiveWeightClass] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [rFighter, setRFighter] = useState(null)
  const [bFighter, setBFighter] = useState(null)
  const [rOdds, setROdds] = useState(-110)
  const [bOdds, setBOdds] = useState(-110)

  const filteredRoster = useMemo(() => {
    if (!fighters) return []
    return fighters.filter(f => {
      const matchesWeight = activeWeightClass === 'All' || (f.weight_classes && f.weight_classes.includes(activeWeightClass))
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesWeight && matchesSearch
    })
  }, [fighters, activeWeightClass, searchQuery])

  const selectFighter = (fighterName) => {
    if (!rFighter) setRFighter(fighterName)
    else if (!bFighter && fighterName !== rFighter) setBFighter(fighterName)
    else {
      // Rotate selection
      setRFighter(fighterName)
      setBFighter(null)
    }
  }

  const handleFight = () => {
    if (rFighter && bFighter) {
      onPredict(rFighter, bFighter, rOdds, bOdds)
    }
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Weight Class Ribbon */}
      <div className="flex overflow-x-auto pb-2 gap-2 snap-x hide-scrollbar">
        {WEIGHT_CLASSES.map(wc => (
          <button
            key={wc}
            onClick={() => setActiveWeightClass(wc)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all snap-start ${
              activeWeightClass === wc 
                ? 'bg-gold text-background shadow-[0_0_15px_rgba(229,169,59,0.5)]' 
                : 'glass-panel text-textSecondary hover:text-textPrimary hover:bg-surface/80'
            }`}
          >
            {wc}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-textSecondary w-5 h-5" />
        <input
          type="text"
          placeholder="SEARCH FIGHTERS..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full glass-panel pl-12 pr-4 py-4 text-lg font-heading text-textPrimary uppercase placeholder:text-textSecondary/50 outline-none focus:border-gold/50 transition-all"
        />
      </div>

      {/* Main Selection Area */}
      <div className="flex-1 min-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredRoster.map(f => {
            const isRed = rFighter === f.name;
            const isBlue = bFighter === f.name;
            const isSelected = isRed || isBlue;
            
            return (
              <FighterCard 
                key={f.name}
                f={f}
                isRed={isRed}
                isBlue={isBlue}
                isSelected={isSelected}
                onClick={() => selectFighter(f.name)}
              />
            )
          })}
        </div>
      </div>

      {/* Matchup Footer */}
      <div className="glass-panel p-4 flex flex-col md:flex-row items-center justify-between gap-6 border-t-2 border-gold/30">
        <div className="flex items-center gap-4 flex-1 w-full">
          <div className="flex-1">
            <label className="text-[10px] text-redCorner uppercase tracking-widest font-bold block mb-1">Red Corner Odds</label>
            <input type="number" value={rOdds} onChange={e=>setROdds(e.target.value)} className="w-24 bg-background/50 border border-redCorner/30 rounded p-1 text-sm text-center" />
          </div>
          <div className="flex-1 text-right md:text-left">
            <div className="text-sm font-heading text-textSecondary uppercase">Red Corner</div>
            <div className={`text-xl font-bold font-heading uppercase ${rFighter ? 'text-redCorner shadow-neon-red drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'text-textSecondary/30'}`}>
              {rFighter || 'SELECT P1'}
            </div>
          </div>
        </div>

        <button
          onClick={handleFight}
          disabled={!rFighter || !bFighter || loading}
          className="px-12 py-4 bg-gold text-background font-heading font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-white hover:text-gold hover:shadow-[0_0_30px_rgba(229,169,59,0.8)] transition-all disabled:opacity-30 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 whitespace-nowrap"
        >
          {loading ? 'Simulating...' : 'Fight!'}
        </button>

        <div className="flex items-center justify-end gap-4 flex-1 w-full text-right">
          <div className="flex-1 text-left md:text-right">
            <div className="text-sm font-heading text-textSecondary uppercase">Blue Corner</div>
            <div className={`text-xl font-bold font-heading uppercase ${bFighter ? 'text-blueCorner shadow-neon-blue drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'text-textSecondary/30'}`}>
              {bFighter || 'SELECT P2'}
            </div>
          </div>
          <div className="flex-1 text-right">
            <label className="text-[10px] text-blueCorner uppercase tracking-widest font-bold block mb-1">Blue Corner Odds</label>
            <input type="number" value={bOdds} onChange={e=>setBOdds(e.target.value)} className="w-24 bg-background/50 border border-blueCorner/30 rounded p-1 text-sm text-center" />
          </div>
        </div>
      </div>
    </div>
  )
}
