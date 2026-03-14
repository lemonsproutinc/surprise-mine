import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { format, parseISO } from 'date-fns'
import InteractiveGiftReveal from '../components/InteractiveGiftReveal'

type GiftType = 'gift_box' | 'love_letter' | 'balloon' | 'fortune_cookie'

interface PublicGift {
  id: string
  gift_type: GiftType
  message: string
  photo_url?: string | null
  created_at: string
}

const GIFT_EMOJI: Record<GiftType, string> = {
  gift_box: '\u{1F381}',
  love_letter: '\u{1F48C}',
  balloon: '\u{1F388}',
  fortune_cookie: '\u{1F960}',
}

export default function GiftOpen() {
  const { token } = useParams<{ token: string }>()
  const [gift, setGift] = useState<PublicGift | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showReveal, setShowReveal] = useState(false)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (!token) {
      setError(true)
      setLoading(false)
      return
    }
    loadGift(token)
  }, [token])

  const loadGift = async (shareToken: string) => {
    setLoading(true)
    setError(false)

    const { data, error: fetchError } = await supabase
      .from('gifts')
      .select('id, gift_type, message, photo_url, created_at')
      .eq('share_token', shareToken)
      .single()

    if (fetchError || !data) {
      setError(true)
      setLoading(false)
      return
    }

    setGift(data as PublicGift)
    setLoading(false)
    // Automatically start the reveal
    setShowReveal(true)
  }

  const handleRevealClose = () => {
    setShowReveal(false)
    setRevealed(true)
  }

  // ── Loading ──

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span className="text-6xl">💝</span>
        </motion.div>
        <p className="font-body text-muted text-sm mt-4">Loading your surprise...</p>
      </div>
    )
  }

  // ── Error / Not Found ──

  if (error || !gift) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="px-4 pt-6 pb-4 text-center">
          <h1 className="font-display text-xl text-dark">Surprise Mine 💝</h1>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span className="text-6xl block mb-4">😢</span>
            <h2 className="font-display text-2xl text-dark mb-2">Gift Not Found</h2>
            <p className="font-body text-muted text-sm max-w-xs">
              This gift link may have expired or doesn&apos;t exist. Double-check the URL and try again.
            </p>
            <Link
              to="/"
              className="inline-block mt-6 gradient-brand text-white font-body font-bold rounded-2xl px-6 py-3 shadow-soft"
            >
              Go to Surprise Mine
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  // ── Interactive Reveal Overlay ──

  if (showReveal) {
    return (
      <InteractiveGiftReveal
        gift={gift}
        onClose={handleRevealClose}
      />
    )
  }

  // ── Post-Reveal Content ──

  const emoji = GIFT_EMOJI[gift.gift_type]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-4 pt-6 pb-2 text-center">
        <h1 className="font-display text-xl text-dark">Surprise Mine 💝</h1>
        <p className="font-body text-muted text-xs mt-0.5">
          A little surprise, just for you
        </p>
      </header>

      {/* Gift Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm flex flex-col items-center gap-5"
        >
          {/* Emoji */}
          <span className="text-6xl">{emoji}</span>

          {/* Photo */}
          {gift.photo_url && (
            <img
              src={gift.photo_url}
              alt="Gift photo"
              className="w-56 h-56 object-cover rounded-3xl shadow-medium border-4 border-white"
            />
          )}

          {/* Message card */}
          <div className="bg-white rounded-3xl p-6 w-full shadow-card">
            <p className="font-body text-dark text-base leading-relaxed text-center">
              &ldquo;{gift.message}&rdquo;
            </p>
            <p className="text-xs text-muted font-body text-center mt-3">
              {format(parseISO(gift.created_at), 'MMMM d, yyyy')}
            </p>
          </div>

          {/* Replay button */}
          {revealed && (
            <button
              onClick={() => setShowReveal(true)}
              className="font-body text-sm text-secondary font-bold underline underline-offset-2"
            >
              Replay the unwrapping
            </button>
          )}
        </motion.div>
      </div>

      {/* Signup CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-6 pb-8"
      >
        <div className="bg-white rounded-3xl p-5 shadow-card max-w-sm mx-auto text-center">
          <span className="text-3xl block mb-2">💝</span>
          <p className="font-display text-lg text-dark mb-1">
            Loved this?
          </p>
          <p className="font-body text-muted text-sm mb-4">
            Send your own surprise to someone special
          </p>
          <Link
            to="/signup"
            className="inline-block gradient-brand text-white font-body font-bold rounded-2xl px-8 py-3 text-base shadow-soft w-full"
          >
            Create Free Account
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
