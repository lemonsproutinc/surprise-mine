import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth, generateShareToken } from '../hooks/useAuth'
import { Gift, GiftType } from '../types'
import { awardHearts, HEARTS } from '../lib/hearts'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Textarea } from '../components/ui/Input'
import { format, parseISO } from 'date-fns'
import InteractiveGiftReveal from '../components/InteractiveGiftReveal'

const GIFT_TYPES: { type: GiftType; emoji: string; label: string; desc: string; color: string }[] = [
  { type: 'gift_box', emoji: '🎁', label: 'Gift Box', desc: 'Unwrap with a ribbon pop', color: 'from-primary/20 to-primary/5' },
  { type: 'love_letter', emoji: '💌', label: 'Love Letter', desc: 'An envelope that unfolds', color: 'from-secondary/20 to-secondary/5' },
  { type: 'balloon', emoji: '🎈', label: 'Balloons', desc: 'Float up to reveal your message', color: 'from-tertiary/20 to-tertiary/5' },
  { type: 'fortune_cookie', emoji: '🥠', label: 'Fortune Cookie', desc: 'Crack it open!', color: 'from-success/20 to-success/5' },
]

export default function Gifts() {
  const { user, couple, partnerProfile, refreshHearts } = useAuth()

  const [tab, setTab] = useState<'send' | 'inbox'>('send')
  const [inbox, setInbox] = useState<Gift[]>([])
  const [sent, setSent] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)
  const [openingGift, setOpeningGift] = useState<Gift | null>(null)

  // Send form
  const [selectedType, setSelectedType] = useState<GiftType>('gift_box')
  const [message, setMessage] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [sentSuccess, setSentSuccess] = useState(false)
  const [shareLink, setShareLink] = useState('')

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
    if (!message.trim() || !user) return
    setSending(true)

    const isSolo = !couple || !partnerProfile
    const shareToken = generateShareToken()

    let photoUrl: string | null = null

    // Upload photo if selected
    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gift-images')
        .upload(fileName, photoFile)

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('gift-images')
          .getPublicUrl(uploadData.path)
        photoUrl = urlData.publicUrl
      }
    }

    const { error } = await supabase.from('gifts').insert({
      from_user_id: user.id,
      to_user_id: isSolo ? null : partnerProfile!.id,
      couple_id: couple?.id ?? null,
      gift_type: selectedType,
      message: message.trim(),
      photo_url: photoUrl,
      pending: isSolo,
      share_token: shareToken,
    })

    if (!error) {
      await awardHearts(user.id, HEARTS.SEND_GIFT, 'Sent a virtual gift')
      await refreshHearts()
      setSentSuccess(true)
      setShareLink(`${window.location.origin}/gift/${shareToken}`)
      setMessage('')
      setPhotoFile(null)
      setTimeout(() => setSentSuccess(false), 8000)
      loadGifts()
    }

    setSending(false)
  }

  const handleOpenGift = async (gift: Gift) => {
    if (gift.opened) return
    setOpeningGift(gift)

    await supabase.from('gifts').update({ opened: true }).eq('id', gift.id)
    setInbox(prev => prev.map(g => g.id === gift.id ? { ...g, opened: true } : g))
  }

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
  }

  const handleShareNative = () => {
    if (navigator.share) {
      navigator.share({
        title: 'You got a surprise!',
        text: 'Someone sent you a gift on Surprise Mine!',
        url: shareLink,
      })
    }
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
        {(['send', 'inbox'] as const).map(t => (
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
          {inbox.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🎁</div>
              <p className="font-body font-bold text-dark">No gifts yet!</p>
              <p className="text-sm text-muted font-body mt-1">
                Gifts from your partner will appear here.
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
                      <span className={`text-3xl ${!gift.opened ? 'animate-gift-pulse' : ''}`}>
                        {giftInfo?.emoji}
                      </span>
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
          {sentSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-success/15 border border-success/30 p-3"
            >
              <p className="font-body font-bold text-success text-sm text-center mb-2">
                🎁 Gift sent! +{HEARTS.SEND_GIFT} 💝
              </p>
              {!couple && (
                <p className="text-xs text-muted font-body text-center mb-2">
                  Your gift will be delivered when you connect with your partner!
                </p>
              )}
              {shareLink && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted font-body text-center">Share this gift link:</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={shareLink}
                      className="flex-1 text-xs font-body bg-white rounded-xl px-3 py-2 border border-surface truncate"
                    />
                    <button
                      onClick={handleCopyShareLink}
                      className="text-xs font-body font-bold text-primary bg-primary/10 rounded-xl px-3 py-2"
                    >
                      📋 Copy
                    </button>
                  </div>
                  {typeof navigator.share === 'function' && (
                    <button
                      onClick={handleShareNative}
                      className="text-xs font-body font-bold text-secondary bg-secondary/10 rounded-xl px-3 py-2"
                    >
                      Share via... 📤
                    </button>
                  )}
                </div>
              )}
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
            label={couple ? `Your message to ${partnerName} 💌` : 'Your gift message 💌'}
            placeholder="Write something from the heart… it doesn't have to be perfect 💭"
            rows={4}
            value={message}
            onChange={e => setMessage(e.target.value)}
          />

          {/* Photo upload */}
          <div>
            <label className="flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-surface bg-white cursor-pointer hover:border-primary/40 transition-colors">
              <span className="text-2xl">📷</span>
              <div className="flex-1">
                {photoFile ? (
                  <p className="font-body text-dark text-sm">{photoFile.name}</p>
                ) : (
                  <p className="font-body text-muted text-sm">Add a photo (optional)</p>
                )}
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/heic"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file && file.size <= 5 * 1024 * 1024) {
                    setPhotoFile(file)
                  }
                }}
              />
            </label>
            {photoFile && (
              <button
                onClick={() => setPhotoFile(null)}
                className="text-xs text-red-400 font-body mt-1"
              >
                Remove photo
              </button>
            )}
          </div>

          <Button
            size="lg"
            fullWidth
            variant="gradient"
            loading={sending}
            disabled={!message.trim()}
            onClick={handleSend}
          >
            {couple ? `Send Gift to ${partnerName} 🎁` : 'Send Gift 🎁'}
          </Button>

          <p className="text-center text-xs text-muted font-body">
            Sending earns you +{HEARTS.SEND_GIFT} 💝 hearts
          </p>
        </motion.div>
      )}

      {/* Gift opening overlay — Interactive multi-step */}
      <AnimatePresence>
        {openingGift && (
          <InteractiveGiftReveal
            gift={openingGift}
            onClose={() => setOpeningGift(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
