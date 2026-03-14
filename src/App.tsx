import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ReactNode } from 'react'
import { motion } from 'framer-motion'

// Screens — Onboarding
import Welcome from './screens/onboarding/Welcome'
import CreateAccount from './screens/onboarding/CreateAccount'
import JoinPartner from './screens/onboarding/JoinPartner'
import SignIn from './screens/onboarding/SignIn'
import Preferences from './screens/onboarding/Preferences'

// Screens — Main App
import Home from './screens/Home'
import Questions from './screens/Questions'
import Gifts from './screens/Gifts'
import GiftView from './screens/GiftView'
import Milestones from './screens/Milestones'
import Profile from './screens/Profile'

import AppLayout from './components/layout/AppLayout'

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="text-5xl"
      >
        💝
      </motion.div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user && profile) return <Navigate to="/home" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public / Onboarding */}
      <Route path="/" element={<PublicRoute><Welcome /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><CreateAccount /></PublicRoute>} />
      <Route path="/join" element={<PublicRoute><JoinPartner /></PublicRoute>} />
      <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />

      {/* Semi-protected: needs auth but no couple yet */}
      <Route path="/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />

      {/* Main App */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/home" element={<Home />} />
        <Route path="/questions" element={<Questions />} />
        <Route path="/gifts" element={<Gifts />} />
        <Route path="/milestones" element={<Milestones />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Public gift view — no auth required */}
      <Route path="/gift/:giftId" element={<GiftView />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
