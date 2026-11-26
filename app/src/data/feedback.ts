import type { CategoryDefinition, CategoryId, Rating } from '../types'

export interface EmojiLevel {
  value: Rating
  emoji: string
  label: string
  /** Accent used for glow, halo ring and sparkles. */
  tone: string
}

export const EMOJI_LEVELS: EmojiLevel[] = [
  { value: 1, emoji: '😡', label: 'Very Poor', tone: '#E5484D' },
  { value: 2, emoji: '😕', label: 'Needs Improvement', tone: '#F76B15' },
  { value: 3, emoji: '😐', label: 'Average', tone: '#D99A1E' },
  { value: 4, emoji: '🙂', label: 'Good', tone: '#00A3E0' },
  { value: 5, emoji: '🤩', label: 'Excellent', tone: '#0066FF' },
]

export const levelFor = (rating: Rating) => EMOJI_LEVELS[rating - 1]

/** Ratings strictly below this need a reason. */
export const REASON_THRESHOLD = 4

export const OTHER_REASON = 'Other'

export const CATEGORIES: CategoryDefinition[] = [
  {
    id: 'advisory',
    number: '01',
    eyebrow: 'Advisory Experience',
    shortLabel: 'Advisory',
    question: 'How would you rate your overall advisory experience with Fintness?',
    reasonPrompt: 'We’d love to understand what could have been better.',
    reasons: [
      'Advice was not clear enough',
      'Financial goals were not properly understood',
      'Recommendations did not meet my expectations',
      'Insufficient follow-up',
      OTHER_REASON,
    ],
    variant: 'burst',
  },
  {
    id: 'services',
    number: '02',
    eyebrow: 'Services & Communication',
    shortLabel: 'Services',
    question: 'How satisfied are you with our services and communication?',
    reasonPrompt: 'What could we improve?',
    reasons: [
      'Delayed responses',
      'Communication could be clearer',
      'Issues were not resolved effectively',
      'Follow-ups were insufficient',
      'Service experience could be better',
      OTHER_REASON,
    ],
    variant: 'stars',
  },
  {
    id: 'product',
    number: '03',
    eyebrow: 'Product Suitability',
    shortLabel: 'Products',
    question:
      'How well do our financial product recommendations align with your needs and financial goals?',
    reasonPrompt: 'Help us understand your concerns.',
    reasons: [
      'Products did not match my financial goals',
      'Recommendations were not explained clearly',
      'I felt the recommendations were unsuitable',
      'I felt there was potential bias in product recommendations',
      'I wanted more product options',
      OTHER_REASON,
    ],
    variant: 'rings',
  },
]

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<
  CategoryId,
  CategoryDefinition
>

export const LIMITS = {
  nameMax: 80,
  commentMax: 1000,
} as const
