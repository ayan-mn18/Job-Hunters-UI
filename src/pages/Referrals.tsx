import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/context'
import { Button, Card, Chip, Empty, Field, Input, SectionTitle } from '../components/ui'
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
  const [showAddRole, setShowAddRole] = useState(false)
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

  async function save() {
    if (!form) return
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      // The API treats "" as "cleared"; absent keys are left alone.
      const { data } = await api.put<FullKit>('/me/kit', { ...form, skills })
      setKit(data)
      setForm(toForm(data))
      setSkills(data.skills)
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
        days: 7,
      })
      setLinkedinNotice(
        `Checked ${data.inboxesScanned.join(' + ') || 'LinkedIn'}: found ${data.visibleConversations} conversations, opened ${data.scannedThreads}, read ${data.recentInboundMessages} incoming messages from the last 7 days, matched ${data.matchedMessages}, and imported ${data.imported}.`,
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

  async function addEmployment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fields = new FormData(e.currentTarget)
    const role = String(fields.get('role') ?? '').trim()
    const company = String(fields.get('company') ?? '').trim()
    if (!role || !company) return
    try {
      const { data } = await api.post<Employment>('/me/kit/employments', {
        role,
        company,
        emoji: String(fields.get('emoji') ?? '').trim() || '💼',
        blurb: String(fields.get('blurb') ?? '').trim() || undefined,
        isCurrent: fields.get('isCurrent') === 'on',
        sortOrder: kit?.employments.length ?? 0,
      })
      setKit((k) => (k ? { ...k, employments: [...k.employments, data] } : k))
      setShowAddRole(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add that role.')
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
        <div className="flex gap-2">
          {user?.kit.resumeName && <Chip tone="white">📄 {user.kit.resumeName}</Chip>}
          <Chip tone="mint">{kit.completeness}% complete</Chip>
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
              <Field label="Email">
                <Input type="email" value={form.email} onChange={set('email')} />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
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
              <Field label="LinkedIn">
                <Input value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="linkedin.com/in/you" />
              </Field>
              <Field label="GitHub">
                <Input value={form.githubUrl} onChange={set('githubUrl')} placeholder="github.com/you" />
              </Field>
              <Field label="Portfolio">
                <Input value={form.portfolioUrl} onChange={set('portfolioUrl')} placeholder="yoursite.com" />
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
                      {linkedinBusy ? 'Scanning…' : 'Scan last 7 days now'}
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
            <Button size="sm" variant="ghost" onClick={() => setShowAddRole((s) => !s)}>
              {showAddRole ? '✕ Cancel' : '+ Add role'}
            </Button>
          }
        />
        {showAddRole && (
          <Card className="mb-3 animate-pop-in">
            <form onSubmit={addEmployment} className="grid gap-3 sm:grid-cols-2">
              <Field label="Role">
                <Input name="role" placeholder="Software Engineer" required />
              </Field>
              <Field label="Company">
                <Input name="company" placeholder="Nimbus Labs" required />
              </Field>
              <Field label="Emoji" hint="any one will do">
                <Input name="emoji" placeholder="🌩️" maxLength={4} />
              </Field>
              <Field label="What you did">
                <Input name="blurb" placeholder="Owned the billing rewrite." />
              </Field>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" name="isCurrent" defaultChecked /> I work here now
              </label>
              <div className="flex items-end justify-end">
                <Button type="submit" size="sm" variant="blue" icon={<span>➕</span>}>
                  Add to history
                </Button>
              </div>
            </form>
          </Card>
        )}
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
                  <button
                    onClick={() => removeEmployment(e.id)}
                    aria-label={`Remove ${e.role} at ${e.company}`}
                    className="text-xs font-semibold text-ink-soft hover:text-coral"
                  >
                    ✕
                  </button>
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
            <button key={s} onClick={() => setSkills((list) => list.filter((x) => x !== s))}>
              <Chip tone="yellow">{s} ✕</Chip>
            </button>
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
      </section>
    </div>
  )
}
