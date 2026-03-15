import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { DailyQuestion, Question, QuestionAnswer } from '../types'
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

const intensityColor = {
  light: 'bg-green-100 text-green-700',
  balanced: 'bg-blue-100 text-blue-700',
  deep: 'bg-purple-100 text-purple-700',
}

export default function Questions() {
  const { user, couple, partnerProfile, refreshHearts } = useAuth()

  const [dailyQuestion, setDailyQuestion] = useState<DailyQuestion | null>(null)
  // For solo preview (no couple), we show a random question without DB
  const [soloQuestion, setSoloQuestion] = useState<Question | null>(null)
  const [myAnswer, setMyAnswer] = useState<QuestionAnswer | null>(null)
  const [partnerAnswer, setPartnerAnswer] = useState<QuestionAnswer | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [state, setState] = useState<AnswerState>('loading')
  const [submitting, setSubmitting] = useState(false)
  const [heartsEarned, setHeartsEarned] = useState(0)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [tab, setTab] = useState<'today' | 'history'>('today')
  const [skipping, setSkipping] = useState(false)

  const partnerName = partnerProfile?.name?.split(' ')[0] ?? 'your partner'

  useEffect(() => {
    if (!user) { setState('unanswered'); return }
    if (couple) {
      loadTodayQuestion()
      loadHistory()
    } else {
      loadSoloQuestion()
    }
  }, [user, couple])

  const getRandomQuestion = async (excludeId?: string): Promise<Question | null> => {
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .limit(200)
    if (!questions || questions.length === 0) return null
    const pool = excludeId ? questions.filter(q => q.id !== excludeId) : questions
    return pool[Math.floor(Math.random() * pool.length)] ?? null
  }

  const loadSoloQuestion = async () => {
    const q = await getRandomQuestion()
    setSoloQuestion(q)
    setState('unanswered')
  }

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
      const q = await getRandomQuestion()
      if (q) {
        const { data: newDq } = await supabase
          .from('daily_questions')
          .insert({ couple_id: couple.id, question_id: q.id, assigned_date: today })
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
      .limit(50)

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

  const handleSkip = async () => {
    if (!user) return
    setSkipping(true)
    setAnswerText('')

    if (couple && dailyQuestion) {
      // Replace today's question with a new one
      const today = new Date().toISOString().split('T')[0]
      const q = await getRandomQuestion(dailyQuestion.question_id)
      if (q) {
        // Delete old daily question assignment
        await supabase
          .from('daily_questions')
          .delete()
          .eq('id', dailyQuestion.id)

        const { data: newDq } = await supabase
          .from('daily_questions')
          .insert({ couple_id: couple.id, question_id: q.id, assigned_date: today })
          .select('*, question:question_id(*)')
          .single()

        if (newDq) {
          setDailyQuestion(newDq)
          setMyAnswer(null)
          setPartnerAnswer(null)
          setState('unanswered')
        }
      }
    } else {
      // Solo: just swap to a different random question
      const q = await getRandomQuestion(soloQuestion?.id)
      setSoloQuestion(q)
    }

    setSkipping(false)
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
      await awardHearts(user.id, HEARTS.BOTH_ANSWERED, 'Both partners answered today')
      setHeartsEarned(HEARTS.DAILY_QUESTION + HEARTS.BOTH_ANSWERED)
      setState('revealed')
    } else {
      setState('submitted')
    }

    setSubmitting(false)
  }

  // Determine which question to display
  const displayQuestion = couple ? dailyQuestion?.question : soloQuestion

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

          {state !== 'loading' && displayQuestion && (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4"
            >
              {/* No-partner notice */}
              {!couple && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl bg-primary/5 border border-primary/20 px-4 py-3 text-center"
                >
                  <p className="text-sm font-body text-primary/80">
                    💌 Connect with your partner to answer questions together!
                  </p>
                </motion.div>
              )}

              {/* Question card */}
              <div className="rounded-3xl gradient-brand p-5 shadow-soft">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-white/80">{displayQuestion.category_emoji}</span>
                  <span className="text-white/80 text-xs font-body font-semibold uppercase tracking-wider">
                    {displayQuestion.category}
                  </span>
                  <span className={`ml-auto text-xs font-body font-bold px-2 py-0.5 rounded-full ${intensityColor[displayQuestion.intensity]}`}>
                    {displayQuestion.intensity}
                  </span>
                </div>
                <p className="font-body font-bold text-white text-lg leading-snug">
                  "{displayQuestion.text}"
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
                    placeholder={couple ? "Take your time… there's no wrong answer 💭" : "Pair up to answer together!"}
                    rows={4}
                    value={answerText}
                    onChange={e => setAnswerText(e.target.value)}
                    disabled={!couple}
                  />
                  <div className="flex gap-3">
                    <Button
                      size="lg"
                      fullWidth
                      variant="outline"
                      loading={skipping}
                      onClick={handleSkip}
                      className="text-muted border-surface"
                    >
                      Skip ⏭
                    </Button>
                    <Button
                      size="lg"
                      fullWidth
                      variant="gradient"
                      loading={submitting}
                      onClick={handleSubmit}
                      disabled={!answerText.trim() || !couple}
                    >
                      Lock In 🔒
                    </Button>
                  </div>
                  {!couple && (
                    <p className="text-center text-xs text-muted font-body">
                      You can skip to preview more questions. Answering requires a partner!
                    </p>
                  )}
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
          {!couple ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">📚</div>
              <p className="font-body font-bold text-dark">No history yet</p>
              <p className="text-sm text-muted font-body mt-1">
                Connect with your partner to start building your question history!
              </p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">📚</div>
              <p className="font-body font-bold text-dark">No history yet</p>
              <p className="text-sm text-muted font-body mt-1">
                Start answering daily questions to build your history!
              </p>
            </div>
          ) : (
            history.map(({ dq, myAnswer: ma, partnerAnswer: pa }) => (
              <motion.div
                key={dq.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card padding="md">
                  {/* Header: date + intensity + category */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{dq.question?.category_emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted font-body">{format(parseISO(dq.assigned_date), 'MMM d, yyyy')}</p>
                        {dq.question?.intensity && (
                          <span className={`text-[10px] font-body font-bold px-1.5 py-0.5 rounded-full ${intensityColor[dq.question.intensity]}`}>
                            {dq.question.intensity}
                          </span>
                        )}
                      </div>
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

                  {/* Question text */}
                  <p className="font-body font-semibold text-dark text-sm leading-snug mb-3">
                    {dq.question?.text}
                  </p>

                  {/* Answers */}
                  {(ma || pa) && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-surface">
                      {ma && (
                        <div className="bg-primary/5 rounded-xl p-3">
                          <p className="text-[11px] font-body font-bold text-primary mb-1">You answered:</p>
                          <p className="text-xs text-dark font-body leading-relaxed">"{ma.answer}"</p>
                        </div>
                      )}
                      {pa && (
                        <div className="bg-secondary/5 rounded-xl p-3">
                          <p className="text-[11px] font-body font-bold text-secondary mb-1">{partnerName} answered:</p>
                          <p className="text-xs text-dark font-body leading-relaxed">"{pa.answer}"</p>
                        </div>
                      )}
                      {ma && !pa && (
                        <div className="bg-surface rounded-xl p-3">
                          <p className="text-[11px] font-body text-muted italic">Waiting for {partnerName}'s answer…</p>
                        </div>
                      )}
                      {!ma && pa && (
                        <div className="bg-surface rounded-xl p-3">
                          <p className="text-[11px] font-body text-muted italic">You didn't answer this one.</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      )}
    </div>
  )
}
