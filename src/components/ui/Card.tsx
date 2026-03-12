import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: ReactNode
  className?: string
  gradient?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
  animate?: boolean
}

export default function Card({
  children,
  className = '',
  gradient = false,
  onClick,
  padding = 'md',
  animate = false,
}: CardProps) {
  const paddings = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-5' }

  return (
    <motion.div
      whileTap={onClick ? { scale: 0.98 } : undefined}
      initial={animate ? { opacity: 0, y: 16 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      onClick={onClick}
      className={`rounded-3xl shadow-card ${gradient ? 'gradient-brand text-white' : 'bg-white'} ${paddings[padding]} ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}
