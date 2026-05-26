import { useState, useEffect, useMemo } from 'react'
import { Zap, Clock, AlertTriangle, ChevronRight, Trophy, Signal, Calendar, ChevronLeft } from 'lucide-react'

function FighterImage({ name, imageUrl, side }) {
  const [error, setError] = useState(false)

  useEffect(() => { setError(false) }, [imageUrl])

  if (error || !imageUrl) {
    return (
      <div className={`w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center text-2xl font-heading font-black uppercase ${
        side === 'red' ? 'bg-red-950/50 text-redCorner' : 'bg-blue-950/50 text-blueCorner'
      }`}>
        {name ? name.charAt(0) : '?'}
      </div>
    )
  }

  return (
    <div className={`w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-3 ${
      side === 'red' ? 'border-redCorner' : 'border-blueCorner'
    } shadow-lg`}>
      <img
        src={imageUrl}
        alt={name}
        onError={() => setError(true)}
        className="w-full h-full object-cover object-top"
      />
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-surfaceDark border border-borderDark p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-full animate-shimmer" />
          <div className="space-y-2">
            <div className="h-5 w-32 animate-shimmer rounded" />
            <div className="h-3 w-20 animate-shimmer rounded" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="h-8 w-12 animate-shimmer rounded" />
        </div>
        <div className="flex items-center gap-4 flex-1 justify-end">
          <div className="space-y-2 text-right">
            <div className="h-5 w-32 animate-shimmer rounded ml-auto" />
            <div className="h-3 w-20 animate-shimmer rounded ml-auto" />
          </div>
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-full animate-shimmer" />
        </div>
      </div>
    </div>
  )
}

function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({})

  useEffect(() => {
    const target = new Date(targetDate)

    const update = () => {
      const now = new Date()
      const diff = target - now

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, live: true })
        return
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        live: false,
      })
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  if (timeLeft.live) {
    return (
      <div className="flex items-center gap-2 animate-countdown-pulse">
        <Signal className="w-5 h-5 text-green-400" />
        <span className="text-green-400 font-heading font-black text-lg uppercase tracking-widest">
          LIVE NOW
        </span>
      </div>
    )
  }

  const blocks = [
    { val: timeLeft.days, label: 'Days' },
    { val: timeLeft.hours, label: 'Hrs' },
    { val: timeLeft.minutes, label: 'Min' },
    { val: timeLeft.seconds, label: 'Sec' },
  ]

  return (
    <div className="flex items-center gap-2 md:gap-3">
      {blocks.map((b, i) => (
        <div key={b.label} className="flex items-center gap-2 md:gap-3">
          <div className="flex flex-col items-center">
            <span className="text-xl md:text-3xl font-heading font-black text-white tabular-nums leading-none">
              {String(b.val ?? 0).padStart(2, '0')}
            </span>
            <span className="text-[9px] md:text-[10px] text-textInverseMuted uppercase tracking-widest font-bold mt-1">
              {b.label}
            </span>
          </div>
          {i < blocks.length - 1 && (
            <span className="text-ufcRed font-heading font-black text-xl md:text-2xl -mt-3">:</span>
          )}
        </div>
      ))}
    </div>
  )
}

function formatOdds(odds) {
  return odds > 0 ? `+${odds}` : `${odds}`
}

function formatEventDate(dateStr) {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    })
  } catch {
    return dateStr
  }
}

function formatEventDateFull(dateStr) {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  } catch {
    return dateStr
  }
}

export default function UpcomingCard({ onSimulate }) {
  const [allEvents, setAllEvents] = useState([])
  const [selectedEventIdx, setSelectedEventIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCard = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('http://localhost:8000/api/upcoming-card')
        const data = await res.json()

        if (data.status === 'success' && data.events?.length > 0) {
          setAllEvents(data.events)
          setSelectedEventIdx(0)
        } else if (data.status === 'key_missing') {
          setError('Odds API key not configured. Add your key to .env to see upcoming cards.')
        } else if (data.status === 'no_events') {
          setError('No upcoming UFC events found at this time.')
        } else {
          setError('Could not load upcoming cards. Try again later.')
        }
      } catch (err) {
        console.error('Failed to fetch upcoming card:', err)
        setError('Failed to connect to the backend. Make sure the server is running.')
      } finally {
        setLoading(false)
      }
    }

    fetchCard()
  }, [])

  const currentEvent = allEvents[selectedEventIdx] || null

  // Find the earliest commence_time for the countdown
  const earliestTime = useMemo(() => {
    if (!currentEvent?.matchups?.length) return null
    const times = currentEvent.matchups
      .map(m => m.commence_time)
      .filter(Boolean)
      .sort()
    return times[0] || null
  }, [currentEvent])

  return (
    <div className="w-full bg-background min-h-screen pb-16 relative">

      {/* ─── FULL SCREEN LOADING OVERLAY ─── */}
      {loading && (
        <div className="fixed inset-0 bg-ufcBlack/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            {/* Animated UFC Logo Spinner */}
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 border-4 border-ufcRed/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-ufcRed rounded-full animate-spin" />
              <div className="absolute inset-4 border-4 border-transparent border-t-ufcRed/50 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-heading font-black italic text-3xl text-white">UFC</span>
              </div>
            </div>
            
            {/* Loading Text */}
            <div className="text-center">
              <h3 className="text-white font-heading font-black text-xl uppercase tracking-widest mb-2 animate-pulse">
                Loading Fight Card
              </h3>
              <p className="text-textInverseMuted text-sm font-heading tracking-wider">
                Fetching upcoming matchups...
              </p>
            </div>

            {/* Loading Dots */}
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-ufcRed rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-ufcRed rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-ufcRed rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      {/* ─── HERO SECTION ─── */}
      <section className="bg-ufcBlack border-b-8 border-ufcRed text-white pt-10 pb-14 relative overflow-hidden">
        {/* Subtle bg pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.05) 35px, rgba(255,255,255,0.05) 36px)'
        }} />

        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center relative z-10">

          {/* ─── EVENT SELECTOR TABS ─── */}
          {!loading && allEvents.length > 1 && (
            <div className="flex items-center gap-2 mb-6 flex-wrap justify-center">
              {allEvents.map((evt, idx) => (
                <button
                  key={evt.event_date}
                  onClick={() => setSelectedEventIdx(idx)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-heading font-bold uppercase tracking-widest transition-all duration-300 border ${
                    selectedEventIdx === idx
                      ? 'bg-ufcRed border-ufcRed text-white shadow-lg shadow-ufcRed/30 scale-105'
                      : 'bg-surfaceDark border-borderDark text-textInverseMuted hover:border-ufcRed/50 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatEventDate(evt.event_date)}</span>
                  <span className="text-[9px] opacity-60">({evt.matchups.length})</span>
                </button>
              ))}
            </div>
          )}

          {/* Event Badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-ufcRed px-3 py-1 text-[10px] font-heading font-black uppercase tracking-[0.3em]">
              {selectedEventIdx === 0 ? 'Next Event' : 'Upcoming'}
            </div>
            {currentEvent?.matchups?.length > 0 && (
              <div className="bg-surfaceDark border border-borderDark px-3 py-1 text-[10px] font-heading font-bold uppercase tracking-widest text-textInverseMuted">
                {currentEvent.matchups.length} Bouts
              </div>
            )}
          </div>

          {/* Event Name */}
          <h1 className="text-4xl md:text-6xl font-heading font-black uppercase tracking-tighter mb-2 text-center">
            {loading ? (
              <span className="inline-block h-12 w-64 animate-shimmer rounded" />
            ) : currentEvent?.event_name || 'Upcoming Card'}
          </h1>

          {/* Event Date */}
          <p className="text-textInverseMuted text-sm font-heading tracking-widest uppercase mb-8">
            {loading ? (
              <span className="inline-block h-4 w-48 animate-shimmer rounded" />
            ) : currentEvent ? formatEventDateFull(currentEvent.event_date) : ''}
          </p>

          {/* Countdown Timer */}
          {!loading && earliestTime && (
            <div className="bg-surfaceDark/80 border border-borderDark backdrop-blur-sm px-8 py-5">
              <div className="text-center mb-3">
                <span className="text-[10px] text-textInverseMuted uppercase tracking-[0.3em] font-bold">
                  Event Starts In
                </span>
              </div>
              <CountdownTimer targetDate={earliestTime} />
            </div>
          )}
        </div>
      </section>

      {/* ─── MATCHUPS LIST ─── */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 -mt-8 relative z-10">

        {/* Loading State - Hidden behind overlay */}
        {loading && (
          <div className="space-y-4 opacity-0">
            {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-surfaceDark border border-borderDark p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-ufcRed mx-auto mb-4" />
            <h3 className="text-white font-heading font-black text-xl uppercase tracking-tight mb-2">
              No Card Available
            </h3>
            <p className="text-textInverseMuted text-sm max-w-md mx-auto">
              {error}
            </p>
          </div>
        )}

        {/* Matchup Cards */}
        {!loading && !error && currentEvent?.matchups?.map((matchup, index) => (
          <div
            key={`${matchup.fighter_a}-${matchup.fighter_b}-${currentEvent.event_date}`}
            className="animate-stagger-in"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="group bg-surfaceDark border border-borderDark hover:border-ufcRed/50 transition-all duration-500 mb-4 relative overflow-hidden cursor-pointer"
              onClick={() => {
                if (matchup.fighter_a_in_db && matchup.fighter_b_in_db) {
                  onSimulate(matchup.fighter_a, matchup.fighter_b, matchup.fighter_a_odds, matchup.fighter_b_odds, matchup.weight_class, matchup.rounds)
                }
              }}
            >
              {/* Hover glow bar */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-ufcRed to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="p-5 md:p-8">
                {/* Main matchup row */}
                <div className="flex items-center justify-between gap-3 md:gap-6">

                  {/* Fighter A (Red Corner) */}
                  <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
                    <FighterImage
                      name={matchup.fighter_a}
                      imageUrl={matchup.fighter_a_image}
                      side="red"
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] text-redCorner uppercase tracking-[0.2em] font-bold mb-1 hidden md:block">
                        Red Corner
                      </p>
                      <h3 className="text-white font-heading font-black text-base md:text-xl uppercase tracking-tight truncate">
                        {matchup.fighter_a}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-sm font-mono font-bold ${
                          matchup.fighter_a_odds < 0 ? 'text-green-400' : 'text-textInverseMuted'
                        }`}>
                          {formatOdds(matchup.fighter_a_odds)}
                        </span>
                        {!matchup.fighter_a_in_db && (
                          <span className="text-[9px] bg-yellow-900/40 text-yellow-500 px-1.5 py-0.5 font-bold uppercase tracking-wider">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Center VS + Weight Class */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="bg-ufcRed text-white font-heading font-black italic text-lg md:text-2xl px-3 md:px-5 py-1.5 md:py-2 skew-x-[-12deg] shadow-lg shadow-ufcRed/30 group-hover:shadow-ufcRed/60 transition-shadow duration-500">
                      VS
                    </div>
                    {matchup.weight_class && (
                      <p className="text-[9px] text-textInverseMuted uppercase tracking-widest mt-2 font-bold text-center hidden md:block">
                        {matchup.weight_class} • {matchup.rounds} RDS
                      </p>
                    )}
                    {matchup.bookmaker && (
                      <p className="text-[8px] text-textInverseMuted/50 uppercase tracking-widest mt-0.5 hidden md:block">
                        {matchup.bookmaker}
                      </p>
                    )}
                  </div>

                  {/* Fighter B (Blue Corner) */}
                  <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0 justify-end">
                    <div className="min-w-0 text-right">
                      <p className="text-[10px] text-blueCorner uppercase tracking-[0.2em] font-bold mb-1 hidden md:block">
                        Blue Corner
                      </p>
                      <h3 className="text-white font-heading font-black text-base md:text-xl uppercase tracking-tight truncate">
                        {matchup.fighter_b}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 justify-end">
                        {!matchup.fighter_b_in_db && (
                          <span className="text-[9px] bg-yellow-900/40 text-yellow-500 px-1.5 py-0.5 font-bold uppercase tracking-wider">
                            New
                          </span>
                        )}
                        <span className={`text-sm font-mono font-bold ${
                          matchup.fighter_b_odds < 0 ? 'text-green-400' : 'text-textInverseMuted'
                        }`}>
                          {formatOdds(matchup.fighter_b_odds)}
                        </span>
                      </div>
                    </div>
                    <FighterImage
                      name={matchup.fighter_b}
                      imageUrl={matchup.fighter_b_image}
                      side="blue"
                    />
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-borderDark/50">
                  <div className="flex items-center gap-2">
                    {matchup.fighter_a_in_db && matchup.fighter_b_in_db ? (
                      <span className="text-[10px] text-green-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                        <Zap className="w-3 h-3" />
                        Both in Database — Ready to Simulate
                      </span>
                    ) : (
                      <span className="text-[10px] text-yellow-500 uppercase tracking-widest font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" />
                        {!matchup.fighter_a_in_db && !matchup.fighter_b_in_db
                          ? 'Both fighters not in database'
                          : `${!matchup.fighter_a_in_db ? matchup.fighter_a : matchup.fighter_b} not in database`}
                      </span>
                    )}
                  </div>

                  {matchup.fighter_a_in_db && matchup.fighter_b_in_db && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSimulate(matchup.fighter_a, matchup.fighter_b, matchup.fighter_a_odds, matchup.fighter_b_odds, matchup.weight_class, matchup.rounds)
                      }}
                      className="flex items-center gap-2 bg-ufcRed hover:bg-red-700 text-white px-5 py-2.5 font-heading font-black text-xs uppercase tracking-widest transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-ufcRed/30 group/btn"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Simulate</span>
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  )}
                </div>

                {/* Weight class & rounds badge on mobile */}
                {matchup.weight_class && (
                  <div className="mt-3 md:hidden flex items-center gap-2">
                    <span className="text-[9px] bg-surfaceDark border border-borderDark px-2 py-1 text-textInverseMuted uppercase tracking-widest font-bold">
                      {matchup.weight_class}
                    </span>
                    <span className="text-[9px] bg-surfaceDark border border-borderDark px-2 py-1 text-textInverseMuted uppercase tracking-widest font-bold">
                      {matchup.rounds} RDS
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Footer info */}
        {!loading && !error && currentEvent?.matchups?.length > 0 && (
          <div className="text-center mt-8 mb-4">
            <p className="text-textMuted text-[11px] uppercase tracking-widest font-heading">
              Odds powered by The Odds API • Click any matchup to run 10,000 simulations
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
