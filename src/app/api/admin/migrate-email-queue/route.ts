// Endpoint temporal — BORRAR después de correr una vez
// POST /api/admin/migrate-email-queue  con header x-migrate-token: feb-mig-2026-queue
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const TOKEN = 'feb-mig-2026-queue'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-migrate-token') !== TOKEN) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const sql = getDb()
  await sql`
    CREATE TABLE IF NOT EXISTS email_queue (
      id           SERIAL PRIMARY KEY,
      job_id       TEXT NOT NULL,
      tipo         TEXT NOT NULL,
      email        TEXT NOT NULL,
      nombre       TEXT,
      asunto       TEXT NOT NULL,
      html_body    TEXT NOT NULL,
      estado       TEXT NOT NULL DEFAULT 'pendiente',
      intentos     INTEGER NOT NULL DEFAULT 0,
      enviado_at   TIMESTAMPTZ,
      error_msg    TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS email_queue_estado_idx ON email_queue (estado, created_at)`
  await sql`CREATE INDEX IF NOT EXISTS email_queue_job_idx   ON email_queue (job_id)`
  return NextResponse.json({ ok: true, msg: 'Tabla email_queue creada' })
}
