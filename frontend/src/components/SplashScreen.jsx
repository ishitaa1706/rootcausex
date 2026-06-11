import { motion } from 'framer-motion'

const MEMBERS = ['Ishita', 'Sonali', 'Aanchal']

const STACK = [
  { label: 'React 19',      category: 'Frontend' },
  { label: 'Vite',          category: 'Frontend' },
  { label: 'Tailwind CSS',  category: 'Frontend' },
  { label: 'Framer Motion', category: 'Frontend' },
  { label: 'React Flow',    category: 'Frontend' },
  { label: 'Spring Boot',   category: 'Backend'  },
  { label: 'Java 17',       category: 'Backend'  },
  { label: 'Claude API',    category: 'AI'       },
]

const CATEGORY_COLOR = {
  Frontend: { color: '#38bdf8', bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.2)'  },
  Backend:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' },
  AI:       { color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)'  },
}

export default function SplashScreen({ onEnter }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center"
         style={{ background: '#060d1a' }}>

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-[0.04]"
           style={{
             backgroundImage: 'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)',
             backgroundSize: '60px 60px'
           }} />

      {/* Glow behind logo */}
      <div className="absolute w-[600px] h-[600px] rounded-full opacity-10"
           style={{ background: 'radial-gradient(circle, #38bdf8 0%, transparent 70%)' }} />

      <div className="relative flex flex-col items-center gap-10 px-8 text-center">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-mono tracking-widest uppercase"
          style={{ borderColor: '#1e3a5f', color: '#38bdf8', background: 'rgba(56,189,248,0.06)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
          AI-Native Runtime Investigation
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex flex-col items-center gap-3">
          <h1 className="font-bold tracking-tight"
              style={{ fontSize: '5rem', lineHeight: 1, color: '#f1f5f9', letterSpacing: '-0.03em' }}>
            RootCause<span style={{ color: '#38bdf8' }}>X</span>
          </h1>
          <p className="font-mono text-base tracking-[0.25em] uppercase"
             style={{ color: '#475569' }}>
            from anomaly to answer in 30 seconds
          </p>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-48 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #1e3a5f, transparent)' }} />

        {/* Tech stack */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col items-center gap-3">
          <span className="text-xs font-mono tracking-widest uppercase"
                style={{ color: '#334155' }}>built with</span>
          <div className="flex flex-wrap justify-center gap-2 max-w-md">
            {STACK.map((item, i) => {
              const c = CATEGORY_COLOR[item.category]
              return (
                <motion.span
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.55 + i * 0.06 }}
                  className="px-3 py-1 rounded-full text-xs font-mono font-medium"
                  style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
                  {item.label}
                </motion.span>
              )
            })}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-5">
            {Object.entries(CATEGORY_COLOR).map(([cat, c]) => (
              <div key={cat} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                <span className="text-xs font-mono" style={{ color: '#334155' }}>{cat}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="w-48 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #1e3a5f, transparent)' }} />

        {/* Team name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="flex flex-col items-center gap-3">
          <span className="text-xs font-mono tracking-widest uppercase"
                style={{ color: '#334155' }}>presented by</span>
          <span className="text-2xl font-bold tracking-wide"
                style={{ color: '#38bdf8', letterSpacing: '0.08em' }}>
            Runtime Rebels
          </span>
          {/* Member names as small credits */}
          <div className="flex items-center gap-2 mt-1">
            {MEMBERS.map((name, i) => (
              <motion.span
                key={name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.7 + i * 0.08 }}
                className="text-xs font-mono"
                style={{ color: '#334155' }}>
                {name}{i < MEMBERS.length - 1 ? <span style={{ color: '#1e3a5f' }}> · </span> : ''}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Enter button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onEnter}
          className="mt-4 px-10 py-3.5 rounded-lg text-sm font-mono font-bold tracking-widest uppercase cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
            color: '#060d1a',
            boxShadow: '0 0 32px rgba(56,189,248,0.3)',
            border: 'none'
          }}>
          Launch Demo →
        </motion.button>

      </div>
    </div>
  )
}
