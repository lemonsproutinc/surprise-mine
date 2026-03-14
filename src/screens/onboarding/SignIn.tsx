import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export default function SignIn() {
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setError('')
    setLoading(true)
    try {
      const { error: signInError } = await signIn(email, password)
      if (signInError) { setError(signInError); return }
      navigate('/home')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-10">
      <div className="flex items-center gap-3 mb-10">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-2xl bg-white shadow-card flex items-center justify-center text-xl"
        >
          ←
        </button>
        <div>
          <h1 className="font-display text-2xl text-dark">Welcome Back</h1>
          <p className="text-xs text-muted font-body">Sign in to your account 💕</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 flex-1"
      >
        <div className="text-center mb-4">
          <div className="text-6xl mb-2">💝</div>
          <p className="text-muted font-body text-sm">Your partner is waiting for you!</p>
        </div>

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
          placeholder="Your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          icon="🔒"
        />

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500 font-body text-center bg-red-50 rounded-2xl py-2 px-4"
          >
            {error}
          </motion.p>
        )}

        <Button size="lg" fullWidth variant="gradient" loading={loading} onClick={handleSignIn} className="mt-4">
          Sign In 💕
        </Button>

        <p className="text-center text-xs text-muted font-body mt-2">
          Don't have an account?{' '}
          <button onClick={() => navigate('/signup')} className="text-primary font-bold">
            Create one
          </button>
        </p>
      </motion.div>
    </div>
  )
}
