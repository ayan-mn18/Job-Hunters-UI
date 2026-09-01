import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Chip, Empty, SectionTitle } from '../components/ui'
import { api } from '../lib/api'

interface Notification {
  id: string
  kind: string
  urgency: 'now' | 'soon' | 'fyi'
  title: string
  body: string | null
  link: string | null
  applicationId: string | null
  readAt: string | null
  createdAt: string
}

interface InboxStatus {
  connected: boolean
  kind: string | null
  address: string | null
  lastPolledAt: string | null
  dailySweep: boolean
  available: boolean
  note: string
}

const KIND_EMOJI: Record<string, string> = {
  interview: '🎉',
  assessment: '📝',
  recruiter: '📨',
  rejection: '📪',
  blocked_application: '🖐️',
  run_finished: '🔎',
  referral: '🤝',
}

/**
 * Urgency, in words rather than a number.
 *
 * `fyi` deliberately has no colour. Rejections are the most common thing that
 * ever lands here, and giving them a badge would turn the screen into a wall
 * of red that hides the one interview invite.
 */
const URGENCY_LABEL: Record<Notification['urgency'], { text: string; tone: 'coral' | 'yellow' | 'white' }> = {
  now: { text: 'today', tone: 'coral' },
  soon: { text: 'this week', tone: 'yellow' },
  fyi: { text: '', tone: 'white' },
}

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - Date.parse(iso)) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function Notifications() {
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [status, setStatus] = useState<InboxStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [connecting, setConnecting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [feed, inbox] = await Promise.all([
        api.get<{ unread: number; items: Notification[] }>('/notifications'),
        api.get<InboxStatus>('/inbox/status'),
      ])
      setItems(feed.data.items)
      setUnread(feed.data.unread)
      setStatus(inbox.data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load notifications.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function markRead(id: string) {
    // Optimistic: the row is already read by the time the request lands, and
    // waiting for a round trip to grey it out feels broken.
    setItems((current) => current.map((item) => (item.id === id ? { ...item, readAt: new Date().toISOString() } : item)))
    setUnread((count) => Math.max(0, count - 1))
    await api.post(`/notifications/${id}/read`, {}).catch(() => undefined)
  }

  async function markAllRead() {
    setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })))
    setUnread(0)
    await api.post('/notifications/read-all', {}).catch(() => undefined)
  }

  async function connectGmail() {
    setConnecting(true)
    try {
      const { data } = await api.post<{ authorizeUrl: string }>('/inbox/gmail/connect', {})
      window.location.href = data.authorizeUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the Gmail connection.')
      setConnecting(false)
    }
  }

  const needsAttention = items.filter((item) => item.urgency !== 'fyi' && !item.readAt)
  const rest = items.filter((item) => item.urgency === 'fyi' || item.readAt)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <SectionTitle emoji="🔔" title="Notifications" />
        {unread > 0 && <Chip tone="coral">{unread} unread</Chip>}
        {unread > 0 && (
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => void markAllRead()}>
            Mark all read
          </Button>
        )}
      </div>

      {status && !status.connected && (
        <Card className="bg-sky-soft!">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-3xl">📬</div>
            <div className="mr-auto max-w-lg">
              <h3 className="text-xl">Connect your inbox</h3>
              <p className="mt-1 text-[15px] font-semibold text-ink-soft">
                Hunty reads replies from employers and tells you when one matters. {status.note}
              </p>
            </div>
            {status.available ? (
              <Button onClick={() => void connectGmail()} disabled={connecting}>
                {connecting ? 'Opening Google…' : 'Connect Gmail'}
              </Button>
            ) : (
              <Chip tone="white">Not configured</Chip>
            )}
          </div>
        </Card>
      )}

      {error && <Card className="bg-coral/15!">{error}</Card>}

      {loading ? (
        <Card>Loading…</Card>
      ) : items.length === 0 ? (
        <Empty
          emoji="🌱"
          title="Nothing yet"
          sub="When an employer replies, or an application needs you, it shows up here."
        />
      ) : (
        <>
          {needsAttention.length > 0 && (
            <div className="space-y-3">
              {needsAttention.map((item) => (
                <Row key={item.id} item={item} onRead={() => void markRead(item.id)} />
              ))}
            </div>
          )}

          {rest.length > 0 && (
            <div className="space-y-2">
              <div className="font-display text-sm font-bold text-ink-soft">Everything else</div>
              {rest.map((item) => (
                <Row key={item.id} item={item} muted onRead={() => void markRead(item.id)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Row({
  item,
  muted,
  onRead,
}: {
  item: Notification
  muted?: boolean
  onRead: () => void
}) {
  const urgency = URGENCY_LABEL[item.urgency]
  const body = (
    <div className="flex items-start gap-3">
      <div className="text-2xl leading-none">{KIND_EMOJI[item.kind] ?? '•'}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display font-bold">{item.title}</span>
          {urgency.text && <Chip tone={urgency.tone}>{urgency.text}</Chip>}
          <span className="ml-auto text-xs font-semibold text-ink-soft">{timeAgo(item.createdAt)}</span>
        </div>
        {item.body && <p className="mt-1 text-[15px] font-semibold text-ink-soft">{item.body}</p>}
      </div>
    </div>
  )

  return (
    <Card className={muted ? 'opacity-70' : undefined}>
      {item.link ? (
        <Link to={item.link} onClick={onRead} className="block">
          {body}
        </Link>
      ) : (
        <button type="button" className="block w-full text-left" onClick={onRead}>
          {body}
        </button>
      )}
    </Card>
  )
}
