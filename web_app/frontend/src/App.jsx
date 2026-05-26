import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import FightCenter from './components/FightCenter'
import RosterPage from './components/RosterPage'
import AnalysisScreen from './components/AnalysisScreen'
import FighterProfile from './components/FighterProfile'
import UpcomingCard from './components/UpcomingCard'

function App() {
  const [fighters, setFighters] = useState([])
  const [loading, setLoading] = useState(false)
  const [prediction, setPrediction] = useState(null)
  const [currentPage, setCurrentPage] = useState('fight-center')
  const [selectedFighter, setSelectedFighter] = useState(null)

  // Pre-fill state from Upcoming Card → Fight Center
  const [prefill, setPrefill] = useState(null)

  useEffect(() => {
    fetch('http://localhost:8000/api/fighters')
      .then(res => res.json())
      .then(data => setFighters(data.fighters))
      .catch(err => console.error(err))
  }, [])

  const handlePredict = async (rFighter, bFighter, rOdds, bOdds, rounds, boutWeightClass) => {
    setLoading(true)
    setPrediction(null)

    // Artificial delay to build anticipation with the loading animation
    const minDelay = new Promise(resolve => setTimeout(resolve, 3000))

    try {
      const apiCall = fetch('http://localhost:8000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          R_fighter: rFighter,
          B_fighter: bFighter,
          R_odds: parseFloat(rOdds),
          B_odds: parseFloat(bOdds),
          rounds: rounds || 3,
          bout_weight_class: boutWeightClass
        })
      }).then(res => res.json().then(data => ({ res, data })))

      const [_, { res, data }] = await Promise.all([minDelay, apiCall])

      if (!res.ok) throw new Error(data.detail || 'Prediction failed')
      setPrediction(data)
      setCurrentPage('analysis')
    } catch (err) {
      console.error(err)
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleViewProfile = (name) => {
    setSelectedFighter(name)
    setCurrentPage('fighter-profile')
  }

  // Called when user clicks "Simulate" on an upcoming card matchup
  const handleSimulateFromCard = (fighterA, fighterB, oddsA, oddsB, weightClass, rounds) => {
    setPrefill({ rFighter: fighterA, bFighter: fighterB, rOdds: oddsA, bOdds: oddsB, weightClass: weightClass || '', rounds: rounds || 3 })
    setCurrentPage('fight-center')
  }

  const renderPage = () => {
    // If loading prediction, show a full screen or prominent loading state
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-ufcBlack text-white w-full">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-ufcRed rounded-full animate-ping opacity-20" />
            <div className="absolute inset-4 border-4 border-ufcRed/50 rounded-full animate-spin border-t-ufcRed" style={{ animationDuration: '1s' }} />
            <div className="font-heading font-black italic text-2xl text-white z-10">UFC</div>
          </div>
          <h2 className="mt-8 font-heading font-bold text-xl tracking-widest uppercase animate-pulse">Running Simulations</h2>
          <p className="text-textInverseMuted text-sm mt-2 font-heading tracking-wider">Processing 10,000 outcomes...</p>
        </div>
      )
    }

    switch (currentPage) {
      case 'upcoming-card':
        return <UpcomingCard onSimulate={handleSimulateFromCard} />
      case 'fight-center':
        return (
          <FightCenter
            fighters={fighters}
            onPredict={handlePredict}
            loading={loading}
            prefill={prefill}
            onPrefillConsumed={() => setPrefill(null)}
          />
        )
      case 'roster':
        return <RosterPage fighters={fighters} onViewProfile={handleViewProfile} />
      case 'analysis':
        return (
          <AnalysisScreen
            prediction={prediction}
            onBack={() => setCurrentPage('fight-center')}
          />
        )
      case 'fighter-profile':
        return (
          <FighterProfile 
            fighterName={selectedFighter} 
            onBack={() => setCurrentPage('roster')} 
            onViewFighter={handleViewProfile} 
          />
        )
      default:
        return <FightCenter fighters={fighters} onPredict={handlePredict} loading={loading} />
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 w-full">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
