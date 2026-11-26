import { Phone, UserRound } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { ActionBar, BackButton, PrimaryButton } from './Button'
import { TextField } from './TextField'
import { LIMITS } from '../data/feedback'
import { normalizeMobile, validateName } from '../lib/validation'
import type { ClientInfo } from '../types'

interface Props {
  client: ClientInfo
  onName: (v: string) => void
  onMobile: (v: string) => void
  honeypot: string
  onHoneypot: (v: string) => void
  onBack: () => void
  onContinue: () => void
  continueLabel: string
}

export function ClientDetails({
  client,
  onName,
  onMobile,
  honeypot,
  onHoneypot,
  onBack,
  onContinue,
  continueLabel,
}: Props) {
  const [touched, setTouched] = useState({ name: false, mobile: false })
  const [attempted, setAttempted] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const mobileRef = useRef<HTMLInputElement>(null)

  const nameError = validateName(client.name)
  const mobileResult = normalizeMobile(client.mobile)
  const mobileError = mobileResult.ok ? null : mobileResult.error

  const showName = (touched.name || attempted) && nameError
  const showMobile = (touched.mobile || attempted) && mobileError

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    setAttempted(true)
    if (nameError) return nameRef.current?.focus()
    if (mobileError) return mobileRef.current?.focus()
    onContinue()
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-1 flex-col">
      <p className="text-[12px] font-semibold tracking-[0.16em] text-brand uppercase">Before we begin</p>
      <h1 className="mt-3 font-display text-[32px] leading-[1.1] font-medium tracking-[-0.015em] text-ink sm:text-[40px]">
        First, a little <em className="italic">about you.</em>
      </h1>
      <p className="mt-3 text-[15.5px] leading-relaxed text-slate">
        Just your name, so we know who to thank.
      </p>

      <div className="mt-8 space-y-6">
        <TextField
          ref={nameRef}
          label="Full name"
          icon={<UserRound className="h-5 w-5" />}
          placeholder="e.g. Ananya Sharma"
          value={client.name}
          onChange={(e) => onName(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          error={showName ? nameError : null}
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
          maxLength={LIMITS.nameMax + 10}
          required
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              mobileRef.current?.focus()
            }
          }}
        />
        <TextField
          ref={mobileRef}
          label="Mobile number"
          badge="Optional"
          icon={<Phone className="h-5 w-5" />}
          prefix="+91"
          placeholder="98765 43210"
          value={client.mobile}
          onChange={(e) => onMobile(e.target.value.replace(/[^\d+\s-]/g, ''))}
          onBlur={() => setTouched((t) => ({ ...t, mobile: true }))}
          error={showMobile ? mobileError : null}
          hint="Only if you’d like us to follow up with you."
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          enterKeyHint="go"
          maxLength={18}
        />
        {/* Honeypot: invisible to people, tempting to bots. */}
        <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Company website
            <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => onHoneypot(e.target.value)} />
          </label>
        </div>
      </div>

      <ActionBar>
        <BackButton onClick={onBack} />
        <PrimaryButton type="submit" className="flex-1">
          {continueLabel}
        </PrimaryButton>
      </ActionBar>
    </form>
  )
}
