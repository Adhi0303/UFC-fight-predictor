import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

export default function Navbar({ currentPage, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const isFightCenter = currentPage === 'fight-center'

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const shouldBeSolid = !isFightCenter || isScrolled || isHovered || mobileMenuOpen

  const leftItems = [
    { id: 'upcoming-card', label: 'Upcoming Card' },
    { id: 'roster', label: 'Roster' },
  ]
  
  const rightItems = [
    { id: 'fight-center', label: 'Fight Center' },
    { id: 'analysis', label: 'Analysis' },
  ]

  const handleNav = (id) => {
    onNavigate(id)
    setMobileMenuOpen(false)
  }

  return (
    <header 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-0 w-full z-50 transition-all duration-700 ease-in-out ${
        shouldBeSolid 
          ? 'bg-ufcBlack border-b border-borderDark text-textInverse' 
          : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent text-white pt-2'
      }`}
    >
      <div className="w-full px-4 sm:px-8 lg:px-12">
        <div className={`flex justify-between items-center relative transition-all duration-700 ${shouldBeSolid ? 'h-24' : 'h-16'}`}>
          
          {/* Mobile menu button (Left aligned on mobile) */}
          <div className={`md:hidden flex items-center absolute left-0 transition-opacity duration-700 ${shouldBeSolid ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white p-2"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Desktop Left Nav */}
          <nav className={`hidden md:flex flex-1 justify-end space-x-12 lg:space-x-16 pr-8 lg:pr-12 transition-all duration-700 ${
            shouldBeSolid ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}>
            {leftItems.map(item => {
              const isActive = currentPage === item.id || (item.id === 'roster' && currentPage === 'fighter-profile')
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`px-3 py-2 text-sm font-heading font-bold uppercase tracking-widest transition-colors ${
                    isActive 
                      ? 'text-ufcRed border-b-2 border-ufcRed' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </nav>

          {/* Center Logo */}
          <div 
            className={`flex-shrink-0 flex items-center gap-3 cursor-pointer mx-auto md:mx-0 transition-all duration-700 transform origin-top ${
              shouldBeSolid ? 'scale-100 translate-y-0' : 'scale-[0.8] -translate-y-1'
            }`} 
            onClick={() => handleNav('fight-center')}
          >
            <div className="w-10 h-10 bg-ufcRed text-white flex items-center justify-center font-heading font-black italic text-2xl tracking-tighter transform skew-x-[-12deg]">
              <span className="skew-x-[12deg]">UFC</span>
            </div>
            <span className="font-heading font-black text-2xl tracking-tight uppercase mt-1">Predictor</span>
          </div>

          {/* Desktop Right Nav */}
          <nav className={`hidden md:flex flex-1 justify-start space-x-12 lg:space-x-16 pl-8 lg:pl-12 transition-all duration-700 ${
            shouldBeSolid ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}>
            {rightItems.map(item => {
              const isActive = currentPage === item.id || (item.id === 'roster' && currentPage === 'fighter-profile')
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`px-3 py-2 text-sm font-heading font-bold uppercase tracking-widest transition-colors ${
                    isActive 
                      ? 'text-ufcRed border-b-2 border-ufcRed' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-ufcBlack border-t border-borderDark animate-slide-down">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {[...leftItems, ...rightItems].map(item => {
              const isActive = currentPage === item.id || (item.id === 'roster' && currentPage === 'fighter-profile')
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`block w-full text-left px-3 py-3 rounded-md text-base font-heading font-bold uppercase tracking-widest ${
                    isActive 
                      ? 'bg-ufcRed text-white' 
                      : 'text-textInverseMuted hover:bg-surfaceDark hover:text-textInverse'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}
