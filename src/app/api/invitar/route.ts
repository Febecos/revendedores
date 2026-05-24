// POST /api/invitar
// Envía mail de invitación beta al portal de revendedores.
// Body: { nombre, email, token, descuento_pct? }

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

function htmlInvitacion(nombre: string, token: string, descuento: number): string {
  const primerNombre = nombre.split(' ')[0] || nombre
  const portalUrl = `https://revendedores.febecos.com/portal?token=${token}`

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invitación Beta — Portal Revendedores Febecos</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f0f4f8; font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a2a3a; }
    .wrap { max-width: 600px; margin: 0 auto; }
    .header { background: #003d72; padding: 40px; text-align: center; border-radius: 0; }
    .badge { display: inline-block; background: #a8c61b; color: #003d72; font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; padding: 5px 14px; border-radius: 20px; margin-bottom: 20px; }
    .header h1 { color: #ffffff; font-size: 26px; font-weight: 800; line-height: 1.3; }
    .header h1 span { color: #a8c61b; }
    .body { background: #ffffff; padding: 40px; }
    .greeting { font-size: 16px; line-height: 1.8; color: #2d3f55; margin-bottom: 32px; }
    .greeting strong { color: #003d72; }
    .card { background: #f7f9fc; border: 1px solid #d6e0ea; border-radius: 12px; padding: 24px 28px; margin-bottom: 32px; }
    .card-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e8edf2; }
    .card-row:last-child { border-bottom: none; }
    .card-label { font-size: 13px; color: #5a6f84; font-weight: 600; }
    .card-value { font-size: 14px; color: #003d72; font-weight: 800; }
    .card-value.green { color: #1a6b35; font-size: 18px; }
    .token-box { background: #003d72; border-radius: 8px; padding: 14px 20px; margin-bottom: 32px; text-align: center; }
    .token-label { font-size: 11px; color: rgba(255,255,255,.6); font-weight: 700; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 6px; }
    .token-value { font-size: 22px; font-weight: 800; color: #a8c61b; letter-spacing: .08em; font-family: monospace; }
    .steps { margin-bottom: 32px; }
    .step { display: flex; gap: 14px; margin-bottom: 18px; align-items: flex-start; }
    .step-num { background: #003d72; color: #fff; font-size: 13px; font-weight: 800; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .step-text strong { display: block; font-size: 14px; color: #003d72; margin-bottom: 2px; }
    .step-text span { font-size: 13px; color: #5a6f84; line-height: 1.6; }
    .cta-wrap { text-align: center; padding: 8px 0 32px; }
    .cta-btn { display: inline-block; background: #a8c61b; color: #003d72; padding: 18px 48px; border-radius: 12px; font-weight: 800; font-size: 17px; text-decoration: none; letter-spacing: -.2px; }
    .cta-note { font-size: 12px; color: #7a8fa5; margin-top: 12px; text-align: center; }
    .footer { background: #f0f4f8; padding: 28px 40px; text-align: center; border-top: 1px solid #d6e0ea; }
    .footer p { font-size: 12px; color: #7a8fa5; line-height: 1.8; }
    .footer a { color: #003d72; text-decoration: none; font-weight: 600; }
    @media (max-width: 600px) {
      .header, .body, .footer { padding-left: 20px; padding-right: 20px; }
    }
  </style>
</head>
<body>
<div class="wrap">

  <div class="header">
    <div class="badge">✦ Acceso Beta</div>
    <h1>Tu acceso al portal<br /><span>Revendedores Febecos</span><br />está listo</h1>
  </div>

  <div class="body">

    <p class="greeting">
      Hola <strong>${primerNombre}</strong>,<br /><br />
      Te damos la bienvenida al programa de revendedores de Febecos Bombas Solares.
      Sos parte del grupo inicial de acceso — antes de que abramos el portal al público general.<br /><br />
      Desde hoy podés cotizar equipos con tu descuento mayorista y ver precios en tiempo real.
    </p>

    <!-- CARD ACCESO -->
    <div class="card">
      <div class="card-row">
        <span class="card-label">Tu descuento mayorista</span>
        <span class="card-value green">${descuento}% off</span>
      </div>
      <div class="card-row">
        <span class="card-label">Acceso al portal</span>
        <span class="card-value">revendedores.febecos.com</span>
      </div>
      <div class="card-row">
        <span class="card-label">Soporte</span>
        <span class="card-value">WhatsApp directo con Guillermo</span>
      </div>
    </div>

    <!-- TOKEN -->
    <div class="token-box">
      <div class="token-label">Tu código de acceso</div>
      <div class="token-value">${token}</div>
    </div>

    <!-- PASOS -->
    <div class="steps">
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-text">
          <strong>Hacé clic en el botón de abajo</strong>
          <span>Te lleva directo al portal con tu acceso ya activado. No necesitás crear cuenta ni contraseña.</span>
        </div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-text">
          <strong>Ingresá los datos del pozo de tu cliente</strong>
          <span>El sistema elige el equipo correcto automáticamente y te muestra el precio con tu descuento.</span>
        </div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-text">
          <strong>Consultanos por cualquier duda</strong>
          <span>Guillermo está disponible por WhatsApp para ayudarte a cerrar tus primeras ventas.</span>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div class="cta-wrap">
      <a href="${portalUrl}" class="cta-btn">
        Acceder al portal →
      </a>
      <p class="cta-note">O ingresá el código <strong>${token}</strong> en revendedores.febecos.com</p>
    </div>

  </div>

  <div class="footer">
    <p>
      <strong>Guillermo Sandler</strong> · Febecos Bombas Solares<br />
      <a href="https://wa.me/5491125750323">WhatsApp: +54 9 11 2575-0323</a> ·
      <a href="mailto:revende@febecos.com">revende@febecos.com</a><br />
      <a href="https://revendedores.febecos.com">revendedores.febecos.com</a>
    </p>
    <p style="margin-top:10px;">Lun a Vie 10–17 hs</p>
  </div>

</div>
</body>
</html>
`.trim()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const nombre      = (body.nombre || '').trim()
    const email       = (body.email  || '').trim()
    const token       = (body.token  || '').trim()
    const descuento   = Number(body.descuento_pct ?? 7)

    if (!nombre || !email || !token) {
      return NextResponse.json({ ok: false, error: 'nombre, email y token son requeridos' }, { status: 400 })
    }

    const resend = getResend()
    const { error } = await resend.emails.send({
      from: 'Febecos Revendedores <revende@febecos.com>',
      replyTo: 'revende@febecos.com',
      to: email,
      subject: `${nombre.split(' ')[0]}, tu acceso al portal Febecos está listo ✅`,
      html: htmlInvitacion(nombre, token, descuento),
    })

    if (error) {
      console.error('[invitar] Resend error:', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[invitar] Error:', err)
    return NextResponse.json({ ok: false, error: 'error interno' }, { status: 500 })
  }
}
