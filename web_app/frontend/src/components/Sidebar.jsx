import { useState } from 'react'
import { Swords, Users, BarChart3, History, TrendingUp, Award, Settings, HelpCircle, Menu, X, Zap } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'fight-center', label: 'Fight Center', icon: Swords, active: true },
  { id: 'roster',       label: 'Roster',       icon: Users,   active: true },
  { id: 'analysis',     label: 'Analysis',     icon: BarChart3, active: true },
  { id: 'rankings',     label: 'Rankings',     icon: Award,   active: false },
  { id: 'history',      label: 'Fight History', icon: History, active: false },
  { id: 'odds',         label: 'Betting Odds', icon: TrendingUp, active: false },
]

export default function Sidebar({ currentPage, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleNav = (item) => {
    if (item.active) {
      onNavigate(item.id)
      setMobileOpen(false)
    }
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 glass-panel text-textSecondary hover:text-gold transition-colors"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static z-40 h-screen flex flex-col
        bg-surface border-r border-border
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-[220px]'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand */}
        <div className="p-5 pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-goldDim flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-gold" />
            </div>
            {!collapsed && (
              <div className="animate-slide-in">
                <h1 className="font-heading font-bold text-base leading-none tracking-tight text-textPrimary">
                  OCTAGON
                </h1>
                <span className="text-[11px] font-heading font-semibold text-gold tracking-[0.15em] uppercase">
                  AI
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto hide-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id || (item.id === 'roster' && currentPage === 'fighter-profile')
            const isDisabled = !item.active

            return (
              <button
                key={item.id}
                onClick={() => handleNav(item)}
                disabled={isDisabled}
                title={collapsed ? item.label : undefined}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200 relative group
                  ${isActive
                    ? 'bg-goldDim text-gold'
                    : isDisabled
                      ? 'text-textMuted cursor-not-allowed'
                      : 'text-textSecondary hover:text-textPrimary hover:bg-white/[0.03]'
                  }
                `}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gold rounded-r-full" />
                )}

                <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-gold' : ''}`} />

                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}

                {!collapsed && isDisabled && (
                  <span className="ml-auto text-[9px] uppercase tracking-wider bg-white/5 text-textMuted px-1.5 py-0.5 rounded-full">
                    Soon
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-border space-y-1">
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-textSecondary hover:text-textPrimary hover:bg-white/[0.03] transition-colors"
          >
            <Menu className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>Collapse</span>}
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-textSecondary hover:text-textPrimary hover:bg-white/[0.03] transition-colors">
            <Settings className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>Settings</span>}
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-textSecondary hover:text-textPrimary hover:bg-white/[0.03] transition-colors">
            <HelpCircle className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>Support</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
