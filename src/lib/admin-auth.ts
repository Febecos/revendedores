import crypto from 'node:crypto'
import { NextResponse } from 'next/server'

/**
 * Server-side admin authentication for the revendedores panel.
 *
 * Previously the only "auth" was a hardcoded password compared in the client
 * bundle, and the /api/admin/* and /api/pedidos* routes had no check at all.
 * Now login is validated server-side against ADMIN_PASSWORD and issues an
 * HMAC-signed, httpOnly session cookie that every protected route verifies.
 *
 * Required env var (set in Vercel): ADMIN_PASSWORD — strong, not the old value.
 * Fails closed: if ADMIN_PASSWORD is not set, login and all checks reject.
 */

const COOKIE_NAME = 'rev_admin'
const SESSION_TTL_MS = 1000 * 60 * 60 * 12 // 12 hours

function getSecret(): string | null {
  const pwd = process.env.ADMIN_PASSWORD
  if (!pwd || pwd.length < 8) return null
  return pwd
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb)
}

/** Validate a login password attempt against ADMIN_PASSWORD (constant-time). */
export function checkAdminPassword(password: string): boolean {
  const secret = getSecret()
  if (!secret || typeof password !== 'string') return false
  return timingSafeEqualStr(password, secret)
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

/** Build a signed session token: `<expiryMs>.<hmac>`. */
export function createSessionToken(): string | null {
  const secret = getSecret()
  if (!secret) return null
  const exp = String(Date.now() + SESSION_TTL_MS)
  return `${exp}.${sign(exp, secret)}`
}

function isValidToken(token: string | undefined): boolean {
  const secret = getSecret()
  if (!secret || !token) return false
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return false
  const exp = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (!timingSafeEqualStr(sig, sign(exp, secret))) return false
  const expMs = Number(exp)
  return Number.isFinite(expMs) && expMs > Date.now()
}

/**
 * Verify the request carries a valid admin session cookie.
 * Returns null when authorized, or a 401 NextResponse when not.
 */
export function requireAdmin(req: Request): NextResponse | null {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  const token = match ? decodeURIComponent(match[1]) : undefined
  if (isValidToken(token)) return null
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME
export const ADMIN_COOKIE_MAX_AGE = Math.floor(SESSION_TTL_MS / 1000)
