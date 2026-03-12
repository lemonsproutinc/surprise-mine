import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export default function JoinPartner() {
  const navigate = useNavigate()
  const { signUp, refreshProfile } = useAuth()

  const [inviteCode, setInviteCode] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [codeValidated, setCodeValidated] = useState(false)
  const [partnerName, setPartnerName] = useState('')
  const [codeChecking, setCodeChecking] = useState(false)

  const validateCode = async () => {
    const code = inviteCode.toUpperCase().trim()
    if (!code) return
    setCodeChecking(true)
    setError('')

    const { data, error: codeError } = await supabase
      .from('invite_codes')
      .select('*, creator:creator_id(name)')
      .eq('code', code)
      .eq('used', false)
      .single()

    setCodeChecking(false)
    if (codeError || !data) {
      setError('Invalid or already used invite code. Double-check with your partner!')
      return
    }

    setPartnerName((data.creator as any)?.name ?? 'your partner')
    setCodeValidated(true)
  }

  const handleJoin = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setError('')
    setLoading(true)

    // Sign up the new user
    const { error: signUpError } = await signUp(email, password, name, 'dating', partnerName)
    if (signUpError) {
      setError(signUpError)
      setLoading(false)
      return
    }

    // Re-fetch session to get user ID
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Something went wrong. Please try again.'); setLoading(false); return }

    // Get invite code record
    const { data: codeData } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', inviteCode.toUpperCase().trim())
      .single()

    if (!codeData) { setError('Could not find invite code.'); setLoading(false); return }

    // Create couple
    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .insert({ user1_id: codeData.creator_id, user2_id: user.id })
      .select()
      .single()

    if (coupleError || !coupleData) {
      setError('Could not create couple. Please try again.')
      setLoading(false)
      return
    }

    // Update both profiles with couple_id
    await supabase.from('profiles').update({ couple_id: coupleData.id }).eq('id', user.id)
    await supabase.from('profiles').update({ couple_id: coupleData.id }).eq('id', codeData.creator_id)

    // Mark invite code as used
    await supabase.from('invite_codes').update({ used: true, used_by: user.id }).eq('id', codeData.id)

    await refreshProfile()
    setLoading(false)
    navigate('/preferences')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-2xl bg-white shadow-card flex items-center justify-center text-xl"
        >
          ←
        </button>
        <div>
          <h1 className="font-display text-2xl text-dark">Join My Partner</h1>
          <p className="text-xs text-muted font-body">Enter your partner's invite code 💌</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-5">
        {/* Step 1: Enter code */}
        <div>
          <p className="text-xs font-body font-bold text-muted uppercase tracking-wider mb-3">Invite Code</p>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="e.g. LOVE-7X3K"
                value={inviteCode}
                onChange={e => { setInviteCode(e.target.value.toUpperCase()); setCodeValidated(false) }}
                icon="🔑"
                disabled={codeValidated}
              />
            </div>
            {!codeValidated && (
              <Button
                onClick={validateCode}
                loading={codeChecking}
                variant="secondary"
                className="self-end rounded-2xl"
                size="md"
              >
                Check
              </Button>
            )}
          </div>

          {codeValidated && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 flex items-center gap-2 text-success font-body font-semibold text-sm bg-success/10 rounded-2xl px-3 py-2"
            >
              <span>✅</span>
              <span>Connected to <strong>{partnerName}</strong>! Now create your account below.</span>
            </motion.div>
          )}
        </div>

        {/* Step 2: Create account (shown after code validated) */}
        {codeValidated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            <div>
              <p className="text-xs font-body font-bold text-muted uppercase tracking-wider mb-3">Your Info</p>
              <div className="flex flex-col gap-3">
                <Input
                  label="Your Name"
                  placeholder="e.g. Jordan"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  icon="👤"
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  icon="📧"
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  icon="🔒"
                />
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500 font-body text-center bg-red-50 rounded-2xl py-2 px-4"
          >
            {error}
          </motion.p>
        )}

        {codeValidated && (
          <Button
            size="lg"
            fullWidth
            variant="gradient"
            loading={loading}
            onClick={handleJoin}
            className="mt-auto"
          >
            Join {partnerName} 💕
          </Button>
        )}
      </div>
    </div>
  )
}
