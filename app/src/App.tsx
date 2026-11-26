import { AnimatePresence, MotionConfig, motion, useIsPresent } from 'motion/react'
import { useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { AmbientBackground } from './components/AmbientBackground'
import { BrandMark } from './components/BrandMark'
import { ClientDetails } from './components/ClientDetails'
import { FeedbackProgress } from './components/FeedbackProgress'
import { Footer } from './components/Footer'
import { QuestionStep } from './components/QuestionStep'
import { ReviewScreen } from './components/ReviewScreen'
import { SubmissionLoader } from './components/SubmissionLoader'
import { SuccessScreen } from './components/SuccessScreen'
import { WelcomeScreen } from './components/WelcomeScreen'
import { CATEGORIES } from './data/feedback'
import { SubmitError, buildPayload, newSubmissionId, submitFeedback } from './lib/api'
import { EASE_OUT, stepVariants } from './lib/motion'
import { firstName, validateAll } from './lib/validation'
import { feedbackReducer, initialFeedback } from './state/feedbackReducer'
import type { CategoryId, StepId } from './types'

const ORDER: StepId[] = ['welcome', 'details', 'advisory', 'services', 'product', 'review', 'success']
const PROGRESS_LABELS = ['About you', 'Advisory', 'Services', 'Products', 'Review']
const isCategory = (s: StepId): s is CategoryId => CATEGORIES.some((c) => c.id === s)

/** The outgoing step stays visible while it animates out — make it non-interactive meanwhile. */
function PresenceGuard({ children }: { children: ReactNode }) {
  const present = useIsPresent()
  return (
    <div inert={!present} aria-hidden={!present || undefined} className="contents">
      {children}
    </div>
  )
}

export default function App() {
  const [state, dispatch] = useReducer(feedbackReducer, initialFeedback)
  const [step, setStep] = useState<StepId>('welcome')
  const [dir, setDir] = useState(1)
  const [returnToReview, setReturnToReview] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [honeypot, setHoneypot] = useState('')

  // Stable for the whole session: retries reuse it, so the backend can de-duplicate.
  const submissionId = useRef(newSubmissionId())
  const startedAt = useRef(Date.now())
  const inFlight = useRef(false)
  const sectionRef = useRef<HTMLElement>(null)

  const go = useCallback(
    (to: StepId) => {
      setDir(ORDER.indexOf(to) >= ORDER.indexOf(step) ? 1 : -1)
      setStep(to)
    },
    [step],
  )

  // New step: back to top, and move focus to the step for screen-reader users.
  useEffect(() => {
    window.scrollTo({ top: 0 })
    if (step === 'welcome') return
    const t = window.setTimeout(() => sectionRef.current?.focus({ preventScroll: true }), 60)
    return () => window.clearTimeout(t)
  }, [step])

  // Guard against accidentally closing the tab mid-feedback.
  useEffect(() => {
    const dirty = step !== 'welcome' && step !== 'success' && state.client.name.trim().length > 0
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [step, state.client.name])

  const forward = () => {
    if (returnToReview) {
      setReturnToReview(false)
      go('review')
      return
    }
    go(ORDER[ORDER.indexOf(step) + 1])
  }

  const back = () => {
    if (returnToReview) {
      setReturnToReview(false)
      go('review')
      return
    }
    go(ORDER[Math.max(0, ORDER.indexOf(step) - 1)])
  }

  const editFromReview = (to: StepId) => {
    setError(null)
    setReturnToReview(true)
    go(to)
  }

  const submit = async () => {
    if (inFlight.current || step !== 'review') return
    const check = validateAll(state)
    if (!check.ok) {
      editFromReview(check.clientValid ? (check.firstInvalidCategory ?? 'advisory') : 'details')
      return
    }
    inFlight.current = true
    setSubmitting(true)
    setError(null)
    try {
      const payload = buildPayload(state, submissionId.current, startedAt.current, honeypot)
      // Hold the loader at least ~0.9s so it reads as a deliberate moment, not a flicker.
      await Promise.all([submitFeedback(payload), new Promise((r) => setTimeout(r, 900))])
      setDir(1)
      setStep('success')
    } catch (err) {
      setError(err instanceof SubmitError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      inFlight.current = false
      setSubmitting(false)
    }
  }

  const progressIndex = ORDER.indexOf(step) - 1
  const showChrome = step !== 'welcome'
  const showProgress = progressIndex >= 0 && progressIndex < PROGRESS_LABELS.length
  const nextLabel = (s: StepId) =>
    returnToReview ? 'Save & Review' : s === 'product' ? 'Review Answers' : 'Continue'

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return <WelcomeScreen onStart={() => go('details')} />
      case 'details':
        return (
          <ClientDetails
            client={state.client}
            onName={(value) => dispatch({ type: 'setName', value })}
            onMobile={(value) => dispatch({ type: 'setMobile', value })}
            honeypot={honeypot}
            onHoneypot={setHoneypot}
            onBack={back}
            onContinue={forward}
            continueLabel={returnToReview ? 'Save & Review' : 'Let’s Begin'}
          />
        )
      case 'review':
        return (
          <ReviewScreen
            state={state}
            onEdit={editFromReview}
            onBack={() => go('product')}
            onSubmit={submit}
            submitting={submitting}
            error={error}
          />
        )
      case 'success':
        return <SuccessScreen name={firstName(state.client.name)} />
      default: {
        if (!isCategory(step)) return null
        const index = CATEGORIES.findIndex((c) => c.id === step)
        const category = CATEGORIES[index]
        return (
          <QuestionStep
            category={category}
            index={index}
            total={CATEGORIES.length}
            response={state.responses[step]}
            onRate={(rating) => dispatch({ type: 'setRating', category: step, rating })}
            onToggleReason={(reason) => dispatch({ type: 'toggleReason', category: step, reason })}
            onComment={(value) => dispatch({ type: 'setComment', category: step, value })}
            onBack={back}
            onNext={forward}
            nextLabel={nextLabel(step)}
          />
        )
      }
    }
  }

  const card = step !== 'welcome'

  return (
    <MotionConfig reducedMotion="user" transition={{ ease: EASE_OUT }}>
      <AmbientBackground />
      <div className="relative flex min-h-dvh flex-col">
        <AnimatePresence initial={false}>
          {showChrome && (
            <motion.header
              key="chrome"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className="relative z-30 mx-auto w-full max-w-[640px] px-5 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:pt-8"
            >
              <div className="flex h-11 items-center justify-between">
                <BrandMark />
              </div>
              <AnimatePresence initial={false}>
                {showProgress && (
                  <motion.div
                    key="progress"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 sm:mt-4"
                  >
                    <FeedbackProgress steps={PROGRESS_LABELS} current={progressIndex} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.header>
          )}
        </AnimatePresence>

        <main className="relative flex flex-1 flex-col px-5 sm:items-center sm:justify-center sm:px-8 sm:py-8">
          <div className="relative flex w-full flex-1 flex-col sm:max-w-[640px] sm:flex-none">
            <AnimatePresence mode="popLayout" custom={dir} initial={false}>
              <motion.section
                key={step}
                ref={sectionRef}
                tabIndex={-1}
                custom={dir}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                aria-label={step === 'welcome' ? 'Welcome' : undefined}
                className={`flex w-full flex-1 flex-col outline-none ${
                  card
                    ? 'pt-5 sm:rounded-[32px] sm:border sm:border-white sm:bg-white/80 sm:p-10 sm:pt-10 sm:shadow-[var(--shadow-card)]'
                    : ''
                }`}
              >
                <PresenceGuard>{renderStep()}</PresenceGuard>
              </motion.section>
            </AnimatePresence>
          </div>
        </main>

        <Footer showTagline={step !== 'success'} />
      </div>
      <SubmissionLoader visible={submitting} />
    </MotionConfig>
  )
}
