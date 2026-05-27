import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import FighterRadarChart from './FighterRadarChart'
import HeroVideo from './HeroVideo'

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

function CustomDropdown({ value, options, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="relative">
      {label && <label className="text-[10px] text-textSecondary uppercase tracking-widest font-bold block mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white border border-border px-4 py-3 text-sm font-bold text-textPrimary hover:border-ufcRed transition-all duration-300 hover:shadow-md hover:scale-[1.01] transform"
      >
        <span>{value}</span>
        <ChevronDown className={`w-4 h-4 text-textMuted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-border shadow-xl max-h-60 overflow-y-auto">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setIsOpen(false) }}
              className={`w-full text-left px-4 py-3 text-sm font-bold transition-all duration-300 transform ${
                value === opt 
                  ? 'bg-ufcRed text-white scale-[1.02]' 
                  : 'text-textPrimary hover:bg-background hover:text-ufcRed hover:translate-x-1 hover:shadow-md'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
      
      {isOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
      )}
    </div>
  )
}

function PosterBgImage({ name, imageUrl, isRed }) {
  const [error, setError] = useState(false)
  
  useEffect(() => {
    setError(false)
  }, [imageUrl])

  if (error || !imageUrl) {
    return (
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-ufcBlack to-ufcGrey/10 opacity-30 flex items-center justify-center select-none pointer-events-none">
        <div className="w-24 h-24 rounded-full bg-borderDark/30 -mb-6" />
        <div className="w-36 h-36 rounded-t-full bg-borderDark/50 absolute bottom-0" />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-0 transition-all duration-700 ease-out transform scale-100 group-hover:scale-[1.04] select-none pointer-events-none">
      <img 
        src={imageUrl} 
        alt={name}
        onError={() => setError(true)}
        className="w-full h-full object-cover object-top opacity-75 md:opacity-65 filter brightness-[0.9] contrast-[1.15]"
      />
      {/* Poster Gradient Overlay: Lightened to make the fighter pop */}
      <div className="absolute inset-0 bg-gradient-to-t from-ufcBlack via-ufcBlack/30 to-transparent" />
      {isRed ? (
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/15 via-transparent to-ufcBlack/50 md:to-ufcBlack/35" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-l from-blue-950/15 via-transparent to-ufcBlack/50 md:to-ufcBlack/35" />
      )}
    </div>
  )
}

export default function FightCenter({ fighters, onPredict, loading, prefill, onPrefillConsumed }) {
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
  const [boutWCOpen, setBoutWCOpen] = useState(false)
  const [fetchingOdds, setFetchingOdds] = useState(false)
  const [oddsStatus, setOddsStatus] = useState(null)
  const [prefillRef, setPrefillRef] = useState(null)
  const [rProfile, setRProfile] = useState(null)
  const [bProfile, setBProfile] = useState(null)
  const vsSectionRef = useRef(null)

  // Fetch profiles for radar chart when fighters change
  useEffect(() => {
    if (rFighter) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/fighters/${encodeURIComponent(rFighter)}/profile`)
        .then(res => res.json())
        .then(data => setRProfile(data))
        .catch(console.error)
    } else {
      setRProfile(null)
    }
  }, [rFighter])

  useEffect(() => {
    if (bFighter) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/fighters/${encodeURIComponent(bFighter)}/profile`)
        .then(res => res.json())
        .then(data => setBProfile(data))
        .catch(console.error)
    } else {
      setBProfile(null)
    }
  }, [bFighter])

  // Consume prefill data from Upcoming Card
  useEffect(() => {
    if (prefill && prefill !== prefillRef) {
      setRFighter(prefill.rFighter)
      setRSearch(prefill.rFighter)
      setBFighter(prefill.bFighter)
      setBSearch(prefill.bFighter)
      setROdds(prefill.rOdds)
      setBOdds(prefill.bOdds)
      if (prefill.weightClass) {
        setBoutWeightClass(prefill.weightClass)
      }
      if (prefill.rounds) {
        setRounds(prefill.rounds)
      }
      setOddsStatus(`Live odds pre-loaded from Upcoming Card`)
      setPrefillRef(prefill)
      if (onPrefillConsumed) onPrefillConsumed()
    }
  }, [prefill])

  useEffect(() => {
    if (rFighter && bFighter) {
      // Don't re-fetch if odds were just pre-loaded from Upcoming Card
      if (prefillRef && prefill === prefillRef) return

      const fetchOdds = async () => {
        setFetchingOdds(true)
        setOddsStatus(null)
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/odds?fighter_a=${encodeURIComponent(rFighter)}&fighter_b=${encodeURIComponent(bFighter)}`)
          const data = await res.json()
          
          if (data.status === 'success') {
            setROdds(data.r_odds)
            setBOdds(data.b_odds)
            setOddsStatus(`Live odds from ${data.bookmaker}`)
          } else if (data.status === 'key_missing') {
            setOddsStatus('API key missing. Using default -110.')
          } else {
            setOddsStatus('Matchup not found in live odds. Using default -110.')
          }
        } catch (err) {
          console.error("Failed to fetch odds:", err)
          setOddsStatus('Failed to fetch live odds.')
        } finally {
          setFetchingOdds(false)
        }
      }
      fetchOdds()
    } else {
      setOddsStatus(null)
    }
  }, [rFighter, bFighter])

  // Auto-update the Bout Weight Class when manually selecting fighters
  useEffect(() => {
    // Don't auto-update if we just loaded from a prefill (Upcoming Card)
    if (prefillRef && prefill === prefillRef && prefill.weightClass) return

    if (rFighterObj && bFighterObj) {
      const rClasses = rFighterObj.weight_classes || []
      const bClasses = bFighterObj.weight_classes || []
      
      // Try to find a shared weight class
      const intersection = rClasses.find(c => bClasses.includes(c))
      
      if (intersection) {
        setBoutWeightClass(intersection)
      } else {
        // If they don't share a weight class (e.g. Pereira moving up to fight Gane),
        // default to the opponent's (Blue Corner) weight class
        if (bClasses.length > 0) {
          setBoutWeightClass(bClasses[0])
        }
      }
    } else if (rFighterObj && rFighterObj.weight_classes?.length > 0) {
      setBoutWeightClass(rFighterObj.weight_classes[0])
    } else if (bFighterObj && bFighterObj.weight_classes?.length > 0) {
      setBoutWeightClass(bFighterObj.weight_classes[0])
    }
  }, [rFighterObj, bFighterObj, prefill, prefillRef])

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

  const rFighterObj = useMemo(() => fighters?.find(f => f.name === rFighter), [fighters, rFighter])
  const bFighterObj = useMemo(() => fighters?.find(f => f.name === bFighter), [fighters, bFighter])

  const scrollToVS = () => {
    vsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  // Custom wrapper to ensure prediction works
  const handleLetsFight = () => {
    if (rFighter && bFighter) {
      onPredict(rFighter, bFighter, rOdds, bOdds, rounds, boutWeightClass)
    }
  }

  return (
    <div className="w-full bg-background min-h-screen pb-16">
      
      {/* ─── HERO CINEMATIC VIDEO ─── */}
      <HeroVideo onScrollDown={scrollToVS} />

      {/* ─── VS HERO (UFC STYLE) ─── */}
      <section ref={vsSectionRef} className="bg-ufcBlack border-b-8 border-ufcRed text-white pt-12 pb-16">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center">
          
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-5xl md:text-6xl font-heading font-black uppercase tracking-tighter mb-2">Fight Center</h1>
            <p className="text-textInverseMuted text-sm font-heading tracking-widest uppercase">Run 10,000 Monte Carlo Simulations</p>
          </div>

          {/* VS Display (Free Floating Poster Style - Widescreen Wt) */}
          <div className="w-full max-w-5xl relative mb-10 overflow-hidden min-h-[260px] md:min-h-[440px] flex items-stretch">
            
            <div className="grid grid-cols-1 md:grid-cols-2 w-full">
              
              {/* Red Corner Poster Card */}
              <div className="relative overflow-hidden flex flex-col justify-end p-8 group min-h-[220px] md:min-h-auto transition-all duration-500">
                <PosterBgImage key={rFighterObj?.image_url || 'empty-red'} name={rFighter} imageUrl={rFighterObj?.image_url} isRed={true} />
                
                <div className="relative z-10 text-center md:text-right flex flex-col md:items-end mb-4">
                  <span className="text-[12px] font-heading font-black text-redCorner uppercase tracking-[0.3em] mb-2 drop-shadow-md">
                    Red Corner
                  </span>
                  <h2 className="text-4xl sm:text-5xl md:text-7xl font-heading font-black uppercase tracking-tighter text-white leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] break-words w-full">
                    {rLastName || 'FIGHTER 1'}
                  </h2>
                </div>
              </div>

              {/* Blue Corner Poster Card */}
              <div className="relative overflow-hidden flex flex-col justify-end p-8 group min-h-[220px] md:min-h-auto transition-all duration-500">
                <PosterBgImage key={bFighterObj?.image_url || 'empty-blue'} name={bFighter} imageUrl={bFighterObj?.image_url} isRed={false} />

                <div className="relative z-10 text-center md:text-left flex flex-col md:items-start mb-4">
                  <span className="text-[12px] font-heading font-black text-blueCorner uppercase tracking-[0.3em] mb-2 drop-shadow-md">
                    Blue Corner
                  </span>
                  <h2 className="text-4xl sm:text-5xl md:text-7xl font-heading font-black uppercase tracking-tighter text-white leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] break-words w-full">
                    {bLastName || 'FIGHTER 2'}
                  </h2>
                </div>
              </div>

            </div>

            {/* Center VS Divider (UFC Red Badge) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center pointer-events-none">
              <div className="bg-ufcRed text-white font-heading font-black italic text-3xl md:text-5xl px-6 py-3 border-2 border-white shadow-[0_0_30px_rgba(210,32,48,0.9)] skew-x-[-12deg] tracking-widest leading-none">
                VS
              </div>
            </div>

          </div>

          {/* Let's Fight Button (Positioned below the fighters) */}
          <div className="h-20 flex items-center justify-center -mt-4 mb-10 z-30">
            {rFighter && bFighter && (
              <button
                onClick={handleLetsFight}
                disabled={loading}
                className="bg-ufcRed text-white border-2 border-ufcRed px-8 py-3 md:px-12 md:py-4 font-heading font-black text-xl md:text-2xl uppercase tracking-widest skew-x-[-12deg] transition-all duration-300 hover:scale-110 hover:bg-black shadow-[0_0_40px_rgba(210,32,48,0.6)] active:scale-95"
              >
                <span className="block skew-x-[12deg]">
                  {loading ? 'Processing...' : "Let's Fight"}
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─── RADAR CHART ANALYSIS ─── */}
      {rFighter && bFighter && rProfile && bProfile && (
        <FighterRadarChart rProfile={rProfile} bProfile={bProfile} />
      )}

      {/* ─── BOUT CONFIGURATION ─── */}
      <section className="max-w-6xl mx-auto px-6 mt-8 relative z-40">
        <div className="flex flex-wrap items-center justify-center gap-4 bg-surfaceDark px-6 py-4 border border-borderDark relative">
          <div className="flex items-center gap-3">
              <span className="text-xs text-textInverseMuted uppercase tracking-widest font-bold">Class</span>
              
              {/* Custom Dropdown for Bout Weight Class */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBoutWCOpen(!boutWCOpen)}
                  className="flex items-center gap-2 bg-ufcBlack border border-borderDark px-4 py-2 text-sm text-white font-heading font-bold uppercase tracking-wider outline-none hover:border-ufcRed transition-colors"
                >
                  {boutWeightClass}
                  <ChevronDown className={`w-4 h-4 text-textInverseMuted transition-transform ${boutWCOpen ? 'rotate-180' : ''}`} />
                </button>
                {boutWCOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-ufcBlack border border-borderDark shadow-2xl max-h-60 overflow-y-auto z-50">
                    {BOUT_WEIGHT_CLASSES.map(wc => (
                      <button
                        key={wc}
                        type="button"
                        onClick={() => { setBoutWeightClass(wc); setBoutWCOpen(false) }}
                        className={`w-full text-left px-4 py-2 text-sm font-heading font-bold uppercase tracking-wider transition-colors ${
                          boutWeightClass === wc ? 'bg-ufcRed text-white' : 'text-textInverseMuted hover:bg-surfaceDark hover:text-white'
                        }`}
                      >
                        {wc}
                      </button>
                    ))}
                  </div>
                )}
                {boutWCOpen && <div className="fixed inset-0 z-40" onClick={() => setBoutWCOpen(false)} />}
              </div>

            </div>
            <div className="w-px h-6 bg-borderDark hidden md:block mx-2" />
            <div className="flex items-center gap-3">
              <span className="text-xs text-textInverseMuted uppercase tracking-widest font-bold">Rounds</span>
              <div className="flex bg-ufcBlack border border-borderDark rounded-sm overflow-hidden">
                {[3, 5].map(r => (
                  <button
                    key={r}
                    onClick={() => setRounds(r)}
                    className={`px-4 py-2 text-sm font-heading font-bold transition-all duration-300 transform ${
                      rounds === r
                        ? 'bg-ufcRed text-white scale-110 shadow-lg shadow-ufcRed/50'
                        : 'text-textInverseMuted hover:text-white hover:bg-surfaceDark hover:scale-105'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
      </section>

      {/* ─── MATCHUP CONFIGURATION ─── */}
      <section className="max-w-5xl mx-auto px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-border shadow-xl p-6 md:p-10">
          
          {/* Red Corner Form */}
          <div className="space-y-6">
            <div className="border-b-4 border-redCorner pb-2">
              <h3 className="font-heading font-black text-2xl uppercase tracking-tighter">Fighter Selection</h3>
            </div>

            <div className="space-y-4">
              <CustomDropdown
                label="Filter by Weight Class"
                value={rWeightFilter}
                options={WEIGHT_CLASSES}
                onChange={setRWeightFilter}
              />

              <div className="relative">
                <label className="text-[10px] text-textSecondary uppercase tracking-widest font-bold block mb-1">Search Fighter</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={rSearch}
                    onChange={(e) => { setRSearch(e.target.value); setRDropdownOpen(true); setRFighter('') }}
                    onFocus={() => setRDropdownOpen(true)}
                    className="w-full bg-white border border-border pl-10 pr-4 py-3 text-sm font-bold text-textPrimary outline-none focus:border-redCorner transition-colors"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                </div>

                {rDropdownOpen && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-border shadow-lg max-h-48 overflow-y-auto py-1">
                    {rFiltered.length > 0 ? rFiltered.map(f => (
                      <button
                        key={f.name}
                        onClick={() => selectR(f.name)}
                        className="w-full text-left px-4 py-2 text-sm font-bold text-textSecondary hover:text-white hover:bg-redCorner transition-all duration-300 transform hover:translate-x-2 hover:shadow-lg flex items-center justify-between group"
                      >
                        <span>{f.name}</span>
                        <span className="text-[10px] opacity-70">{f.weight_classes?.[0] || ''}</span>
                      </button>
                    )) : (
                      <div className="px-4 py-3 text-sm text-textMuted">No fighters found</div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-textSecondary uppercase tracking-widest font-bold">Vegas Odds</label>
                  {fetchingOdds && <span className="text-[10px] text-zinc-400 animate-pulse">Fetching live...</span>}
                </div>
                <input type="number" 
                  className="w-full bg-background border border-borderDark focus:border-redCorner outline-none rounded p-2 text-textPrimary font-mono text-center"
                  value={rOdds}
                  onChange={(e) => setROdds(e.target.value)}
                />
                {oddsStatus && <p className="text-[9px] text-zinc-500 mt-1">{oddsStatus}</p>}
              </div>
            </div>
          </div>

          {/* Blue Corner Form */}
          <div className="space-y-6">
            <div className="border-b-4 border-blueCorner pb-2">
              <h3 className="font-heading font-black text-2xl uppercase tracking-tighter">Opponent Selection</h3>
            </div>

            <div className="space-y-4">
              <CustomDropdown
                label="Filter by Weight Class"
                value={bWeightFilter}
                options={WEIGHT_CLASSES}
                onChange={setBWeightFilter}
              />

              <div className="relative">
                <label className="text-[10px] text-textSecondary uppercase tracking-widest font-bold block mb-1">Search Fighter</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={bSearch}
                    onChange={(e) => { setBSearch(e.target.value); setBDropdownOpen(true); setBFighter('') }}
                    onFocus={() => setBDropdownOpen(true)}
                    className="w-full bg-white border border-border pl-10 pr-4 py-3 text-sm font-bold text-textPrimary outline-none focus:border-blueCorner transition-colors"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                </div>

                {bDropdownOpen && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-border shadow-lg max-h-48 overflow-y-auto py-1">
                    {bFiltered.length > 0 ? bFiltered.map(f => (
                      <button
                        key={f.name}
                        onClick={() => selectB(f.name)}
                        className="w-full text-left px-4 py-2 text-sm font-bold text-textSecondary hover:text-white hover:bg-blueCorner transition-all duration-300 transform hover:translate-x-2 hover:shadow-lg flex items-center justify-between group"
                      >
                        <span>{f.name}</span>
                        <span className="text-[10px] opacity-70">{f.weight_classes?.[0] || ''}</span>
                      </button>
                    )) : (
                      <div className="px-4 py-3 text-sm text-textMuted">No fighters found</div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-textSecondary uppercase tracking-widest font-bold">Vegas Odds</label>
                  {fetchingOdds && <span className="text-[10px] text-zinc-400 animate-pulse">Fetching live...</span>}
                </div>
                <input type="number" 
                  className="w-full bg-background border border-borderDark focus:border-blueCorner outline-none rounded p-2 text-textPrimary font-mono text-center"
                  value={bOdds}
                  onChange={(e) => setBOdds(e.target.value)}
                />
                {oddsStatus && <p className="text-[9px] text-zinc-500 mt-1 text-right">{oddsStatus}</p>}
              </div>
            </div>
          </div>
          
          {/* Stage Fight Button (Scrolls up) */}
          <div className="col-span-1 md:col-span-2 pt-4">
            <button
              onClick={scrollToVS}
              disabled={!rFighter || !bFighter || loading}
              className={`w-full py-5 font-heading font-black text-xl uppercase tracking-widest transition-all duration-500 transform relative overflow-hidden group
                ${!rFighter || !bFighter || loading
                  ? 'bg-background text-textMuted border border-border cursor-not-allowed'
                  : 'bg-ufcBlack text-white hover:bg-black hover:scale-[1.02] border border-borderDark hover:border-ufcRed hover:shadow-2xl active:scale-[0.98]'
                }
              `}
            >
              <div className="relative h-8 w-full overflow-hidden flex items-center justify-center">
                <span className="absolute inset-0 flex items-center justify-center">
                  Stage Fight
                </span>
              </div>
            </button>
          </div>

        </div>
      </section>

    </div>
  )
}
