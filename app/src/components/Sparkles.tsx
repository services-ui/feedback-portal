import { motion } from 'motion/react'
import { EASE_OUT } from '../lib/motion'
import type { RatingVariant } from '../types'

interface Props {
  tone: string
  variant: RatingVariant
}

const DELAY = 0.08 // land with the emoji's pop peak, not the tap

/**
 * One-shot particle burst centred on its parent. Mount with a fresh `key` per selection.
 * Each category gets its own particle language so three ratings in a row never feel identical.
 */
export function Sparkles({ tone, variant }: Props) {
  const count = variant === 'rings' ? 6 : 8
  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (variant === 'stars' ? Math.PI / 8 : 0)
    const dist = (variant === 'stars' ? 44 : 38) + (i % 2) * 10
    return { i, x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, alt: i % 2 === 1 }
  })

  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
      {variant === 'rings' && (
        <motion.span
          className="absolute h-14 w-14 rounded-full border-2"
          style={{ borderColor: tone }}
          initial={{ scale: 0.6, opacity: 0.7 }}
          animate={{ scale: 1.9, opacity: 0 }}
          transition={{ duration: 0.65, ease: EASE_OUT, delay: DELAY }}
        />
      )}
      {particles.map((p) => (
        <motion.span
          key={p.i}
          className="absolute"
          initial={{ x: 0, y: 0, scale: 0.4, opacity: 1, rotate: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            scale: [0.4, 1, 0.6],
            opacity: [1, 1, 0],
            rotate: variant === 'stars' ? 140 : 0,
          }}
          transition={{ duration: 0.62, ease: EASE_OUT, delay: DELAY + (p.alt ? 0.04 : 0) }}
        >
          {variant === 'stars' ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill={p.alt ? '#00B2FF' : tone}>
              <path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0Z" />
            </svg>
          ) : (
            <span
              className="block rounded-full"
              style={{
                width: p.alt ? 5 : 7,
                height: p.alt ? 5 : 7,
                background: p.alt ? '#00B2FF' : tone,
              }}
            />
          )}
        </motion.span>
      ))}
    </span>
  )
}
