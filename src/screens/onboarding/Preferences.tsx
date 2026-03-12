import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/ui/Button'

const INTENSITIES = [
  { value: 'light', label: 'Light & Fun', emoji: '🤍', desc: 'Keep it playful and easy' },
  { value: 'balanced', label: 'Balanced', emoji: '⚖️', desc: 'Mix of fun and meaningful' },
  { value: 'deep', label: 'Deep & Meaningful', emoji: '🔮', desc: 'Go below the surface' },
]

const CATEGORIES = [
  { value: 'Communication', emoji: '💬' },
  { value: 'Love & Romance', emoji: '❤️' },
  { value: 'Intimacy & Desires', emoji: '🔥' },
  { value: 'Money & Finances', emoji: '💰' },
  { value: 'Future Planning', emoji: '🏠' },
  { value: 'Just for Fun', emoji: '😄' },
  { value: 'Conflict Resolution', emoji: '🤝' },
  { value: 'Personal Growth', emoji: '🧠' },
]

export default function Preferences() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()

  const [intensity, setIntensity] = useState('balanced')
  const [categories, setCategories] = useState<string[]>(CATEGORIES.map(c => c.value))
  const [loading, setLoading] = useState(false)
  const [showInviteCode, setShowInviteCode] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Show invite code only to the account creator (who has an invite code but no couple yet)
    if (profile && profile.invite_code && !profile.couple_id) {
      setShowInviteCode(true)
    }
  }, [profile])

  const toggleCategory = (cat: string) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const handleCopy = () => {
    if (profile?.invite_code) {
      navigator.clipboard.writeText(profile.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setLoading(true)

    await supabase.from('user_preferences').upsert({
      user_id: user.id,
      question_intensity: intensity,
      question_categories: categories,
    })

    // Initialize streak record
    await supabase.from('streaks').upsert({
      user_id: user.id,
      current_streak: 0,
      longest_streak: 0,
    })

    await refreshProfile()
    setLoading(false)
    navigate('/home')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-dark mb-1">Set Up Your Experience</h1>
        <p className="text-muted font-body text-sm">Personalize how you grow together 🌱</p>
      </div>

      <div className="flex flex-col gap-6 flex-1">

        {/* Invite code banner (shown to creator only) */}
        {showInviteCode && profile?.invite_code && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl gradient-brand p-5 text-white"
          >
            <p className="font-body font-bold text-sm opacity-80 mb-1">Share this with your partner 💌</p>
            <div className="flex items-center justify-between gap-3">
              <span className="font-accent text-3xl font-bold tracking-widest">
                {profile.invite_code}
              </span>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="bg-white/20 rounded-2xl px-4 py-2 font-body font-bold text-sm"
              >
                {copied ? '✅ Copied!' : '📋 Copy'}
              </motion.button>
            </div>
            <p className="text-xs opacity-70 mt-2 font-body">
              Your partner enters this code when joining. You can also find it in Settings later.
            </p>
          </motion.div>
        )}

        {/* Intensity */}
        <div>
          <p className="text-xs font-body font-bold text-muted uppercase tracking-wider mb-3">
            Question Intensity
          </p>
          <div className="flex flex-col gap-2">
            {INTENSITIES.map(({ value, label, emoji, desc }) => (
              <motion.button
                key={value}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIntensity(value)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-colors ${
                  intensity === value
                    ? 'border-primary bg-primary/10'
                    : 'border-surface bg-white'
                }`}
              >
                <span className="text-2xl">{emoji}</span>
                <div>
                  <p className={`font-body font-bold text-sm ${intensity === value ? 'text-primary' : 'text-dark'}`}>
                    {label}
                  </p>
                  <p className="text-xs text-muted font-body">{desc}</p>
                </div>
                {intensity === value && (
                  <span className="ml-auto text-primary text-lg">✓</span>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <p className="text-xs font-body font-bold text-muted uppercase tracking-wider mb-3">
            Topics You Want to Explore
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(({ value, emoji }) => {
              const selected = categories.includes(value)
              return (
                <motion.button
                  key={value}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => toggleCategory(value)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-2xl border-2 font-body font-semibold text-sm transition-colors ${
                    selected
                      ? 'border-secondary bg-secondary/10 text-secondary'
                      : 'border-surface bg-white text-muted'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="text-left leading-tight">{value}</span>
                </motion.button>
              )
            })}
          </div>
          <p className="text-xs text-muted font-body mt-2 text-center">
            You can change these anytime in settings.
          </p>
        </div>

        <Button
          size="lg"
          fullWidth
          variant="gradient"
          loading={loading}
          onClick={handleSave}
          className="mt-auto"
        >
          Let's Go! 🚀
        </Button>
      </div>
    </div>
  )
}
