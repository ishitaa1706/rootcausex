import { motion } from 'framer-motion'
import { LayoutDashboard, Search, GitBranch, Activity, Zap, Clock } from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',  active: true  },
  { icon: Activity,        label: 'Metrics',    active: false },
  { icon: GitBranch,       label: 'Topology',   active: false },
  { icon: Clock,           label: 'Timeline',   active: false },
  { icon: Search,          label: 'Investigate',active: false },
]

export default function Sidebar() {
  return (
    <motion.aside
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0,   opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="w-[60px] flex flex-col items-center py-5 gap-6 shrink-0"
      style={{
        background: 'rgba(3, 9, 22, 0.95)',
        borderRight: '1px solid rgba(56,189,248,0.08)',
      }}
    >
      {/* Logo mark */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{
          background: 'rgba(56,189,248,0.12)',
          border: '1px solid rgba(56,189,248,0.35)',
          boxShadow: '0 0 16px rgba(56,189,248,0.25)',
        }}
      >
        <Zap size={16} color="#38bdf8" />
      </div>

      {/* Nav items */}
      <nav className="flex flex-col items-center gap-2 flex-1">
        {navItems.map((item) => (
          <motion.button
            key={item.label}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.93 }}
            title={item.label}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200"
            style={
              item.active
                ? {
                    background: 'rgba(56,189,248,0.18)',
                    border: '1px solid rgba(56,189,248,0.35)',
                    color: '#38bdf8',
                    boxShadow: '0 0 12px rgba(56,189,248,0.2)',
                  }
                : {
                    background: 'transparent',
                    border: '1px solid transparent',
                    color: '#334155',
                  }
            }
          >
            <item.icon size={16} />
          </motion.button>
        ))}
      </nav>

      {/* Bottom dot — live indicator */}
      <div className="flex flex-col items-center gap-1 pb-1">
        <div
          className="w-1.5 h-1.5 rounded-full pulse-dot"
          style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }}
        />
      </div>
    </motion.aside>
  )
}
