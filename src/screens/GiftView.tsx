import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { GiftBoxInteractive } from './Gifts'
import { format, parseISO } from 'date-fns'

type GiftType = 'gift_box' | 'love_letter' | 'balloon' | 'fortune_cookie'

interface PublicGift {
  id: string
  gift_type: GiftType
  message: string
  photo_url: string | null
  created_at: string
}

const GIFT_INFO: Record<GiftType, { emoji: string; label: string }> = {
  gift_box: { emoji: '🎁', label: 'Gift Box' },
  love_letter: { emoji: '💌', label: 'Love Letter' },
  balloon: { emoji: '🎈', label: 'Balloons' },
  fortune_cookie: { emoji: '🥠', label: 'Fortune Cookie' },
}

type Stage = 'loading' | 'error' | 'teaser' | 'opening' | 'opened'

export default function GiftView() {
  const { giftId } = useParams<{ giftId: string }>()
  const navigate = useNavigate()
  const [gift, setGift] = useState<PublicGift | null>(null)
  const [stage, setStage] = useState<Stage>('loading')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!giftId) { setStage('error'); return }
    const fetchGift = async () => {
      const { data, error } = await supabase
        .from('gifts')
        .select('id, gift_type, message, photo_url, created_at')
        .eq('id', giftId)
        .single()
      if (error || !data) {
        setStage('error')
      } else {
        setGift(data as PublicGift)
        setStage('teaser')
      }
    }
    fetchGift()
  }, [giftId])

  const info = gift ? GIFT_INFO[gift.gift_type] : null

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center px-6 py-10">
      <AnimatePresence mode="wait">
        {stage === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-6xl"
            >
              🎁
            </motion.div>
            <p className="text-white/70 font-body text-sm">Loading your gift…</p>
          </motion.div>
        )}

        {stage === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="text-5xl mb-4">😔</div>
            <p className="font-display text-xl text-white mb-2">Gift not found</p>
            <p className="text-white/60 font-body text-sm mb-6">
              This link may be invalid or the gift was removed.
            </p>
            <button
              onClick={() => navigate('/')}
              className="text-primary font-body font-bold text-sm underline"
            >
              Go to Surprise Mine
            </button>
          </motion.div>
        )}

        {stage === 'teaser' && gift && info && (
          <motion.div
            key="teaser"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center text-center gap-6 w-full max-w-sm"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="text-8xl"
            >
              {info.emoji}
            </motion.div>
            <div>
              <p className="font-display text-3xl text-white mb-2">Someone sent you a gift!</p>
              <p className="text-white/60 font-body text-sm">
                {info.label} · {format(parseISO(gift.created_at), 'MMM d, yyyy')}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => setStage('opening')}
              className="w-full py-4 rounded-2xl font-body font-bold text-white text-lg gradient-brand shadow-medium"
            >
              Open Your Gift 🎁
            </motion.button>
          </motion.div>
        )}

        {stage === 'opening' && gift && (
          <motion.div
            key="opening"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm flex flex-col items-center"
          >
            <GiftBoxInteractive
              photoUrl={gift.photo_url ?? undefined}
              onOpened={() => setStage('opened')}
            />
          </motion.div>
        )}

        {stage === 'opened' && gift && (
          <motion.div
            key="opened"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm flex flex-col gap-5"
          >
            {/* Message card */}
            <div className="bg-white rounded-3xl p-6 shadow-medium text-center">
              <p className="font-display text-2xl text-dark mb-4">🎁 Your gift!</p>
              <div className="bg-surface rounded-2xl p-4 mb-4">
                <p className="font-body text-dark text-base leading-relaxed">"{gift.message}"</p>
              </div>
              {gift.photo_url && (
                <img
                  src={gift.photo_url}
                  alt="Gift"
                  className="rounded-2xl w-full max-h-56 object-cover"
                />
              )}
              <p className="text-xs text-muted font-body mt-3">
                {format(parseISO(gift.created_at), 'MMMM d, yyyy')}
              </p>
            </div>

            {/* Sign up prompt */}
            <div className="bg-white/10 border border-white/20 rounded-3xl p-5 text-center flex flex-col gap-3">
              <p className="font-display text-xl text-white">💝 Loved this?</p>
              <p className="font-body text-white/70 text-sm">
                Create your own surprise gifts and send them to anyone — for free.
              </p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/signup')}
                className="w-full py-3 rounded-2xl font-body font-bold text-white gradient-brand"
              >
                Sign Up Free
              </motion.button>
              <button
                onClick={() => navigate('/signin')}
                className="text-white/60 font-body text-sm underline"
              >
                Already have an account? Sign in
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
