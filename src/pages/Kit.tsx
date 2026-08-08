import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/context'
import { Button, Card, Chip, Dialog, Empty, Field, Input, SectionTitle } from '../components/ui'
import { api } from '../lib/api'
import type {
  Employment,
  FullKit,
  LinkedInReferralConnection,
  LinkedInReferralSyncResult,
  Resume,
  ResumeAutofillResult,
} from '../lib/types'

/**
 * "My Kit" — the bag of answers Hunty carries to every application form.
 * Anything a job portal ever asks for lives here once.
 *
 * The whole form saves in one `PUT /me/kit`; employment rows and skills have
 * their own endpoints.
 */

type KitForm = {
  fullName: string
  pronouns: string
  email: string
  phone: string
  addressLine1: string
  city: string
  state: string
  postalCode: string
  country: string
  linkedinUrl: string
  githubUrl: string
  portfolioUrl: string
  headline: string
  noticePeriod: string
  totalExperience: string
  maxYearsExperience: string
  currentCtc: string
  expectedCtc: string
  workAuthorization: string
  willingToRelocate: string
}

/**
 * Which kit fields count toward the completeness percentage. Mirrors
 * `COMPLETENESS_FIELDS` in the API's serializer, so the breakdown the user
 * sees on hover matches the number they are being shown.
 */
const COMPLETENESS_FIELDS: Array<{ key: keyof KitForm; label: string }> = [
  { key: 'fullName', label: 'Full name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'addressLine1', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'postalCode', label: 'PIN / ZIP' },
  { key: 'country', label: 'Country' },
  { key: 'linkedinUrl', label: 'LinkedIn' },
  { key: 'noticePeriod', label: 'Notice period' },
  { key: 'totalExperience', label: 'Total experience' },
  { key: 'currentCtc', label: 'Current CTC' },
  { key: 'expectedCtc', label: 'Expected CTC' },
  { key: 'workAuthorization', label: 'Work authorization' },
  { key: 'willingToRelocate', label: 'Willing to relocate' },
]

/**
 * Validation is deliberately forgiving: these values are copied into portal
 * forms verbatim, and a phone number with an extension or a country prefix is
 * still a phone number. It catches typos, it does not enforce a format.
 */
function fieldError(key: keyof KitForm, value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
    return 'That does not look like an email address.'
  }
  if (key === 'phone' && !/^\+?[\d\s().-]{6,20}$/.test(trimmed)) {
    return 'Use digits, spaces and + only.'
  }
  if ((key === 'linkedinUrl' || key === 'githubUrl' || key === 'portfolioUrl')) {
    if (/\s/.test(trimmed) || !/^([a-z]+:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(trimmed)) {
      return 'That does not look like a web address.'
    }
  }
  if (key === 'maxYearsExperience') {
    const years = Number(trimmed)
    if (!Number.isFinite(years) || years < 0 || years > 50) return 'Enter a number between 0 and 50.'
  }
  return null
}

type EmploymentDraft = {
  id: string | null
  emoji: string
  role: string
  company: string
  startedOn: string
  endedOn: string
  isCurrent: boolean
  blurb: string
}

const EMPTY_EMPLOYMENT: EmploymentDraft = {
  id: null,
  emoji: '💼',
  role: '',
  company: '',
  startedOn: '',
  endedOn: '',
  isCurrent: true,
  blurb: '',
}

function toDraft(row: Employment): EmploymentDraft {
  return {
    id: row.id,
    emoji: row.emoji,
    role: row.role,
    company: row.company,
    // The API stores full dates; the form edits them as months.
    startedOn: row.startedOn?.slice(0, 7) ?? '',
    endedOn: row.endedOn?.slice(0, 7) ?? '',
    isCurrent: row.isCurrent,
    blurb: row.blurb ?? '',
  }
}

/** `2026-08` from a month input becomes the first of that month. */
function monthToDate(value: string): string | null {
  return value ? `${value}-01` : null
}

function toForm(kit: FullKit): KitForm {
  return {
    fullName: kit.fullName ?? '',
    pronouns: kit.pronouns ?? '',
    email: kit.email ?? '',
    phone: kit.phone ?? '',
    addressLine1: kit.addressLine1 ?? '',
    city: kit.city ?? '',
    state: kit.state ?? '',
    postalCode: kit.postalCode ?? '',
    country: kit.country ?? '',
    linkedinUrl: kit.linkedinUrl ?? '',
    githubUrl: kit.githubUrl ?? '',
    portfolioUrl: kit.portfolioUrl ?? '',
    headline: kit.headline ?? '',
    noticePeriod: kit.noticePeriod ?? '',
    totalExperience: kit.totalExperience ?? '',
    maxYearsExperience: String(kit.maxYearsExperience ?? 5),
    currentCtc: kit.currentCtc ?? '',
    expectedCtc: kit.expectedCtc ?? '',
    workAuthorization: kit.workAuthorization ?? '',
    willingToRelocate: kit.willingToRelocate ?? '',
  }
}

export function Kit() {
  const { user } = useAuth()
  const [kit, setKit] = useState<FullKit | null>(null)
  const [form, setForm] = useState<KitForm | null>(null)
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [autofilling, setAutofilling] = useState(false)
  const [autofillNotice, setAutofillNotice] = useState('')
  const [roleDraft, setRoleDraft] = useState<EmploymentDraft | null>(null)
  const [roleBusy, setRoleBusy] = useState(false)
  const [undoSkill, setUndoSkill] = useState<{ name: string; index: number } | null>(null)
  const [touched, setTouched] = useState<Partial<Record<keyof KitForm, boolean>>>({})
  /** The last saved state, for the dirty check. */
  const [baseline, setBaseline] = useState<{ form: KitForm; skills: string[] } | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const photoInput = useRef<HTMLInputElement>(null)
  const [linkedin, setLinkedin] = useState<LinkedInReferralConnection | null>(null)
  const [linkedinProfileUrl, setLinkedinProfileUrl] = useState('')
  const [linkedinBusy, setLinkedinBusy] = useState(false)
  const [linkedinNotice, setLinkedinNotice] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([
      api.get<FullKit>('/me/kit'),
      api.get<LinkedInReferralConnection>('/referrals/linkedin/status'),
    ])
      .then(([kitResponse, linkedinResponse]) => {
        if (cancelled) return
        setKit(kitResponse.data)
        setForm(toForm(kitResponse.data))
        setSkills(kitResponse.data.skills)
        setBaseline({ form: toForm(kitResponse.data), skills: kitResponse.data.skills })
        setLinkedin(linkedinResponse.data)
        setLinkedinProfileUrl(linkedinResponse.data.profileUrl ?? kitResponse.data.linkedinUrl ?? '')
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load the kit.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!linkedin || !['provisioning', 'pending_verification'].includes(linkedin.status)) return
    const interval = window.setInterval(() => {
      api
        .get<LinkedInReferralConnection>('/referrals/linkedin/status')
        .then(({ data }) => {
          setLinkedin(data)
          if (data.connected) setLinkedinNotice('LinkedIn connected. Initial seven-day sync started.')
        })
        .catch(() => undefined)
    }, 3_000)
    return () => window.clearInterval(interval)
  }, [linkedin])

  const set = (key: keyof KitForm) => (e: { target: { value: string } }) =>
    setForm((f) => (f ? { ...f, [key]: e.target.value } : f))

  const blur = (key: keyof KitForm) => () => setTouched((current) => ({ ...current, [key]: true }))

  const dirty = useMemo(() => {
    if (!form || !baseline) return false
    const sameForm = (Object.keys(form) as Array<keyof KitForm>).every(
      (key) => form[key] === baseline.form[key],
    )
    const sameSkills =
      skills.length === baseline.skills.length && skills.every((skill, i) => skill === baseline.skills[i])
    return !sameForm || !sameSkills
  }, [form, skills, baseline])

  const errors = useMemo(() => {
    if (!form) return {} as Partial<Record<keyof KitForm, string>>
    const found: Partial<Record<keyof KitForm, string>> = {}
    for (const key of Object.keys(form) as Array<keyof KitForm>) {
      const message = fieldError(key, form[key])
      if (message) found[key] = message
    }
    return found
  }, [form])

  const hasErrors = Object.keys(errors).length > 0

  const missingFields = useMemo(
    () => (form ? COMPLETENESS_FIELDS.filter(({ key }) => !form[key].trim()).map(({ label }) => label) : []),
    [form],
  )

  // Leaving with unsaved edits loses them silently otherwise. The browser
  // shows its own generic wording; the point is that the prompt appears.
  useEffect(() => {
    if (!dirty) return
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  async function save() {
    if (!form) return
    if (hasErrors) {
      setTouched(
        Object.fromEntries((Object.keys(errors) as Array<keyof KitForm>).map((key) => [key, true])),
      )
      setError('Fix the highlighted fields before saving.')
      return
    }
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      // The API treats "" as "cleared"; absent keys are left alone.
      const { data } = await api.put<FullKit>('/me/kit', { ...form, skills })
      setKit(data)
      setForm(toForm(data))
      setSkills(data.skills)
      setBaseline({ form: toForm(data), skills: data.skills })
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the kit.')
    } finally {
      setSaving(false)
    }
  }
  async function autofillFromResume() {
    setAutofilling(true)
    setError('')
    setAutofillNotice('')
    try {
      const { data: resume } = await api.get<Resume | null>('/resumes/base')
      if (!resume) throw new Error('Upload a base resume before using autofill.')
      const { data } = await api.post<ResumeAutofillResult>(
        `/resumes/${resume.id}/autofill`,
      )
      setKit(data.kit)
      setForm(toForm(data.kit))
      setSkills(data.kit.skills)
      const count = data.applied.fields.length + data.applied.skills + data.applied.employments
      setAutofillNotice(
        count > 0
          ? `Filled ${count} blank detail${count === 1 ? '' : 's'} from ${resume.fileName}.`
          : 'Everything found in your resume is already in your kit.',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not autofill from your resume.')
    } finally {
      setAutofilling(false)
    }
  }

  async function uploadPhoto(file: File) {
    setPhotoBusy(true)
    setError('')
    const body = new FormData()
    body.append('photo', file)
    try {
      const { data } = await api.upload<FullKit>('/me/kit/photo', body)
      setKit(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload profile photo.')
    } finally {
      setPhotoBusy(false)
    }
  }

  async function removePhoto() {
    setPhotoBusy(true)
    setError('')
    try {
      await api.delete('/me/kit/photo')
      setKit((current) => current ? { ...current, photoFileName: null, photoUrl: null } : current)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove profile photo.')
    } finally {
      setPhotoBusy(false)
    }
  }
  async function connectLinkedIn() {
    const profileUrl = linkedinProfileUrl.trim() || form?.linkedinUrl.trim()
    if (!profileUrl) {
      setError('Add your LinkedIn profile URL first.')
      return
    }
    setLinkedinBusy(true)
    setError('')
    setLinkedinNotice('')
    try {
      const { data } = await api.post<LinkedInReferralConnection>('/referrals/linkedin/connect', {
        profileUrl,
      })
      setLinkedin(data)
      setLinkedinNotice('LinkedIn window opened. Sign in there; Hunty stores only an encrypted session.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start LinkedIn connection.')
    } finally {
      setLinkedinBusy(false)
    }
  }

  async function syncLinkedIn() {
    setLinkedinBusy(true)
    setError('')
    setLinkedinNotice('')
    try {
      const { data } = await api.post<LinkedInReferralSyncResult>('/referrals/linkedin/sync', {
        days: 90,
      })
      setLinkedinNotice(
        `Checked ${data.inboxesScanned.join(' + ') || 'LinkedIn'}: found ${data.visibleConversations} conversations, opened ${data.scannedThreads}, read ${data.recentInboundMessages} incoming messages from the last ${data.lookbackDays} days, matched ${data.matchedMessages}, and imported ${data.imported}.`,
      )
      const { data: status } = await api.get<LinkedInReferralConnection>('/referrals/linkedin/status')
      setLinkedin(status)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sync LinkedIn referrals.')
    } finally {
      setLinkedinBusy(false)
    }
  }

  async function disconnectLinkedIn() {
    setLinkedinBusy(true)
    setError('')
    try {
      await api.delete('/referrals/linkedin/connection')
      setLinkedin({
        connected: false,
        status: 'absent',
        profileUrl: null,
        actionRequired: null,
        lastVerifiedAt: null,
        lastSyncedAt: null,
        syncing: false,
        schedule: 'Every 24 hours',
      })
      setLinkedinNotice('LinkedIn disconnected and stored session removed.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not disconnect LinkedIn.')
    } finally {
      setLinkedinBusy(false)
    }
  }



  function addSkill() {
    const skill = newSkill.trim()
    if (!skill) return
    setSkills((list) => (list.includes(skill) ? list : [...list, skill]))
    setNewSkill('')
  }

  /** Removing a skill used to be a single click with no way back. */
  function removeSkill(skill: string) {
    const index = skills.indexOf(skill)
    if (index === -1) return
    setSkills((list) => list.filter((value) => value !== skill))
    setUndoSkill({ name: skill, index })
  }

  function restoreSkill() {
    if (!undoSkill) return
    setSkills((list) => {
      if (list.includes(undoSkill.name)) return list
      const next = [...list]
      next.splice(Math.min(undoSkill.index, next.length), 0, undoSkill.name)
      return next
    })
    setUndoSkill(null)
  }

  async function saveEmployment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!roleDraft) return
    const role = roleDraft.role.trim()
    const company = roleDraft.company.trim()
    if (!role || !company) return

    setRoleBusy(true)
    setError('')
    const payload = {
      role,
      company,
      emoji: roleDraft.emoji.trim() || '💼',
      blurb: roleDraft.blurb.trim() || undefined,
      isCurrent: roleDraft.isCurrent,
      startedOn: monthToDate(roleDraft.startedOn),
      // A current role has no end date, whatever the field happens to hold.
      endedOn: roleDraft.isCurrent ? null : monthToDate(roleDraft.endedOn),
    }
    try {
      if (roleDraft.id) {
        const { data } = await api.patch<Employment>(`/me/kit/employments/${roleDraft.id}`, payload)
        setKit((k) =>
          k ? { ...k, employments: k.employments.map((row) => (row.id === data.id ? data : row)) } : k,
        )
      } else {
        const { data } = await api.post<Employment>('/me/kit/employments', {
          ...payload,
          sortOrder: kit?.employments.length ?? 0,
        })
        setKit((k) => (k ? { ...k, employments: [...k.employments, data] } : k))
      }
      setRoleDraft(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that role.')
    } finally {
      setRoleBusy(false)
    }
  }

  async function removeEmployment(id: string) {
    const previous = kit?.employments ?? []
    setKit((k) => (k ? { ...k, employments: k.employments.filter((e) => e.id !== id) } : k))
    try {
      await api.delete(`/me/kit/employments/${id}`)
    } catch (err) {
      setKit((k) => (k ? { ...k, employments: previous } : k))
      setError(err instanceof Error ? err.message : 'Could not remove that role.')
    }
  }

  if (!kit || !form) {
    return (
      <Card>
        {error ? (
          <Empty emoji="😵" title="The kit did not load" sub={error} />
        ) : (
          <Empty emoji="🧳" title="Packing your kit…" />
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-7">
      <SectionTitle
        emoji="🧳"
        title="My Kit"
        sub="Fill it once. Hunty answers every form with it."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={autofillFromResume}
              disabled={autofilling}
              icon={<span>✨</span>}
            >
              {autofilling ? 'Reading resume…' : 'Autofill from resume'}
            </Button>
            <Button size="sm" onClick={save} disabled={saving} icon={<span>💾</span>}>
              {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save kit'}
            </Button>
          </div>
        }
      />

      {error && (
        <Card className="bg-coral/15!">
          <p className="text-sm font-semibold">{error}</p>
        </Card>
      )}
      {autofillNotice && (
        <Card className="bg-mint/20!">
          <p className="text-sm font-semibold">{autofillNotice}</p>
        </Card>
      )}


      <Card className="flex flex-wrap items-center gap-4 bg-butter-300!">
        <div className="toon-sm flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white text-3xl">
          {kit.photoUrl ? (
            <img src={kit.photoUrl} alt="Portal profile" className="h-full w-full object-cover" />
          ) : (
            user?.avatar ?? '🧑‍🚀'
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-2xl">{user?.name ?? 'Hunter'}</h3>
          <p className="text-sm font-semibold text-ink-soft">
            {form.headline || 'Add a headline below so portals know who you are'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              ref={photoInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void uploadPhoto(file)
                event.target.value = ''
              }}
            />
            <Button size="sm" variant="ghost" disabled={photoBusy} onClick={() => photoInput.current?.click()}>
              {photoBusy ? 'Saving…' : kit.photoUrl ? 'Replace photo' : 'Upload photo'}
            </Button>
            {kit.photoUrl && (
              <Button size="sm" variant="ghost" disabled={photoBusy} onClick={() => void removePhoto()}>
                Remove
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            {user?.kit.resumeName && <Chip tone="white">📄 {user.kit.resumeName}</Chip>}
            <Chip
              tone="mint"
              className={missingFields.length > 0 ? 'cursor-help' : undefined}
              // The number alone never said what was missing.
              title={
                missingFields.length > 0
                  ? `Still blank: ${missingFields.join(', ')}`
                  : 'Every tracked field is filled in.'
              }
            >
              {kit.completeness}% complete
            </Chip>
          </div>
          {missingFields.length > 0 && (
            <p className="max-w-64 text-right text-xs font-semibold text-ink-soft">
              Still blank: {missingFields.slice(0, 3).join(', ')}
              {missingFields.length > 3 && ` and ${missingFields.length - 3} more`}
            </p>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle emoji="🙋" title="Personal" />
          <Card className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <Input value={form.fullName} onChange={set('fullName')} />
              </Field>
              <Field label="Pronouns" hint="optional, shown on some forms">
                <Input value={form.pronouns} onChange={set('pronouns')} placeholder="e.g. they/them" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" hint={touched.email ? errors.email : undefined}>
                <Input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  onBlur={blur('email')}
                  aria-invalid={Boolean(touched.email && errors.email)}
                  className={touched.email && errors.email ? 'bg-coral/15!' : undefined}
                />
              </Field>
              <Field label="Phone" hint={touched.phone ? errors.phone : undefined}>
                <Input
                  value={form.phone}
                  onChange={set('phone')}
                  onBlur={blur('phone')}
                  placeholder="+91 98765 43210"
                  aria-invalid={Boolean(touched.phone && errors.phone)}
                  className={touched.phone && errors.phone ? 'bg-coral/15!' : undefined}
                />
              </Field>
            </div>
            <Field label="Headline" hint="one line, shown under your name">
              <Input
                value={form.headline}
                onChange={set('headline')}
                placeholder="Full-stack Engineer · 4 years · open to remote"
              />
            </Field>
            <Field label="Address">
              <Input value={form.addressLine1} onChange={set('addressLine1')} placeholder="221B Marigold Lane" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City">
                <Input value={form.city} onChange={set('city')} placeholder="Pune" />
              </Field>
              <Field label="State">
                <Input value={form.state} onChange={set('state')} placeholder="Maharashtra" />
              </Field>
              <Field label="PIN / ZIP">
                <Input value={form.postalCode} onChange={set('postalCode')} placeholder="411001" />
              </Field>
            </div>
            <Field label="Country">
              <Input value={form.country} onChange={set('country')} placeholder="India" />
            </Field>
          </Card>
        </section>

        <section className="space-y-6">
          <div>
            <SectionTitle emoji="🔗" title="Links" />
            <Card className="space-y-4">
              <Field label="LinkedIn" hint={touched.linkedinUrl ? errors.linkedinUrl : undefined}>
                <Input
                  value={form.linkedinUrl}
                  onChange={set('linkedinUrl')}
                  onBlur={blur('linkedinUrl')}
                  placeholder="linkedin.com/in/you"
                  aria-invalid={Boolean(touched.linkedinUrl && errors.linkedinUrl)}
                  className={touched.linkedinUrl && errors.linkedinUrl ? 'bg-coral/15!' : undefined}
                />
              </Field>
              <Field label="GitHub" hint={touched.githubUrl ? errors.githubUrl : undefined}>
                <Input
                  value={form.githubUrl}
                  onChange={set('githubUrl')}
                  onBlur={blur('githubUrl')}
                  placeholder="github.com/you"
                  aria-invalid={Boolean(touched.githubUrl && errors.githubUrl)}
                  className={touched.githubUrl && errors.githubUrl ? 'bg-coral/15!' : undefined}
                />
              </Field>
              <Field label="Portfolio" hint={touched.portfolioUrl ? errors.portfolioUrl : undefined}>
                <Input
                  value={form.portfolioUrl}
                  onChange={set('portfolioUrl')}
                  onBlur={blur('portfolioUrl')}
                  placeholder="yoursite.com"
                  aria-invalid={Boolean(touched.portfolioUrl && errors.portfolioUrl)}
                  className={touched.portfolioUrl && errors.portfolioUrl ? 'bg-coral/15!' : undefined}
                />
              </Field>
            </Card>
            <Card className="space-y-3 bg-sky-soft/35!">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg">LinkedIn referral inbox</h3>
                  <p className="mt-1 text-sm font-semibold text-ink-soft">
                    Free browser sync. Hunty checks new DMs every 24 hours.
                  </p>
                </div>
                <Chip tone={linkedin?.connected ? 'mint' : linkedin?.status === 'failed' ? 'coral' : 'white'}>
                  {linkedin?.connected ? 'Connected' : linkedin?.status === 'provisioning' ? 'Sign-in open' : 'Not connected'}
                </Chip>
              </div>

              <Field label="LinkedIn profile URL" hint="Used to label this connection">
                <Input
                  value={linkedinProfileUrl}
                  onChange={(event) => setLinkedinProfileUrl(event.target.value)}
                  placeholder="linkedin.com/in/you"
                  disabled={linkedin?.connected}
                />
              </Field>

              {linkedin?.actionRequired && (
                <p className="rounded-xl bg-butter-200 px-3 py-2 text-xs font-semibold">
                  {linkedin.actionRequired}
                </p>
              )}
              {linkedinNotice && <p className="text-xs font-semibold text-moss">{linkedinNotice}</p>}
              {linkedin?.lastSyncedAt && (
                <p className="text-xs font-semibold text-ink-soft">
                  Last synced {new Date(linkedin.lastSyncedAt).toLocaleString()} · {linkedin.schedule}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {linkedin?.connected ? (
                  <>
                    <Button size="sm" variant="blue" onClick={syncLinkedIn} disabled={linkedinBusy}>
                      {linkedinBusy ? 'Scanning…' : 'Scan referral history'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={disconnectLinkedIn} disabled={linkedinBusy}>
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="blue" onClick={connectLinkedIn} disabled={linkedinBusy}>
                    {linkedinBusy ? 'Opening LinkedIn…' : 'Connect LinkedIn'}
                  </Button>
                )}
              </div>
              <p className="text-[11px] leading-relaxed text-ink-soft">
                LinkedIn does not offer free inbox-reading API access. This uses your own signed-in browser session. Password never enters Huntly. LinkedIn may request verification or restrict automation.
              </p>
            </Card>
          </div>

          <div>
            <SectionTitle emoji="📋" title="The awkward questions" sub="asked by almost every portal" />
            <Card className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Notice period">
                  <Input value={form.noticePeriod} onChange={set('noticePeriod')} placeholder="30 days" />
                </Field>
                <Field label="Total experience">
                  <Input value={form.totalExperience} onChange={set('totalExperience')} placeholder="4 years" />
                </Field>
                <Field label="Maximum required experience" hint="skip jobs asking for more">
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    value={form.maxYearsExperience}
                    onChange={set('maxYearsExperience')}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Current CTC">
                  <Input value={form.currentCtc} onChange={set('currentCtc')} placeholder="₹24,00,000" />
                </Field>
                <Field label="Expected CTC">
                  <Input value={form.expectedCtc} onChange={set('expectedCtc')} placeholder="₹36,00,000" />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Work authorization">
                  <Input
                    value={form.workAuthorization}
                    onChange={set('workAuthorization')}
                    placeholder="Indian citizen — no sponsorship needed"
                  />
                </Field>
                <Field label="Willing to relocate">
                  <Input
                    value={form.willingToRelocate}
                    onChange={set('willingToRelocate')}
                    placeholder="Yes, for the right team"
                  />
                </Field>
              </div>
            </Card>
          </div>
        </section>
      </div>

      <section>
        <SectionTitle
          emoji="💼"
          title="Employment history"
          action={
            <Button size="sm" variant="ghost" onClick={() => setRoleDraft({ ...EMPTY_EMPLOYMENT })}>
              + Add role
            </Button>
          }
        />
        {kit.employments.length === 0 ? (
          <Card>
            <Empty emoji="🍼" title="No roles yet" sub="Add your first job so portals stop asking." />
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {kit.employments.map((e, i) => (
              <Card key={e.id} className="p-4" tilt={i % 2 ? 0.8 : -0.8}>
                <div className="flex items-start gap-3">
                  <div className="toon-sm flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-butter-200 text-xl">
                    {e.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-bold">{e.role}</div>
                    <div className="text-sm text-ink-soft">
                      {e.company} · {e.period}
                    </div>
                    {e.blurb && <p className="mt-1.5 text-sm">{e.blurb}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => setRoleDraft(toDraft(e))}
                      aria-label={`Edit ${e.role} at ${e.company}`}
                      className="text-xs font-semibold text-ink-soft hover:text-ink"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeEmployment(e.id)}
                      aria-label={`Remove ${e.role} at ${e.company}`}
                      className="text-xs font-semibold text-ink-soft hover:text-coral"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle emoji="🛠️" title="Skills" sub="pulled from your resume, edit freely" />
        <Card className="flex flex-wrap items-center gap-2">
          {skills.map((s) => (
            // The whole chip used to be the delete button, so reading the list
            // and destroying it were the same gesture. Only the ✕ removes now.
            <Chip key={s} tone="yellow">
              {s}
              <button
                type="button"
                onClick={() => removeSkill(s)}
                aria-label={`Remove ${s}`}
                className="-mr-1 ml-0.5 rounded-full px-1 leading-none hover:bg-ink/10"
              >
                ✕
              </button>
            </Chip>
          ))}
          <span className="flex items-center gap-1.5">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addSkill()
                }
              }}
              placeholder="add a skill"
              className="w-36 py-1.5 text-sm"
            />
            <Button size="sm" variant="ghost" onClick={addSkill}>
              + add
            </Button>
          </span>
        </Card>
        {undoSkill && (
          <div className="mt-2 flex items-center gap-3 rounded-2xl border-[3px] border-ink bg-butter-200 px-4 py-2">
            <span className="text-sm font-semibold">Removed “{undoSkill.name}”.</span>
            <Button size="sm" variant="ghost" onClick={restoreSkill}>
              Undo
            </Button>
            <button
              type="button"
              onClick={() => setUndoSkill(null)}
              aria-label="Dismiss"
              className="ml-auto text-sm font-bold text-ink-soft hover:text-ink"
            >
              ✕
            </button>
          </div>
        )}
      </section>

      {/* Sticky save bar: the only save button used to be in the page header,
          off-screen by the time anyone finished typing. */}
      {dirty && (
        <div className="sticky bottom-4 z-30 mx-auto w-fit">
          <div className="toon flex items-center gap-3 rounded-full bg-white px-4 py-2.5">
            <span className="text-sm font-semibold">
              {hasErrors ? 'Some fields need fixing' : 'Unsaved changes'}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (!baseline) return
                setForm(baseline.form)
                setSkills(baseline.skills)
                setTouched({})
                setUndoSkill(null)
              }}
            >
              Discard
            </Button>
            <Button size="sm" variant="blue" onClick={save} disabled={saving || hasErrors}>
              {saving ? 'Saving…' : 'Save kit'}
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={roleDraft !== null}
        onClose={() => setRoleDraft(null)}
        size="md"
        eyebrow="Employment history"
        title={roleDraft?.id ? 'Edit role' : 'Add a role'}
        subtitle="Portals ask for dates; storing them here means you only type them once."
      >
        {roleDraft && (
          <form id="employment-form" onSubmit={saveEmployment} className="grid gap-4 sm:grid-cols-2">
            <Field label="Role">
              <Input
                value={roleDraft.role}
                onChange={(event) => setRoleDraft({ ...roleDraft, role: event.target.value })}
                placeholder="Software Engineer"
                required
              />
            </Field>
            <Field label="Company">
              <Input
                value={roleDraft.company}
                onChange={(event) => setRoleDraft({ ...roleDraft, company: event.target.value })}
                placeholder="Nimbus Labs"
                required
              />
            </Field>
            <Field label="Started">
              <Input
                type="month"
                value={roleDraft.startedOn}
                onChange={(event) => setRoleDraft({ ...roleDraft, startedOn: event.target.value })}
              />
            </Field>
            <Field label="Ended" hint={roleDraft.isCurrent ? 'not needed for a current role' : undefined}>
              <Input
                type="month"
                value={roleDraft.endedOn}
                disabled={roleDraft.isCurrent}
                onChange={(event) => setRoleDraft({ ...roleDraft, endedOn: event.target.value })}
              />
            </Field>
            <Field label="Emoji" hint="any one will do">
              <Input
                value={roleDraft.emoji}
                onChange={(event) => setRoleDraft({ ...roleDraft, emoji: event.target.value })}
                maxLength={4}
              />
            </Field>
            <Field label="What you did">
              <Input
                value={roleDraft.blurb}
                onChange={(event) => setRoleDraft({ ...roleDraft, blurb: event.target.value })}
                placeholder="Owned the billing rewrite."
              />
            </Field>
            <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
              <input
                type="checkbox"
                checked={roleDraft.isCurrent}
                onChange={(event) => setRoleDraft({ ...roleDraft, isCurrent: event.target.checked })}
              />
              I work here now
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" size="sm" variant="ghost" onClick={() => setRoleDraft(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" variant="blue" disabled={roleBusy}>
                {roleBusy ? 'Saving…' : roleDraft.id ? 'Save changes' : 'Add to history'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  )
}
