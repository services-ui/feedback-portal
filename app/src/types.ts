export type Rating = 1 | 2 | 3 | 4 | 5

export type CategoryId = 'advisory' | 'services' | 'product'

export interface CategoryResponse {
  rating: Rating | null
  reasons: string[]
  comment: string
}

export interface ClientInfo {
  name: string
  mobile: string
}

export interface FeedbackState {
  client: ClientInfo
  responses: Record<CategoryId, CategoryResponse>
}

export type StepId = 'welcome' | 'details' | CategoryId | 'review' | 'success'

/** Sparkle/reaction personality, varied per category so the three ratings don't feel identical. */
export type RatingVariant = 'burst' | 'stars' | 'rings'

export interface CategoryDefinition {
  id: CategoryId
  number: string
  eyebrow: string
  shortLabel: string
  question: string
  reasonPrompt: string
  reasons: string[]
  variant: RatingVariant
}

/** Wire format sent to the Apps Script backend. */
export interface FeedbackPayload {
  submissionId: string
  clientName: string
  mobile: string
  advisory: CategoryPayload
  services: CategoryPayload
  product: CategoryPayload
  meta: {
    elapsedMs: number
    hp: string
    client: string
  }
}

export interface CategoryPayload {
  rating: Rating
  reasons: string[]
  comment: string
}
