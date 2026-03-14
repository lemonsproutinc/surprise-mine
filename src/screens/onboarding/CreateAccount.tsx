import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { RELATIONSHIP_STAGES } from '../../types'

export default function CreateAccount() {
  const navigate = useNavigate()
  const { signUp } = useAuth()

  const [step, setStep] = useState<'form' | 'code'>('form')
  const [inviteCode, setInviteCode] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [partnerName, setPartnerName] = useState('')
  const [stage, setStage] = useState('dating')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name || !email || !password || !partnerName) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setError('')
    setLoading(true)

    const { error: signUpError } = await signUp(email, password, name, stage, partnerName)

    if (signUpError) {
      setError(signUpError)
      setLoading(false)
      return
    }

    // Fetch the generated invite code from the profile
    setLoading(false)
    // Navigate to preferences — the invite code is shown there
    navigate('/preferences')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-2xl bg-white shadow-card flex items-center justify-center text-xl"
        >
          ←
        </button>
        <div>
          <h1 className="font-display text-2xl text-dark">Create Account</h1>
          <p className="text-xs text-muted font-body">Start your journey together 💑</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-5">
        {/* Your info */}
        <div>
          <p className="text-xs font-body font-bold text-muted uppercase tracking-wider mb-3">About You</p>
          <div className="flex flex-col gap-3">
            <Input
              label="Your Name"
              placeholder="e.g. Alex"
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

        {/* Partner info */}
        <div>
          <p className="text-xs font-body font-bold text-muted uppercase tracking-wider mb-3">Your Partner</p>
          <Input
            label="Partner's Name or Nickname"
            placeholder="e.g. Jordan"
            value={partnerName}
            onChange={e => setPartnerName(e.target.value)}
            icon="💕"
          />
        </div>

        {/* Relationship stage */}
        <div>
          <p className="text-xs font-body font-bold text-muted uppercase tracking-wider mb-3">Relationship Stage</p>
          <div className="grid grid-cols-2 gap-2">
            {RELATIONSHIP_STAGES.map(({ value, label, emoji }) => (
              <motion.button
                key={value}
                whileTap={{ scale: 0.96 }}
                onClick={() => setStage(value)}
                className={`flex items-center gap-2 px-3 py-3 rounded-2xl border-2 font-body font-semibold text-sm transition-colors ${
                  stage === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-surface bg-white text-dark'
                }`}
              >
                <span>{emoji}</span>
                <span>{label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500 font-body text-center bg-red-50 rounded-2xl py-2 px-4"
          >
            {error}
          </motion.p>
        )}

        <Button
          size="lg"
          fullWidth
          variant="gradient"
          loading={loading}
          onClick={handleSubmit}
          className="mt-auto"
        >
          Create Account ✨
        </Button>

        <p className="text-center text-xs text-muted font-body">
          After creating your account, you'll get an invite code to share with your partner.
        </p>
      </div>
    </div>
  )
}
