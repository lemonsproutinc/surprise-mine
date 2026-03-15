import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Milestone, MILESTONE_TYPES } from '../types'
import { awardHearts, HEARTS } from '../lib/hearts'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Input'
import { format, parseISO, differenceInDays, differenceInMonths, differenceInYears } from 'date-fns'

function timeAgo(dateStr: string): string {
  const date = parseISO(dateStr)
  const years = differenceInYears(new Date(), date)
  const months = differenceInMonths(new Date(), date)
  const days = differenceInDays(new Date(), date)

  if (years >= 1) return `${years} year${years > 1 ? 's' : ''} ago`
  if (months >= 1) return `${months} month${months > 1 ? 's' : ''} ago`
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  return 'Today!'
}

function timeUntil(dateStr: string): string {
  const date = parseISO(dateStr)
  const days = differenceInDays(date, new Date())
  const years = differenceInYears(date, new Date())
  const months = differenceInMonths(date, new Date())

  if (days < 0) return timeAgo(dateStr)
  if (days === 0) return 'Today! 🎉'
  if (years >= 1) return `in ${years} year${years > 1 ? 's' : ''}`
  if (months >= 1) return `in ${months} month${months > 1 ? 's' : ''}`
  return `in ${days} day${days > 1 ? 's' : ''}`
}

export default function Milestones() {
  const { user, couple, refreshHearts } = useAuth()

  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [milestoneType, setMilestoneType] = useState('custom')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    loadMilestones()
  }, [user, couple])

  const loadMilestones = async () => {
    if (!user) return

    if (couple) {
      // Load shared couple milestones
      const { data } = await supabase
        .from('milestones')
        .select('*')
        .eq('couple_id', couple.id)
        .order('milestone_date', { ascending: false })
      setMilestones(data ?? [])
    } else {
      // Load personal milestones (no couple yet)
      const { data } = await supabase
        .from('milestones')
        .select('*')
        .eq('created_by', user.id)
        .is('couple_id', null)
        .order('milestone_date', { ascending: false })
      setMilestones(data ?? [])
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!title || !date || !user) return
    setSaving(true)

    const { error } = await supabase.from('milestones').insert({
      couple_id: couple?.id ?? null,
      title,
      milestone_date: date,
      note: note || null,
      milestone_type: milestoneType,
      created_by: user.id,
    })

    if (!error) {
      await awardHearts(user.id, HEARTS.LOG_MILESTONE, 'Logged a milestone')
      await refreshHearts()
      setShowForm(false)
      setTitle('')
      setDate('')
      setNote('')
      setMilestoneType('custom')
      loadMilestones()
    }

    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('milestones').delete().eq('id', id)
    setMilestones(prev => prev.filter(m => m.id !== id))
  }

  const today = new Date().toISOString().split('T')[0]
  const past = milestones.filter(m => m.milestone_date <= today)
  const upcoming = milestones.filter(m => m.milestone_date > today)

  return (
    <div className="min-h-screen bg-background px-4 pt-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl text-dark">Milestones 🏆</h1>
          <p className="text-xs text-muted font-body">
            {couple ? 'Your journey together' : 'Your personal milestones'}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => setShowForm(true)}
          className="w-10 h-10 rounded-2xl gradient-brand text-white flex items-center justify-center text-xl font-bold shadow-soft"
        >
          +
        </motion.button>
      </div>

      {!couple && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-2xl bg-primary/5 border border-primary/20 px-4 py-3"
        >
          <p className="text-xs font-body text-primary/80">
            💌 Milestones you add now will be shared with your partner once you connect.
          </p>
        </motion.div>
      )}

      {/* Upcoming milestones */}
      {upcoming.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-body font-bold text-muted uppercase tracking-wider mb-3">Upcoming</p>
          <div className="flex flex-col gap-2">
            {upcoming.map((m, i) => {
              const typeInfo = MILESTONE_TYPES.find(t => t.value === m.milestone_type)
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-l-4 border-tertiary">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{typeInfo?.emoji ?? '⭐'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-bold text-dark text-sm">{m.title}</p>
                        <p className="text-xs text-muted font-body">
                          {format(parseISO(m.milestone_date), 'MMMM d, yyyy')} · {timeUntil(m.milestone_date)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Timeline — past milestones */}
      {past.length === 0 && upcoming.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🌱</div>
          <p className="font-body font-bold text-dark">No milestones yet!</p>
          <p className="text-sm text-muted font-body mt-1 mb-4">
            Start logging your journey — every moment counts 💕
          </p>
          <Button variant="gradient" onClick={() => setShowForm(true)}>
            Add Your First Milestone ✨
          </Button>
        </div>
      ) : (
        <div>
          {past.length > 0 && (
            <p className="text-xs font-body font-bold text-muted uppercase tracking-wider mb-3">Timeline</p>
          )}
          <div className="relative flex flex-col gap-0">
            {past.map((m, i) => {
              const typeInfo = MILESTONE_TYPES.find(t => t.value === m.milestone_type)
              const isFirst = i === 0
              const isLast = i === past.length - 1

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex gap-4"
                >
                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center w-8 flex-shrink-0">
                    {!isFirst && <div className="w-0.5 h-4 bg-surface" />}
                    <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-sm flex-shrink-0 shadow-soft">
                      {typeInfo?.emoji ?? '⭐'}
                    </div>
                    {!isLast && <div className="w-0.5 flex-1 bg-surface min-h-[16px]" />}
                  </div>

                  {/* Card */}
                  <div className="flex-1 pb-4">
                    <Card padding="md" className="group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-bold text-dark text-sm">{m.title}</p>
                          <p className="text-xs text-muted font-body mt-0.5">
                            {format(parseISO(m.milestone_date), 'MMMM d, yyyy')} · {timeAgo(m.milestone_date)}
                          </p>
                          {m.note && (
                            <p className="text-xs text-dark font-body mt-2 leading-relaxed italic">
                              "{m.note}"
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-red-400 text-xs p-1"
                        >
                          ✕
                        </button>
                      </div>
                    </Card>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add milestone modal — positioned at top */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-dark/60 backdrop-blur-sm z-50 flex items-start justify-center pt-8 px-4"
            onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="bg-background rounded-3xl p-6 w-full max-w-[430px] max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-xl text-dark">Add Milestone</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 rounded-xl bg-surface text-muted flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {/* Milestone type */}
                <div>
                  <p className="text-xs font-body font-bold text-muted uppercase tracking-wider mb-2">Type</p>
                  <div className="grid grid-cols-5 gap-2">
                    {MILESTONE_TYPES.map(({ value, emoji }) => (
                      <motion.button
                        key={value}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setMilestoneType(value)
                          if (!title) {
                            const t = MILESTONE_TYPES.find(m => m.value === value)
                            if (t && value !== 'custom') setTitle(t.label)
                          }
                        }}
                        className={`flex items-center justify-center text-2xl h-12 rounded-2xl border-2 transition-colors ${
                          milestoneType === value
                            ? 'border-primary bg-primary/10'
                            : 'border-surface bg-white'
                        }`}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Title"
                  placeholder="e.g. Our First Date"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />

                <Input
                  label="Date"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />

                <Textarea
                  label="Memory / Note (optional)"
                  placeholder="Add a memory or note about this moment…"
                  rows={3}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />

                <p className="text-xs text-muted font-body text-center">
                  Logging a milestone earns +{HEARTS.LOG_MILESTONE} 💝 hearts!
                </p>

                <Button
                  size="lg"
                  fullWidth
                  variant="gradient"
                  loading={saving}
                  disabled={!title || !date}
                  onClick={handleSave}
                >
                  Save Milestone 🏆
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
