import type { CategoryId, FeedbackState, Rating } from '../types'

export type FeedbackAction =
  | { type: 'setName'; value: string }
  | { type: 'setMobile'; value: string }
  | { type: 'setRating'; category: CategoryId; rating: Rating }
  | { type: 'toggleReason'; category: CategoryId; reason: string }
  | { type: 'setComment'; category: CategoryId; value: string }

const emptyResponse = () => ({ rating: null, reasons: [], comment: '' })

export const initialFeedback: FeedbackState = {
  client: { name: '', mobile: '' },
  responses: {
    advisory: emptyResponse(),
    services: emptyResponse(),
    product: emptyResponse(),
  },
}

/**
 * Reasons and comments are kept when a rating moves to 4–5 so switching back restores them;
 * buildPayload() drops reasons that no longer apply.
 */
export function feedbackReducer(state: FeedbackState, action: FeedbackAction): FeedbackState {
  switch (action.type) {
    case 'setName':
      return { ...state, client: { ...state.client, name: action.value } }
    case 'setMobile':
      return { ...state, client: { ...state.client, mobile: action.value } }
    case 'setRating':
      return patch(state, action.category, { rating: action.rating })
    case 'toggleReason': {
      const current = state.responses[action.category].reasons
      const reasons = current.includes(action.reason)
        ? current.filter((r) => r !== action.reason)
        : [...current, action.reason]
      return patch(state, action.category, { reasons })
    }
    case 'setComment':
      return patch(state, action.category, { comment: action.value })
  }
}

function patch(
  state: FeedbackState,
  category: CategoryId,
  next: Partial<FeedbackState['responses'][CategoryId]>,
): FeedbackState {
  return {
    ...state,
    responses: { ...state.responses, [category]: { ...state.responses[category], ...next } },
  }
}
