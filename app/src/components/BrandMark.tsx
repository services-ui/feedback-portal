interface Props {
  size?: 'sm' | 'md'
  className?: string
}

/** Compact lockup: logo mark + wordmark set in the site's type pairing. */
export function BrandMark({ size = 'sm', className = '' }: Props) {
  const img = size === 'sm' ? 'h-8 w-auto' : 'h-10 w-auto'
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img src="/logo-mark.png" alt="" className={img} width={273} height={215} decoding="async" />
      <div className="leading-none">
        <div className="text-[15px] font-semibold tracking-[0.14em] text-navy">FINTNESS</div>
        <div className="mt-1 font-display text-[11px] italic tracking-wide text-slate">Finserv</div>
      </div>
      <span className="sr-only">Fintness Finserv</span>
    </div>
  )
}
