import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Gift, GiftType } from '../types'
import { format, parseISO } from 'date-fns'
import Button from '../components/ui/Button'

const GIFT_TYPES: { type: GiftType; emoji: string; label: string }[] = [
  { type: 'gift_box', emoji: '🎁', label: 'Gift Box' },
  { type: 'love_letter', emoji: '💌', label: 'Love Letter' },
  { type: 'balloon', emoji: '🎈', label: 'Balloons' },
  { type: 'fortune_cookie', emoji: '🥠', label: 'Fortune Cookie' },
]

export default function GiftView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [gift, setGift] = useState<Gift | null>(null)
  const [senderName, setSenderName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id || !user) return
    loadGift()
  }, [id, user])

  const loadGift = async () => {
    const { data, error: fetchError } = await supabase
      .from('gifts')
      .select('*, from_profile:from_user_id(name)')
      .eq('id', id)
      .single()

    if (fetchError || !data) {
      setError('Gift not found.')
      setLoading(false)
      return
    }

    if (data.from_user_id !== user!.id && data.to_user_id !== user!.id) {
      setError('You don\'t have access to this gift.')
      setLoading(false)
      return
    }

    setGift(data)
    setSenderName((data.from_profile as any)?.name ?? 'your partner')
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <span className="text-5xl">💝</span>
        </motion.div>
      </div>
    )
  }

  if (error || !gift) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">💔</div>
        <p className="font-body font-bold text-dark mb-2">{error || 'Something went wrong'}</p>
        <Button variant="gradient" onClick={() => navigate('/gifts')}>Back to Gifts</Button>
      </div>
    )
  }

  const giftInfo = GIFT_TYPES.find(g => g.type === gift.gift_type)
  const isFromMe = gift.from_user_id === user?.id

  return (
    <div className="min-h-screen bg-background px-4 pt-6 pb-6 flex flex-col">
      {/* Back button */}
      <button
        onClick={() => navigate('/gifts')}
        className="w-10 h-10 rounded-2xl bg-white shadow-card flex items-center justify-center text-xl mb-6"
      >
        ←
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col items-center justify-center gap-6"
      >
        {/* Gift emoji */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-[100px]"
        >
          {giftInfo?.emoji}
        </motion.div>

        {/* Gift details */}
        <div className="w-full max-w-sm">
          <div className="rounded-3xl gradient-brand p-5 text-white text-center mb-4">
            <p className="font-body font-bold text-white/80 text-xs uppercase tracking-wider mb-1">
              {giftInfo?.label}
            </p>
            <p className="font-display text-xl text-white mb-1">
              {isFromMe ? `A gift you sent 💝` : `A gift from ${senderName} 💝`}
            </p>
            <p className="text-white/70 text-xs font-body">
              {format(parseISO(gift.created_at), 'MMMM d, yyyy · h:mm a')}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-soft">
            <p className="text-xs text-muted font-body font-bold uppercase tracking-wider mb-2">Message</p>
            <p className="font-body text-dark text-base leading-relaxed">"{gift.message}"</p>
          </div>

          {!gift.opened && !isFromMe && (
            <p className="text-center text-xs text-muted font-body mt-3">
              Open this gift from your Gifts inbox!
            </p>
          )}
          {gift.opened && (
            <p className="text-center text-xs text-success font-body font-bold mt-3">
              ✅ Opened
            </p>
          )}
        </div>

        <Button variant="gradient" size="lg" onClick={() => navigate('/gifts')} className="w-full max-w-sm">
          Back to Gifts 🎁
        </Button>
      </motion.div>
    </div>
  )
}
