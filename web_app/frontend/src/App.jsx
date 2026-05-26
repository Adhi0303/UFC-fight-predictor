import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import FightCenter from './components/FightCenter'
import RosterPage from './components/RosterPage'
import AnalysisScreen from './components/AnalysisScreen'
import FighterProfile from './components/FighterProfile'

function App() {
  const [fighters, setFighters] = useState([])
  const [loading, setLoading] = useState(false)
  const [prediction, setPrediction] = useState(null)
  const [currentPage, setCurrentPage] = useState('fight-center')
  const [selectedFighter, setSelectedFighter] = useState(null)

  useEffect(() => {
    fetch('http://localhost:8000/api/fighters')
      .then(res => res.json())
      .then(data => setFighters(data.fighters))
      .catch(err => console.error(err))
  }, [])

  const handlePredict = async (rFighter, bFighter, rOdds, bOdds, rounds, boutWeightClass) => {
    setLoading(true)
    setPrediction(null)

    try {
      const res = await fetch('http://localhost:8000/api/predict', {
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
      })
      const data = await res.json()
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

  const renderPage = () => {
    switch (currentPage) {
      case 'fight-center':
        return <FightCenter fighters={fighters} onPredict={handlePredict} loading={loading} />
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
    <div className="flex h-screen bg-background text-textPrimary font-sans overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 overflow-y-auto">
        <div className="animate-fade-in">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}

export default App
