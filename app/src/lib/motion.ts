import type { Transition, Variants } from 'motion/react'

/** Mirrors --ease-out / --ease-in-out in index.css. One easing family for the whole app. */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const

export const SPRING_SOFT: Transition = { type: 'spring', duration: 0.5, bounce: 0.2 }
export const SPRING_POP: Transition = { type: 'spring', duration: 0.45, bounce: 0.35 }

/**
 * Directional step swap. Forward: new content enters from the right, old leaves left.
 * Direction is passed via `custom` so the exiting step reads the latest direction.
 */
export const stepVariants: Variants = {
  enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
  center: {
    x: 0,
    opacity: 1,
    transition: { x: { duration: 0.5, ease: EASE_OUT }, opacity: { duration: 0.35, ease: EASE_OUT } },
  },
  exit: (dir: number) => ({
    x: dir * -28,
    opacity: 0,
    transition: { duration: 0.22, ease: EASE_OUT },
  }),
}

/**
 * Entrance group for first-run moments (welcome, success). Shrinking gaps read as a wave,
 * not a metronome. Product-UI groups use `staggerQuick`.
 */
export const heroStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.08 } },
}

export const riseIn = (distance = 14): Variants => ({
  hidden: { opacity: 0, y: distance },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
})

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: EASE_OUT } },
}

export const staggerQuick: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } },
}
