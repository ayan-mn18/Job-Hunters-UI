/**
 * The playground's fake run.
 *
 * Everything here is scripted. No browser is started, no model is called and
 * nothing is applied to — the point is to settle the *flow* before any of that
 * is wired up: where the browser sits, when the Apply button appears, what
 * happens the moment it gets stuck, and who gets asked.
 *
 * The postings are real ones read off Work at a Startup, and the form is shaped
 * like that site's actual application — a message to the founders rather than a
 * field-by-field questionnaire — so the mock does not teach a flow the real
 * thing cannot deliver.
 */

export type Phase =
  | 'idle'
  | 'launching'
  | 'searching'
  | 'shortlisted'
  | 'opening'
  | 'login_blocked'
  | 'signing_in'
  | 'filling'
  | 'field_blocked'
  | 'submitting'
  | 'submitted'

export type Speaker = 'huntly' | 'agent' | 'llm' | 'user' | 'system'

export interface ChatMessage {
  id: string
  speaker: Speaker
  text: string
  /** Renders the message as a callout rather than a plain line. */
  kind?: 'stuck' | 'draft' | 'refused' | 'success'
}

export interface Posting {
  id: string
  title: string
  company: string
  batch: string
  location: string
  salary: string
  experience: string
  score: number
  reasons: string[]
}

export const POSTINGS: Posting[] = [
  {
    id: '94543',
    title: 'Lead, Engineer',
    company: 'Noora Health',
    batch: 'W14',
    location: 'Bengaluru, KA, IN',
    salary: '—',
    experience: '6+ years',
    score: 91,
    reasons: [
      'Same city as you — Bengaluru, on-site',
      'Backend + Postgres, which is most of your last four years',
      'Asks for 6+ years; you have 6',
    ],
  },
  {
    id: '103934',
    title: 'Senior Software Engineer, Data Systems',
    company: 'Hive',
    batch: 'S14',
    location: 'Remote (US)',
    salary: '—',
    experience: '5+ years',
    score: 78,
    reasons: ['Stack matches', 'Remote, but US hours'],
  },
  {
    id: '103933',
    title: 'Senior Software Engineer, Machine Learning',
    company: 'Hive',
    batch: 'S14',
    location: 'Remote (CA)',
    salary: '$124K – $188K',
    experience: '5+ years',
    score: 64,
    reasons: ['ML-heavy; your experience is backend'],
  },
  {
    id: '107082',
    title: 'Head of ML',
    company: 'The Subvocal Company',
    batch: 'F26',
    location: 'San Francisco, CA, US',
    salary: '$150K – $200K',
    experience: '3+ years',
    score: 41,
    reasons: ['Leadership scope beyond your current level'],
  },
]

export const BEST = POSTINGS[0] as Posting

export type FieldState = 'pending' | 'filling' | 'filled' | 'blocked' | 'refused'

export interface FormField {
  id: string
  label: string
  value: string
  /** Long answers render as a textarea in the mock form. */
  long?: boolean
  state: FieldState
  /** Shown under a blocked or refused field. */
  note?: string
}

export const FORM: FormField[] = [
  { id: 'name', label: 'Full name', value: 'Ada Lovelace', state: 'pending' },
  { id: 'email', label: 'Email', value: 'ada@example.com', state: 'pending' },
  { id: 'phone', label: 'Phone', value: '+91 90000 00000', state: 'pending' },
  { id: 'linkedin', label: 'LinkedIn', value: 'linkedin.com/in/ada', state: 'pending' },
  { id: 'resume', label: 'Résumé', value: 'ada-lovelace-backend.pdf', state: 'pending' },
  {
    id: 'message',
    label: 'Why do you want to work at Noora Health?',
    long: true,
    value:
      "I've spent six years building backend systems where the failure mode is someone not getting "
      + 'something they needed — payments, then health records at Example Ltd, where I owned the '
      + 'Postgres layer behind patient discharge summaries. Noora is doing that at a scale where the '
      + "hospital is the integration surface, and I'd like to work on that directly.",
    state: 'pending',
  },
  {
    id: 'ctc',
    label: 'Expected annual compensation (INR) *',
    value: '',
    state: 'pending',
    note: 'Your Kit has no expected CTC, and this is not a number to guess at.',
  },
  {
    id: 'visa',
    label: 'Will you now or in the future require visa sponsorship? *',
    value: '',
    state: 'pending',
    note: 'Huntly never answers visa, demographic or disability questions on your behalf.',
  },
]

/** Fields that fill without anyone being asked anything. */
export const AUTO_FIELD_IDS = ['name', 'email', 'phone', 'linkedin', 'resume', 'message']

export const SUGGESTED_PROMPTS = [
  'search the best suitable job on workatastartup.com',
  'find a remote backend role at a YC startup and apply',
  'apply to the closest match to my kit on workatastartup.com',
]

let counter = 0
export function say(speaker: Speaker, text: string, kind?: ChatMessage['kind']): ChatMessage {
  counter += 1
  return { id: `m${counter}`, speaker, text, ...(kind ? { kind } : {}) }
}

export const SPEAKER_LABEL: Record<Speaker, string> = {
  huntly: 'Huntly',
  agent: 'Browser agent',
  llm: 'Muse Spark',
  user: 'You',
  system: 'Playground',
}

export const SPEAKER_EMOJI: Record<Speaker, string> = {
  huntly: '🦊',
  agent: '🖥️',
  llm: '🧠',
  user: '🙂',
  system: '⚙️',
}
