import { Compass, MessagesSquare, PencilLine, Target } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { ActionBar, BackButton, PrimaryButton } from './Button'
import { CommentBox } from './CommentBox'
import { ConditionalReason } from './ConditionalReason'
import { MoodSlider } from './MoodSlider'
import { EASE_OUT } from '../lib/motion'
import { hasErrors, needsReason, validateCategory } from '../lib/validation'
import type { CategoryDefinition, CategoryResponse, Rating } from '../types'

const ICONS = { advisory: Compass, services: MessagesSquare, product: Target }

interface Props {
  category: CategoryDefinition
  index: number
  total: number
  response: CategoryResponse
  onRate: (r: Rating) => void
  onToggleReason: (reason: string) => void
  onComment: (v: string) => void
  onBack: () => void
  onNext: () => void
  nextLabel: string
}

export function QuestionStep({
  category,
  index,
  total,
  response,
  onRate,
  onToggleReason,
  onComment,
  onBack,
  onNext,
  nextLabel,
}: Props) {
  const [attempts, setAttempts] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)
  const [noteOpen, setNoteOpen] = useState(() => response.comment.trim().length > 0)
  const errors = validateCategory(response)
  const showErrors = attempts > 0
  const lowRating = needsReason(response)
  const Icon = ICONS[category.id]
  const headingId = `q-${category.id}`

  const next = () => {
    if (hasErrors(errors)) {
      setAttempts((a) => a + 1)
      if (errors.rating) sliderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    onNext()
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-brand shadow-[0_1px_2px_rgb(11_21_38/0.06)] ring-1 ring-line">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <p className="text-[12px] font-semibold tracking-[0.16em] text-brand uppercase">{category.eyebrow}</p>
        <span className="ml-auto text-[12px] font-medium text-hush tabular-nums">
          {index + 1}/{total}
        </span>
      </div>

      <h2
        id={headingId}
        className="mt-3 font-display text-[25px] leading-[1.16] font-medium tracking-[-0.015em] text-balance text-ink min-[390px]:text-[27px] sm:mt-4 sm:text-[34px]"
      >
        {category.question}
      </h2>

      <div ref={sliderRef} className="mt-5 scroll-mt-28 sm:mt-8">
        <MoodSlider value={response.rating} onChange={onRate} variant={category.variant} labelledBy={headingId} />
      </div>

      {/* Rating-missing hint replays a small shake on every failed attempt */}
      <AnimatePresence initial={false}>
        {showErrors && errors.rating && (
          <motion.p
            key={`rating-err-${attempts}`}
            role="alert"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="mt-2 text-center text-[13.5px] font-medium text-danger"
          >
            {errors.rating}
          </motion.p>
        )}
      </AnimatePresence>

      <ConditionalReason
        open={lowRating}
        category={category}
        response={response}
        errors={errors}
        showErrors={showErrors}
        onToggleReason={onToggleReason}
        onComment={onComment}
      />

      {/* Positive ratings skip the reason section; an optional note stays one tap away. */}
      <AnimatePresence initial={false}>
        {response.rating !== null && !lowRating && (
          <motion.div
            key="note"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="pt-6">
              {noteOpen ? (
                <CommentBox
                  label="Anything you’d like to add?"
                  placeholder="What’s working well for you"
                  value={response.comment}
                  onChange={onComment}
                  error={showErrors ? errors.comment : null}
                  autoFocus={response.comment.length === 0}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setNoteOpen(true)}
                  className="pressable mx-auto flex min-h-11 items-center gap-2 rounded-full px-4 text-[14px] font-medium text-slate hover:text-brand"
                >
                  <PencilLine className="h-4 w-4" />
                  Add a note <span className="text-hush">(optional)</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ActionBar>
        <BackButton onClick={onBack} />
        <PrimaryButton onClick={next} className="flex-1">
          {nextLabel}
        </PrimaryButton>
      </ActionBar>
    </div>
  )
}
