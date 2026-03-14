import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Profile, Couple } from '../types'
import { getTotalHearts } from '../lib/hearts'

const IDLE_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes

interface AuthContextType {
  user: User | null
  profile: Profile | null
  couple: Couple | null
  partnerProfile: Profile | null
  totalHearts: number
  currentStreak: number
  loading: boolean
  signUp: (
    email: string,
    password: string,
    name: string,
    stage: string,
    partnerName: string
  ) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshHearts: () => Promise<void>
  linkPartner: (code: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'LOVE-'
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function generateShareToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let token = ''
  for (let i = 0; i < 8; i++) {
    token += chars[Math.floor(Math.random() * chars.length)]
  }
  return token
}

// Export for use in gifts
export { generateShareToken }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [couple, setCouple] = useState<Couple | null>(null)
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null)
  const [totalHearts, setTotalHearts] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  const lastActivityRef = useRef<number>(Date.now())
  const idleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const userRef = useRef<User | null>(null)

  // Keep userRef in sync for idle timer closure
  useEffect(() => {
    userRef.current = user
  }, [user])

  const loadProfile = async (userId: string) => {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !profileData) return

    setProfile(profileData)

    if (profileData.couple_id) {
      const { data: coupleData } = await supabase
        .from('couples')
        .select('*')
        .eq('id', profileData.couple_id)
        .single()

      if (coupleData) {
        setCouple(coupleData)
        const partnerId =
          coupleData.user1_id === userId ? coupleData.user2_id : coupleData.user1_id
        const { data: partnerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', partnerId)
          .single()
        if (partnerData) setPartnerProfile(partnerData)
      }
    }

    const hearts = await getTotalHearts(userId)
    setTotalHearts(hearts)

    const { data: streakData } = await supabase
      .from('streaks')
      .select('current_streak')
      .eq('user_id', userId)
      .single()
    if (streakData) setCurrentStreak(streakData.current_streak)
  }

  // Idle timer setup
  const setupIdleTimer = () => {
    // Track user activity
    const resetTimer = () => {
      lastActivityRef.current = Date.now()
    }

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))

    // Check every 60s if user has been idle for 15min
    idleIntervalRef.current = setInterval(() => {
      if (!userRef.current) return
      const idleTime = Date.now() - lastActivityRef.current
      if (idleTime >= IDLE_TIMEOUT_MS) {
        supabase.auth.signOut()
      }
    }, 60_000)

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      if (idleIntervalRef.current) clearInterval(idleIntervalRef.current)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setProfile(null)
        setCouple(null)
        setPartnerProfile(null)
        setTotalHearts(0)
        setCurrentStreak(0)
      }
      setLoading(false)
    })

    const cleanupIdle = setupIdleTimer()

    return () => {
      subscription.unsubscribe()
      cleanupIdle()
    }
  }, [])

  const signUp = async (
    email: string,
    password: string,
    name: string,
    stage: string,
    partnerName: string
  ) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    if (!data.user) return { error: 'Signup failed. Please try again.' }

    const inviteCode = generateInviteCode()

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name,
      email,
      relationship_stage: stage,
      partner_name: partnerName,
      invite_code: inviteCode,
    })

    if (profileError) return { error: profileError.message }

    await supabase.from('invite_codes').insert({
      code: inviteCode,
      creator_id: data.user.id,
    })

    return { error: null }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id)
  }

  const refreshHearts = async () => {
    if (user) {
      const hearts = await getTotalHearts(user.id)
      setTotalHearts(hearts)
    }
  }

  const linkPartner = async (code: string): Promise<{ error: string | null }> => {
    if (!user || !profile) return { error: 'Not signed in' }

    // Validate the invite code
    const { data: inviteData, error: inviteError } = await supabase
      .from('invite_codes')
      .select('*, creator:creator_id(id, name)')
      .eq('code', code.toUpperCase().trim())
      .eq('used', false)
      .single()

    if (inviteError || !inviteData) {
      return { error: 'Invalid or already used invite code.' }
    }

    if (inviteData.creator_id === user.id) {
      return { error: "That's your own invite code! Share it with your partner." }
    }

    const partnerId = inviteData.creator_id

    // Create the couple
    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .insert({ user1_id: partnerId, user2_id: user.id })
      .select()
      .single()

    if (coupleError || !coupleData) {
      return { error: 'Failed to create couple. Please try again.' }
    }

    // Update both profiles with couple_id
    await supabase.from('profiles').update({ couple_id: coupleData.id }).eq('id', user.id)
    await supabase.from('profiles').update({ couple_id: coupleData.id }).eq('id', partnerId)

    // Mark invite code as used
    await supabase
      .from('invite_codes')
      .update({ used: true, used_by: user.id })
      .eq('code', code.toUpperCase().trim())

    // Deliver pending gifts from current user to partner
    await supabase
      .from('gifts')
      .update({ to_user_id: partnerId, couple_id: coupleData.id, pending: false })
      .eq('from_user_id', user.id)
      .eq('pending', true)

    // Deliver pending gifts from partner to current user
    await supabase
      .from('gifts')
      .update({ to_user_id: user.id, couple_id: coupleData.id, pending: false })
      .eq('from_user_id', partnerId)
      .eq('pending', true)

    // Migrate solo milestones to couple
    await supabase
      .from('milestones')
      .update({ couple_id: coupleData.id })
      .eq('created_by', user.id)
      .is('couple_id', null)

    await supabase
      .from('milestones')
      .update({ couple_id: coupleData.id })
      .eq('created_by', partnerId)
      .is('couple_id', null)

    // Migrate solo daily questions to couple
    await supabase
      .from('daily_questions')
      .update({ couple_id: coupleData.id, user_id: null })
      .eq('user_id', user.id)
      .is('couple_id', null)

    // Refresh profile to get updated couple/partner data
    await loadProfile(user.id)

    return { error: null }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        couple,
        partnerProfile,
        totalHearts,
        currentStreak,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        refreshHearts,
        linkPartner,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
