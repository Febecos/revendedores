// GET  /api/demo  — verifica si hay demo activa, devuelve diasRestantes + email
// POST /api/demo  — crea una demo de 7 días (cookie HttpOnly firmada con HMAC)

import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { getDb } from '@/lib/db'
import { antiSpam } from '@/lib/anti-spam'

const SECRET  = process.env.DEMO_SECRET || 'febecos-demo-secret-2025'
const DIAS    = 7
const COOKIE  = 'febecos_demo'

// ── helpers ─────────────────────────────────────────────────────────────────
// Formato de cookie: "expires|email.sig"  (sig cubre "expires|email")

function firmar(expires: number, email: string): string {
  const payload = `${expires}|${email}`
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 20)
  return `${payload}.${sig}`
}

function verificar(valor: string): { ok: boolean; expired: boolean; diasRestantes: number; email: string } {
  const lastDot = valor.lastIndexOf('.')
  if (lastDot < 0) return { ok: false, expired: false, diasRestantes: 0, email: '' }
  const payload = valor.slice(0, lastDot)
  const sig     = valor.slice(lastDot + 1)
  const expected = createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 20)
  if (sig !== expected) return { ok: false, expired: false, diasRestantes: 0, email: '' }
  const [expiresStr, email = ''] = payload.split('|')
  const expires = Number(expiresStr)
  if (isNaN(expires)) return { ok: false, expired: false, diasRestantes: 0, email: '' }
  if (Date.now() > expires) return { ok: false, expired: true, diasRestantes: 0, email }
  const diasRestantes = Math.ceil((expires - Date.now()) / (1000 * 60 * 60 * 24))
  return { ok: true, expired: false, diasRestantes, email }
}

// ── GET — chequear demo activa ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE)?.value
  if (!cookie) return NextResponse.json({ ok: false, expired: false })
  const result = verificar(cookie)
  return NextResponse.json(result)
}

// ── POST — iniciar demo ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let nombre = '', email = '', whatsapp = '', localidad = '', website: unknown = ''
  try {
    const body = await req.json()
    nombre    = body.nombre    || ''
    email     = body.email     || ''
    whatsapp  = body.whatsapp  || ''
    localidad = body.localidad || ''
    website   = body.website   || ''
  } catch { /* body vacío — ok */ }

  const blocked = antiSpam(req, { honeypot: website, email })
  if (blocked) return blocked

  // Guardar en solicitudes_revendedor con estado='demo' (para analytics en admin)
  if (nombre || email) {
    try {
      const sql = getDb()
      // No crear una fila demo nueva si el email ya solicitó o está aprobado (evita las 2
      // filas del mismo revendedor: pedido coordinador, punto 3). Antes solo excluía
      // aprobado/activo — le faltaba 'pendiente'.
      const existing = await sql`
        SELECT id FROM solicitudes_revendedor
        WHERE lower(email) = ${email.toLowerCase()} AND estado IN ('aprobado','activo','pendiente')
        LIMIT 1
      `
      if (existing.length === 0) {
        await sql`
          INSERT INTO solicitudes_revendedor (nombre, email, whatsapp, localidad, estado)
          VALUES (${nombre}, ${email}, ${whatsapp}, ${localidad}, 'demo')
        `
      }
    } catch (e) {
      console.warn('[demo] No se pudo guardar en solicitudes_revendedor:', e)
    }
  }

  const expires = Date.now() + DIAS * 24 * 60 * 60 * 1000
  const token = firmar(expires, email)

  const res = NextResponse.json({ ok: true, diasRestantes: DIAS, email })
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: DIAS * 24 * 60 * 60,
    path: '/',
  })
  return res
}
