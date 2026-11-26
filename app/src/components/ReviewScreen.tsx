import { AlertTriangle, Lock, Pencil, RotateCw, Send } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { ActionBar, BackButton, PrimaryButton } from './Button'
import { CATEGORIES, levelFor } from '../data/feedback'
import { EASE_OUT } from '../lib/motion'
import { cleanText, firstName, needsReason, normalizeMobile } from '../lib/validation'
import type { CategoryId, FeedbackState, StepId } from '../types'

interface Props {
  state: FeedbackState
  onEdit: (step: StepId) => void
  onBack: () => void
  onSubmit: () => void
  submitting: boolean
  error: string | null
}

export function ReviewScreen({ state, onEdit, onBack, onSubmit, submitting, error }: Props) {
  const name = firstName(state.client.name)
  const mobile = normalizeMobile(state.client.mobile)
  return (
    <div className="flex flex-1 flex-col">
      <p className="text-[12px] font-semibold tracking-[0.16em] text-brand uppercase">Review</p>
      <h1 className="mt-3 font-display text-[34px] leading-[1.08] font-medium tracking-[-0.015em] text-ink sm:text-[42px]">
        Almost there<span className="text-brand">!</span>
      </h1>
      <p className="mt-3 text-[15.5px] leading-relaxed text-slate">
        Here’s what you’ve shared{name ? `, ${name}` : ''}. Tap <em className="font-medium not-italic text-navy">Edit</em> on
        anything you’d like to change.
      </p>

      <div className="mt-7 space-y-3">
        <ReviewCard title="About you" onEdit={() => onEdit('details')} disabled={submitting}>
          <p className="text-[16px] font-semibold text-ink">{cleanText(state.client.name)}</p>
          <p className="mt-0.5 text-[14px] text-slate tabular-nums">
            {mobile.ok && mobile.value ? formatMobile(mobile.value) : 'Mobile not shared'}
          </p>
        </ReviewCard>

        {CATEGORIES.map((c) => (
          <CategoryReview key={c.id} id={c.id} state={state} onEdit={() => onEdit(c.id)} disabled={submitting} />
        ))}
      </div>

      <AnimatePresence initial={false}>
        {error && (
          <motion.div
            key={error}
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-danger/20 bg-[#FEF3F2] p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
              <div className="text-[14px] leading-relaxed">
                <p className="font-semibold text-[#912018]">Your feedback wasn’t sent yet</p>
                <p className="mt-0.5 text-[#B42318]">{error}</p>
                <p className="mt-1 text-[13px] text-[#B42318]/80">Your answers are still here — nothing has been lost.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-[12.5px] text-hush">
        <Lock className="h-3.5 w-3.5" /> Sent securely and shared only with the Fintness team.
      </p>

      <ActionBar>
        <BackButton onClick={onBack} />
        <PrimaryButton
          onClick={onSubmit}
          disabled={submitting}
          aria-busy={submitting}
          arrow={false}
          className="flex-1"
          icon={error ? <RotateCw className="h-[18px] w-[18px]" /> : <Send className="h-[17px] w-[17px]" />}
        >
          {error ? 'Try Again' : 'Submit My Feedback'}
        </PrimaryButton>
      </ActionBar>
    </div>
  )
}

function formatMobile(v: string) {
  const m = v.match(/^\+91(\d{5})(\d{5})$/)
  return m ? `+91 ${m[1]} ${m[2]}` : v
}

function ReviewCard({
  title,
  onEdit,
  disabled,
  children,
  leading,
}: {
  title: string
  onEdit: () => void
  disabled?: boolean
  children: React.ReactNode
  leading?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3.5 rounded-[20px] border border-line bg-white/85 p-4 sm:p-5">
      {leading}
      <div className="min-w-0 flex-1">
        <p className="text-[11.5px] font-semibold tracking-[0.14em] text-hush uppercase">{title}</p>
        <div className="mt-1.5">{children}</div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
        aria-label={`Edit ${title}`}
        className="pressable -mt-1 -mr-1 inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-medium text-brand hover:bg-brand/[0.06] disabled:opacity-40"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </button>
    </div>
  )
}

function CategoryReview({ id, state, onEdit, disabled }: { id: CategoryId; state: FeedbackState; onEdit: () => void; disabled: boolean }) {
  const def = CATEGORIES.find((c) => c.id === id)!
  const r = state.responses[id]
  if (!r.rating) return null
  const level = levelFor(r.rating)
  const comment = cleanText(r.comment)
  return (
    <ReviewCard
      title={def.eyebrow}
      onEdit={onEdit}
      disabled={disabled}
      leading={
        <span
          className="emoji-glyph grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-[28px]"
          style={{ background: `${level.tone}14`, boxShadow: `inset 0 0 0 1px ${level.tone}26` }}
          aria-hidden
        >
          {level.emoji}
        </span>
      }
    >
      <p className="flex items-center gap-2 text-[16px] font-semibold text-ink">
        {level.label}
      </p>
      {needsReason(r) && r.reasons.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {r.reasons.map((reason) => (
            <li key={reason} className="rounded-full bg-mist px-2.5 py-1 text-[12.5px] leading-snug text-navy">
              {reason}
            </li>
          ))}
        </ul>
      )}
      {comment && (
        <p className="mt-2.5 border-l-2 border-brand/25 pl-3 font-display text-[15px] leading-relaxed text-slate italic break-words">
          “{comment}”
        </p>
      )}
    </ReviewCard>
  )
}
