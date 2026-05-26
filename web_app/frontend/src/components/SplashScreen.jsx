import { useEffect, useState } from 'react'

function SplashScreen({ onComplete }) {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true)
      setTimeout(onComplete, 500)
    }, 4500)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gray-300 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="ufc-letter" style={{ animationDelay: '0s' }}>U</div>
        <div className="ufc-letter ufc-f" style={{ animationDelay: '0.5s' }}>F</div>
        <div className="ufc-letter" style={{ animationDelay: '1s' }}>C</div>
      </div>
    </div>
  )
}

export default SplashScreen
