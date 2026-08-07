import type { AuthSession } from './types'

/**
 * The one place that talks to Job-Hunters-api.
 *
 * - Base URL comes from `VITE_API_URL` (see `.env`).
 * - The access token rides on every request as a bearer header.
 * - A 401 triggers exactly one refresh (shared across concurrent requests),
 *   then the original call is retried once. If the refresh also fails the
 *   tokens are dropped and `SESSION_EXPIRED_EVENT` is broadcast so the
 *   AuthContext can bounce the user back to /login.
 */

const BASE_URL = (
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:6060'
).replace(/\/$/, '')

export { BASE_URL }

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

/* ------------------------------------------------------------------ tokens */

const ACCESS_KEY = 'jobhunters.accessToken'
const REFRESH_KEY = 'jobhunters.refreshToken'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function storeTokens(session: AuthSession): void {
  localStorage.setItem(ACCESS_KEY, session.accessToken)
  localStorage.setItem(REFRESH_KEY, session.refreshToken)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

/** Fired when the refresh token is dead too — time to show the login page. */
export const SESSION_EXPIRED_EVENT = 'jobhunters:session-expired'

/* ----------------------------------------------------------------- refresh */

let refreshing: Promise<boolean> | null = null

async function refreshSession(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false
    const body = (await res.json()) as { data: AuthSession }
    storeTokens(body.data)
    return true
  } catch {
    return false
  }
}

/** All concurrent 401s pile onto the same refresh call. */
function refreshOnce(): Promise<boolean> {
  refreshing ??= refreshSession().finally(() => {
    refreshing = null
  })
  return refreshing
}

/* ----------------------------------------------------------------- request */

type Envelope<T> = { data: T; meta?: Record<string, unknown> }

interface RequestOptions {
  body?: unknown
  form?: FormData
  /** Internal: stops a retried request from looping on a second 401. */
  retried?: boolean
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<Envelope<T>> {
  const headers: Record<string, string> = {}
  const token = getAccessToken()
  if (token) headers.authorization = `Bearer ${token}`
  if (options.body !== undefined) headers['content-type'] = 'application/json'

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: options.form ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
    })
  } catch {
    throw new ApiError(
      0,
      'network_error',
      `Cannot reach the API at ${BASE_URL}. Is the backend running?`,
    )
  }

  if (res.status === 401 && !options.retried) {
    if (await refreshOnce()) {
      return request<T>(method, path, { ...options, retried: true })
    }
    clearTokens()
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
  }

  if (res.status === 204) return { data: undefined as T }

  const text = await res.text()
  const json = text ? JSON.parse(text) : {}

  if (!res.ok) {
    const err = (json as { error?: { code?: string; message?: string; details?: unknown } }).error
    throw new ApiError(
      res.status,
      err?.code ?? 'unknown',
      err?.message ?? `Request failed with status ${res.status}`,
      err?.details,
    )
  }

  return json as Envelope<T>
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
  /** Multipart upload — pass a FormData with the file under `file`. */
  upload: <T>(path: string, form: FormData) => request<T>('POST', path, { form }),
}

/**
 * Authenticated file download (the CSV export). Reads the response as a blob
 * and clicks a temporary anchor, because a plain `window.open` cannot carry
 * the Authorization header.
 */
export async function downloadFile(path: string, fileName: string): Promise<void> {
  const headers: Record<string, string> = {}
  const token = getAccessToken()
  if (token) headers.authorization = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { headers })
  if (!res.ok) throw new ApiError(res.status, 'download_failed', 'The download failed.')

  const url = URL.createObjectURL(await res.blob())
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
