// GET  /api/email-queue?job_id=X&key=GUARD  → estado del job
// POST /api/email-queue                       → encolar emails (body: { key, job_id, emails: [{email,nombre,asunto,html_body}], tipo })
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { randomUUID } from 'crypto'

const GUARD = process.env.RECORDATORIO_KEY || 'f0d9811cd021923ba50d50b1'

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('key') !== GUARD) {
    return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  }

  const sql = getDb()
  const job_id = req.nextUrl.searchParams.get('job_id')
  const tipo   = req.nextUrl.searchParams.get('tipo')

  // ── Por job_id específico ─────────────────────────────────────────────────
  if (job_id) {
    const rows = await sql`
      SELECT
        COUNT(*) FILTER (WHERE estado = 'pendiente') AS pendiente,
        COUNT(*) FILTER (WHERE estado = 'enviado')   AS enviado,
        COUNT(*) FILTER (WHERE estado = 'fallido')   AS fallido,
        COUNT(*) AS total,
        MIN(created_at) AS iniciado_at,
        MAX(enviado_at) AS ultimo_envio_at
      FROM email_queue WHERE job_id = ${job_id}
    `
    return NextResponse.json({ ok: true, job_id, ...rows[0] })
  }

  // ── Último job por tipo ───────────────────────────────────────────────────
  if (tipo) {
    const rows = await sql`
      SELECT
        job_id,
        COUNT(*) FILTER (WHERE estado = 'pendiente') AS pendiente,
        COUNT(*) FILTER (WHERE estado = 'enviado')   AS enviado,
        COUNT(*) FILTER (WHERE estado = 'fallido')   AS fallido,
        COUNT(*) AS total,
        MIN(created_at) AS iniciado_at,
        MAX(enviado_at) AS ultimo_envio_at
      FROM email_queue
      WHERE tipo = ${tipo}
        AND job_id = (
          SELECT job_id FROM email_queue
          WHERE tipo = ${tipo}
          ORDER BY created_at DESC LIMIT 1
        )
      GROUP BY job_id
    `
    if (!rows.length) return NextResponse.json({ ok: true, tipo, sin_jobs: true })
    return NextResponse.json({ ok: true, tipo, ...rows[0] })
  }

  return NextResponse.json({ ok: false, error: 'job_id o tipo requerido' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (body.key !== GUARD) {
    return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  }
  const { emails, tipo, job_id: jobIdParam } = body
  if (!emails?.length) return NextResponse.json({ ok: false, error: 'emails requerido' }, { status: 400 })

  const job_id = jobIdParam || randomUUID()
  const sql = getDb()

  // Insertar todos los destinatarios como filas pendientes
  for (const e of emails) {
    await sql`
      INSERT INTO email_queue (job_id, tipo, email, nombre, asunto, html_body)
      VALUES (${job_id}, ${tipo || 'generico'}, ${e.email}, ${e.nombre || null}, ${e.asunto}, ${e.html_body})
    `
  }

  return NextResponse.json({ ok: true, job_id, encolados: emails.length })
}
