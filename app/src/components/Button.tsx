import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface PrimaryProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  arrow?: boolean
  icon?: ReactNode
}

export function PrimaryButton({ children, arrow = true, icon, className = '', ...rest }: PrimaryProps) {
  return (
    <button
      type="button"
      {...rest}
      className={`pressable cta-arrow-host group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-full bg-brand px-6 text-[16px] whitespace-nowrap font-semibold tracking-[-0.01em] text-white shadow-[var(--shadow-cta)] outline-offset-4 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {/* Soft top sheen + sky edge — reads premium without glassmorphism */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgb(255_255_255/0.18),transparent_55%),linear-gradient(90deg,transparent_55%,rgb(0_178_255/0.45))]"
      />
      <span className="relative inline-flex items-center gap-2">
        {icon}
        {children}
        {arrow && <ArrowRight aria-hidden className="cta-arrow h-[18px] w-[18px]" strokeWidth={2.25} />}
      </span>
    </button>
  )
}

export function BackButton({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="pressable inline-flex h-14 shrink-0 items-center justify-center gap-1.5 rounded-full border border-line bg-white/80 px-5 text-[15px] font-medium text-navy hover:border-navy/20 max-[399px]:w-14 max-[399px]:px-0"
    >
      <ArrowLeft aria-hidden className="h-[18px] w-[18px]" strokeWidth={2} />
      {/* Icon-only on narrow phones so the primary CTA never wraps */}
      <span className="max-[399px]:sr-only">{label}</span>
    </button>
  )
}

/**
 * Bottom action area. Sticky on phones (thumb zone, safe-area aware) with a fade so content
 * scrolls under it gracefully; a normal row inside the card on larger screens.
 */
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-5 mt-auto px-5 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:px-0 sm:pt-8 sm:pb-0">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgb(245_248_252/0),rgb(245_248_252/0.92)_38%,rgb(245_248_252))] sm:hidden"
      />
      <div className="relative flex items-center gap-3">{children}</div>
    </div>
  )
}
