/** Keep links entered in the kit usable by ATS forms and browser navigation. */
export function normaliseHttpUrl(value: string): string {
  const raw = value.trim()
  if (!raw) return ''
  const markdown = /^\[[^\]]*\]\((https?:\/\/[^)\s]+)\)$/i.exec(raw)
  const candidate = (markdown?.[1] ?? raw).replace(/^<|>$/g, '')
  const absolute = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`
  try {
    const parsed = new URL(absolute)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return candidate
    return parsed.toString()
  } catch {
    return candidate
  }
}
