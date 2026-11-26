import { Clock3, ShieldCheck, Smile } from 'lucide-react'
import { motion } from 'motion/react'
import { PrimaryButton } from './Button'
import { EMOJI_LEVELS } from '../data/feedback'
import { EASE_OUT, fadeIn, heroStagger, riseIn } from '../lib/motion'

/**
 * Timeline (first-run, delight budget):
 *   Logo medallion — lead   — 0ms    — scale .92→1 + fade, 700ms, then one gentle "lift"
 *   Eyebrow pill   — decor  — 80ms   — fade only
 *   Headline       — lead   — 190ms  — 18px rise
 *   Supporting     — support— 300ms  — 12px rise
 *   CTA            — support— 410ms  — 10px rise (clickable immediately when visible)
 *   Trust row      — decor  — 520ms  — fade only
 */
export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      variants={heroStagger}
      initial="hidden"
      animate="show"
      className="flex flex-1 flex-col items-center justify-center py-10 text-center sm:py-16"
    >
      <LogoMedallion />

      <motion.div
        variants={fadeIn}
        className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-brand/15 bg-white/80 py-1.5 pr-3.5 pl-2 text-[12px] font-medium tracking-wide text-navy shadow-[0_4px_14px_-6px_rgb(21_53_92/0.18)]"
      >
        <EmojiWave />
        <span className="h-3.5 w-px bg-navy/15" />
        Client Feedback
      </motion.div>

      <motion.h1
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.075 } } }}
        className="mt-5 max-w-[13ch] font-display text-[42px] leading-[1.06] font-medium tracking-[-0.02em] text-ink sm:text-[60px] lg:text-[68px]"
      >
        {['Your', 'experience'].map((w) => (
          <Word key={w}>{w}</Word>
        ))}{' '}
        <Word>
          <em className="bg-[linear-gradient(100deg,var(--color-brand),var(--color-sky))] bg-clip-text pr-1 font-normal text-transparent italic">
            matters
          </em>
        </Word>
        {['to', 'us.'].map((w) => (
          <Word key={w}>{w}</Word>
        ))}
      </motion.h1>

      <motion.p
        variants={riseIn(12)}
        className="mt-5 max-w-[34ch] text-[16.5px] leading-relaxed text-slate sm:max-w-[44ch] sm:text-[18px]"
      >
        Your feedback helps us build a fitter financial future together. Take a moment to tell us
        how we’re doing.
      </motion.p>

      <motion.div variants={riseIn(10)} className="mt-9 w-full max-w-[340px] sm:w-auto">
        <PrimaryButton onClick={onStart} className="w-full sm:w-auto sm:px-9">
          Share Your Experience
        </PrimaryButton>
      </motion.div>

      <motion.ul
        variants={fadeIn}
        className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-slate"
      >
        <TrustItem icon={<Clock3 className="h-4 w-4" />}>About a minute</TrustItem>
        <TrustItem icon={<Smile className="h-4 w-4" />}>3 quick questions</TrustItem>
        <TrustItem icon={<ShieldCheck className="h-4 w-4" />}>Shared only with Fintness</TrustItem>
      </motion.ul>
    </motion.div>
  )
}

/** Headline word: rises and sharpens out of a soft blur. One-time, first-run moment. */
function Word({ children }: { children: React.ReactNode }) {
  return (
    <>
      <motion.span
        className="inline-block"
        variants={{
          hidden: { opacity: 0, y: 22, filter: 'blur(8px)' },
          show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE_OUT } },
        }}
      >
        {children}
      </motion.span>{' '}
    </>
  )
}

/** The five moods doing a small Mexican wave — a teaser of the rating to come. */
function EmojiWave() {
  return (
    <span aria-hidden className="flex items-center -space-x-0.5">
      {EMOJI_LEVELS.map((l, i) => (
        <motion.span
          key={l.value}
          className="emoji-glyph grid h-6 w-6 place-items-center rounded-full bg-white text-[14px] ring-1 ring-white"
          animate={{ y: [0, -5, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 1.3 + i * 0.08, repeat: Infinity, repeatDelay: 3 }}
        >
          {l.emoji}
        </motion.span>
      ))}
    </span>
  )
}

function TrustItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span className="text-brand/80">{icon}</span>
      {children}
    </li>
  )
}

function LogoMedallion() {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.92 },
        show: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: EASE_OUT } },
      }}
      className="relative"
    >
      {/* Halo rings */}
      <div aria-hidden className="absolute -inset-6 rounded-full bg-[radial-gradient(closest-side,rgb(0_102_255/0.14),transparent)]" />
      <motion.div
        aria-hidden
        className="absolute -inset-3 rounded-full border border-brand/15"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: [0, 1, 0], scale: [0.9, 1.12, 1.25] }}
        transition={{ duration: 2.4, ease: 'easeOut', delay: 0.6, repeat: Infinity, repeatDelay: 3.2 }}
      />
      <div className="relative grid h-32 w-32 place-items-center rounded-full border border-white bg-white shadow-[var(--shadow-card)] sm:h-36 sm:w-36">
        {/* The barbell does one satisfying "rep" once the medallion lands */}
        <motion.img
          src="/logo-mark.png"
          alt="Fintness Finserv"
          width={273}
          height={215}
          className="h-auto w-[78px] sm:w-[88px]"
          initial={{ y: 0 }}
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.75 }}
        />
      </div>
    </motion.div>
  )
}
