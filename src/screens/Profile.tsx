import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { RELATIONSHIP_STAGES } from '../types'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { format, parseISO } from 'date-fns'

export default function Profile() {
  const { user, profile, partnerProfile, couple, totalHearts, currentStreak, signOut, linkPartner, refreshProfile } = useAuth()
  const [copied, setCopied] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  // Partner code state
  const [partnerCodeInput, setPartnerCodeInput] = useState('')
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [linkSuccess, setLinkSuccess] = useState(false)

  // Anniversary date modal state
  const [showDateModal, setShowDateModal] = useState(false)
  const [dateInput, setDateInput] = useState(profile?.relationship_start_date ?? '')
  const [savingDate, setSavingDate] = useState(false)

  const handleCopyCode = () => {
    if (profile?.invite_code) {
      navigator.clipboard.writeText(profile.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleConnect = async () => {
    if (!partnerCodeInput.trim()) return
    setLinking(true)
    setLinkError('')
    const { error } = await linkPartner(partnerCodeInput)
    if (error) {
      setLinkError(error)
    } else {
      setLinkSuccess(true)
    }
    setLinking(false)
  }

  const handleSaveDate = async () => {
    if (!dateInput || !user) return
    setSavingDate(true)
    await supabase
      .from('profiles')
      .update({ relationship_start_date: dateInput })
      .eq('id', user.id)
    await refreshProfile()
    setSavingDate(false)
    setShowDateModal(false)
  }

  const stageInfo = RELATIONSHIP_STAGES.find(s => s.value === profile?.relationship_stage)
  const partnerName = partnerProfile?.name ?? profile?.partner_name ?? 'Not connected yet'

  const heartsToNextLevel = (() => {
    if (totalHearts < 50) return 50 - totalHearts
    if (totalHearts < 100) return 100 - totalHearts
    if (totalHearts < 300) return 300 - totalHearts
    if (totalHearts < 500) return 500 - totalHearts
    return 1000 - totalHearts
  })()

  const currentLevel = (() => {
    if (totalHearts >= 500) return { label: 'Love Legend', emoji: '👑' }
    if (totalHearts >= 300) return { label: 'Heart Hero', emoji: '🦸' }
    if (totalHearts >= 100) return { label: 'Rising Star', emoji: '⭐' }
    if (totalHearts >= 50) return { label: 'Budding', emoji: '🌱' }
    return { label: 'New Couple', emoji: '🌸' }
  })()

  return (
    <div className="min-h-screen bg-background px-4 pt-6 pb-6">
      <h1 className="font-display text-2xl text-dark mb-5">Profile 👤</h1>

      {/* Couple card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <div className="rounded-3xl gradient-brand p-5 text-white shadow-soft">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-display">
                {profile?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <p className="text-xs font-body font-bold mt-1 text-white/90">
                {profile?.name ?? 'You'}
              </p>
            </div>
            <div className="flex flex-col items-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-3xl"
              >
                ❤️
              </motion.div>
              {stageInfo && (
                <span className="text-xs font-body font-bold text-white/70 mt-1">
                  {stageInfo.emoji} {stageInfo.label}
                </span>
              )}
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-display">
                {partnerProfile?.name?.[0]?.toUpperCase() ?? '💕'}
              </div>
              <p className="text-xs font-body font-bold mt-1 text-white/90">
                {partnerName}
              </p>
            </div>
          </div>

          {/* Together since / anniversary */}
          <div className="flex items-center justify-center gap-2">
            <p className="text-center text-white/80 text-xs font-body">
              {profile?.relationship_start_date
                ? `Together since ${format(parseISO(profile.relationship_start_date), 'MMMM d, yyyy')}`
                : 'Set your anniversary'}
            </p>
            <button
              onClick={() => {
                setDateInput(profile?.relationship_start_date ?? '')
                setShowDateModal(true)
              }}
              className="text-[10px] bg-white/20 hover:bg-white/30 text-white font-body font-bold px-2 py-0.5 rounded-full transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      </motion.div>

      {/* Hearts & Level */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">💝</span>
            <div>
              <p className="font-body font-bold text-dark">{currentLevel.emoji} {currentLevel.label}</p>
              <p className="text-xs text-muted font-body">{totalHearts} hearts earned total</p>
            </div>
          </div>
          <div className="h-2 bg-surface rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((totalHearts % 500) / 5, 100)}%` }}
              transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
              className="h-full gradient-brand rounded-full"
            />
          </div>
          <p className="text-xs text-muted font-body mt-1 text-right">
            {heartsToNextLevel} hearts to next level
          </p>
        </Card>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 gap-3 mb-4"
      >
        <Card padding="md" className="text-center">
          <div className="text-3xl mb-1">🔥</div>
          <div className="font-accent font-bold text-2xl text-dark">{currentStreak}</div>
          <div className="text-xs text-muted font-body">Day Streak</div>
        </Card>
        <Card padding="md" className="text-center">
          <div className="text-3xl mb-1">💝</div>
          <div className="font-accent font-bold text-2xl text-dark">{totalHearts}</div>
          <div className="text-xs text-muted font-body">Total Hearts</div>
        </Card>
      </motion.div>

      {/* Partner code section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-4"
      >
        {!couple ? (
          /* Unpaired — prominent card */
          <Card className="border-2 border-primary/30">
            <p className="font-display text-base text-dark mb-1">Connect with your partner 💌</p>
            <p className="text-xs text-muted font-body mb-4">Share your code or enter theirs to get started.</p>

            {/* Your invite code */}
            <p className="text-xs font-body font-bold text-muted uppercase tracking-wider mb-2">Your Invite Code</p>
            <div className="flex items-center justify-between gap-3 mb-4 bg-surface rounded-2xl px-4 py-3">
              <span className="font-accent text-2xl font-bold text-dark tracking-widest">
                {profile?.invite_code ?? '—'}
              </span>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyCode}
                className="bg-primary/10 rounded-xl px-3 py-1.5 font-body font-bold text-primary text-sm"
              >
                {copied ? '✅ Copied!' : '📋 Copy'}
              </motion.button>
            </div>

            {/* Enter partner code */}
            <p className="text-xs font-body font-bold text-muted uppercase tracking-wider mb-2">Have their code?</p>
            {linkSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl bg-success/10 border border-success/30 p-3 text-center"
              >
                <p className="font-body font-bold text-success text-sm">🎉 Connected! Refreshing…</p>
              </motion.div>
            ) : (
              <>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="e.g. LOVE-7X3K"
                      value={partnerCodeInput}
                      onChange={e => { setPartnerCodeInput(e.target.value.toUpperCase()); setLinkError('') }}
                    />
                  </div>
                  <Button
                    variant="gradient"
                    size="md"
                    loading={linking}
                    disabled={!partnerCodeInput.trim()}
                    onClick={handleConnect}
                    className="self-end"
                  >
                    Connect
                  </Button>
                </div>
                {linkError && (
                  <p className="text-xs text-red-500 font-body mt-2">{linkError}</p>
                )}
              </>
            )}
          </Card>
        ) : (
          /* Paired — smaller informational card */
          <Card className="border border-surface">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xl">💑</span>
              <p className="font-body font-bold text-dark text-sm">
                You've partnered with {partnerProfile?.name ?? 'your partner'}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted font-body">Your invite code</p>
                <span className="font-accent text-sm font-bold text-dark tracking-widest">
                  {profile?.invite_code ?? '—'}
                </span>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyCode}
                className="bg-surface rounded-xl px-3 py-1.5 font-body font-bold text-muted text-xs"
              >
                {copied ? '✅ Copied' : '📋 Copy'}
              </motion.button>
            </div>
          </Card>
        )}
      </motion.div>

      {/* Hearts earning guide */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-4"
      >
        <p className="text-xs font-body font-bold text-muted uppercase tracking-wider mb-3">
          How to Earn Hearts 💝
        </p>
        <Card padding="md">
          {[
            { emoji: '💬', action: 'Answer daily question', hearts: '+3' },
            { emoji: '🎁', action: 'Send a virtual gift', hearts: '+5' },
            { emoji: '✨', action: 'Both partners answer', hearts: '+5 bonus' },
            { emoji: '🏆', action: 'Log a milestone', hearts: '+15' },
            { emoji: '🔥', action: 'Weekly streak', hearts: '+20' },
          ].map(({ emoji, action, hearts }) => (
            <div key={action} className="flex items-center gap-3 py-2 border-b border-surface last:border-0">
              <span className="text-xl w-7">{emoji}</span>
              <span className="flex-1 font-body text-sm text-dark">{action}</span>
              <span className="font-accent font-bold text-primary text-sm">{hearts}</span>
            </div>
          ))}
        </Card>
      </motion.div>

      {/* Account section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-4"
      >
        <p className="text-xs font-body font-bold text-muted uppercase tracking-wider mb-3">Account</p>
        <Card padding="md">
          <div className="flex items-center gap-3 py-2">
            <span className="text-xl">📧</span>
            <div>
              <p className="text-xs text-muted font-body">Email</p>
              <p className="font-body font-semibold text-dark text-sm">{profile?.email}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Sign out */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Button
          size="lg"
          fullWidth
          variant="outline"
          onClick={() => setShowSignOutConfirm(true)}
          className="border-red-300 text-red-400 hover:bg-red-50"
        >
          Sign Out
        </Button>
      </motion.div>

      {/* Sign out confirmation */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-dark/60 backdrop-blur-sm z-50 flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-medium"
            >
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">👋</div>
                <h3 className="font-display text-xl text-dark">Sign out?</h3>
                <p className="text-sm text-muted font-body mt-1">Your data will be safe. See you soon!</p>
              </div>
              <div className="flex gap-3">
                <Button
                  fullWidth
                  variant="ghost"
                  onClick={() => setShowSignOutConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  variant="primary"
                  onClick={signOut}
                  className="bg-red-400"
                >
                  Sign Out
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Anniversary date modal */}
      <AnimatePresence>
        {showDateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-dark/60 backdrop-blur-sm z-50 flex items-center justify-center px-6"
            onClick={e => { if (e.target === e.currentTarget) setShowDateModal(false) }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-medium"
            >
              <div className="text-center mb-5">
                <div className="text-4xl mb-2">📅</div>
                <h3 className="font-display text-xl text-dark">When did you two start?</h3>
                <p className="text-sm text-muted font-body mt-1">Set your anniversary or relationship start date.</p>
              </div>
              <Input
                type="date"
                value={dateInput}
                onChange={e => setDateInput(e.target.value)}
                className="mb-4"
              />
              <div className="flex gap-3">
                <Button
                  fullWidth
                  variant="ghost"
                  onClick={() => setShowDateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  variant="gradient"
                  loading={savingDate}
                  disabled={!dateInput}
                  onClick={handleSaveDate}
                >
                  Save 💕
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
