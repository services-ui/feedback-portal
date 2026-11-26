import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { EASE_OUT } from '../lib/motion'

const MESSAGES = ['Packing up your feedback…', 'Sending it securely…', 'Almost there…']

/** Full-screen, input-blocking loader shown only while the request is in flight. */
export function SubmissionLoader({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loader"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
          className="fixed inset-0 z-50 grid place-items-center bg-cloud/[0.96] px-6"
        >
          <motion.div
            initial={{ scale: 0.96, y: 6 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className="flex flex-col items-center text-center"
          >
            <div className="relative grid h-28 w-28 place-items-center">
              <div
                aria-hidden
                className="spin-ring absolute inset-0 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, rgb(0 102 255 / 0) 0deg, #0066FF 260deg, #00B2FF 340deg, rgb(0 178 255 / 0) 360deg)',
                  WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
                  mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
                }}
              />
              <div className="grid h-[92px] w-[92px] place-items-center rounded-full bg-white shadow-[var(--shadow-card)]">
                <motion.img
                  src="/logo-mark.png"
                  alt=""
                  className="w-[54px]"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 1.2, ease: 'easeInOut', repeat: Infinity }}
                />
              </div>
            </div>
            <CyclingMessage />
            <p className="mt-1.5 text-[13px] text-hush">Please keep this page open.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function CyclingMessage() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setI((n) => Math.min(n + 1, MESSAGES.length - 1)), 1700)
    return () => window.clearInterval(t)
  }, [])
  return (
    <div className="relative mt-7 h-7 w-72">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="absolute inset-x-0 font-display text-[20px] font-medium text-ink"
        >
          {MESSAGES[i]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
