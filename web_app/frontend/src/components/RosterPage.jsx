import { useState, useMemo, useEffect } from 'react'
import { Search, User, ArrowRight } from 'lucide-react'

const WEIGHT_CLASSES = [
  'All Classes', 'Flyweight', 'Bantamweight', 'Featherweight', 'Lightweight',
  'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight',
  "Women's Strawweight", "Women's Flyweight", "Women's Bantamweight"
]

function FighterCard({ fighter, stats, onViewProfile }) {
  const [imgError, setImgError] = useState(false)
  const formattedName = fighter.name.replace(/ /g, '_')
  const weightClass = fighter.weight_classes?.[0] || '—'

  return (
    <div className="glass-panel overflow-hidden group hover:border-borderHover transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
      {/* Image area */}
      <div className="relative aspect-[4/3] bg-surfaceLight overflow-hidden shrink-0">
        {!imgError ? (
          <img
            src={`/fighters/${formattedName}.png`}
            alt={fighter.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-14 h-14 text-textMuted" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <div>
          <h3 className="font-heading font-bold text-base text-textPrimary truncate group-hover:text-gold transition-colors">
            {fighter.name}
          </h3>
          <p className="text-xs text-gold font-heading mt-0.5">{weightClass}</p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-1 border-t border-border pt-3 mt-3">
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

        <div className="mt-auto pt-4 flex justify-end">
          <button 
            onClick={() => onViewProfile(fighter.name)}
            className="text-xs font-heading font-semibold text-textSecondary hover:text-gold transition-colors flex items-center gap-1"
          >
            View Profile <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCell({ label, value, highlight }) {
  return (
    <div className="flex-1 text-center">
      <div className="text-[10px] text-textMuted uppercase tracking-wider font-heading">{label}</div>
      <div className={`text-sm font-heading font-bold mt-0.5 ${highlight ? 'text-gold' : 'text-textPrimary'}`}>
        {value}
      </div>
    </div>
  )
}

export default function RosterPage({ fighters, onViewProfile }) {
  const [activeWC, setActiveWC] = useState('All Classes')
  const [searchQuery, setSearchQuery] = useState('')
  const [fighterStats, setFighterStats] = useState({})

  const filteredRoster = useMemo(() => {
    if (!fighters) return []
    return fighters.filter(f => {
      const matchesWeight = activeWC === 'All Classes' || (f.weight_classes && f.weight_classes.includes(activeWC))
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesWeight && matchesSearch
    }).slice(0, 50) // Limit for performance
  }, [fighters, activeWC, searchQuery])

  // Fetch stats for visible fighters
  useEffect(() => {
    filteredRoster.forEach(f => {
      if (!fighterStats[f.name]) {
        fetch(`http://localhost:8000/api/fighters/${encodeURIComponent(f.name)}`)
          .then(res => res.json())
          .then(data => {
            setFighterStats(prev => ({ ...prev, [f.name]: data }))
          })
          .catch(() => {})
      }
    })
  }, [filteredRoster])

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Fighter Database</h1>
        <p className="text-textSecondary text-sm mt-1">
          Browse the active roster, analyze historical stats, and identify high-value matchups across all weight classes.
        </p>
      </div>

      {/* Controls: Search + Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
          <input
            type="text"
            placeholder="Search by name, nickname, or style..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-textPrimary placeholder:text-textMuted outline-none focus:border-gold/30 transition-colors"
          />
        </div>

        {/* Weight class pills */}
        <div className="flex flex-wrap gap-2">
          {WEIGHT_CLASSES.map(wc => (
            <button
              key={wc}
              onClick={() => setActiveWC(wc)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                activeWC === wc
                  ? 'bg-gold text-background shadow-neon-gold'
                  : 'border border-border text-textSecondary hover:text-textPrimary hover:border-borderHover'
              }`}
            >
              {wc}
            </button>
          ))}
        </div>
      </div>

      {/* Fighter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
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
        <div className="text-center py-16 text-textMuted">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-heading">No fighters found</p>
          <p className="text-sm mt-1">Try adjusting your search or filter</p>
        </div>
      )}

      <div className="h-8" />
    </div>
  )
}
