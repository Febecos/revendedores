// GET  /api/demo  — verifica si hay demo activa, devuelve diasRestantes
// POST /api/demo  — crea una demo de 7 días (cookie HttpOnly firmada con HMAC)

import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { getDb } from '@/lib/db'

const SECRET  = process.env.DEMO_SECRET || 'febecos-demo-secret-2025'
const DIAS    = 7
const COOKIE  = 'febecos_demo'

// ── helpers ─────────────────────────────────────────────────────────────────

function firmar(expires: number): string {
  const payload = String(expires)
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 20)
  return `${payload}.${sig}`
}

function verificar(valor: string): { ok: boolean; expired: boolean; diasRestantes: number } {
  const parts = valor.split('.')
  if (parts.length !== 2) return { ok: false, expired: false, diasRestantes: 0 }
  const [payload, sig] = parts
  const expected = createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 20)
  if (sig !== expected) return { ok: false, expired: false, diasRestantes: 0 }
  const expires = Number(payload)
  if (isNaN(expires)) return { ok: false, expired: false, diasRestantes: 0 }
  if (Date.now() > expires) return { ok: false, expired: true, diasRestantes: 0 }
  const diasRestantes = Math.ceil((expires - Date.now()) / (1000 * 60 * 60 * 24))
  return { ok: true, expired: false, diasRestantes }
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
  // Leer datos del formulario (puede venir vacío si se llama sin body)
  let nombre = '', email = '', whatsapp = '', localidad = ''
  try {
    const body = await req.json()
    nombre    = body.nombre    || ''
    email     = body.email     || ''
    whatsapp  = body.whatsapp  || ''
    localidad = body.localidad || ''
  } catch { /* body vacío — ok */ }

  // Guardar lead en DB (graceful — si falla, igual damos la demo)
  if (nombre || email) {
    try {
      const sql = getDb()
      await sql`
        INSERT INTO demo_leads (nombre, email, whatsapp, localidad, creado_en)
        VALUES (${nombre}, ${email}, ${whatsapp}, ${localidad}, NOW())
        ON CONFLICT (email) DO UPDATE
          SET whatsapp  = EXCLUDED.whatsapp,
              localidad = EXCLUDED.localidad,
              creado_en = NOW()
      `
    } catch (err) {
      // La tabla puede no existir todavía — la creamos y reintentamos
      try {
        const sql = getDb()
        await sql`
          CREATE TABLE IF NOT EXISTS demo_leads (
            id         SERIAL PRIMARY KEY,
            nombre     TEXT,
            email      TEXT UNIQUE,
            whatsapp   TEXT,
            localidad  TEXT,
            creado_en  TIMESTAMPTZ DEFAULT NOW()
          )
        `
        await sql`
          INSERT INTO demo_leads (nombre, email, whatsapp, localidad)
          VALUES (${nombre}, ${email}, ${whatsapp}, ${localidad})
          ON CONFLICT (email) DO UPDATE
            SET whatsapp  = EXCLUDED.whatsapp,
                localidad = EXCLUDED.localidad,
                creado_en = NOW()
        `
      } catch (e2) {
        console.warn('[demo] No se pudo guardar el lead:', e2)
      }
    }
  }

  const expires = Date.now() + DIAS * 24 * 60 * 60 * 1000
  const token = firmar(expires)

  const res = NextResponse.json({ ok: true, diasRestantes: DIAS })
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: DIAS * 24 * 60 * 60,
    path: '/',
  })
  return res
}
