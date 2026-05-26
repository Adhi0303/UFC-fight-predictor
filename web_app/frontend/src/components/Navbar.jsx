import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function Navbar({ currentPage, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { id: 'fight-center', label: 'Fight Center' },
    { id: 'roster', label: 'Roster' },
    { id: 'analysis', label: 'Analysis' },
  ]

  const handleNav = (id) => {
    onNavigate(id)
    setMobileMenuOpen(false)
  }

  return (
    <header className="bg-ufcBlack text-textInverse sticky top-0 z-50 border-b border-borderDark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer" onClick={() => handleNav('fight-center')}>
            <div className="w-8 h-8 bg-ufcRed text-white flex items-center justify-center font-heading font-black italic text-xl tracking-tighter">
              UFC
            </div>
            <span className="font-heading font-black text-xl tracking-tight uppercase">Predictor</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map(item => {
              // Roster is active if we are on roster OR fighter-profile
              const isActive = currentPage === item.id || (item.id === 'roster' && currentPage === 'fighter-profile')
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`px-3 py-2 text-sm font-heading font-bold uppercase tracking-widest transition-colors ${
                    isActive 
                      ? 'text-ufcRed border-b-2 border-ufcRed' 
                      : 'text-textInverseMuted hover:text-textInverse'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-textInverseMuted hover:text-textInverse"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-ufcBlack border-t border-borderDark animate-slide-down">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map(item => {
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
