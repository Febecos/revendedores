import { NextRequest, NextResponse } from 'next/server'

// Anti-spam reutilizable para formularios públicos: honeypot + rate-limit por IP
// + bloqueo de dominios de email descartables.

const RATE = new Map<string, number[]>()
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 4

const DISPOSABLE = new Set([
  'jmailservice.com', 'mailinator.com', 'guerrillamail.com', 'sharklasers.com',
  'tempmail.com', 'temp-mail.org', 'yopmail.com', '10minutemail.com',
  'trashmail.com', 'getnada.com', 'maildrop.cc', 'dispostable.com',
])

export function clientIp(req: NextRequest): string {
  return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
}

/** NextResponse para cortar (spam/rate-limit), o null para seguir. */
export function antiSpam(
  req: NextRequest,
  opts: { honeypot?: unknown; email?: string; okBody?: unknown } = {}
): NextResponse | null {
  const ok = opts.okBody ?? { ok: true }
  if (opts.honeypot) return NextResponse.json(ok)

  const ip = clientIp(req)
  const now = Date.now()
  const arr = (RATE.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  arr.push(now)
  RATE.set(ip, arr)
  if (RATE.size > 5000) RATE.clear()
  if (arr.length > MAX_PER_WINDOW)
    return NextResponse.json({ error: 'Demasiados intentos. Esperá un minuto.' }, { status: 429 })

  if (opts.email) {
    const dom = (opts.email.split('@')[1] || '').toLowerCase()
    if (DISPOSABLE.has(dom)) return NextResponse.json(ok)
  }
  return null
}
