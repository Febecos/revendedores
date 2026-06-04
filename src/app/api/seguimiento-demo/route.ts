// /api/seguimiento-demo — Follow-up a usuarios con estado='demo'
//
//   GET  ?key=GUARD                 → dry-run: lista destinatarios (no envía)
//   POST ?key=GUARD                 → envía a TODOS los demos con token activo
//   POST ?key=GUARD&test=EMAIL      → envía SOLO a EMAIL (para prueba)
//
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getDb } from '@/lib/db'

const GUARD  = process.env.RECORDATORIO_KEY || 'f0d9811cd021923ba50d50b1'
const PORTAL = 'https://revendedores.febecos.com/portal'

function html(nombre: string, token: string): string {
  const primer = (nombre || '').split(' ')[0] || 'Hola'
  const url = `${PORTAL}?token=${token}`
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Seguimiento demo — Portal Revendedores Febecos</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#f0f4f8;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a2a3a}
.wrap{max-width:600px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)}
.header{background:#1a3a5c;padding:36px 40px;text-align:center;border-radius:16px 16px 0 0}
.header img{height:42px;object-fit:contain;margin-bottom:14px;display:block;margin-left:auto;margin-right:auto}
.header h1{color:#fff;font-size:21px;font-weight:800;line-height:1.4}
.header h1 span{color:#e8681a}
.body{background:#fff;padding:36px 40px}
.greeting{font-size:15px;line-height:1.85;color:#2d3f55;margin-bottom:28px}
.greeting strong{color:#1a3a5c}
.card{background:#f7f9fc;border:1px solid #d6e0ea;border-radius:12px;padding:22px 26px;margin-bottom:28px}
.card h3{font-size:12px;color:#1a3a5c;text-transform:uppercase;letter-spacing:.07em;font-weight:700;margin-bottom:14px}
.card ul{list-style:none;margin:0;padding:0}
.card li{font-size:14px;color:#2d3f55;padding:8px 0;border-bottom:1px solid #e8edf2;display:flex;align-items:center;gap:8px}
.card li:last-child{border-bottom:none}
.cta-wrap{text-align:center;padding:4px 0 28px}
.cta-btn{display:inline-block;background:#e8681a;color:#fff;padding:16px 44px;border-radius:12px;font-weight:800;font-size:16px;text-decoration:none;letter-spacing:.02em}
.note{font-size:12px;color:#7a8fa5;margin-top:12px;text-align:center;line-height:1.6}
.reply-box{background:#f0f9f4;border:1px solid #b8ddc8;border-radius:10px;padding:18px 22px;margin-top:4px;font-size:13px;color:#1a5a3c;line-height:1.75}
.reply-box a{color:#1a5a3c;font-weight:700}
.footer{background:#f0f4f8;padding:26px 40px;text-align:center;border-top:1px solid #d6e0ea}
.footer p{font-size:12px;color:#7a8fa5;line-height:1.9}
.footer a{color:#1a3a5c;text-decoration:none;font-weight:600}
@media(max-width:600px){.header,.body,.footer{padding-left:20px;padding-right:20px}}
</style></head>
<body><div class="wrap">

  <div class="header">
    <img src="https://selector.febecos.com/images/febecos-logo.png" alt="Febecos"/>
    <h1>¿Cómo te fue con el<br/><span>Portal de Revendedores?</span></h1>
  </div>

  <div class="body">
    <p class="greeting">
      Hola <strong>${primer}</strong>,<br/><br/>
      Hace unos días te creaste una cuenta demo en el portal de revendedores de Febecos.
      Queríamos saber cómo estuvo la experiencia y si tuviste algún problema o pregunta que
      no pudiste resolver.
    </p>

    <div class="card">
      <h3>¿Pudiste explorar?</h3>
      <ul>
        <li>🔍 El buscador de bombas por altura y caudal</li>
        <li>📄 La generación de presupuestos en PDF</li>
        <li>💰 Los precios mayoristas y el % de descuento</li>
        <li>📊 La curva de rendimiento de cada equipo</li>
      </ul>
    </div>

    <div class="cta-wrap">
      <a href="${url}" class="cta-btn">Volver al portal →</a>
      <p class="note">Tu acceso demo sigue activo. El enlace te abre el portal directamente.</p>
    </div>

    <div class="reply-box">
      💬 <strong>Respondé este mail</strong> si tenés preguntas, si algo no te quedó claro
      o si querés activar tu cuenta completa como revendedor.
      También podés escribirnos por WhatsApp al
      <a href="https://wa.me/5491125750323">+54 9 11 2575 0323</a>.
    </div>
  </div>

  <div class="footer">
    <p>
      <strong>Patricio Ratto</strong> · Febecos Bombas Solares<br/>
      <a href="mailto:revende@febecos.com">revende@febecos.com</a> ·
      <a href="https://febecos.com">febecos.com</a>
    </p>
    <p style="margin-top:6px">Lun a Vie 10–17 hs · Argentina</p>
  </div>

</div></body></html>`
}

async function getDestinatarios() {
  const sql = getDb()
  return await sql`
    SELECT nombre, email, token_acceso
    FROM solicitudes_revendedor
    WHERE estado = 'demo'
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

  const testEmail = (req.nextUrl.searchParams.get('test') || '').toLowerCase().trim()
  let rows = await getDestinatarios()

  if (testEmail) {
    // En modo prueba buscamos el token del email; si no está en demos, lo buscamos igual
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
        subject: `${(r.nombre || '').split(' ')[0] || 'Hola'}, ¿cómo te fue con el portal de revendedores?`,
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
  const asunto = `¿Cómo te fue con el portal de revendedores de Febecos?`
  const emailsParaEncolar = (rows as any[]).map(r => ({
    email: r.email, nombre: r.nombre, asunto, html_body: html(r.nombre, r.token_acceso),
  }))
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://revendedores.febecos.com'
  await fetch(`${baseUrl}/api/email-queue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: GUARD, job_id, tipo: 'seguimiento-demo', emails: emailsParaEncolar }),
  })
  return NextResponse.json({
    ok: true, modo: 'cola', job_id, encolados: emailsParaEncolar.length,
    msg: `${emailsParaEncolar.length} emails encolados. ~${Math.ceil(emailsParaEncolar.length / 3) * 3} min en total.`,
  })
}
