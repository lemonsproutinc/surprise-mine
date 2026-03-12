import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { DailyQuestion, QuestionAnswer, Gift, Milestone } from '../types'
import Card from '../components/ui/Card'
import { format, differenceInDays, parseISO } from 'date-fns'

const quickActions = [
  { emoji: '🎁', label: 'Send Gift', path: '/gifts' },
  { emoji: '💬', label: 'Questions', path: '/questions' },
  { emoji: '🏆', label: 'Milestone', path: '/milestones' },
  { emoji: '👤', label: 'Profile', path: '/profile' },
]

export default function Home() {
  const navigate = useNavigate()
  const { user, profile, partnerProfile, couple, totalHearts, currentStreak } = useAuth()

  const [dailyQuestion, setDailyQuestion] = useState<DailyQuestion | null>(null)
  const [myAnswer, setMyAnswer] = useState<QuestionAnswer | null>(null)
  const [partnerAnswer, setPartnerAnswer] = useState<QuestionAnswer | null>(null)
  const [pendingGifts, setPendingGifts] = useState<Gift[]>([])
  const [upcomingMilestones, setUpcomingMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !couple) { setLoading(false); return }
    loadHomeData()
  }, [user, couple])

  const loadHomeData = async () => {
    if (!user || !couple) return

    const today = new Date().toISOString().split('T')[0]

    // Load or create today's daily question
    let { data: dq } = await supabase
      .from('daily_questions')
      .select('*, question:question_id(*)')
      .eq('couple_id', couple.id)
      .eq('assigned_date', today)
      .single()

    if (!dq) {
      // Assign a random question not used recently
      const { data: questions } = await supabase
        .from('questions')
        .select('id')
        .limit(100)

      if (questions && questions.length > 0) {
        const randomQ = questions[Math.floor(Math.random() * questions.length)]
        const { data: newDq } = await supabase
          .from('daily_questions')
          .insert({ couple_id: couple.id, question_id: randomQ.id, assigned_date: today })
          .select('*, question:question_id(*)')
          .single()
        dq = newDq
      }
    }

    if (dq) {
      setDailyQuestion(dq)

      // Load answers
      const { data: answers } = await supabase
        .from('question_answers')
        .select('*')
        .eq('daily_question_id', dq.id)

      if (answers) {
        const mine = answers.find(a => a.user_id === user.id)
        const theirs = answers.find(a => a.user_id !== user.id)
        setMyAnswer(mine ?? null)
        setPartnerAnswer(theirs ?? null)
      }
    }

    // Load pending (unopened) gifts for me
    const { data: gifts } = await supabase
      .from('gifts')
      .select('*')
      .eq('to_user_id', user.id)
      .eq('opened', false)
      .order('created_at', { ascending: false })

    setPendingGifts(gifts ?? [])

    // Load upcoming milestones
    const { data: milestones } = await supabase
      .from('milestones')
      .select('*')
      .eq('couple_id', couple.id)
      .gte('milestone_date', today)
      .order('milestone_date', { ascending: true })
      .limit(3)

    setUpcomingMilestones(milestones ?? [])

    setLoading(false)
  }

  const bothAnswered = !!(myAnswer && partnerAnswer)
  const questionStatus = myAnswer
    ? bothAnswered
      ? 'both'
      : 'waiting'
    : 'unanswered'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <span className="text-5xl">💝</span>
        </motion.div>
      </div>
    )
  }

  const partnerFirstName = partnerProfile?.name?.split(' ')[0] ?? profile?.partner_name ?? 'your partner'
  const myFirstName = profile?.name?.split(' ')[0] ?? 'You'

  return (
    <div className="min-h-screen bg-background px-4 pt-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl text-dark">
            Hey {myFirstName}! 👋
          </h1>
          <p className="text-xs text-muted font-body mt-0.5">
            {couple
              ? `${myFirstName} ❤️ ${partnerFirstName}`
              : 'Waiting for your partner to join…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentStreak > 0 && (
            <div className="flex items-center gap-1 bg-white rounded-2xl px-3 py-1.5 shadow-card">
              <span className="text-base">🔥</span>
              <span className="font-accent font-bold text-sm text-dark">{currentStreak}</span>
            </div>
          )}
          <div className="flex items-center gap-1 bg-white rounded-2xl px-3 py-1.5 shadow-card">
            <span className="text-base">💝</span>
            <span className="font-accent font-bold text-sm text-dark">{totalHearts}</span>
          </div>
        </div>
      </div>

      {/* No couple yet banner */}
      {!couple && (
        <Card animate className="mb-4 border-2 border-dashed border-primary/30">
          <div className="text-center py-2">
            <div className="text-4xl mb-2">💌</div>
            <p className="font-body font-bold text-dark text-sm">Your partner hasn't joined yet</p>
            <p className="text-xs text-muted font-body mt-1">
              Share your invite code from{' '}
              <button onClick={() => navigate('/profile')} className="text-primary font-bold">
                Profile
              </button>{' '}
              to get started!
            </p>
          </div>
        </Card>
      )}

      {/* Pending gifts banner */}
      {pendingGifts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Card
            onClick={() => navigate('/gifts')}
            className="border-2 border-tertiary/50 bg-tertiary/5"
          >
            <div className="flex items-center gap-3">
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-3xl"
              >
                🎁
              </motion.span>
              <div>
                <p className="font-body font-bold text-dark text-sm">
                  You have {pendingGifts.length} unopened gift{pendingGifts.length > 1 ? 's' : ''}!
                </p>
                <p className="text-xs text-muted font-body">Tap to open ✨</p>
              </div>
              <span className="ml-auto text-muted">→</span>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Daily Question Card */}
      {dailyQuestion?.question && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <div
            className="rounded-3xl gradient-brand p-5 cursor-pointer shadow-soft"
            onClick={() => navigate('/questions')}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-white/80 text-sm">{dailyQuestion.question.category_emoji}</span>
                <span className="text-white/80 text-xs font-body font-semibold uppercase tracking-wider">
                  {dailyQuestion.question.category}
                </span>
              </div>
              <span className="bg-white/20 text-white text-xs font-body font-bold px-2 py-1 rounded-full">
                Today's Q
              </span>
            </div>

            <p className="font-body font-bold text-white text-base leading-snug mb-4 line-clamp-3">
              "{dailyQuestion.question.text}"
            </p>

            <div className="flex items-center justify-between">
              <div className="flex -space-x-1">
                <div className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs ${myAnswer ? 'bg-success' : 'bg-white/30'}`}>
                  {myAnswer ? '✓' : '?'}
                </div>
                <div className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs ${partnerAnswer ? 'bg-success' : 'bg-white/30'}`}>
                  {partnerAnswer ? '✓' : '?'}
                </div>
              </div>
              <span className="text-white/80 text-xs font-body font-semibold">
                {questionStatus === 'unanswered' && 'Answer now →'}
                {questionStatus === 'waiting' && `Waiting for ${partnerFirstName}... 🔒`}
                {questionStatus === 'both' && 'Reveal answers! 🎉'}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-4"
      >
        <p className="text-xs font-body font-bold text-muted uppercase tracking-wider mb-3">Quick Actions</p>
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map(({ emoji, label, path }) => (
            <motion.button
              key={path}
              whileTap={{ scale: 0.93 }}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-1.5 bg-white rounded-3xl py-4 px-2 shadow-card"
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-[11px] text-dark font-body font-semibold">{label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Upcoming Milestones */}
      {upcomingMilestones.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-4"
        >
          <p className="text-xs font-body font-bold text-muted uppercase tracking-wider mb-3">Upcoming</p>
          <div className="flex flex-col gap-2">
            {upcomingMilestones.map(m => {
              const daysUntil = differenceInDays(parseISO(m.milestone_date), new Date())
              const typeEmoji = m.milestone_type === 'anniversary' ? '🎉' : m.milestone_type === 'birthday' ? '🎂' : '⭐'
              return (
                <Card key={m.id} onClick={() => navigate('/milestones')} padding="sm">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{typeEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-bold text-dark text-sm truncate">{m.title}</p>
                      <p className="text-xs text-muted font-body">
                        {format(parseISO(m.milestone_date), 'MMM d')} · {daysUntil === 0 ? 'Today! 🎉' : `in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-3 gap-2"
      >
        {[
          { emoji: '💝', label: 'Hearts', value: totalHearts },
          { emoji: '🔥', label: 'Streak', value: `${currentStreak}d` },
          { emoji: '💬', label: 'Together', value: couple ? `${differenceInDays(new Date(), parseISO(couple.created_at))}d` : '–' },
        ].map(({ emoji, label, value }) => (
          <Card key={label} padding="sm" className="text-center">
            <div className="text-2xl mb-1">{emoji}</div>
            <div className="font-accent font-bold text-dark text-lg leading-none">{value}</div>
            <div className="text-[10px] text-muted font-body mt-0.5">{label}</div>
          </Card>
        ))}
      </motion.div>
    </div>
  )
}
