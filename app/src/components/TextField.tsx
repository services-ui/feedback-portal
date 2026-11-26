import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle } from 'lucide-react'
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { EASE_OUT } from '../lib/motion'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  badge?: string
  icon?: ReactNode
  prefix?: string
  hint?: string
  error?: string | null
}

/** Soft, tall field with leading icon and an animated inline error. */
export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, badge, icon, prefix, hint, error, className = '', ...rest },
  ref,
) {
  const id = useId()
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined
  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className="text-[14px] font-medium text-navy">
          {label}
        </label>
        {badge && (
          <span className="rounded-full bg-mist px-2 py-0.5 text-[11px] font-medium tracking-wide text-slate">
            {badge}
          </span>
        )}
      </div>
      <div
        className={`group flex h-14 items-center gap-3 rounded-2xl border bg-white px-4 transition-[border-color,box-shadow] duration-200 focus-within:shadow-[0_0_0_4px_rgb(0_102_255/0.12)] ${
          error ? 'border-danger/50 focus-within:border-danger/60' : 'border-line focus-within:border-brand/50'
        }`}
      >
        {icon && (
          <span className={`transition-colors duration-200 ${error ? 'text-danger/70' : 'text-hush group-focus-within:text-brand'}`}>
            {icon}
          </span>
        )}
        {prefix && (
          <span className="border-r border-line pr-3 text-[16px] font-medium text-slate tabular-nums">{prefix}</span>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className="h-full w-full min-w-0 bg-transparent text-[16px] text-ink outline-none placeholder:text-hush/80"
          {...rest}
        />
      </div>
      <AnimatePresence initial={false} mode="wait">
        {error ? (
          <motion.p
            key="err"
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
        ) : hint ? (
          <motion.p
            key="hint"
            id={`${id}-hint`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 text-[13px] text-hush"
          >
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
})
