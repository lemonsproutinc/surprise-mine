import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../../components/ui/Button'

const features = [
  { emoji: '💬', label: 'Daily\nQuestions' },
  { emoji: '🎁', label: 'Virtual\nGifts' },
  { emoji: '💝', label: 'Earn\nHearts' },
]

function StarRating() {
  // 4.9/5 stars — 98% filled
  return (
    <div className="flex items-center gap-1.5 justify-center">
      {[1, 2, 3, 4].map(i => (
        <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="#FFD93D">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      {/* Partial star at ~90% */}
      <svg width="18" height="18" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="partialStar">
            <stop offset="90%" stopColor="#FFD93D" />
            <stop offset="90%" stopColor="#E5E7EB" />
          </linearGradient>
        </defs>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#partialStar)" />
      </svg>
      <span className="text-sm font-body font-bold text-dark ml-1">4.9/5 stars</span>
    </div>
  )
}

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-80px] left-[-80px] w-72 h-72 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm">
        {/* Logo — CSS animation instead of JS loop */}
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14 }}
          className="mb-3 relative"
        >
          <div className="text-[72px] leading-none select-none animate-rotate-gentle">
            💝
          </div>
          {/* Sparkles — CSS animations */}
          {[
            { emoji: '✨', style: { top: '-8px', left: '-18px' }, delay: '0s' },
            { emoji: '⭐', style: { top: '-4px', right: '-16px' }, delay: '0.8s' },
            { emoji: '✨', style: { bottom: '4px', right: '-20px' }, delay: '1.6s' },
          ].map(({ emoji, style, delay }, i) => (
            <span
              key={i}
              className="absolute text-lg pointer-events-none animate-bounce-sparkle"
              style={{ ...style, animationDelay: delay }}
            >
              {emoji}
            </span>
          ))}
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-display text-5xl text-dark leading-tight mb-1"
        >
          Surprise Mine
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="font-body text-lg text-muted mb-3"
        >
          The app that brings couples closer.
        </motion.p>

        {/* Star rating */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mb-3"
        >
          <StarRating />
        </motion.div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="bg-white rounded-2xl p-4 shadow-card border border-surface mb-4 text-left"
        >
          <p className="text-xs text-muted font-body leading-relaxed italic">
            "I'm always surprised with what my partner says (in a good way) with the questions. We change as we get older, and it's nice to learn more about them and send cute little notes &amp; gifts to each other. It's nice when we can do it on our own times so that it's a surprise when I get a notification"
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex">
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#FFD93D">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <span className="text-[10px] text-muted font-body">Verified user</span>
          </div>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="flex gap-4 mb-5 justify-center"
        >
          {features.map(({ emoji, label }) => (
            <div
              key={emoji}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="w-14 h-14 rounded-3xl bg-white shadow-card flex items-center justify-center text-2xl">
                {emoji}
              </div>
              <span className="text-xs text-muted font-body font-bold whitespace-pre-line text-center leading-tight">
                {label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="w-full flex flex-col gap-3"
        >
          <Button size="lg" fullWidth variant="gradient" onClick={() => navigate('/signup')}>
            Create Account ✨
          </Button>

          <Button size="lg" fullWidth variant="outline" onClick={() => navigate('/signin')}>
            Sign In 💕
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
