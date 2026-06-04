// GET /api/email-queue/process  — procesador de la cola (llamado por cron de Vercel)
// Vercel lo llama con header Authorization: Bearer <CRON_SECRET>
// También acepta ?key=GUARD para dispararlo manualmente desde admin
//
// Parámetros query:
//   batch=3   → cuántos emails enviar por corrida (default 3)
//
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getDb } from '@/lib/db'

const GUARD       = process.env.RECORDATORIO_KEY || 'f0d9811cd021923ba50d50b1'
const CRON_SECRET = process.env.CRON_SECRET || ''
const FROM        = 'Febecos Revendedores <revende@febecos.com>'
const REPLY_TO    = 'revende@febecos.com'

function autorizado(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || ''
  if (CRON_SECRET && auth === `Bearer ${CRON_SECRET}`) return true
  if (req.nextUrl.searchParams.get('key') === GUARD) return true
  return false
}

export async function GET(req: NextRequest) {
  if (!autorizado(req)) {
    return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  }

  const batch = Math.min(parseInt(req.nextUrl.searchParams.get('batch') || '3'), 10)
  const sql   = getDb()
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Toma los próximos N pendientes (SKIP LOCKED evita procesamiento doble)
  const rows = await sql`
    SELECT id, email, nombre, asunto, html_body, tipo, intentos
    FROM email_queue
    WHERE estado = 'pendiente' AND intentos < 3
    ORDER BY created_at ASC
    LIMIT ${batch}
    FOR UPDATE SKIP LOCKED
  `

  if (!rows.length) {
    return NextResponse.json({ ok: true, procesados: 0, msg: 'Cola vacía' })
  }

  const enviados: string[] = []
  const fallidos: string[] = []

  for (const row of rows as any[]) {
    try {
      const res = await resend.emails.send({
        from:    FROM,
        replyTo: REPLY_TO,
        to:      row.email,
        subject: row.asunto,
        html:    row.html_body,
      })

      if (res.error) throw new Error(res.error.message)

      await sql`
        UPDATE email_queue
        SET estado = 'enviado', enviado_at = NOW(), intentos = intentos + 1
        WHERE id = ${row.id}
      `
      enviados.push(row.email)
    } catch (e: any) {
      const intentos = (row.intentos || 0) + 1
      await sql`
        UPDATE email_queue
        SET estado = ${intentos >= 3 ? 'fallido' : 'pendiente'},
            intentos = ${intentos},
            error_msg = ${e.message}
        WHERE id = ${row.id}
      `
      fallidos.push(row.email)
    }
  }

  console.log(`[email-queue/process] enviados=${enviados.length} fallidos=${fallidos.length}`)
  return NextResponse.json({ ok: true, procesados: rows.length, enviados: enviados.length, fallidos: fallidos.length })
}
