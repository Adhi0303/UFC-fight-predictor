import { useState, useMemo, useEffect } from 'react'
import { Search, Filter, User, ArrowRight } from 'lucide-react'

const WEIGHT_CLASSES = [
  'All Classes', 'Flyweight', 'Bantamweight', 'Featherweight', 'Lightweight',
  'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight',
  "Women's Strawweight", "Women's Flyweight", "Women's Bantamweight"
]

function StatCell({ label, value, highlight }) {
  return (
    <div className="flex-1 text-center">
      <div className={`font-heading font-black text-lg ${highlight ? 'text-ufcRed' : 'text-textPrimary'}`}>
        {value}
      </div>
      <div className="text-[10px] text-textSecondary uppercase tracking-widest font-bold">
        {label}
      </div>
    </div>
  )
}

function FighterCard({ fighter, stats, onViewProfile }) {
  const [imgError, setImgError] = useState(false)
  const imageUrl = fighter.image_url || ''
  const weightClass = fighter.weight_classes?.[0] || '—'

  const handleImageError = (e) => {
    console.error(`[Image Load Failed] Fighter: "${fighter.name}"`);
    console.error(`  → Attempted URL: ${imageUrl || 'NO URL PROVIDED'}`);
    console.error(`  → Error event:`, e);
    console.error(`  → Fighter data:`, fighter);
    setImgError(true);
  };

  const handleImageLoad = () => {
    console.log(`[Image Loaded Successfully] Fighter: "${fighter.name}"`);
    console.log(`  → URL: ${imageUrl}`);
  };

  return (
    <div className="bg-white border-2 border-transparent hover:border-ufcRed transition-all duration-300 hover:-translate-y-1 flex flex-col h-full shadow-sm overflow-hidden group">
      
      {/* Image area */}
      <div className="relative aspect-[4/3] bg-background overflow-hidden shrink-0">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={fighter.name}
            onError={handleImageError}
            onLoad={handleImageLoad}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-14 h-14 text-textMuted" />
            {!imageUrl && (
              <div className="absolute bottom-2 left-2 right-2 text-[8px] text-textMuted text-center">
                No image URL
              </div>
            )}
          </div>
        )}
        {/* Subtle dark gradient overlay at the bottom to make the image pop */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col flex-1 border-t border-border">
        <div className="mb-4">
          <p className="text-[10px] text-ufcRed font-heading font-bold uppercase tracking-widest mb-1">{weightClass}</p>
          <h3 className="font-heading font-black text-xl text-textPrimary uppercase tracking-tighter leading-tight truncate group-hover:text-ufcRed transition-colors">
            {fighter.name}
          </h3>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between border-t border-border pt-4 mt-auto">
          <StatCell label="Record" value={stats ? `${stats.wins}-${stats.losses}` : '—'} />
          <div className="w-px h-8 bg-border" />
          <StatCell label="SLpM" value={stats ? stats.slpm.toFixed(1) : '—'} />
          <div className="w-px h-8 bg-border" />
          <StatCell
            label="KO%"
            value={stats ? `${Math.round((stats.ko_wins / (stats.wins || 1)) * 100)}%` : '—'}
            highlight
          />
        </div>

        {/* View Profile Action */}
        <div className="mt-4 pt-4 border-t border-border flex justify-center">
          <button 
            onClick={() => onViewProfile(fighter.name)}
            className="w-full py-2 bg-background text-textPrimary text-xs font-heading font-bold uppercase tracking-widest hover:bg-ufcRed hover:text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative z-10">View Profile</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RosterPage({ fighters, onViewProfile }) {
  const [activeWC, setActiveWC] = useState('All Classes')
  const [searchQuery, setSearchQuery] = useState('')
  const [fighterStats, setFighterStats] = useState({})

  // Fetch individual stats only for filtered fighters to display in cards
  useEffect(() => {
    if (!fighters || fighters.length === 0) return
    const fetchStats = async () => {
      const topFighters = filteredRoster.slice(0, 12)
      for (const f of topFighters) {
        if (!fighterStats[f.name]) {
          try {
            const res = await fetch(`http://localhost:8000/api/fighters/${encodeURIComponent(f.name)}`)
            const data = await res.json()
            setFighterStats(prev => ({ ...prev, [f.name]: data }))
          } catch (e) {
            // ignore
          }
        }
      }
    }
    fetchStats()
  }, [fighters, activeWC, searchQuery])

  const filteredRoster = useMemo(() => {
    if (!fighters) return []
    let list = fighters
    if (activeWC !== 'All Classes') {
      list = list.filter(f => f.weight_classes && f.weight_classes.includes(activeWC))
    }
    if (searchQuery) {
      list = list.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    return list
  }, [fighters, activeWC, searchQuery])

  return (
    <div className="w-full min-h-screen bg-background">
      
      {/* Header section */}
      <section className="bg-ufcBlack text-white py-12 px-6 border-b-8 border-ufcRed">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-heading font-black uppercase tracking-tighter mb-2">Athlete Roster</h1>
            <p className="text-textInverseMuted text-sm font-heading uppercase tracking-widest">Database of active UFC fighters</p>
          </div>
          
          <div className="w-full md:w-auto relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textInverseMuted" />
            <input
              type="text"
              placeholder="Search athlete by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-surfaceDark border border-borderDark rounded-none pl-10 pr-4 py-3 text-sm text-white placeholder:text-textInverseMuted outline-none focus:border-ufcRed transition-colors font-bold"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto p-6 md:py-10">
        
        {/* Filters */}
        <div className="mb-8 overflow-x-auto hide-scrollbar pb-2">
          <div className="flex items-center gap-2 min-w-max">
            <div className="flex items-center gap-2 text-xs font-heading font-bold text-textSecondary uppercase tracking-widest mr-4">
              <Filter className="w-3 h-3" />
              Division
            </div>
            {WEIGHT_CLASSES.map(wc => (
              <button
                key={wc}
                onClick={() => setActiveWC(wc)}
                className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-widest transition-all duration-300 transform rounded-none ${
                  activeWC === wc
                    ? 'bg-ufcBlack text-white scale-105 shadow-lg'
                    : 'bg-white text-textSecondary border border-border hover:border-ufcBlack hover:scale-105 hover:shadow-md'
                }`}
              >
                {wc === 'All Classes' ? 'All' : wc.replace('Women\'s ', 'W ')}
              </button>
            ))}
          </div>
        </div>

        {/* Fighter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredRoster.map(f => (
            <FighterCard
              key={f.name}
              fighter={f}
              stats={fighterStats[f.name] || null}
              onViewProfile={onViewProfile}
            />
          ))}
        </div>

        {filteredRoster.length === 0 && (
          <div className="text-center py-20 text-textMuted font-heading font-bold uppercase tracking-widest">
            No athletes found matching criteria.
          </div>
        )}

      </section>
    </div>
  )
}
