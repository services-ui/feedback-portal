import { Check, MessageCircleHeart } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { CommentBox } from './CommentBox'
import { OTHER_REASON } from '../data/feedback'
import { EASE_OUT } from '../lib/motion'
import type { CategoryDefinition, CategoryResponse } from '../types'
import type { CategoryErrors } from '../lib/validation'

interface Props {
  open: boolean
  category: CategoryDefinition
  response: CategoryResponse
  errors: CategoryErrors
  showErrors: boolean
  onToggleReason: (reason: string) => void
  onComment: (v: string) => void
}

/**
 * Collapsible "tell us why" panel. One entrance for the whole panel (height + fade);
 * its chips come with it rather than staggering in — this can open several times per visit.
 * `initial={false}` so a panel that's already open on back-navigation doesn't re-animate.
 */
export function ConditionalReason({ open, category, response, errors, showErrors, onToggleReason, onComment }: Props) {
  const otherPicked = response.reasons.includes(OTHER_REASON)
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="reason-panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            height: { duration: 0.32, ease: EASE_OUT },
            opacity: { duration: 0.24, ease: EASE_OUT },
          }}
          className="overflow-hidden"
        >
          <motion.div
            initial={{ y: 8 }}
            animate={{ y: 0 }}
            exit={{ y: 8 }}
            transition={{ duration: 0.32, ease: EASE_OUT }}
            className="pt-7"
          >
            <div className="rounded-[22px] border border-line bg-[linear-gradient(180deg,rgb(255_255_255/0.92),rgb(245_248_252/0.9))] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                  <MessageCircleHeart className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <h3 className="text-[16px] leading-snug font-semibold tracking-[-0.01em] text-ink">
                    {category.reasonPrompt}
                  </h3>
                  <p className="mt-0.5 text-[13.5px] text-slate">Pick all that apply.</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={category.reasonPrompt}>
                {category.reasons.map((reason) => {
                  const on = response.reasons.includes(reason)
                  return (
                    <button
                      key={reason}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => onToggleReason(reason)}
                      className={`pressable inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 py-2 text-left text-[14px] leading-snug ${
                        on
                          ? 'border-brand/40 bg-brand/[0.08] font-medium text-brand-deep'
                          : 'border-line bg-white text-navy hover:border-navy/20'
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`grid h-4 w-4 shrink-0 place-items-center rounded-full transition-[background-color,transform,opacity] duration-200 ${
                          on ? 'scale-100 bg-brand opacity-100' : 'scale-75 bg-navy/10 opacity-70'
                        }`}
                      >
                        <Check className={`h-3 w-3 text-white transition-opacity duration-150 ${on ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                      </span>
                      {reason}
                    </button>
                  )
                })}
              </div>

              <AnimatePresence initial={false}>
                {showErrors && errors.reasons && (
                  <motion.p
                    role="alert"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: EASE_OUT }}
                    className="overflow-hidden text-[13px] text-danger"
                  >
                    <span className="block pt-3">{errors.reasons}</span>
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="mt-5">
                <CommentBox
                  label="Tell us a little more…"
                  placeholder="Anything that would help us do better"
                  value={response.comment}
                  onChange={onComment}
                  required={otherPicked}
                  error={showErrors ? errors.comment : null}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
