import { AnimatePresence, motion } from 'motion/react'
import { EASE_OUT, SPRING_SOFT } from '../lib/motion'

interface Props {
  steps: string[]
  current: number
}

/**
 * Segmented progress. Completed segments are filled, the active one fills with a gentle
 * shimmer; fills animate on scaleX (transform only). Label crossfades between steps.
 */
export function FeedbackProgress({ steps, current }: Props) {
  return (
    <div className="w-full" role="group" aria-label="Progress">
      <div className="mb-2 flex items-baseline justify-between text-[12px] font-medium">
        <div className="relative h-4 flex-1 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={steps[current]}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="absolute left-0 tracking-wide text-navy"
            >
              {steps[current]}
            </motion.span>
          </AnimatePresence>
        </div>
        <span className="tabular-nums text-hush" aria-live="polite">
          Step {current + 1} of {steps.length}
        </span>
      </div>
      <div className="flex gap-1.5">
        {steps.map((label, i) => {
          const state = i < current ? 'done' : i === current ? 'active' : 'todo'
          return (
            <div key={label} className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-navy/[0.08]">
              <motion.div
                className="absolute inset-0 origin-left rounded-full bg-[linear-gradient(90deg,var(--color-brand),var(--color-sky))]"
                initial={false}
                animate={{ scaleX: state === 'todo' ? 0 : 1 }}
                transition={SPRING_SOFT}
              />
              {state === 'active' && <div className="progress-shimmer absolute inset-0 rounded-full" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
