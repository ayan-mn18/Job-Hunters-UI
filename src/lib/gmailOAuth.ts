import { useEffect, useRef } from 'react'
import { api } from './api'

/** Handles Gmail's full-page OAuth return from whichever app screen started it. */
export function useGmailOAuthReturn(onDone: (message: string | null) => void): void {
  const onDoneRef = useRef(onDone)
  const handledRef = useRef(false)

  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    if (handledRef.current) return
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const oauthError = params.get('error')

    if (oauthError) {
      handledRef.current = true
      window.history.replaceState(null, '', window.location.pathname + window.location.hash)
      onDoneRef.current(
        params.get('error_description') ?? 'Google did not approve the Gmail connection.',
      )
      return
    }
    if (!code || !state) return

    handledRef.current = true
    window.history.replaceState(null, '', window.location.pathname + window.location.hash)
    void api
      .post('/inbox/gmail/callback', { code, state })
      .then(() => {
        onDoneRef.current(null)
      })
      .catch((err) => {
        onDoneRef.current(err instanceof Error ? err.message : 'Could not connect Gmail.')
      })
  }, [])
}
