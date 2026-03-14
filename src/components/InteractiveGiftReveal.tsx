import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'

type GiftType = 'gift_box' | 'love_letter' | 'balloon' | 'fortune_cookie'

interface InteractiveGiftRevealProps {
  gift: {
    gift_type: GiftType
    message: string
    photo_url?: string | null
    created_at: string
  }
  onClose: () => void
}

const GIFT_EMOJI: Record<GiftType, string> = {
  gift_box: '\u{1F381}',
  love_letter: '\u{1F48C}',
  balloon: '\u{1F388}',
  fortune_cookie: '\u{1F960}',
}

const TOTAL_STEPS: Record<GiftType, number> = {
  gift_box: 10,
  love_letter: 9,
  balloon: 10,
  fortune_cookie: 8,
}

// ── Gift Box Visuals ──────────────────────────────────────────────

function GiftBoxStep({ step }: { step: number }) {
  const boxColor = 'bg-primary'
  const lidColor = 'bg-primary/90'
  const ribbonColor = 'bg-secondary'

  // Helper booleans
  const ribbonVLoose = step >= 2
  const ribbonVGone = step >= 3
  const ribbonHLoose = step >= 4
  const ribbonHGone = step >= 5
  const lidGlow = step >= 6
  const lidLifted = step >= 7
  const sidesFall = step >= 8
  const allFall = step >= 9

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* Box body */}
      <motion.div
        animate={
          step === 0
            ? { rotate: [0, -3, 3, -3, 3, 0] }
            : sidesFall
            ? { scaleX: 0, opacity: 0 }
            : {}
        }
        transition={
          step === 0
            ? { duration: 0.8, repeat: Infinity, repeatType: 'mirror' as const }
            : { duration: 0.5 }
        }
        className={`absolute ${boxColor} rounded-lg w-28 h-24 bottom-10`}
      />

      {/* Left side panel */}
      {sidesFall && !allFall && (
        <motion.div
          initial={{ x: -14, rotateY: 0 }}
          animate={{ rotateY: 90, x: -40, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className={`absolute ${boxColor} rounded-lg w-14 h-24 bottom-10`}
          style={{ transformOrigin: 'left center' }}
        />
      )}

      {/* Right side panel */}
      {sidesFall && !allFall && (
        <motion.div
          initial={{ x: 14, rotateY: 0 }}
          animate={{ rotateY: -90, x: 40, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className={`absolute ${boxColor} rounded-lg w-14 h-24 bottom-10`}
          style={{ transformOrigin: 'right center' }}
        />
      )}

      {/* Front/back fall + tissue paper */}
      {allFall && (
        <>
          <motion.div
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className={`absolute ${boxColor} rounded-lg w-28 h-24 bottom-10`}
            style={{ transformOrigin: 'bottom center' }}
          />
          {/* Tissue paper puffs */}
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={`tissue-${i}`}
              initial={{ y: 0, x: 0, opacity: 0.9, scale: 0.5 }}
              animate={{
                y: -(30 + i * 12),
                x: (i - 2) * 20,
                opacity: 0,
                scale: 1.5,
              }}
              transition={{ duration: 0.8, delay: i * 0.08 }}
              className="absolute bottom-20 w-5 h-5 bg-tertiary/50 rounded-full"
            />
          ))}
        </>
      )}

      {/* Vertical ribbon */}
      {!ribbonVGone && (
        <motion.div
          animate={
            ribbonVLoose
              ? { rotate: 15, x: 10, opacity: 0.7 }
              : {}
          }
          transition={{ duration: 0.5 }}
          className={`absolute ${ribbonColor} w-4 h-24 bottom-10 rounded-sm`}
        />
      )}
      {ribbonVGone && step === 3 && (
        <motion.div
          initial={{ x: 0, opacity: 1 }}
          animate={{ x: 100, opacity: 0, rotate: 30 }}
          transition={{ duration: 0.5 }}
          className={`absolute ${ribbonColor} w-4 h-24 bottom-10 rounded-sm`}
        />
      )}

      {/* Horizontal ribbon */}
      {!ribbonHGone && (
        <motion.div
          animate={
            ribbonHLoose
              ? { rotate: -10, y: -5, opacity: 0.7 }
              : {}
          }
          transition={{ duration: 0.5 }}
          className={`absolute ${ribbonColor} w-28 h-4 bottom-[50px] rounded-sm`}
        />
      )}
      {ribbonHGone && step === 5 && (
        <motion.div
          initial={{ x: 0, opacity: 1 }}
          animate={{ x: -100, opacity: 0, rotate: -20 }}
          transition={{ duration: 0.5 }}
          className={`absolute ${ribbonColor} w-28 h-4 bottom-[50px] rounded-sm`}
        />
      )}

      {/* Lid */}
      {!allFall && (
        <motion.div
          animate={
            lidLifted
              ? { y: -50, rotate: -25, opacity: 0 }
              : lidGlow
              ? { boxShadow: '0 0 25px rgba(255,217,61,0.8)' }
              : {}
          }
          transition={{ duration: 0.6 }}
          className={`absolute ${lidColor} rounded-lg w-32 h-8 bottom-[120px] shadow-md ${
            lidGlow && !lidLifted ? 'ring-2 ring-tertiary/60' : ''
          }`}
        />
      )}
    </div>
  )
}

// ── Love Letter Visuals ───────────────────────────────────────────

function LoveLetterStep({ step }: { step: number }) {
  const envelopeIn = step >= 1
  const sealGlow = step >= 2
  const sealBroken = step >= 3
  const flapStart = step >= 4
  const flapOpen = step >= 5
  const letterPeek = step >= 6
  const letterHalf = step >= 7
  const letterFull = step >= 8

  return (
    <div className="relative w-48 h-56 flex items-center justify-center">
      {/* Envelope body */}
      <motion.div
        initial={step === 0 ? { y: 200, opacity: 0 } : undefined}
        animate={
          envelopeIn
            ? letterFull
              ? { y: 60, opacity: 0, scale: 0.8 }
              : { y: 0, opacity: 1 }
            : step === 0
            ? { y: 200, opacity: 0 }
            : {}
        }
        transition={{ duration: 0.6 }}
        className="absolute w-40 h-28 bg-primary/20 rounded-2xl border-2 border-primary/40 bottom-14"
      >
        {/* Wax seal */}
        {!sealBroken && (
          <motion.div
            animate={sealGlow ? { boxShadow: '0 0 20px rgba(255,107,107,0.7)', scale: 1.1 } : {}}
            transition={{ duration: 0.4 }}
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-md"
          >
            <span className="text-white text-xs font-display">S</span>
          </motion.div>
        )}
        {sealBroken && step === 3 && (
          <>
            <motion.div
              initial={{ x: 0, opacity: 1 }}
              animate={{ x: -20, y: -15, rotate: -30, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute -top-3 left-[calc(50%-8px)] w-4 h-8 bg-primary rounded-l-full"
            />
            <motion.div
              initial={{ x: 0, opacity: 1 }}
              animate={{ x: 20, y: -15, rotate: 30, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute -top-3 left-1/2 w-4 h-8 bg-primary rounded-r-full"
            />
          </>
        )}

        {/* Flap (triangle) */}
        <motion.div
          animate={
            flapOpen
              ? { rotateX: 180 }
              : flapStart
              ? { rotateX: 60 }
              : {}
          }
          transition={{ duration: 0.5 }}
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: '80px solid transparent',
            borderRight: '80px solid transparent',
            borderBottom: '40px solid rgb(255 107 107 / 0.3)',
            transformOrigin: 'bottom center',
          }}
        />
      </motion.div>

      {/* Letter */}
      {(letterPeek || letterHalf || letterFull) && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={
            letterFull
              ? { y: -10, opacity: 1, scale: 1 }
              : letterHalf
              ? { y: 0, opacity: 1 }
              : { y: 20, opacity: 0.8 }
          }
          transition={{ duration: 0.5 }}
          className="absolute w-36 bg-white rounded-xl shadow-card p-3 bottom-20 border border-surface"
        >
          <div className="w-full h-2 bg-muted/20 rounded mb-1.5" />
          <div className="w-3/4 h-2 bg-muted/20 rounded mb-1.5" />
          <div className="w-5/6 h-2 bg-muted/20 rounded" />
        </motion.div>
      )}
    </div>
  )
}

// ── Balloon Visuals ───────────────────────────────────────────────

const BALLOON_COLORS = [
  'bg-primary',
  'bg-secondary',
  'bg-tertiary',
  'bg-success',
  'bg-primary/70',
]

function BalloonStep({ step }: { step: number }) {
  const poppedAt = [3, 5, 6, 7, 8] // steps at which balloons 0-4 pop
  const lastDescends = step >= 9

  return (
    <div className="relative w-56 h-56 flex items-center justify-center">
      {BALLOON_COLORS.map((color, i) => {
        const popStep = poppedAt[i]
        const isPopped = step >= popStep
        const isPopping = step === popStep
        const wobbleStep = popStep - 1
        const isWobbling = step === wobbleStep
        const isLast = i === BALLOON_COLORS.length - 1

        if (isPopped && !isPopping && !isLast) return null
        if (isLast && lastDescends) {
          // Last balloon descends with card
          return (
            <motion.div
              key={i}
              animate={{ y: 30 }}
              transition={{ duration: 0.8, type: 'spring' }}
              className="absolute flex flex-col items-center"
              style={{ left: `${20 + i * 15}%` }}
            >
              <div className={`${color} w-10 h-12 rounded-full`} />
              <div className="w-px h-8 bg-muted/40" />
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="w-12 h-8 bg-white rounded-lg shadow-card flex items-center justify-center"
              >
                <span className="text-xs">💌</span>
              </motion.div>
            </motion.div>
          )
        }

        if (isPopping) {
          // Particle burst
          return (
            <div
              key={i}
              className="absolute"
              style={{ left: `${20 + i * 15}%`, top: '30%' }}
            >
              {[0, 1, 2, 3, 4, 5].map((p) => (
                <motion.div
                  key={p}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{
                    x: Math.cos((p * 60 * Math.PI) / 180) * 40,
                    y: Math.sin((p * 60 * Math.PI) / 180) * 40,
                    scale: 0,
                    opacity: 0,
                  }}
                  transition={{ duration: 0.5 }}
                  className={`absolute w-2 h-2 ${color} rounded-full`}
                />
              ))}
            </div>
          )
        }

        if (isPopped) return null

        // Normal / wobbling balloon
        return (
          <motion.div
            key={i}
            initial={step === 0 ? { y: 200, opacity: 0 } : undefined}
            animate={
              step >= 1
                ? {
                    y: isWobbling ? [-5, 5, -5] : 0,
                    x: isWobbling ? [-4, 4, -4] : 0,
                    opacity: 1,
                  }
                : { y: 200, opacity: 0 }
            }
            transition={
              isWobbling
                ? { duration: 0.4, repeat: Infinity, repeatType: 'mirror' as const }
                : { duration: 0.6, delay: i * 0.1 }
            }
            className="absolute flex flex-col items-center"
            style={{ left: `${20 + i * 15}%`, top: '15%' }}
          >
            <div className={`${color} w-10 h-12 rounded-full shadow-sm`} />
            <div className="w-px h-10 bg-muted/40" />
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Fortune Cookie Visuals ────────────────────────────────────────

function FortuneCookieStep({ step }: { step: number }) {
  const wobble = step >= 2
  const shakeMore = step >= 3
  const crackLine = step >= 4
  const crackDeep = step >= 5
  const crackOpen = step >= 6
  const paperEmerges = step >= 7

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* Plate */}
      <motion.div
        initial={step === 0 ? { x: -150, opacity: 0 } : undefined}
        animate={
          step >= 1
            ? { x: 0, opacity: 1 }
            : step === 0
            ? { x: -150, opacity: 0 }
            : {}
        }
        transition={{ duration: 0.5 }}
        className="absolute bottom-8 w-36 h-6 bg-surface rounded-full border border-muted/20"
      />

      {/* Cookie */}
      {!crackOpen ? (
        <motion.div
          animate={
            shakeMore
              ? { rotate: [0, -8, 8, -8, 8, 0] }
              : wobble
              ? { rotate: [0, -4, 4, -4, 4, 0] }
              : {}
          }
          transition={{
            duration: shakeMore ? 0.4 : 0.6,
            repeat: Infinity,
            repeatType: 'mirror' as const,
          }}
          className="absolute bottom-10 flex items-center justify-center"
        >
          {/* Cookie shape: two overlapping ovals */}
          <div className="relative w-24 h-16">
            <div className="absolute inset-0 bg-amber-300 rounded-[50%] shadow-md" />
            <div className="absolute top-1 left-2 right-2 bottom-1 bg-amber-200 rounded-[50%]" />
            {/* Crack line */}
            {crackLine && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
                className={`absolute top-1/2 left-1/4 right-1/4 h-0.5 ${
                  crackDeep ? 'bg-amber-700 h-1 shadow-glow' : 'bg-amber-600'
                }`}
                style={{ transformOrigin: 'center' }}
              />
            )}
          </div>
        </motion.div>
      ) : (
        <>
          {/* Left half */}
          <motion.div
            initial={{ x: 0, rotate: 0 }}
            animate={{ x: -30, rotate: -25, y: 10 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-10"
          >
            <div className="w-12 h-16 bg-amber-300 rounded-l-[50%] shadow-md" />
          </motion.div>
          {/* Right half */}
          <motion.div
            initial={{ x: 0, rotate: 0 }}
            animate={{ x: 30, rotate: 25, y: 10 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-10"
          >
            <div className="w-12 h-16 bg-amber-300 rounded-r-[50%] shadow-md" />
          </motion.div>

          {/* Fortune paper */}
          {paperEmerges && (
            <motion.div
              initial={{ y: 10, scaleY: 0, opacity: 0 }}
              animate={{ y: -10, scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="absolute bottom-16 w-28 bg-white rounded-lg shadow-card p-2 border border-tertiary/30"
              style={{ transformOrigin: 'bottom center' }}
            >
              <div className="w-full h-1.5 bg-muted/20 rounded mb-1" />
              <div className="w-3/4 h-1.5 bg-muted/20 rounded" />
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}

// ── Final Reveal ──────────────────────────────────────────────────

function RevealContent({
  gift,
  onClose,
}: {
  gift: InteractiveGiftRevealProps['gift']
  onClose: () => void
}) {
  const emoji = GIFT_EMOJI[gift.gift_type]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: 'spring' }}
      className="flex flex-col items-center gap-4 w-full max-w-sm px-4"
    >
      {/* Sparkle burst */}
      <div className="relative">
        {['✨', '🌟', '⭐', '🎊', '💫', '🎉'].map((sparkle, i) => (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: Math.cos((i * 60 * Math.PI) / 180) * 70,
              y: Math.sin((i * 60 * Math.PI) / 180) * 70,
              opacity: [0, 1, 1, 0],
              scale: [0, 1.5, 1.5, 0],
            }}
            transition={{ duration: 1.2, delay: i * 0.08 }}
            className="absolute text-xl"
          >
            {sparkle}
          </motion.span>
        ))}
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ duration: 0.5 }}
          className="text-7xl block"
        >
          {emoji}
        </motion.span>
      </div>

      {/* Photo */}
      {gift.photo_url && (
        <motion.img
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          src={gift.photo_url}
          alt="Gift photo"
          className="w-48 h-48 object-cover rounded-3xl shadow-medium border-4 border-white"
        />
      )}

      {/* Message card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-3xl p-5 w-full shadow-card"
      >
        <p className="font-body text-dark text-base leading-relaxed text-center">
          &ldquo;{gift.message}&rdquo;
        </p>
      </motion.div>

      {/* Date */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-xs text-muted font-body"
      >
        {format(parseISO(gift.created_at), 'MMMM d, yyyy')}
      </motion.p>

      {/* Close button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        whileTap={{ scale: 0.96 }}
        onClick={onClose}
        className="gradient-brand text-white font-body font-bold rounded-2xl px-8 py-4 text-lg shadow-soft w-full"
      >
        Close
      </motion.button>
    </motion.div>
  )
}

// ── Progress Dots ─────────────────────────────────────────────────

function ProgressDots({
  current,
  total,
}: {
  current: number
  total: number
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            scale: i === current ? 1.3 : 1,
            backgroundColor: i <= current ? '#FF6B6B' : '#E5E5EA',
          }}
          transition={{ duration: 0.2 }}
          className="w-2 h-2 rounded-full"
        />
      ))}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────

export default function InteractiveGiftReveal({
  gift,
  onClose,
}: InteractiveGiftRevealProps) {
  const [step, setStep] = useState(0)
  const totalSteps = TOTAL_STEPS[gift.gift_type]
  const isFinalStep = step >= totalSteps - 1

  const advance = useCallback(() => {
    if (!isFinalStep) {
      setStep((prev) => prev + 1)
    }
  }, [isFinalStep])

  const renderGiftVisual = () => {
    switch (gift.gift_type) {
      case 'gift_box':
        return <GiftBoxStep step={step} />
      case 'love_letter':
        return <LoveLetterStep step={step} />
      case 'balloon':
        return <BalloonStep step={step} />
      case 'fortune_cookie':
        return <FortuneCookieStep step={step} />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-dark/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
      onClick={!isFinalStep ? advance : undefined}
    >
      <div className="flex-1 flex items-center justify-center w-full px-6">
        <AnimatePresence mode="wait">
          {isFinalStep ? (
            <RevealContent key="reveal" gift={gift} onClose={onClose} />
          ) : (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderGiftVisual()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom area: progress + tap hint */}
      <div className="pb-10 flex flex-col items-center gap-3">
        <ProgressDots current={step} total={totalSteps} />
        {!isFinalStep && (
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-white/70 font-body text-sm"
          >
            Tap to continue
          </motion.p>
        )}
      </div>
    </motion.div>
  )
}
