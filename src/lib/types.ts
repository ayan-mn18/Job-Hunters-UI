/**
 * The wire shapes of Job-Hunters-api, mirrored one-to-one. The API's
 * serializers were written against this UI's old mock data, so the field
 * names here are exactly what the pages used to import from `data/mock`.
 */

/* ------------------------------------------------------------------ auth */

export type KitDraft = {
  roles: string
  locations: string
  companies: string
  dailyTarget: number
  portals: string[]
  phone: string
  city: string
  noticePeriod: string
  maxYearsExperience: number
  resumeName: string
}

export type User = {
  id: string
  name: string
  email: string
  avatar: string
  onboarded: boolean
  kit: Partial<KitDraft>
  joinedAt: string
}

export type AuthSession = {
  user: User
  accessToken: string
  refreshToken: string
  /** Seconds until the access token expires. */
  expiresIn: number
  tokenType: 'Bearer'
}

/* -------------------------------------------------------------- dashboard */

export type DashboardHunter = {
  name: string
  avatar: string
  streakDays: number
  dailyTarget: number
  appliedToday: number
  remainingToday: number
}

export type DashboardStats = {
  appliedToday: number
  totalApplications: number
  jobsScraped: number
  portalsConnected: number
  interviews: number
  viewed: number
  queued: number
  rejected: number
  referralsWaiting: number
  referralsToday: number
}

export type RecentApplication = {
  id: string
  role: string
  company: string
  logo: string
  location: string
  matchScore: number
  status: ApplicationStatus
  appliedAt: string
}

export type ActivityItem = {
  id: string
  emoji: string
  text: string
  time: string
  at: string
  kind: string
  meta: Record<string, unknown>
}

export type Dashboard = {
  hunter: DashboardHunter
  stats: DashboardStats
  recentApplications: RecentApplication[]
  activity: ActivityItem[]
}

export type ScrapedJobStatus =
  | 'scraped'
  | 'eligible'
  | 'below_threshold'
  | 'deal_breaker'
  | 'approved'
  | 'role_mismatch'
  | 'seniority_mismatch'
  | 'experience_mismatch'
  | 'insufficient_skills'
  | 'location_mismatch'
  | 'rejected'
  | 'queued'
  | 'tailored'
  | 'applying'
  | 'applied'
  | 'needs_review'
  | 'failed'
  | 'closed'

export type ScrapedJobDashboardItem = {
  id: string
  jobId: string
  title: string
  candidateId: string | null
  company: string
  locations: Array<{
    raw?: string
    city?: string
    country?: string
    countryCode?: string
    isRemote?: boolean
  }>
  remote: string
  sourcePortal: string
  status: ScrapedJobStatus
  candidateStatus: string | null
  score: number | null
  skills: string[]
  salary: string | null
  jobUrl: string
  postedAt: string
  discoveredAt: string
}

export type ScrapedJobDetail = ScrapedJobDashboardItem & {
  scoreBreakdown: unknown
  reasons: string[]
  description: string
  applyUrl: string | null
  postedAtPrecision: string
}

export type ScrapedJobsDashboard = {
  run: {
    id: string
    status: string
    jobsScraped: number
    jobsScored: number
    applicationsSubmitted: number
    createdAt: string
    startedAt: string | null
    finishedAt: string | null
  } | null
  counts: Record<string, number>
  portals: Record<string, number>
  items: ScrapedJobDashboardItem[]
  historical: boolean
  pagination: {
    page: number
    pageSize: 20 | 50
    total: number
    totalPages: number
  }
}

/* ----------------------------------------------------------- applications */

export type ApplicationStatus =
  | 'queued'
  | 'applied'
  | 'viewed'
  | 'interview'
  | 'rejected'
  | 'needs_review'
  | 'failed'
  | 'closed'

export type Application = {
  id: string
  role: string
  company: string
  logo: string
  location: string
  portal: string
  salary: string
  matchScore: number
  status: ApplicationStatus
  /** Pre-formatted by the API: "2 days ago", "in queue". */
  appliedAt: string
  resumeVariant: string
  jobUrl: string | null
  externalJobId: string | null
  appliedAtIso: string | null
  queuedAtIso: string
  updatedAtIso: string
}

export type ApplicationCounts = Record<ApplicationStatus, number> & { all: number }

/* ---------------------------------------------------------------- portals */

export type Portal = {
  id: string
  name: string
  emoji: string
  connected: boolean
  jobsFound: number
  isAvailable: boolean
  connectedAt: string | null
  lastSyncedAt: string | null
}

export type PortalAccount = {
  id: string
  portalId: string
  email: string
  status: string
  actionRequired: string | null
  lastVerifiedAt: string | null
  profileSyncedAt: string | null
}

/* -------------------------------------------------------------- referrals */

export type ReferralSource = 'linkedin' | 'email'

export type Referral = {
  id: string
  name: string
  headline: string
  avatar: string
  source: ReferralSource
  /** "09:12" in the app timezone. */
  receivedAt: string
  targetRole: string
  jobId: string
  resumeName: string
  note: string
  matchScore: number
  handled: boolean
  draft: string
  receivedAtIso: string
  receivedAtRelative: string
  dateKey: string
  hasResumeFile: boolean
  draftGeneratedAt: string | null
  draftStubbed: boolean
}

export type ReferralDay = {
  date: string
  label: string
  linkedin: number
  email: number
  total: number
  pending: number
}

/* ------------------------------------------------------------------ hunt */

export type HuntSpec = {
  roles: string[]
  rolesText: string
  dreamCompanies: string[]
  dreamCompaniesText: string
  locations: string[]
  locationsText: string
  dealBreakers: string[]
  dealBreakersText: string
  minMatchScore: number
  dailyTarget: number
  isActive: boolean
  updatedAt: string
}

export type HuntCandidate = {
  id: string
  jobId: string
  title: string
  company: string
  location: string
  remote: string
  sourcePortal: string
  score: number
  reasons: string[]
  url: string
  applyUrl: string | null
  postedAt: string
  descriptionPreview: string
  skills: string[]
  status: string
}

export type HuntRun = {
  id: string
  status: string
  running: boolean
  awaitingApproval: boolean
  targetApplications: number
  jobsScraped: number
  jobsScored: number
  candidatesApproved: number
  applicationsSubmitted: number
  applicationsNeedsReview: number
  progress: unknown
  error: string | null
  startedAt: string | null
  finishedAt: string | null
  stopRequestedAt: string | null
  approvedAt: string | null
  createdAt: string
}

export type HuntStatus = {
  running: boolean
  awaitingApproval: boolean
  dailyTarget: number
  currentRun: HuntRun | null
  candidates: HuntCandidate[]
  queueStubbed: boolean
}

export type HuntStartResult = HuntRun & {
  warnings: string[]
  candidates: HuntCandidate[]
  sources: Array<{ portal: string; seen: number; fresh: number; error: string | null }>
}

/* ---------------------------------------------------------------- resumes */

export type Resume = {
  id: string
  fileName: string
  kind: string
  mimeType: string
  sizeBytes: number
  isBase: boolean
  parseStatus: string
  parsedAt: string | null
  parsedSkills: string[]
  parsedTitles: string[]
  parsedYearsExperience: number | null
  parseError: string | null
  autofillAvailable: boolean
  uploadedAt: string
  structuredVersion: number
  structuredConfirmedAt: string | null
}
export type ResumeAutofillResult = {
  resume: Resume
  roles: string[]
  kit: FullKit
  applied: {
    fields: string[]
    skills: number
    employments: number
  }
}


/* -------------------------------------------------------------------- kit */

export type Employment = {
  id: string
  emoji: string
  role: string
  company: string
  startedOn: string | null
  endedOn: string | null
  isCurrent: boolean
  /** Pre-formatted, e.g. "Jan 2024 — now". */
  period: string
  blurb: string | null
  sortOrder: number
}

export type FullKit = {
  fullName: string | null
  pronouns: string | null
  email: string | null
  phone: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  linkedinUrl: string | null
  githubUrl: string | null
  portfolioUrl: string | null
  headline: string | null
  noticePeriod: string | null
  totalExperience: string | null
  maxYearsExperience: number
  currentCtc: string | null
  expectedCtc: string | null
  workAuthorization: string | null
  willingToRelocate: string | null
  skills: string[]
  photoFileName: string | null
  photoUrl: string | null
  /** 0–100, drives the "92% complete" chip. */
  completeness: number
  updatedAt: string | null
  employments: Employment[]
}
