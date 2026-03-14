import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { DailyQuestion, QuestionAnswer, QuestionRating } from '../types'
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

  // History detail popup
  const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(null)
  const [userRating, setUserRating] = useState<number>(0)
  const [savingRating, setSavingRating] = useState(false)

  const partnerName = partnerProfile?.name?.split(' ')[0] ?? 'your partner'

  useEffect(() => {
    if (!user) { setState('unanswered'); return }
    loadTodayQuestion()
    loadHistory()
  }, [user, couple])

  const loadTodayQuestion = async () => {
    if (!user) return

    const today = new Date().toISOString().split('T')[0]

    let dq: DailyQuestion | null = null

    if (couple) {
      // Couple mode: assign by couple_id
      const { data } = await supabase
        .from('daily_questions')
        .select('*, question:question_id(*)')
        .eq('couple_id', couple.id)
        .eq('assigned_date', today)
        .single()
      dq = data

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
    } else {
      // Solo mode: assign by user_id
      const { data } = await supabase
        .from('daily_questions')
        .select('*, question:question_id(*)')
        .eq('user_id', user.id)
        .eq('assigned_date', today)
        .single()
      dq = data

      if (!dq) {
        const { data: questions } = await supabase.from('questions').select('id').limit(100)
        if (questions && questions.length > 0) {
          const randomQ = questions[Math.floor(Math.random() * questions.length)]
          const { data: newDq } = await supabase
            .from('daily_questions')
            .insert({ user_id: user.id, question_id: randomQ.id, assigned_date: today })
            .select('*, question:question_id(*)')
            .single()
          dq = newDq
        }
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
    if (!user) return
    const today = new Date().toISOString().split('T')[0]

    let query = supabase
      .from('daily_questions')
      .select('*, question:question_id(*)')
      .lt('assigned_date', today)
      .order('assigned_date', { ascending: false })
      .limit(20)

    if (couple) {
      query = query.eq('couple_id', couple.id)
    } else {
      query = query.eq('user_id', user.id)
    }

    const { data: dqs } = await query
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
      setState(couple ? 'submitted' : 'revealed')
    }

    setSubmitting(false)
  }

  const handleSelectHistory = async (item: HistoryItem) => {
    setSelectedHistory(item)
    setUserRating(0)

    if (!user) return
    // Load existing rating
    const { data } = await supabase
      .from('question_ratings')
      .select('*')
      .eq('daily_question_id', item.dq.id)
      .eq('user_id', user.id)
      .single()

    if (data) setUserRating(data.rating)
  }

  const handleRate = async (rating: number) => {
    if (!user || !selectedHistory) return
    setSavingRating(true)
    setUserRating(rating)

    // Upsert rating
    const { data: existing } = await supabase
      .from('question_ratings')
      .select('id')
      .eq('daily_question_id', selectedHistory.dq.id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      await supabase
        .from('question_ratings')
        .update({ rating })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('question_ratings')
        .insert({
          daily_question_id: selectedHistory.dq.id,
          user_id: user.id,
          rating,
        })
    }
    setSavingRating(false)
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
              <span className="text-5xl animate-pulse-heart">💝</span>
            </motion.div>
          )}

          {dailyQuestion?.question && (
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

              {/* Waiting state (only in couple mode) */}
              {state === 'submitted' && (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-3xl bg-surface p-5 text-center"
                >
                  <div className="text-5xl mb-3 animate-wiggle">
                    🔒
                  </div>
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
              {state === 'revealed' && myAnswer && (
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
                    <p className="font-body font-bold text-dark text-sm">
                      {partnerAnswer ? "Both answered! Here's what you said:" : "Here's your answer:"}
                    </p>
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
                  {partnerAnswer && (
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
                  )}

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="rounded-2xl bg-surface p-3 text-center"
                  >
                    <p className="text-xs text-muted font-body">
                      {partnerAnswer
                        ? '💬 Talk about what surprised you about each other\'s answers!'
                        : couple
                          ? `💬 Your partner hasn't answered yet. Check back later!`
                          : '💬 Connect with your partner on Profile to see their answers!'}
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
            history.map(item => {
              const { dq, myAnswer: ma, partnerAnswer: pa } = item
              return (
                <Card
                  key={dq.id}
                  padding="md"
                  animate
                  onClick={() => handleSelectHistory(item)}
                  className="cursor-pointer hover:shadow-soft transition-shadow"
                >
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
                      {couple && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-lg font-body font-bold ${pa ? 'bg-secondary/10 text-secondary' : 'bg-surface text-muted'}`}>
                          {pa ? `${partnerName} ✓` : `${partnerName} –`}
                        </span>
                      )}
                    </div>
                  </div>
                  {ma && (
                    <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-surface">
                      <p className="text-xs text-dark font-body line-clamp-1">
                        <span className="font-bold text-primary">You:</span> "{ma.answer}"
                      </p>
                      {pa && (
                        <p className="text-xs text-dark font-body line-clamp-1">
                          <span className="font-bold text-secondary">{partnerName}:</span> "{pa.answer}"
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </motion.div>
      )}

      {/* History detail popup */}
      <AnimatePresence>
        {selectedHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-dark/60 backdrop-blur-sm z-50 flex items-center justify-center px-6"
            onClick={e => { if (e.target === e.currentTarget) setSelectedHistory(null) }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-medium max-h-[80vh] overflow-y-auto"
            >
              {/* Question info */}
              <div className="flex items-center gap-2 mb-3">
                <span>{selectedHistory.dq.question?.category_emoji}</span>
                <span className="text-xs font-body font-semibold text-muted uppercase tracking-wider">
                  {selectedHistory.dq.question?.category}
                </span>
                {selectedHistory.dq.question && (
                  <span className={`ml-auto text-xs font-body font-bold px-2 py-0.5 rounded-full ${intensityColor[selectedHistory.dq.question.intensity]}`}>
                    {selectedHistory.dq.question.intensity}
                  </span>
                )}
              </div>

              <p className="font-body font-bold text-dark text-base leading-snug mb-4">
                "{selectedHistory.dq.question?.text}"
              </p>

              <p className="text-xs text-muted font-body mb-3">
                {format(parseISO(selectedHistory.dq.assigned_date), 'MMMM d, yyyy')}
              </p>

              {/* Answers */}
              {selectedHistory.myAnswer && (
                <div className="mb-3">
                  <div className="bg-primary/5 rounded-2xl p-3 border border-primary/10">
                    <p className="text-xs text-primary font-body font-bold mb-1">You said:</p>
                    <p className="font-body text-dark text-sm leading-relaxed">
                      "{selectedHistory.myAnswer.answer}"
                    </p>
                    <p className="text-[10px] text-muted font-body mt-1">
                      {format(parseISO(selectedHistory.myAnswer.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              )}

              {selectedHistory.partnerAnswer && (
                <div className="mb-3">
                  <div className="bg-secondary/5 rounded-2xl p-3 border border-secondary/10">
                    <p className="text-xs text-secondary font-body font-bold mb-1">{partnerName} said:</p>
                    <p className="font-body text-dark text-sm leading-relaxed">
                      "{selectedHistory.partnerAnswer.answer}"
                    </p>
                    <p className="text-[10px] text-muted font-body mt-1">
                      {format(parseISO(selectedHistory.partnerAnswer.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              )}

              {/* Rating widget */}
              <div className="border-t border-surface pt-3 mt-3">
                <p className="text-xs font-body font-bold text-muted uppercase tracking-wider mb-2">
                  Rate this question
                </p>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button
                      key={i}
                      onClick={() => handleRate(i)}
                      disabled={savingRating}
                      className="text-2xl transition-transform hover:scale-110 active:scale-90"
                    >
                      {i <= userRating ? '❤️' : '🤍'}
                    </button>
                  ))}
                </div>
                {userRating > 0 && (
                  <p className="text-xs text-muted font-body text-center mt-1">
                    You rated this {userRating}/5
                  </p>
                )}
              </div>

              <Button
                fullWidth
                variant="ghost"
                onClick={() => setSelectedHistory(null)}
                className="mt-4"
              >
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
