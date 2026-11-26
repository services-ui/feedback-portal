import { useId } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle } from 'lucide-react'
import { LIMITS } from '../data/feedback'
import { EASE_OUT } from '../lib/motion'

interface Props {
  value: string
  onChange: (v: string) => void
  label: string
  placeholder?: string
  required?: boolean
  error?: string | null
  autoFocus?: boolean
}

export function CommentBox({ value, onChange, label, placeholder, required, error, autoFocus }: Props) {
  const id = useId()
  const count = value.trim().length
  const near = count > LIMITS.commentMax * 0.85
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[14px] font-medium text-navy">
          {label}
        </label>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide transition-colors duration-200 ${
            required ? 'bg-brand/10 text-brand' : 'bg-mist text-slate'
          }`}
        >
          {required ? 'Required for “Other”' : 'Optional'}
        </span>
      </div>
      <div
        className={`rounded-2xl border bg-white transition-[border-color,box-shadow] duration-200 focus-within:shadow-[0_0_0_4px_rgb(0_102_255/0.12)] ${
          error ? 'border-danger/50' : 'border-line focus-within:border-brand/50'
        }`}
      >
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          maxLength={LIMITS.commentMax + 50}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          autoFocus={autoFocus}
          enterKeyHint="done"
          className="autogrow block max-h-64 min-h-[104px] w-full resize-none rounded-2xl bg-transparent px-4 py-3.5 text-[16px] leading-relaxed text-ink outline-none placeholder:text-hush/80"
        />
        <div className="flex justify-end px-4 pb-2.5">
          <span className={`text-[11.5px] tabular-nums ${near ? 'text-danger' : 'text-hush'}`}>
            {count}/{LIMITS.commentMax}
          </span>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            id={`${id}-err`}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="mt-2 flex items-start gap-1.5 text-[13px] text-danger"
          >
            <AlertCircle aria-hidden className="mt-[1px] h-4 w-4 shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
