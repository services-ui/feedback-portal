/**
 * Runtime configuration. The endpoint is the public /exec URL of the Google Apps Script
 * Web App — it is not a secret. Set it in `.env.local` as VITE_FEEDBACK_ENDPOINT.
 */
export const FEEDBACK_ENDPOINT: string = (import.meta.env.VITE_FEEDBACK_ENDPOINT ?? '').trim()

export const REQUEST_TIMEOUT_MS = 20_000
