/**
 * Placeholder data so the UI has something to show. Every export here is
 * expected to be replaced by a call to Job-Hunters-api later.
 */

export type ApplicationStatus =
  | 'queued'
  | 'applied'
  | 'viewed'
  | 'interview'
  | 'rejected'

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
  appliedAt: string
  resumeVariant: string
}

export type Portal = {
  id: string
  name: string
  emoji: string
  connected: boolean
  jobsFound: number
}

export type ReferralSource = 'linkedin' | 'email'

export type Referral = {
  id: string
  name: string
  headline: string
  avatar: string
  source: ReferralSource
  receivedAt: string
  targetRole: string
  jobId: string
  resumeName: string
  note: string
  matchScore: number
  handled: boolean
  draft: string
}

export type ReferralDay = {
  date: string
  label: string
  linkedin: number
  email: number
}

export const HUNTER = {
  name: 'Ayan',
  title: 'Full-stack Engineer',
  streakDays: 12,
  dailyTarget: 100,
  appliedToday: 68,
}

export const portals: Portal[] = [
  { id: 'linkedin', name: 'LinkedIn', emoji: '💼', connected: true, jobsFound: 412 },
  { id: 'wellfound', name: 'Wellfound', emoji: '🚀', connected: true, jobsFound: 96 },
  { id: 'remoteok', name: 'RemoteOK', emoji: '🌍', connected: true, jobsFound: 138 },
  { id: 'weworkremotely', name: 'We Work Remotely', emoji: '🏝️', connected: true, jobsFound: 74 },
  { id: 'ycombinator', name: 'YC Work at a Startup', emoji: '🧡', connected: false, jobsFound: 0 },
  { id: 'naukri', name: 'Naukri', emoji: '🇮🇳', connected: true, jobsFound: 203 },
  { id: 'instahyre', name: 'Instahyre', emoji: '⚡', connected: false, jobsFound: 0 },
  { id: 'indeed', name: 'Indeed', emoji: '🔎', connected: true, jobsFound: 187 },
]

export const applications: Application[] = [
  {
    id: 'a1',
    role: 'Senior Frontend Engineer',
    company: 'Nimbus Labs',
    logo: '🌩️',
    location: 'Remote — worldwide',
    portal: 'LinkedIn',
    salary: '$120k – $150k',
    matchScore: 94,
    status: 'interview',
    appliedAt: '2 days ago',
    resumeVariant: 'resume—frontend—react.pdf',
  },
  {
    id: 'a2',
    role: 'Full-stack Developer (Node + React)',
    company: 'Pastel Pay',
    logo: '🍭',
    location: 'Bengaluru, India',
    portal: 'Instahyre',
    salary: '₹32L – ₹45L',
    matchScore: 91,
    status: 'viewed',
    appliedAt: '5 hours ago',
    resumeVariant: 'resume—fullstack—fintech.pdf',
  },
  {
    id: 'a3',
    role: 'Platform Engineer',
    company: 'Otterly',
    logo: '🦦',
    location: 'Remote — EU',
    portal: 'RemoteOK',
    salary: '€75k – €95k',
    matchScore: 88,
    status: 'applied',
    appliedAt: '6 hours ago',
    resumeVariant: 'resume—platform—infra.pdf',
  },
  {
    id: 'a4',
    role: 'Software Engineer II',
    company: 'Bluewhale',
    logo: '🐋',
    location: 'Hyderabad, India',
    portal: 'Naukri',
    salary: '₹28L – ₹38L',
    matchScore: 84,
    status: 'applied',
    appliedAt: '7 hours ago',
    resumeVariant: 'resume—backend—java.pdf',
  },
  {
    id: 'a5',
    role: 'Product Engineer',
    company: 'Sunny Side',
    logo: '🍳',
    location: 'Remote — India',
    portal: 'Wellfound',
    salary: '₹25L – ₹35L',
    matchScore: 79,
    status: 'queued',
    appliedAt: 'in queue',
    resumeVariant: 'resume—product—generalist.pdf',
  },
  {
    id: 'a6',
    role: 'Backend Engineer (Go)',
    company: 'Tinbox',
    logo: '📦',
    location: 'Remote — US hours',
    portal: 'We Work Remotely',
    salary: '$110k – $130k',
    matchScore: 72,
    status: 'rejected',
    appliedAt: '9 days ago',
    resumeVariant: 'resume—backend—go.pdf',
  },
]

export const referralDays: ReferralDay[] = [
  { date: '2026-08-07', label: 'Today', linkedin: 7, email: 4 },
  { date: '2026-08-06', label: 'Yesterday', linkedin: 5, email: 2 },
  { date: '2026-08-05', label: 'Wed 5', linkedin: 3, email: 3 },
  { date: '2026-08-04', label: 'Tue 4', linkedin: 6, email: 1 },
  { date: '2026-08-03', label: 'Mon 3', linkedin: 2, email: 0 },
]

export const referrals: Referral[] = [
  {
    id: 'r1',
    name: 'Meera Iyer',
    headline: 'SDE-2 @ Fintech · 4 yrs · React, Node',
    avatar: '🦊',
    source: 'linkedin',
    receivedAt: '09:12',
    targetRole: 'Senior Frontend Engineer',
    jobId: 'JR-48210',
    resumeName: 'meera—iyer—resume.pdf',
    note: 'Hey! Saw you work at Nimbus. Would you be open to referring me for JR-48210?',
    matchScore: 92,
    handled: false,
    draft:
      "Happy to refer Meera Iyer for JR-48210 (Senior Frontend Engineer). We overlapped on a payments dashboard rebuild, where she owned the React migration end to end and cut first-paint by 40%. She writes tests without being asked and gives the kind of code review that makes the whole team better — exactly the bar we hold here. Resume attached; glad to answer anything else.",
  },
  {
    id: 'r2',
    name: 'Rahul Deshmukh',
    headline: 'Backend Engineer · 3 yrs · Go, Postgres',
    avatar: '🐨',
    source: 'email',
    receivedAt: '10:41',
    targetRole: 'Platform Engineer',
    jobId: 'JR-51007',
    resumeName: 'rahul—d—cv.pdf',
    note: 'Applying to the Platform Engineer role. Attaching my CV — would really appreciate a referral.',
    matchScore: 85,
    handled: false,
    draft:
      'Referring Rahul Deshmukh for JR-51007 (Platform Engineer). He spent three years on Go services handling ~8k rps and led the Postgres sharding work that kept their p99 flat through a 4x traffic year. Calm in incidents, writes runbooks nobody has to rewrite. Strong fit for the reliability work on this team.',
  },
  {
    id: 'r3',
    name: 'Sana Qureshi',
    headline: 'New grad · CS · internships at 2 startups',
    avatar: '🐝',
    source: 'linkedin',
    receivedAt: '11:58',
    targetRole: 'Software Engineer I',
    jobId: 'JR-49933',
    resumeName: 'sana—q—resume.pdf',
    note: 'Hi! I am a 2026 grad and would love a referral for the SDE-1 opening.',
    matchScore: 71,
    handled: true,
    draft:
      'Referring Sana Qureshi for JR-49933 (Software Engineer I). Two startup internships where she shipped to production in week two both times, plus an open-source CLI with real users. Early-career, but the learning speed is the standout — worth an interview slot.',
  },
  {
    id: 'r4',
    name: 'Devansh Kapoor',
    headline: 'Data Engineer · 5 yrs · Spark, Airflow',
    avatar: '🦉',
    source: 'email',
    receivedAt: '14:20',
    targetRole: 'Senior Data Engineer',
    jobId: 'JR-50488',
    resumeName: 'devansh—kapoor.pdf',
    note: 'Long shot, but are referrals open for the senior data role? CV attached.',
    matchScore: 88,
    handled: false,
    draft:
      'Referring Devansh Kapoor for JR-50488 (Senior Data Engineer). He rebuilt a nightly Spark pipeline that had been failing weekly into something that has not paged anyone in a year, and he did the unglamorous data-quality work that made the numbers trustworthy. Exactly the profile this team keeps saying it needs.',
  },
]

export const activity = [
  { emoji: '📮', text: 'Applied to Platform Engineer at Otterly', time: '4m ago' },
  { emoji: '✂️', text: 'Tailored resume for Pastel Pay JD', time: '11m ago' },
  { emoji: '👀', text: 'Nimbus Labs viewed your application', time: '1h ago' },
  { emoji: '🔎', text: 'Scraped 138 new jobs from RemoteOK', time: '3h ago' },
  { emoji: '🤝', text: '3 new referral requests landed in inbox', time: '5h ago' },
]
