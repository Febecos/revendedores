// /api/seguimiento-activos - Follow-up "novedades y soporte" a revendedores
// aprobados/activos. Usa la plantilla EDITABLE (asunto/cuerpo) que viene del
// card "✅ Seguimiento - Activos" del admin, NO el recordatorio de datos.
//
//   GET  ?key=GUARD                 → dry-run: lista destinatarios (no envía)
//   POST ?key=GUARD                 → envía a TODOS los aprobados/activos (cola)
//   POST ?key=GUARD&test=EMAIL      → envía SOLO a EMAIL (prueba directa)
//   body: { asunto, cuerpo }        → plantilla; {nombre} y {link} se reemplazan
//
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getDb } from '@/lib/db'

const GUARD  = process.env.RECORDATORIO_KEY || 'f0d9811cd021923ba50d50b1'
const PORTAL = 'https://revendedores.febecos.com/portal'

const ASUNTO_DEF = '{nombre}, novedades y soporte - Portal Febecos Revendedores'
const CUERPO_DEF = `Hola {nombre},

Espero que estés aprovechando el portal. Si tenés preguntas sobre cómo cotizar o hacer un pedido, escribinos.

Tu acceso: {link}

Saludos, Guillermo Sandler - Febecos`

function esc(s: string) {
  return String(s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] || c))
}

function render(plantilla: string, nombre: string, token: string): string {
  const primer = (nombre || '').split(' ')[0] || 'Hola'
  const url = `${PORTAL}?token=${token}`
  // El cuerpo es texto plano editable; respetamos saltos de línea y convertimos {link} en botón/enlace.
  const cuerpoHtml = esc(plantilla)
    .replace(/\{nombre\}/g, esc(primer))
    .replace(/\{link\}/g, `<a href="${url}" style="color:#003d72;font-weight:700">${url}</a>`)
    .replace(/\n/g, '<br/>')
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Portal Revendedores Febecos</title></head>
<body style="margin:0;background:#f0f4f8;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a2a3a">
  <div style="max-width:600px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)">
    <div style="background:#003d72;padding:30px 40px;text-align:center">
      <img src="https://selector.febecos.com/images/febecos-logo.png" alt="Febecos" style="height:40px;object-fit:contain"/>
    </div>
    <div style="background:#fff;padding:34px 40px;font-size:15px;line-height:1.85;color:#2d3f55">
      ${cuerpoHtml}
      <div style="text-align:center;margin-top:30px">
        <a href="${url}" style="display:inline-block;background:#a8c61b;color:#003d72;padding:15px 42px;border-radius:12px;font-weight:800;font-size:16px;text-decoration:none">Entrar al portal →</a>
      </div>
    </div>
    <div style="background:#f0f4f8;padding:24px 40px;text-align:center;border-top:1px solid #d6e0ea;font-size:12px;color:#7a8fa5;line-height:1.8">
      <strong>Guillermo Sandler</strong> · Febecos Bombas Solares<br/>
      <a href="mailto:revende@febecos.com" style="color:#003d72;text-decoration:none;font-weight:600">revende@febecos.com</a> ·
      <a href="https://febecos.com" style="color:#003d72;text-decoration:none;font-weight:600">febecos.com</a><br/>
      <span style="display:block;margin-top:6px">Lun a Vie 10-17 hs · Argentina</span>
    </div>
  </div>
</body></html>`
}

async function getDestinatarios() {
  const sql = getDb()
  return await sql`
    SELECT nombre, email, token_acceso
    FROM solicitudes_revendedor
    WHERE estado IN ('aprobado','activo')
      AND token_acceso IS NOT NULL
      AND token_acceso_activo = true
      AND email IS NOT NULL AND email <> ''
    ORDER BY created_at DESC
  `
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('key') !== GUARD) {
    return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  }
  const rows = await getDestinatarios()
  return NextResponse.json({
    ok: true,
    total: rows.length,
    destinatarios: rows.map((r: any) => ({ nombre: r.nombre, email: r.email })),
  })
}

export async function POST(req: NextRequest) {
  if (req.nextUrl.searchParams.get('key') !== GUARD) {
    return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const asuntoTpl = (body.asunto && String(body.asunto).trim()) || ASUNTO_DEF
  const cuerpoTpl = (body.cuerpo && String(body.cuerpo).trim()) || CUERPO_DEF
  const asuntoDe = (nombre: string) => asuntoTpl.replace(/\{nombre\}/g, (nombre || '').split(' ')[0] || 'Hola')

  const testEmail = (req.nextUrl.searchParams.get('test') || '').toLowerCase().trim()
  let rows = await getDestinatarios()

  if (testEmail) {
    const sql = getDb()
    const fallback = await sql`
      SELECT nombre, email, token_acceso FROM solicitudes_revendedor
      WHERE lower(email) = ${testEmail} AND token_acceso IS NOT NULL LIMIT 1
    `
    rows = fallback.length ? fallback : []
    if (!rows.length) {
      return NextResponse.json({ ok: false, error: `"${testEmail}" no encontrado con token activo` }, { status: 404 })
    }
  }

  // Prueba: directo; Masivo: cola
  if (testEmail) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const r = rows[0] as any
    try {
      const res = await resend.emails.send({
        from: 'Febecos Revendedores <revende@febecos.com>',
        replyTo: 'revende@febecos.com',
        to: r.email,
        subject: asuntoDe(r.nombre),
        html: render(cuerpoTpl, r.nombre, r.token_acceso),
      })
      if (res.error) return NextResponse.json({ ok: false, error: res.error.message })
      return NextResponse.json({ ok: true, modo: 'prueba', enviados: [{ email: r.email, id: res.data?.id }], fallidos: [] })
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
    }
  }

  const { randomUUID } = await import('crypto')
  const job_id = randomUUID()
  const emailsParaEncolar = (rows as any[]).map(r => ({
    email: r.email, nombre: r.nombre,
    asunto: asuntoDe(r.nombre), html_body: render(cuerpoTpl, r.nombre, r.token_acceso),
  }))
  // INSERT directo en email_queue (antes: self-fetch HTTP a /api/email-queue que fallaba en
  // Vercel sin que nadie lo notara — la UI decía "encolado" pero no llegaba nada a la tabla).
  const sqlIns = getDb()
  for (const e of emailsParaEncolar) {
    await sqlIns`
      INSERT INTO email_queue (job_id, tipo, email, nombre, asunto, html_body)
      VALUES (${job_id}, 'seguimiento-activos', ${e.email}, ${e.nombre || null}, ${e.asunto}, ${e.html_body})
    `
  }
  return NextResponse.json({
    ok: true, modo: 'cola', job_id, encolados: emailsParaEncolar.length,
    msg: `${emailsParaEncolar.length} emails encolados. ~${Math.ceil(emailsParaEncolar.length / 3) * 3} min en total.`,
  })
}
