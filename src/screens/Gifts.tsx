import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Gift, GiftType } from '../types'
import { awardHearts, HEARTS } from '../lib/hearts'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Textarea } from '../components/ui/Input'
import { format, parseISO } from 'date-fns'

const GIFT_TYPES: { type: GiftType; emoji: string; label: string; desc: string; color: string }[] = [
  { type: 'gift_box', emoji: '🎁', label: 'Gift Box', desc: 'Unwrap with a ribbon pop', color: 'from-primary/20 to-primary/5' },
  { type: 'love_letter', emoji: '💌', label: 'Love Letter', desc: 'An envelope that unfolds', color: 'from-secondary/20 to-secondary/5' },
  { type: 'balloon', emoji: '🎈', label: 'Balloons', desc: 'Float up to reveal your message', color: 'from-tertiary/20 to-tertiary/5' },
  { type: 'fortune_cookie', emoji: '🥠', label: 'Fortune Cookie', desc: 'Crack it open!', color: 'from-success/20 to-success/5' },
]

// Gift opening animations
function GiftAnimation({ gift, onClose }: { gift: Gift; onClose: () => void }) {
  const [stage, setStage] = useState<'closed' | 'opening' | 'open'>('closed')

  useEffect(() => {
    const t1 = setTimeout(() => setStage('opening'), 400)
    const t2 = setTimeout(() => setStage('open'), 1600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const animations: Record<GiftType, JSX.Element> = {
    gift_box: (
      <div className="relative flex flex-col items-center">
        <motion.div
          animate={stage === 'opening' ? { y: -60, rotate: -15, opacity: 0 } : {}}
          transition={{ duration: 0.8, type: 'spring' }}
          className="text-[80px] select-none"
        >
          🎁
        </motion.div>
        {stage === 'opening' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.3, 1], opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {['🎊', '✨', '🎉', '⭐', '🌟'].map((e, i) => (
              <motion.span
                key={i}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: (Math.cos((i * 72 * Math.PI) / 180)) * 70,
                  y: (Math.sin((i * 72 * Math.PI) / 180)) * 70,
                  opacity: [1, 1, 0],
                  scale: [1, 1.5, 0],
                }}
                transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                className="absolute text-2xl"
              >
                {e}
              </motion.span>
            ))}
          </motion.div>
        )}
      </div>
    ),
    love_letter: (
      <div className="flex flex-col items-center">
        <motion.div
          animate={stage === 'opening' ? { rotateX: 180 } : {}}
          transition={{ duration: 1 }}
          className="text-[80px] select-none"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {stage === 'open' ? '💌' : '✉️'}
        </motion.div>
        {stage === 'opening' && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-2 bg-white rounded-xl p-2 shadow-card text-xs text-muted font-body text-center"
            style={{ transformOrigin: 'top' }}
          >
            📜 unfolding...
          </motion.div>
        )}
      </div>
    ),
    balloon: (
      <div className="relative flex flex-col items-center h-32">
        {['🎈', '🎀', '🎈'].map((e, i) => (
          <motion.span
            key={i}
            initial={{ y: 0 }}
            animate={stage !== 'closed' ? { y: -120, opacity: [1, 1, 0] } : {}}
            transition={{ duration: 1.2, delay: i * 0.2, ease: 'easeOut' }}
            className="absolute text-5xl"
            style={{ left: `${30 + i * 20}%` }}
          >
            {e}
          </motion.span>
        ))}
      </div>
    ),
    fortune_cookie: (
      <div className="flex flex-col items-center">
        <motion.div
          animate={stage === 'opening' ? { rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.2, 0.9, 1.1, 1] } : {}}
          transition={{ duration: 1 }}
          className="text-[80px] select-none"
        >
          {stage === 'open' ? '🥠' : '🥠'}
        </motion.div>
        {stage === 'opening' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 5, -5, 0] }}
            transition={{ delay: 0.8 }}
            className="mt-2 text-3xl"
          >
            ✨
          </motion.div>
        )}
      </div>
    ),
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-dark/60 backdrop-blur-sm z-50 flex items-center justify-center px-6"
      onClick={stage === 'open' ? onClose : undefined}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-medium"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative min-h-[120px] flex items-center justify-center w-full">
            {animations[gift.gift_type]}
          </div>

          <AnimatePresence>
            {stage === 'open' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full text-center"
              >
                <p className="font-display text-2xl text-dark mb-1">
                  {GIFT_TYPES.find(g => g.type === gift.gift_type)?.emoji} A gift for you!
                </p>
                <div className="bg-surface rounded-2xl p-4 mt-3">
                  <p className="font-body text-dark text-base leading-relaxed">"{gift.message}"</p>
                </div>
                <p className="text-xs text-muted font-body mt-2">
                  {format(parseISO(gift.created_at), 'MMM d, yyyy')}
                </p>
                <Button
                  size="lg"
                  fullWidth
                  variant="gradient"
                  onClick={onClose}
                  className="mt-4"
                >
                  Close 💝
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {stage !== 'open' && (
            <p className="text-muted font-body text-sm animate-pulse">Opening your gift…</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Gifts() {
  const { user, couple, partnerProfile, refreshHearts } = useAuth()

  const [tab, setTab] = useState<'send' | 'inbox'>('inbox')
  const [inbox, setInbox] = useState<Gift[]>([])
  const [sent, setSent] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)
  const [openingGift, setOpeningGift] = useState<Gift | null>(null)

  // Send form
  const [selectedType, setSelectedType] = useState<GiftType>('gift_box')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sentSuccess, setSentSuccess] = useState(false)

  const partnerName = partnerProfile?.name?.split(' ')[0] ?? 'your partner'

  useEffect(() => {
    if (!user) return
    loadGifts()
  }, [user])

  const loadGifts = async () => {
    if (!user) return
    setLoading(true)

    const { data: inboxData } = await supabase
      .from('gifts')
      .select('*')
      .eq('to_user_id', user.id)
      .order('created_at', { ascending: false })

    const { data: sentData } = await supabase
      .from('gifts')
      .select('*')
      .eq('from_user_id', user.id)
      .order('created_at', { ascending: false })

    setInbox(inboxData ?? [])
    setSent(sentData ?? [])
    setLoading(false)
  }

  const handleSend = async () => {
    if (!message.trim() || !couple || !user || !partnerProfile) return
    setSending(true)

    const { error } = await supabase.from('gifts').insert({
      from_user_id: user.id,
      to_user_id: partnerProfile.id,
      couple_id: couple.id,
      gift_type: selectedType,
      message: message.trim(),
    })

    if (!error) {
      await awardHearts(user.id, HEARTS.SEND_GIFT, 'Sent a virtual gift')
      await refreshHearts()
      setSentSuccess(true)
      setMessage('')
      setTimeout(() => setSentSuccess(false), 3000)
      loadGifts()
    }

    setSending(false)
  }

  const handleOpenGift = async (gift: Gift) => {
    if (gift.opened) return
    setOpeningGift(gift)

    // Mark as opened
    await supabase.from('gifts').update({ opened: true }).eq('id', gift.id)
    setInbox(prev => prev.map(g => g.id === gift.id ? { ...g, opened: true } : g))
  }

  const unopenedCount = inbox.filter(g => !g.opened).length

  return (
    <div className="min-h-screen bg-background px-4 pt-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl text-dark">Gifts 🎁</h1>
          <p className="text-xs text-muted font-body">
            {unopenedCount > 0 ? `${unopenedCount} unopened gift${unopenedCount > 1 ? 's' : ''} waiting!` : 'Spread some love'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface rounded-2xl p-1 mb-5">
        {(['inbox', 'send'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl font-body font-bold text-sm transition-all capitalize relative ${
              tab === t ? 'bg-white shadow-card text-dark' : 'text-muted'
            }`}
          >
            {t === 'inbox' ? `Inbox ${unopenedCount > 0 ? `(${unopenedCount})` : ''}` : `Send Gift`}
          </button>
        ))}
      </div>

      {tab === 'inbox' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
          {!couple ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">💌</div>
              <p className="font-body font-bold text-dark">Pair up first!</p>
              <p className="text-sm text-muted font-body mt-1">You need a partner to exchange gifts.</p>
            </div>
          ) : inbox.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🎁</div>
              <p className="font-body font-bold text-dark">No gifts yet!</p>
              <p className="text-sm text-muted font-body mt-1">
                Hint to {partnerName} that you'd love a surprise 😉
              </p>
            </div>
          ) : (
            inbox.map(gift => {
              const giftInfo = GIFT_TYPES.find(g => g.type === gift.gift_type)
              return (
                <motion.div
                  key={gift.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card
                    onClick={!gift.opened ? () => handleOpenGift(gift) : undefined}
                    className={!gift.opened ? 'border-2 border-primary/30' : 'opacity-75'}
                  >
                    <div className="flex items-center gap-3">
                      <motion.span
                        animate={!gift.opened ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-3xl"
                      >
                        {giftInfo?.emoji}
                      </motion.span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-body font-bold text-dark text-sm">{giftInfo?.label}</p>
                          {!gift.opened && (
                            <span className="bg-primary/10 text-primary text-[10px] font-body font-bold px-2 py-0.5 rounded-full">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted font-body">
                          {format(parseISO(gift.created_at), 'MMM d, h:mm a')}
                        </p>
                        {gift.opened && (
                          <p className="text-xs text-dark font-body mt-1 line-clamp-1 italic">
                            "{gift.message}"
                          </p>
                        )}
                      </div>
                      {!gift.opened && (
                        <span className="text-primary font-body font-bold text-sm">Tap to open →</span>
                      )}
                      {gift.opened && <span className="text-muted text-sm">✓</span>}
                    </div>
                  </Card>
                </motion.div>
              )
            })
          )}
        </motion.div>
      )}

      {tab === 'send' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
          {!couple ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">💌</div>
              <p className="font-body font-bold text-dark">Pair up first!</p>
            </div>
          ) : (
            <>
              {sentSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-success/15 border border-success/30 p-3 text-center"
                >
                  <p className="font-body font-bold text-success text-sm">
                    🎁 Gift sent to {partnerName}! +{HEARTS.SEND_GIFT} 💝
                  </p>
                </motion.div>
              )}

              {/* Gift type selector */}
              <div>
                <p className="text-xs font-body font-bold text-muted uppercase tracking-wider mb-3">Gift Type</p>
                <div className="grid grid-cols-2 gap-2">
                  {GIFT_TYPES.map(({ type, emoji, label, desc, color }) => (
                    <motion.button
                      key={type}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setSelectedType(type)}
                      className={`flex flex-col items-start gap-1 p-3 rounded-2xl border-2 bg-gradient-to-br ${color} text-left transition-all ${
                        selectedType === type ? 'border-primary shadow-soft' : 'border-transparent'
                      }`}
                    >
                      <span className="text-3xl">{emoji}</span>
                      <p className="font-body font-bold text-dark text-sm">{label}</p>
                      <p className="text-[11px] text-muted font-body">{desc}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <Textarea
                label={`Your message to ${partnerName} 💌`}
                placeholder="Write something from the heart… it doesn't have to be perfect 💭"
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
              />

              <Button
                size="lg"
                fullWidth
                variant="gradient"
                loading={sending}
                disabled={!message.trim()}
                onClick={handleSend}
              >
                Send Gift to {partnerName} 🎁
              </Button>

              <p className="text-center text-xs text-muted font-body">
                Sending earns you +{HEARTS.SEND_GIFT} 💝 hearts
              </p>
            </>
          )}
        </motion.div>
      )}

      {/* Gift opening overlay */}
      <AnimatePresence>
        {openingGift && (
          <GiftAnimation
            gift={openingGift}
            onClose={() => setOpeningGift(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
