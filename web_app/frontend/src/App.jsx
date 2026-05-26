import { useState, useEffect } from 'react'
import { Activity, Swords } from 'lucide-react'
import SelectionScreen from './components/SelectionScreen'
import AnalysisScreen from './components/AnalysisScreen'

function App() {
  const [fighters, setFighters] = useState([])
  const [loading, setLoading] = useState(false)
  const [prediction, setPrediction] = useState(null)
  
  // 'matchmaker' | 'analysis'
  const [currentScreen, setCurrentScreen] = useState('matchmaker')

  useEffect(() => {
    fetch('http://localhost:8000/api/fighters')
      .then(res => res.json())
      .then(data => setFighters(data.fighters))
      .catch(err => console.error(err))
  }, [])

  const handlePredict = async (rFighter, bFighter, rOdds, bOdds) => {
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
          rounds: 3 // Default 3 rounds
        })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to fetch prediction')
      }
      setPrediction(data)
      setCurrentScreen('analysis')
    } catch (err) {
      console.error(err)
      alert("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary p-4 md:p-8 font-sans flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-3">
          <Swords className="w-8 h-8 text-gold" />
          <h1 className="text-2xl font-heading font-bold uppercase tracking-widest text-textPrimary">UFC Predictor</h1>
        </div>
        <div className="glass-panel px-4 py-2 flex items-center gap-2 text-sm text-textSecondary">
          <Activity className="w-4 h-4 text-green-400" />
          <span className="hidden md:inline">Model Status: Active</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0">
        {currentScreen === 'matchmaker' ? (
          <SelectionScreen 
            fighters={fighters} 
            onPredict={handlePredict} 
            loading={loading} 
          />
        ) : (
          <AnalysisScreen 
            prediction={prediction} 
            onBack={() => setCurrentScreen('matchmaker')} 
          />
        )}
      </main>
    </div>
  )
}

export default App
