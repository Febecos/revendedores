// /api/recordatorio-perfil  - Mail a revendedores aprobados/activos para que
// revisen y completen sus datos de perfil. Corre en Vercel (env vars resuelven ahí).
//
//   GET  ?key=GUARD                 -> dry-run: lista destinatarios (no envía)
//   POST ?key=GUARD                 -> envía a TODOS los aprobados/activos
//   POST ?key=GUARD&test=EMAIL      -> envía SOLO a EMAIL (debe estar en la base)
//
// Guard simple para evitar disparos públicos (no es PII, solo anti-abuso).

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getDb } from '@/lib/db'

const GUARD = process.env.RECORDATORIO_KEY || 'f0d9811cd021923ba50d50b1'
const PORTAL = 'https://revendedores.febecos.com/portal/perfil'

function html(nombre: string, token: string): string {
  const primer = (nombre || '').split(' ')[0] || 'Hola'
  const url = `${PORTAL}?token=${token}`
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Revisá tus datos - Portal Revendedores Febecos</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#f0f4f8;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a2a3a}
.wrap{max-width:600px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)}
.header{background:#003d72;padding:36px 40px;text-align:center;border-radius:16px 16px 0 0}
.header h1{color:#fff;font-size:23px;font-weight:800;line-height:1.35}
.header h1 span{color:#a8c61b}
.body{background:#fff;padding:36px 40px}
.greeting{font-size:16px;line-height:1.8;color:#2d3f55;margin-bottom:26px}
.greeting strong{color:#003d72}
.card{background:#f7f9fc;border:1px solid #d6e0ea;border-radius:12px;padding:22px 26px;margin-bottom:28px}
.card h3{font-size:13px;color:#003d72;text-transform:uppercase;letter-spacing:.06em;margin-bottom:14px}
.card ul{list-style:none;margin:0;padding:0}
.card li{font-size:14px;color:#2d3f55;padding:7px 0;border-bottom:1px solid #e8edf2}
.card li:last-child{border-bottom:none}
.card li b{color:#003d72}
.cta-wrap{text-align:center;padding:6px 0 26px}
.cta-btn{display:inline-block;background:#a8c61b;color:#003d72;padding:16px 44px;border-radius:12px;font-weight:800;font-size:16px;text-decoration:none}
.note{font-size:12px;color:#7a8fa5;margin-top:12px;text-align:center}
.footer{background:#f0f4f8;padding:26px 40px;text-align:center;border-top:1px solid #d6e0ea}
.footer p{font-size:12px;color:#7a8fa5;line-height:1.8}
.footer a{color:#003d72;text-decoration:none;font-weight:600}
@media(max-width:600px){.header,.body,.footer{padding-left:20px;padding-right:20px}}
</style></head>
<body><div class="wrap">
  <div class="header">
    <h1>Revisá y completá tus datos<br/><span>Portal Revendedores Febecos</span></h1>
  </div>
  <div class="body">
    <p class="greeting">
      Hola <strong>${primer}</strong>,<br/><br/>
      Estamos poniendo al día la base de revendedores para mejorar el soporte, la facturación
      y los envíos. Te pedimos un minuto para revisar que tus datos estén completos y correctos.
    </p>
    <div class="card">
      <h3>Datos a confirmar</h3>
      <ul>
        <li>🏢 <b>Empresa / razón social</b></li>
        <li>📍 <b>Provincia y localidad</b></li>
        <li>🧾 <b>CUIT</b></li>
        <li>📱 <b>WhatsApp de contacto</b></li>
      </ul>
    </div>
    <div class="cta-wrap">
      <a href="${url}" class="cta-btn">Revisar mis datos →</a>
      <p class="note">El enlace es personal y te abre tu perfil directamente, sin contraseña.</p>
    </div>
    <p style="font-size:13px;color:#5a6f84;line-height:1.7">
      Si ya tenés todo cargado, igual entrá y confirmá que esté correcto. Cualquier duda,
      respondé este mail y te ayudamos.
    </p>
  </div>
  <div class="footer">
    <p>
      <strong>Guillermo Sandler</strong> · Febecos Bombas Solares<br/>
      <a href="mailto:revende@febecos.com">revende@febecos.com</a> ·
      <a href="https://febecos.com">febecos.com</a>
    </p>
    <p style="margin-top:8px;">Lun a Vie 10-17 hs</p>
  </div>
</div></body></html>`
}

// soloVencidos=true → solo revendedores cuyos datos nunca se actualizaron o
// hace más de 6 meses (recordatorio semestral). false → todos los aprobados/activos.
async function getDestinatarios(soloVencidos = false) {
  const sql = getDb()
  if (soloVencidos) {
    return await sql`
      SELECT nombre, email, token_acceso, datos_actualizados_at
      FROM solicitudes_revendedor
      WHERE estado IN ('aprobado','activo')
        AND token_acceso IS NOT NULL
        AND token_acceso_activo = true
        AND email IS NOT NULL AND email <> ''
        AND (datos_actualizados_at IS NULL OR datos_actualizados_at < now() - interval '6 months')
      ORDER BY datos_actualizados_at ASC NULLS FIRST, created_at DESC
    `
  }
  return await sql`
    SELECT nombre, email, token_acceso, datos_actualizados_at
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
  const soloVencidos = req.nextUrl.searchParams.get('vencidos') === '1'
  const rows = await getDestinatarios(soloVencidos)
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

  const testEmail = (req.nextUrl.searchParams.get('test') || '').toLowerCase().trim()
  // En masivo, por defecto solo se manda a los vencidos (>6 meses). vencidos=0 fuerza a todos.
  const soloVencidos = req.nextUrl.searchParams.get('vencidos') !== '0'
  let rows = await getDestinatarios(testEmail ? false : soloVencidos)
  if (testEmail) {
    rows = rows.filter((r: any) => (r.email || '').toLowerCase() === testEmail)
    if (!rows.length) {
      return NextResponse.json({ ok: false, error: `"${testEmail}" no está entre los aprobados con token` }, { status: 404 })
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
        subject: `${(r.nombre || '').split(' ')[0] || 'Hola'}, revisá tus datos en el portal Febecos`,
        html: html(r.nombre, r.token_acceso),
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
    asunto: `${(r.nombre || '').split(' ')[0] || 'Hola'}, revisá tus datos en el portal Febecos`,
    html_body: html(r.nombre, r.token_acceso),
  }))
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://revendedores.febecos.com'
  await fetch(`${baseUrl}/api/email-queue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: GUARD, job_id, tipo: 'recordatorio-perfil', emails: emailsParaEncolar }),
  })
  return NextResponse.json({
    ok: true, modo: 'cola', job_id, encolados: emailsParaEncolar.length,
    msg: `${emailsParaEncolar.length} emails encolados. ~${Math.ceil(emailsParaEncolar.length / 3) * 3} min en total.`,
  })
}
