import { LIMITS, OTHER_REASON, REASON_THRESHOLD } from '../data/feedback'
import type { CategoryResponse, FeedbackState } from '../types'
import { CATEGORIES } from '../data/feedback'

/** Collapses whitespace and trims. */
export const cleanText = (s: string) => s.replace(/\s+/g, ' ').trim()

const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u

export function validateName(raw: string): string | null {
  const name = cleanText(raw)
  if (!name) return 'Please tell us your name so we know who to thank.'
  if (name.length < 2) return 'That looks a little short — could you share your full name?'
  if (name.length > LIMITS.nameMax) return `Please keep your name under ${LIMITS.nameMax} characters.`
  if (!NAME_PATTERN.test(name)) return 'Please use letters only (spaces, dots and hyphens are fine).'
  return null
}

export type MobileResult = { ok: true; value: string } | { ok: false; error: string }

/**
 * Optional mobile number. Empty → ok with ''. Indian numbers are normalised to +91XXXXXXXXXX;
 * international numbers must be entered with a leading '+'.
 */
export function normalizeMobile(raw: string): MobileResult {
  const compact = raw.replace(/[\s\-().]/g, '')
  if (!compact) return { ok: true, value: '' }
  const indian = compact.match(/^(?:\+91|0091|91|0)?([6-9]\d{9})$/)
  if (indian) return { ok: true, value: `+91${indian[1]}` }
  if (/^\+[1-9]\d{7,14}$/.test(compact) && !compact.startsWith('+91')) {
    return { ok: true, value: compact }
  }
  return { ok: false, error: 'Please enter a valid 10-digit mobile number (or leave it blank).' }
}

export const needsReason = (r: CategoryResponse) =>
  r.rating !== null && r.rating < REASON_THRESHOLD

export interface CategoryErrors {
  rating?: string
  reasons?: string
  comment?: string
}

export function validateCategory(r: CategoryResponse): CategoryErrors {
  const errors: CategoryErrors = {}
  if (r.rating === null) {
    errors.rating = 'Slide or tap a face to rate before continuing.'
    return errors
  }
  const comment = cleanText(r.comment)
  if (comment.length > LIMITS.commentMax) {
    errors.comment = `Please keep this under ${LIMITS.commentMax} characters.`
  }
  if (needsReason(r)) {
    if (r.reasons.length === 0) {
      errors.reasons = 'Please pick at least one reason — it helps us improve.'
    } else if (r.reasons.includes(OTHER_REASON) && comment.length < 3) {
      errors.comment = 'You picked “Other” — tell us a little more in a few words.'
    }
  }
  return errors
}

export const hasErrors = (e: object) => Object.keys(e).length > 0

export function validateAll(state: FeedbackState) {
  const name = validateName(state.client.name)
  const mobile = normalizeMobile(state.client.mobile)
  const categories = Object.fromEntries(
    CATEGORIES.map((c) => [c.id, validateCategory(state.responses[c.id])]),
  )
  const firstInvalidCategory = CATEGORIES.find((c) => hasErrors(categories[c.id]))?.id
  const clientValid = !name && mobile.ok
  return {
    ok: clientValid && !firstInvalidCategory,
    clientValid,
    firstInvalidCategory,
  }
}

export const firstName = (full: string) => cleanText(full).split(' ')[0] ?? ''
