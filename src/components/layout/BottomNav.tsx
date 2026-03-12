import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const tabs = [
  { path: '/home', emoji: '🏠', label: 'Home' },
  { path: '/questions', emoji: '💬', label: 'Questions' },
  { path: '/gifts', emoji: '🎁', label: 'Gifts' },
  { path: '/milestones', emoji: '🏆', label: 'Milestones' },
  { path: '/profile', emoji: '👤', label: 'Profile' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] glass border-t border-white/60 z-50 safe-bottom">
      <div className="flex items-center justify-around py-2 px-1">
        {tabs.map(({ path, emoji, label }) => (
          <NavLink
            key={path}
            to={path}
            className="flex-1"
          >
            {({ isActive }) => (
              <div className="flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-2xl relative">
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-primary/10 rounded-2xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <motion.span
                  animate={{ scale: isActive ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="text-xl relative z-10"
                >
                  {emoji}
                </motion.span>
                <span
                  className={`text-[10px] font-body font-bold relative z-10 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted'
                  }`}
                >
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
