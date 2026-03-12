import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { DailyQuestion, QuestionAnswer } from '../types'
import { awardHearts, updateStreak, HEARTS } from '../lib/hearts'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Textarea } from '../components/ui/Input'
import { format, parseISO } from 'date-fns'

type AnswerState = 'loading' | 'unanswered' | 'submitted' | 'revealed'

interface HistoryItem {
  dq: DailyQuestion
  myAnswer?: QuestionAnswer
  partnerAnswer?: QuestionAnswer
}

export default function Questions() {
  const { user, couple, partnerProfile, refreshHearts } = useAuth()

  const [dailyQuestion, setDailyQuestion] = useState<DailyQuestion | null>(null)
  const [myAnswer, setMyAnswer] = useState<QuestionAnswer | null>(null)
  const [partnerAnswer, setPartnerAnswer] = useState<QuestionAnswer | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [state, setState] = useState<AnswerState>('loading')
  const [submitting, setSubmitting] = useState(false)
  const [heartsEarned, setHeartsEarned] = useState(0)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [tab, setTab] = useState<'today' | 'history'>('today')

  const partnerName = partnerProfile?.name?.split(' ')[0] ?? 'your partner'

  useEffect(() => {
    if (!user || !couple) { setState('unanswered'); return }
    loadTodayQuestion()
    loadHistory()
  }, [user, couple])

  const loadTodayQuestion = async () => {
    if (!user || !couple) return

    const today = new Date().toISOString().split('T')[0]

    let { data: dq } = await supabase
      .from('daily_questions')
      .select('*, question:question_id(*)')
      .eq('couple_id', couple.id)
      .eq('assigned_date', today)
      .single()

    if (!dq) {
      const { data: questions } = await supabase.from('questions').select('id').limit(100)
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

    if (!dq) { setState('unanswered'); return }
    setDailyQuestion(dq)

    const { data: answers } = await supabase
      .from('question_answers')
      .select('*')
      .eq('daily_question_id', dq.id)

    const mine = answers?.find(a => a.user_id === user.id) ?? null
    const theirs = answers?.find(a => a.user_id !== user.id) ?? null

    setMyAnswer(mine)
    setPartnerAnswer(theirs)

    if (mine && theirs) setState('revealed')
    else if (mine) setState('submitted')
    else setState('unanswered')
  }

  const loadHistory = async () => {
    if (!user || !couple) return
    const today = new Date().toISOString().split('T')[0]

    const { data: dqs } = await supabase
      .from('daily_questions')
      .select('*, question:question_id(*)')
      .eq('couple_id', couple.id)
      .lt('assigned_date', today)
      .order('assigned_date', { ascending: false })
      .limit(20)

    if (!dqs) return

    const items: HistoryItem[] = []
    for (const dq of dqs) {
      const { data: answers } = await supabase
        .from('question_answers')
        .select('*')
        .eq('daily_question_id', dq.id)

      items.push({
        dq,
        myAnswer: answers?.find(a => a.user_id === user.id),
        partnerAnswer: answers?.find(a => a.user_id !== user.id),
      })
    }
    setHistory(items)
  }

  const handleSubmit = async () => {
    if (!answerText.trim() || !dailyQuestion || !user) return
    setSubmitting(true)

    const { error } = await supabase.from('question_answers').insert({
      daily_question_id: dailyQuestion.id,
      user_id: user.id,
      answer: answerText.trim(),
    })

    if (error) { setSubmitting(false); return }

    // Award hearts
    await awardHearts(user.id, HEARTS.DAILY_QUESTION, 'Answered daily question')
    await updateStreak(user.id)
    await refreshHearts()
    setHeartsEarned(HEARTS.DAILY_QUESTION)

    const { data: answers } = await supabase
      .from('question_answers')
      .select('*')
      .eq('daily_question_id', dailyQuestion.id)

    const mine = answers?.find(a => a.user_id === user.id) ?? null
    const theirs = answers?.find(a => a.user_id !== user.id) ?? null
    setMyAnswer(mine)
    setPartnerAnswer(theirs)

    if (theirs) {
      // Both answered — bonus hearts
      await awardHearts(user.id, HEARTS.BOTH_ANSWERED, 'Both partners answered today')
      setHeartsEarned(HEARTS.DAILY_QUESTION + HEARTS.BOTH_ANSWERED)
      setState('revealed')
    } else {
      setState('submitted')
    }

    setSubmitting(false)
  }

  const intensityColor = {
    light: 'bg-green-100 text-green-700',
    balanced: 'bg-blue-100 text-blue-700',
    deep: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="min-h-screen bg-background px-4 pt-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl text-dark">Questions 💬</h1>
          <p className="text-xs text-muted font-body">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface rounded-2xl p-1 mb-5">
        {(['today', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl font-body font-bold text-sm transition-all capitalize ${
              tab === t ? 'bg-white shadow-card text-dark' : 'text-muted'
            }`}
          >
            {t === 'today' ? "Today's Q" : 'History'}
          </button>
        ))}
      </div>

      {tab === 'today' && (
        <AnimatePresence mode="wait">
          {state === 'loading' && (
            <motion.div key="loading" className="flex justify-center py-20">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-5xl"
              >
                💝
              </motion.span>
            </motion.div>
          )}

          {!couple && state !== 'loading' && (
            <motion.div
              key="no-couple"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="text-5xl mb-3">💌</div>
              <p className="font-body font-bold text-dark">No partner yet!</p>
              <p className="text-sm text-muted font-body mt-1">
                Share your invite code to pair up and start answering questions together.
              </p>
            </motion.div>
          )}

          {couple && dailyQuestion?.question && (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4"
            >
              {/* Question card */}
              <div className="rounded-3xl gradient-brand p-5 shadow-soft">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-white/80">{dailyQuestion.question.category_emoji}</span>
                  <span className="text-white/80 text-xs font-body font-semibold uppercase tracking-wider">
                    {dailyQuestion.question.category}
                  </span>
                  <span className={`ml-auto text-xs font-body font-bold px-2 py-0.5 rounded-full ${intensityColor[dailyQuestion.question.intensity]}`}>
                    {dailyQuestion.question.intensity}
                  </span>
                </div>
                <p className="font-body font-bold text-white text-lg leading-snug">
                  "{dailyQuestion.question.text}"
                </p>
              </div>

              {/* Hearts earned banner */}
              {heartsEarned > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl bg-tertiary/20 border-2 border-tertiary/40 p-3 text-center"
                >
                  <p className="font-body font-bold text-dark text-sm">
                    +{heartsEarned} 💝 hearts earned!
                  </p>
                </motion.div>
              )}

              {/* Unanswered state */}
              {state === 'unanswered' && (
                <motion.div
                  key="unanswered"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-3"
                >
                  <Textarea
                    label="Your answer"
                    placeholder="Take your time… there's no wrong answer 💭"
                    rows={4}
                    value={answerText}
                    onChange={e => setAnswerText(e.target.value)}
                  />
                  <Button
                    size="lg"
                    fullWidth
                    variant="gradient"
                    loading={submitting}
                    onClick={handleSubmit}
                    disabled={!answerText.trim()}
                  >
                    Lock In My Answer 🔒
                  </Button>
                </motion.div>
              )}

              {/* Waiting state */}
              {state === 'submitted' && (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-3xl bg-surface p-5 text-center"
                >
                  <motion.div
                    animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="text-5xl mb-3"
                  >
                    🔒
                  </motion.div>
                  <p className="font-body font-bold text-dark">Your answer is locked in!</p>
                  <p className="text-sm text-muted font-body mt-1">
                    Waiting for {partnerName} to answer…
                  </p>
                  <div className="mt-4 bg-white rounded-2xl p-3">
                    <p className="text-xs text-muted font-body italic">Your answer:</p>
                    <p className="font-body text-dark text-sm mt-1">"{myAnswer?.answer}"</p>
                  </div>
                </motion.div>
              )}

              {/* Revealed state */}
              {state === 'revealed' && myAnswer && partnerAnswer && (
                <motion.div
                  key="revealed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-3"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="text-4xl mb-1"
                    >
                      🎉
                    </motion.div>
                    <p className="font-body font-bold text-dark text-sm">Both answered! Here's what you said:</p>
                  </div>

                  {/* My answer */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="border-l-4 border-primary">
                      <p className="text-xs text-primary font-body font-bold mb-1">You said:</p>
                      <p className="font-body text-dark text-sm leading-relaxed">"{myAnswer.answer}"</p>
                    </Card>
                  </motion.div>

                  {/* Partner answer */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card className="border-l-4 border-secondary">
                      <p className="text-xs text-secondary font-body font-bold mb-1">{partnerName} said:</p>
                      <p className="font-body text-dark text-sm leading-relaxed">"{partnerAnswer.answer}"</p>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="rounded-2xl bg-surface p-3 text-center"
                  >
                    <p className="text-xs text-muted font-body">
                      💬 Talk about what surprised you about each other's answers!
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {tab === 'history' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-3"
        >
          {history.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">📚</div>
              <p className="font-body font-bold text-dark">No history yet</p>
              <p className="text-sm text-muted font-body mt-1">
                Start answering daily questions to build your history!
              </p>
            </div>
          ) : (
            history.map(({ dq, myAnswer: ma, partnerAnswer: pa }) => (
              <Card key={dq.id} padding="md" animate>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-base">{dq.question?.category_emoji}</span>
                  <div className="flex-1">
                    <p className="text-xs text-muted font-body">{format(parseISO(dq.assigned_date), 'MMM d, yyyy')}</p>
                    <p className="font-body font-semibold text-dark text-sm mt-0.5 leading-snug">
                      {dq.question?.text}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded-lg font-body font-bold ${ma ? 'bg-primary/10 text-primary' : 'bg-surface text-muted'}`}>
                      {ma ? 'You ✓' : 'You –'}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-lg font-body font-bold ${pa ? 'bg-secondary/10 text-secondary' : 'bg-surface text-muted'}`}>
                      {pa ? `${partnerName} ✓` : `${partnerName} –`}
                    </span>
                  </div>
                </div>
                {ma && pa && (
                  <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-surface">
                    <p className="text-xs text-dark font-body line-clamp-1">
                      <span className="font-bold text-primary">You:</span> "{ma.answer}"
                    </p>
                    <p className="text-xs text-dark font-body line-clamp-1">
                      <span className="font-bold text-secondary">{partnerName}:</span> "{pa.answer}"
                    </p>
                  </div>
                )}
              </Card>
            ))
          )}
        </motion.div>
      )}
    </div>
  )
}
