import { supabase } from './supabase'

export const HEARTS = {
  DAILY_QUESTION: 3,
  SEND_GIFT: 5,
  BOTH_ANSWERED: 5,
  LOG_MILESTONE: 15,
  WEEKLY_STREAK: 20,
}

export async function awardHearts(userId: string, amount: number, reason: string) {
  const { error } = await supabase.from('hearts_transactions').insert({
    user_id: userId,
    amount,
    reason,
  })
  return { error }
}

export async function getTotalHearts(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('hearts_transactions')
    .select('amount')
    .eq('user_id', userId)

  if (error || !data) return 0
  return data.reduce((sum, t) => sum + t.amount, 0)
}

export async function updateStreak(userId: string) {
  const today = new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!existing) {
    await supabase.from('streaks').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
    })
    return
  }

  const lastDate = existing.last_activity_date
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let newStreak = existing.current_streak
  if (lastDate === yesterdayStr) {
    newStreak += 1
  } else if (lastDate !== today) {
    newStreak = 1
  }

  await supabase.from('streaks').update({
    current_streak: newStreak,
    longest_streak: Math.max(newStreak, existing.longest_streak),
    last_activity_date: today,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId)
}
