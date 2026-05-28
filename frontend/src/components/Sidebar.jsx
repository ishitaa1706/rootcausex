import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Search, GitBranch, Activity, Zap, Clock } from 'lucide-react'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',  view: 'dashboard'  },
  { icon: Activity,        label: 'Metrics',    view: 'metrics'    },
  { icon: GitBranch,       label: 'Topology',   view: 'topology'   },
  { icon: Clock,           label: 'Timeline',   view: 'timeline'   },
  { icon: Search,          label: 'Investigate', view: 'investigate'},
]

/**
 * Sidebar — left navigation rail.
 *
 * Props:
 *   activeView  — current view key (matches NAV_ITEMS[*].view)
 *   onNavigate  — (view: string) => void
 */
export default function Sidebar({ activeView = 'dashboard', onNavigate }) {
  return (
    <motion.aside
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0,   opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="w-[60px] flex flex-col items-center py-5 gap-6 shrink-0"
      style={{
        background:  'rgba(3, 9, 22, 0.95)',
        borderRight: '1px solid rgba(56,189,248,0.08)',
      }}
    >
      {/* Logo mark */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{
          background: 'rgba(56,189,248,0.12)',
          border:     '1px solid rgba(56,189,248,0.35)',
          boxShadow:  '0 0 16px rgba(56,189,248,0.25)',
        }}
      >
        <Zap size={16} color="#38bdf8" />
      </div>

      {/* Nav items */}
      <nav className="flex flex-col items-center gap-2 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.view
          return (
            <div key={item.label} className="relative group">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                title={item.label}
                onClick={() => onNavigate?.(item.view)}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                style={
                  isActive
                    ? {
                        background: 'rgba(56,189,248,0.18)',
                        border:     '1px solid rgba(56,189,248,0.35)',
                        color:      '#38bdf8',
                        boxShadow:  '0 0 12px rgba(56,189,248,0.2)',
                      }
                    : {
                        background: 'transparent',
                        border:     '1px solid transparent',
                        color:      '#334155',
                      }
                }
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.color = '#64748b'
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.color = '#334155'
                }}
              >
                <item.icon size={16} />
              </motion.button>

              {/* Floating label tooltip — appears on hover */}
              <div
                className="absolute left-12 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ zIndex: 100 }}
              >
                <div
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold"
                  style={{
                    background: 'rgba(8,16,36,0.96)',
                    border:     '1px solid rgba(56,189,248,0.15)',
                    color:      isActive ? '#38bdf8' : '#64748b',
                    boxShadow:  '0 4px 16px rgba(0,0,0,0.4)',
                  }}
                >
                  {item.label}
                </div>
              </div>
            </div>
          )
        })}
      </nav>

      {/* Live indicator dot */}
      <div className="flex flex-col items-center gap-1 pb-1">
        <div
          className="w-1.5 h-1.5 rounded-full pulse-dot"
          style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }}
        />
      </div>
    </motion.aside>
  )
}
