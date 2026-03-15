import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Profile, Couple } from '../types'
import { getTotalHearts } from '../lib/hearts'

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
  linkPartner: (code: string) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
  refreshHearts: () => Promise<void>
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [couple, setCouple] = useState<Couple | null>(null)
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null)
  const [totalHearts, setTotalHearts] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [loading, setLoading] = useState(true)

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

    return () => subscription.unsubscribe()
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

  const linkPartner = async (code: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not logged in.' }
    const trimmedCode = code.toUpperCase().trim()

    const { data: codeData, error: codeError } = await supabase
      .from('invite_codes')
      .select('*, creator:creator_id(name)')
      .eq('code', trimmedCode)
      .eq('used', false)
      .single()

    if (codeError || !codeData) return { error: 'Invalid or already used invite code.' }
    if (codeData.creator_id === user.id) return { error: 'You cannot connect with yourself!' }

    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .insert({ user1_id: codeData.creator_id, user2_id: user.id })
      .select()
      .single()

    if (coupleError || !coupleData) return { error: 'Could not create couple. Please try again.' }

    await supabase.from('profiles').update({ couple_id: coupleData.id }).eq('id', user.id)
    await supabase.from('profiles').update({ couple_id: coupleData.id }).eq('id', codeData.creator_id)
    await supabase.from('invite_codes').update({ used: true, used_by: user.id }).eq('id', codeData.id)

    await loadProfile(user.id)
    return { error: null }
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
        linkPartner,
        refreshProfile,
        refreshHearts,
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
