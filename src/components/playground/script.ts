/**
 * What the playground shows, as the API describes it.
 *
 * These mirror `src/modules/playground/routes.ts` on the server. The file
 * started life holding a scripted fake run; the shapes survived the wiring-up
 * because the mock was built against what the backend was going to return.
 */

export type RunStatus =
  | 'queued'
  | 'launching'
  | 'searching'
  | 'shortlisted'
  | 'applying'
  | 'blocked'
  | 'submitted'
  | 'failed'
  | 'cancelled'

export type Speaker = 'huntly' | 'agent' | 'llm' | 'user' | 'system'

export interface ChatMessage {
  id: string
  speaker: Speaker
  text: string
  kind?: 'stuck' | 'draft' | 'refused' | 'success' | null
}

export interface ShortlistEntry {
  url: string
  title: string
  company: string
  location: string
  salary: string | null
  experience: string | null
  score: number
  reasons: string[]
}

export interface FilledField {
  label: string
  value: string
}

export interface BlockedField {
  label: string
  why: string
}

export interface PlaygroundRun {
  id: string
  prompt: string
  status: RunStatus
  skillId: string | null
  liveUrl: string | null
  shortlist: ShortlistEntry[]
  chosen: { url: string; title: string | null; company: string | null } | null
  filledFields: FilledField[]
  blockedFields: BlockedField[]
  pendingQuestion: string | null
  dryRun: boolean
  emailSentAt: string | null
  applicationId: string | null
  error: string | null
  createdAt: string
  completedAt: string | null
}

/** Statuses where the run is still doing something and the socket matters. */
export const LIVE_STATUSES: RunStatus[] = [
  'queued',
  'launching',
  'searching',
  'shortlisted',
  'applying',
  'blocked',
]

export const STATUS_LABEL: Record<RunStatus, string> = {
  queued: 'Waiting its turn',
  launching: 'Starting a browser',
  searching: 'Reading the board',
  shortlisted: 'Found a match',
  applying: 'Filling the application',
  blocked: 'Stuck — needs you',
  submitted: 'Done',
  failed: 'Failed',
  cancelled: 'Stopped',
}

export const SUGGESTED_PROMPTS = [
  'search the best suitable job on workatastartup.com',
  'find a remote backend role at a YC startup and apply',
  'apply to the closest match to my kit on workatastartup.com',
]

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

let counter = 0
/** A local-only message, for things the UI says before the server hears them. */
export function localMessage(speaker: Speaker, text: string, kind?: ChatMessage['kind']): ChatMessage {
  counter += 1
  return { id: `local-${counter}`, speaker, text, ...(kind ? { kind } : {}) }
}
