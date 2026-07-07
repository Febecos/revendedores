// /api/seguimiento-demo-sin-uso — Encuesta a demos que NO hicieron ninguna consulta MCA
//
//   GET ?key=GUARD              → CRON: encola a los elegibles y los marca (no reenvía)
//   GET ?key=GUARD&dry=1        → dry-run: lista elegibles, no encola ni marca
//   GET ?key=GUARD&test=EMAIL   → envía 1 mail de prueba directo a EMAIL
//
// Elegible = estado 'demo', token activo, >= DIAS_SIN_USO días desde el registro,
//            SIN filas en calculos_mca, y todavía no se le mandó esta encuesta.
//
// El disparo es automático (cron diario). Resuelve la falta de automatismo del
// seguimiento-demo original (que era 100% manual).
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getDb } from '@/lib/db'

const GUARD  = process.env.RECORDATORIO_KEY || 'f0d9811cd021923ba50d50b1'
const PORTAL = 'https://revendedores.febecos.com/portal'
const BASE   = 'https://revendedores.febecos.com'
const WA     = 'https://wa.me/5491125750323'
const DIAS_SIN_USO = 3 // días desde el registro para disparar la encuesta

// Motivos de la encuesta (clave → etiqueta). Cada uno es un botón clickeable.
const MOTIVOS: Array<{ k: string; emoji: string; txt: string }> = [
  { k: 'tiempo',  emoji: '⏳', txt: 'No tuve tiempo todavía' },
  { k: 'complejo', emoji: '🤔', txt: 'Me resultó difícil de usar' },
  { k: 'rubro',   emoji: '🚜', txt: 'No es para mi actividad / no lo necesito ahora' },
  { k: 'precio',  emoji: '💰', txt: 'Por los precios o condiciones' },
  { k: 'otro',    emoji: '💬', txt: 'Otro motivo (te lo cuento)' },
]

function html(nombre: string, token: string): string {
  const primer = (nombre || '').split(' ')[0] || 'Hola'
  const portalUrl = `${PORTAL}?token=${encodeURIComponent(token)}`
  const fb = (k: string) => `${BASE}/api/demo-feedback?token=${encodeURIComponent(token)}&motivo=${k}`

  const motivosHtml = MOTIVOS.map(m => `
    <tr><td style="padding:5px 0">
      <a href="${fb(m.k)}" style="display:block;text-decoration:none;background:#f7f9fc;border:1px solid #d6e0ea;border-radius:10px;padding:13px 18px;color:#1a3a5c;font-size:14px;font-weight:600">
        <span style="margin-right:8px">${m.emoji}</span>${m.txt}
      </a>
    </td></tr>`).join('')

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>¿Qué te faltó para probar el portal? — Febecos</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a2a3a">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:28px 16px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)">

  <tr><td style="background:#1a3a5c;padding:34px 40px;text-align:center">
    <img src="https://selector.febecos.com/images/febecos-logo.png" alt="Febecos" height="42" style="display:block;margin:0 auto 14px"/>
    <div style="color:#fff;font-size:21px;font-weight:800;line-height:1.4">${primer}, ¿qué te faltó para<br/><span style="color:#e8681a">probar el portal?</span></div>
  </td></tr>

  <tr><td style="padding:34px 40px 10px">
    <p style="font-size:15px;line-height:1.85;color:#2d3f55;margin:0 0 8px">
      Hola <strong style="color:#1a3a5c">${primer}</strong>,<br/><br/>
      Vimos que abriste tu cuenta demo en el portal de revendedores de Febecos pero todavía
      no llegaste a hacer ninguna búsqueda de bomba. <strong>Queremos entender qué pasó</strong> —
      con un click nos ayudás un montón:
    </p>
  </td></tr>

  <tr><td style="padding:6px 40px 14px">
    <table width="100%" cellpadding="0" cellspacing="0">${motivosHtml}</table>
  </td></tr>

  <tr><td style="padding:6px 40px 30px;text-align:center">
    <p style="font-size:13px;color:#7a8fa5;line-height:1.7;margin:0 0 18px">
      Tu acceso demo <strong>sigue activo</strong>. Si querés darle otra oportunidad, el sistema
      elige la bomba sola: cargás los datos del pozo y te da el equipo + precio mayorista en segundos.
    </p>
    <a href="${portalUrl}" style="display:inline-block;background:#e8681a;color:#fff;padding:15px 42px;border-radius:12px;font-weight:800;font-size:16px;text-decoration:none">Probar el portal →</a>
    <div style="margin-top:14px">
      <a href="${WA}?text=${encodeURIComponent('Hola, soy ' + primer + ' del portal de revendedores Febecos')}" style="display:inline-block;background:#25d366;color:#fff;padding:11px 26px;border-radius:9px;font-weight:700;font-size:13px;text-decoration:none">💬 Hablar por WhatsApp</a>
    </div>
  </td></tr>

  <tr><td style="background:#f0f4f8;padding:24px 40px;text-align:center;border-top:1px solid #d6e0ea">
    <p style="font-size:12px;color:#7a8fa5;line-height:1.9;margin:0">
      <strong style="color:#1a3a5c">Guillermo Sandler</strong> · Febecos — Bombas Solares para el Campo<br/>
      <a href="mailto:revende@febecos.com" style="color:#1a3a5c;text-decoration:none;font-weight:600">revende@febecos.com</a> ·
      <a href="https://febecos.com" style="color:#1a3a5c;text-decoration:none;font-weight:600">febecos.com</a>
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`
}

const ASUNTO = (nombre: string) => `${(nombre || '').split(' ')[0] || 'Hola'}, ¿qué te faltó para probar el portal?`

async function getElegibles() {
  const sql = getDb()
  // No mandar a quien ya solicitó ser revendedor (pendiente) o ya está aprobado — evita el
  // seguimiento demo a alguien que ya avanzó (pedido coordinador, punto 2).
  return await sql`
    SELECT s.nombre, s.email, s.token_acceso
    FROM solicitudes_revendedor s
    WHERE s.estado = 'demo'
      AND s.token_acceso IS NOT NULL
      AND s.token_acceso_activo = true
      AND s.email IS NOT NULL AND s.email <> ''
      AND COALESCE(s.demo_sin_uso_enviado, false) = false
      AND s.created_at <= NOW() - make_interval(days => ${DIAS_SIN_USO})
      AND NOT EXISTS (
        SELECT 1 FROM calculos_mca c WHERE c.revendedor_token = s.token_acceso
      )
      AND lower(s.email) NOT IN (
        SELECT lower(email) FROM solicitudes_revendedor
        WHERE estado IN ('pendiente', 'aprobado') AND email IS NOT NULL AND email <> ''
      )
    ORDER BY s.created_at ASC
  `
}

async function ensureSchema() {
  const sql = getDb()
  await sql`
    ALTER TABLE solicitudes_revendedor
      ADD COLUMN IF NOT EXISTS demo_sin_uso_enviado BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS demo_sin_uso_fecha   TIMESTAMPTZ
  `
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('key') !== GUARD) {
    return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  }

  await ensureSchema()

  const dry  = req.nextUrl.searchParams.get('dry') === '1'
  const test = (req.nextUrl.searchParams.get('test') || '').toLowerCase().trim()

  // ── Prueba: envío directo a un email ──────────────────────────────────────
  if (test) {
    const sql = getDb()
    const found = await sql`
      SELECT nombre, email, token_acceso FROM solicitudes_revendedor
      WHERE lower(email) = ${test} AND token_acceso IS NOT NULL LIMIT 1
    `
    const nombre = found.length ? found[0].nombre : 'Guille'
    const token  = found.length ? found[0].token_acceso : 'TEST'
    const resend = new Resend(process.env.RESEND_API_KEY)
    const res = await resend.emails.send({
      from: 'Febecos Revendedores <revende@febecos.com>',
      replyTo: 'revende@febecos.com',
      to: test,
      subject: ASUNTO(nombre),
      html: html(nombre, token),
    })
    if (res.error) return NextResponse.json({ ok: false, error: res.error.message })
    return NextResponse.json({ ok: true, modo: 'prueba', enviado: test, id: res.data?.id })
  }

  const rows = await getElegibles()

  // ── Dry-run: solo listar ──────────────────────────────────────────────────
  if (dry) {
    return NextResponse.json({
      ok: true, modo: 'dry', dias: DIAS_SIN_USO, total: rows.length,
      elegibles: rows.map((r: any) => ({ nombre: r.nombre, email: r.email })),
    })
  }

  if (!rows.length) {
    return NextResponse.json({ ok: true, modo: 'cron', encolados: 0, msg: 'Sin demos elegibles' })
  }

  // ── Encolar (mismo sistema que el resto: email_queue + cron de proceso) ────
  const { randomUUID } = await import('crypto')
  const job_id = randomUUID()
  const emails = (rows as any[]).map(r => ({
    email: r.email, nombre: r.nombre, asunto: ASUNTO(r.nombre), html_body: html(r.nombre, r.token_acceso),
  }))
  // INSERT directo en email_queue (antes: self-fetch HTTP a /api/email-queue que fallaba en
  // Vercel sin que nadie lo notara — la UI decía "encolado" pero no llegaba nada a la tabla).
  const sql = getDb()
  for (const e of emails) {
    await sql`
      INSERT INTO email_queue (job_id, tipo, email, nombre, asunto, html_body)
      VALUES (${job_id}, 'demo-sin-uso', ${e.email}, ${e.nombre || null}, ${e.asunto}, ${e.html_body})
    `
  }

  // ── Marcar como enviado (control para no reenviar) ────────────────────────
  for (const r of rows as any[]) {
    await sql`
      UPDATE solicitudes_revendedor
      SET demo_sin_uso_enviado = true, demo_sin_uso_fecha = NOW()
      WHERE token_acceso = ${r.token_acceso}
    `
  }

  return NextResponse.json({
    ok: true, modo: 'cron', job_id, encolados: emails.length,
    msg: `${emails.length} encuestas encoladas (demos sin uso, ${DIAS_SIN_USO}+ días).`,
  })
}
