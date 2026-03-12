import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../../components/ui/Button'

const features = [
  { emoji: '💬', label: 'Daily\nQuestions' },
  { emoji: '🎁', label: 'Virtual\nGifts' },
  { emoji: '💝', label: 'Earn\nHearts' },
]

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-80px] left-[-80px] w-72 h-72 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-tertiary/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm">
        {/* Animated logo */}
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14 }}
          className="mb-4 relative"
        >
          <motion.div
            animate={{ rotate: [0, 4, -4, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="text-[88px] leading-none select-none"
          >
            💝
          </motion.div>
          {/* Sparkles */}
          {[
            { emoji: '✨', style: { top: '-8px', left: '-18px' }, delay: 0 },
            { emoji: '⭐', style: { top: '-4px', right: '-16px' }, delay: 0.6 },
            { emoji: '✨', style: { bottom: '4px', right: '-20px' }, delay: 1.2 },
          ].map(({ emoji, style, delay }, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1.2, 0.5],
                y: [0, -12, -24],
              }}
              transition={{ duration: 2.5, repeat: Infinity, delay, ease: 'easeOut' }}
              className="absolute text-lg pointer-events-none"
              style={style}
            >
              {emoji}
            </motion.span>
          ))}
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="font-display text-5xl text-dark leading-tight mb-1"
        >
          Surprise Mine
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="font-body text-lg text-muted mb-10"
        >
          Your love, leveled up. 💫
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="flex gap-4 mb-10 justify-center"
        >
          {features.map(({ emoji, label }) => (
            <motion.div
              key={emoji}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="w-16 h-16 rounded-3xl bg-white shadow-card flex items-center justify-center text-3xl">
                {emoji}
              </div>
              <span className="text-xs text-muted font-body font-bold whitespace-pre-line text-center leading-tight">
                {label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="w-full flex flex-col gap-3"
        >
          <Button size="lg" fullWidth variant="gradient" onClick={() => navigate('/signup')}>
            Create Account ✨
          </Button>

          <Button size="lg" fullWidth variant="outline" onClick={() => navigate('/join')}>
            Join My Partner 💕
          </Button>

          <button
            onClick={() => navigate('/signin')}
            className="mt-1 text-sm text-muted font-body font-semibold hover:text-dark transition-colors"
          >
            Already have an account?{' '}
            <span className="text-primary">Sign in</span>
          </button>
        </motion.div>
      </div>
    </div>
  )
}
