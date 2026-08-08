import type { ChipTone } from '../components/ui'
import type { ScrapedJobStatus } from './types'

export const JOB_STATUS_META: Record<ScrapedJobStatus, { label: string; tone: ChipTone }> = {
  scraped: { label: 'Scraped', tone: 'white' },
  eligible: { label: 'Eligible', tone: 'mint' },
  below_threshold: { label: 'Below threshold', tone: 'yellow' },
  deal_breaker: { label: 'Deal breaker', tone: 'coral' },
  role_mismatch: { label: 'Wrong role', tone: 'coral' },
  experience_mismatch: { label: 'Too much experience', tone: 'yellow' },
  seniority_mismatch: { label: 'Wrong seniority', tone: 'yellow' },
  insufficient_skills: { label: 'Too few skills', tone: 'yellow' },
  location_mismatch: { label: 'Wrong location', tone: 'white' },
  approved: { label: 'Approved', tone: 'blue' },
  rejected: { label: 'Not selected', tone: 'coral' },
  queued: { label: 'Queued', tone: 'grape' },
  tailored: { label: 'Resume ready', tone: 'blue' },
  applying: { label: 'Applying', tone: 'yellow' },
  applied: { label: 'Applied', tone: 'mint' },
  needs_review: { label: 'Needs review', tone: 'grape' },
  failed: { label: 'Failed', tone: 'coral' },
  closed: { label: 'Closed', tone: 'ink' },
}

export const JOB_STATUS_ORDER: ScrapedJobStatus[] = [
  'eligible',
  'scraped',
  'role_mismatch',
  'seniority_mismatch',
  'experience_mismatch',
  'insufficient_skills',
  'location_mismatch',
  'below_threshold',
  'deal_breaker',
  'approved',
  'queued',
  'tailored',
  'applying',
  'applied',
  'needs_review',
  'rejected',
  'failed',
  'closed',
]
