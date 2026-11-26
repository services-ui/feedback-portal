import { FEEDBACK_ENDPOINT, REQUEST_TIMEOUT_MS } from '../config'
import { CATEGORIES } from '../data/feedback'
import type { FeedbackPayload, FeedbackState, Rating } from '../types'
import { cleanText, needsReason, normalizeMobile } from './validation'

export type SubmitErrorKind = 'config' | 'offline' | 'network' | 'timeout' | 'server' | 'rejected'

export class SubmitError extends Error {
  kind: SubmitErrorKind
  constructor(kind: SubmitErrorKind, message: string) {
    super(message)
    this.kind = kind
  }
}

interface BackendResponse {
  ok?: boolean
  status?: string
  message?: string
  code?: string
  duplicate?: boolean
}

export function newSubmissionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

/** Shapes UI state into the wire payload. Reasons are only sent where the rating requires them. */
export function buildPayload(
  state: FeedbackState,
  submissionId: string,
  startedAt: number,
  honeypot: string,
): FeedbackPayload {
  const mobile = normalizeMobile(state.client.mobile)
  const category = (id: (typeof CATEGORIES)[number]['id']) => {
    const r = state.responses[id]
    return {
      rating: r.rating as Rating,
      reasons: needsReason(r) ? r.reasons : [],
      comment: cleanText(r.comment),
    }
  }
  return {
    submissionId,
    clientName: cleanText(state.client.name),
    mobile: mobile.ok ? mobile.value : '',
    advisory: category('advisory'),
    services: category('services'),
    product: category('product'),
    meta: {
      elapsedMs: Math.max(0, Date.now() - startedAt),
      hp: honeypot,
      client: 'fintness-feedback-web/1.0',
    },
  }
}

async function postOnce(payload: FeedbackPayload): Promise<BackendResponse> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    // text/plain keeps this a "simple" CORS request — Apps Script cannot answer preflights.
    const res = await fetch(FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal,
      cache: 'no-store',
    })
    const text = await res.text()
    let json: BackendResponse
    try {
      json = JSON.parse(text)
    } catch {
      throw new SubmitError('server', 'We couldn’t confirm your submission. Please try again.')
    }
    if (!res.ok && json.ok !== false) {
      throw new SubmitError('server', 'Our server is having a moment. Please try again shortly.')
    }
    return json
  } catch (err) {
    if (err instanceof SubmitError) throw err
    if ((err as Error).name === 'AbortError') {
      throw new SubmitError('timeout', 'This is taking longer than usual. Please check your connection and try again.')
    }
    throw new SubmitError('network', 'We couldn’t reach our server. Please check your connection and try again.')
  } finally {
    window.clearTimeout(timer)
  }
}

/**
 * Sends feedback and resolves ONLY when the backend explicitly confirms the row was written.
 * Network failures are retried once — safe because the backend de-duplicates on submissionId.
 */
export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  if (!FEEDBACK_ENDPOINT) {
    throw new SubmitError(
      'config',
      'The feedback service isn’t connected yet. Please let the Fintness team know.',
    )
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new SubmitError('offline', 'You appear to be offline. Reconnect and tap submit again — your answers are safe.')
  }

  let json: BackendResponse
  try {
    json = await postOnce(payload)
  } catch (err) {
    if (err instanceof SubmitError && err.kind === 'network') {
      await new Promise((r) => setTimeout(r, 1200))
      json = await postOnce(payload)
    } else {
      throw err
    }
  }

  if (json.ok === true && json.status === 'success') return
  throw new SubmitError(
    'rejected',
    json.message || 'We couldn’t save your feedback. Please review your answers and try again.',
  )
}
