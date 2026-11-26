import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { fireConfetti } from '../lib/confetti'
import { EASE_OUT } from '../lib/motion'

/**
 * Timeline (rare moment — full delight budget):
 *   Check circle draws   — lead    — 150ms  — 600ms pathLength
 *   Checkmark draws      — lead    — 600ms  — 380ms (starts just before the circle ends)
 *   Confetti             — accent  — 820ms  — lands with the checkmark finishing
 *   Eyebrow + headline   — support — 700/800ms — rise
 *   Body, closing card   — support — 920/1060ms
 */
export function SuccessScreen({ name }: { name: string }) {
  const checkRef = useRef<HTMLDivElement>(null)
  const [highFived, setHighFived] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => {
      const rect = checkRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      fireConfetti({ x, y, count: 70, angle: -Math.PI / 2 - 0.5, spread: 1.1, power: 12 })
      fireConfetti({ x, y, count: 70, angle: -Math.PI / 2 + 0.5, spread: 1.1, power: 12 })
    }, 820)
    return () => window.clearTimeout(t)
  }, [])

  const highFive = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (highFived) return
    setHighFived(true)
    const r = e.currentTarget.getBoundingClientRect()
    fireConfetti({ x: r.left + r.width / 2, y: r.top, count: 80, spread: 1.4, power: 10 })
    if ('vibrate' in navigator) navigator.vibrate?.([10, 40, 14])
  }

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: EASE_OUT, delay },
  })

  return (
    <div className="flex flex-1 flex-col items-center py-4 text-center sm:py-2">
      <div ref={checkRef} className="relative grid h-28 w-28 place-items-center">
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgb(0_102_255/0.18),transparent)]"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [0.6, 1.35, 1.15], opacity: [0, 1, 0.7] }}
          transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.55 }}
        />
        <motion.svg
          viewBox="0 0 96 96"
          className="relative h-24 w-24"
          initial={{ scale: 0.94 }}
          animate={{ scale: [0.94, 1, 1.06, 1] }}
          transition={{ duration: 1, ease: EASE_OUT, times: [0, 0.5, 0.8, 1], delay: 0.15 }}
          aria-hidden
        >
          <defs>
            <linearGradient id="ok" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0066FF" />
              <stop offset="100%" stopColor="#00B2FF" />
            </linearGradient>
          </defs>
          <motion.circle
            cx="48"
            cy="48"
            r="44"
            fill="url(#ok)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.55, ease: EASE_OUT }}
          />
          <motion.circle
            cx="48"
            cy="48"
            r="44"
            fill="none"
            stroke="url(#ok)"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0, rotate: -90 }}
            animate={{ pathLength: 1, rotate: -90 }}
            style={{ originX: '50%', originY: '50%' }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.15 }}
          />
          <motion.path
            d="M30 49.5 L42.5 62 L66 36"
            fill="none"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.38, ease: EASE_OUT, delay: 0.6 }}
          />
        </motion.svg>
      </div>

      <motion.p {...rise(0.7)} className="mt-7 text-[12px] font-semibold tracking-[0.16em] text-brand uppercase">
        Feedback received{name ? ` · Thank you, ${name}` : ''}
      </motion.p>

      <motion.h1
        {...rise(0.8)}
        className="mt-4 max-w-[16ch] font-display text-[34px] leading-[1.1] font-medium tracking-[-0.02em] text-balance text-ink sm:text-[44px]"
      >
        Thank you for being part of our <em className="bg-[linear-gradient(100deg,var(--color-brand),var(--color-sky))] bg-clip-text pr-1 text-transparent italic">journey!</em>
      </motion.h1>

      <motion.p {...rise(0.92)} className="mt-4 max-w-[38ch] text-[16px] leading-relaxed text-slate">
        Your feedback helps us serve you better and build a fitter financial future together.
      </motion.p>

      {/* Closing interaction: a high five */}
      <motion.div {...rise(1.06)} className="mt-9 w-full max-w-[380px]">
        <div className="rounded-[22px] border border-line bg-white/80 p-5">
          <AnimatePresence mode="wait" initial={false}>
            {!highFived ? (
              <motion.div
                key="ask"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
              >
                <p className="text-[14px] text-slate">One last thing before you go…</p>
                <button
                  type="button"
                  onClick={highFive}
                  className="pressable mt-3 inline-flex h-12 items-center gap-2 rounded-full border border-brand/20 bg-brand/[0.06] px-5 text-[15px] font-semibold text-brand-deep hover:bg-brand/10"
                >
                  <motion.span
                    className="emoji-glyph text-[20px]"
                    animate={{ rotate: [0, -16, 12, -8, 0] }}
                    transition={{ duration: 0.9, delay: 2.2, repeat: Infinity, repeatDelay: 4 }}
                  >
                    🙌
                  </motion.span>
                  Send us a high five
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
              >
                <motion.div
                  className="emoji-glyph text-[38px]"
                  initial={{ rotate: -20, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', duration: 0.6, bounce: 0.45 }}
                >
                  🙌
                </motion.div>
                <p className="mt-2 text-[15.5px] font-semibold text-ink">High five received!</p>
                <p className="mt-1 text-[14px] text-slate">Here’s to your fitter financial future. You can close this page now.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div {...rise(1.2)} className="mt-9 flex flex-col items-center">
        <img src="/logo-full.png" alt="Fintness Finserv — Let’s build a fitter financial future together" className="w-[150px] opacity-90" width={288} height={264} />
      </motion.div>
    </div>
  )
}
