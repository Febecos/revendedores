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

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tu acceso al portal — Revendedores Febecos</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a2a3a">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 16px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

  <!-- HEADER -->
  <tr><td style="background:#003d72;padding:36px 40px;text-align:center;border-radius:12px 12px 0 0">
    <div style="display:inline-block;background:#a8c61b;color:#003d72;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:5px 14px;border-radius:20px;margin-bottom:18px">✦ Acceso Beta</div>
    <div style="color:#fff;font-size:26px;font-weight:800;line-height:1.35">Tu acceso al portal<br/><span style="color:#a8c61b">Revendedores Febecos</span><br/>está listo</div>
  </td></tr>

  <!-- BODY -->
  <tr><td style="background:#fff;padding:36px 40px">

    <!-- Saludo -->
    <p style="font-size:16px;line-height:1.8;color:#2d3f55;margin:0 0 28px">
      Hola <strong style="color:#003d72">${primerNombre}</strong>,<br/><br/>
      Te damos la bienvenida al programa de revendedores de Febecos Bombas Solares.
      Sos parte del grupo inicial de acceso — antes de que abramos el portal al público general.<br/><br/>
      Desde hoy podés cotizar equipos con tu descuento mayorista y ver precios en tiempo real.
    </p>

    <!-- CARD ACCESO — tabla para compatibilidad con clientes de email -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9fc;border:1px solid #d6e0ea;border-radius:12px;margin-bottom:28px">
      <tr>
        <td style="padding:12px 20px;font-size:13px;color:#5a6f84;font-weight:600;border-bottom:1px solid #e8edf2">Tu descuento mayorista</td>
        <td style="padding:12px 20px;font-size:18px;font-weight:800;color:#1a6b35;text-align:right;border-bottom:1px solid #e8edf2">${descuento}% off</td>
      </tr>
      <tr>
        <td style="padding:12px 20px;font-size:13px;color:#5a6f84;font-weight:600;border-bottom:1px solid #e8edf2">Acceso al portal</td>
        <td style="padding:12px 20px;text-align:right;border-bottom:1px solid #e8edf2">
          <a href="${portalUrl}" style="font-size:14px;color:#003d72;font-weight:800;text-decoration:none">revendedores.febecos.com →</a>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 20px;font-size:13px;color:#5a6f84;font-weight:600">Soporte</td>
        <td style="padding:12px 20px;text-align:right">
          <a href="https://wa.me/5491125750323" style="font-size:14px;color:#003d72;font-weight:800;text-decoration:none">💬 WhatsApp 11 2575-0323</a>
        </td>
      </tr>
    </table>

    <!-- TOKEN -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#003d72;border-radius:8px;margin-bottom:28px">
      <tr><td style="padding:16px 20px;text-align:center">
        <div style="font-size:11px;color:rgba(255,255,255,.6);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">Tu código de acceso</div>
        <div style="font-size:24px;font-weight:800;color:#a8c61b;letter-spacing:.1em;font-family:monospace">${token}</div>
      </td></tr>
    </table>

    <!-- PASOS — tabla para centrar los números -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
      <tr>
        <td width="36" valign="top" style="padding-bottom:16px">
          <div style="background:#003d72;color:#fff;font-size:13px;font-weight:800;width:28px;height:28px;border-radius:50%;text-align:center;line-height:28px">1</div>
        </td>
        <td style="padding-left:14px;padding-bottom:16px;vertical-align:top">
          <strong style="display:block;font-size:14px;color:#003d72;margin-bottom:3px">Hacé clic en el botón de abajo</strong>
          <span style="font-size:13px;color:#5a6f84;line-height:1.6">Te lleva directo al portal con tu acceso ya activado. No necesitás crear cuenta ni contraseña.</span>
        </td>
      </tr>
      <tr>
        <td width="36" valign="top" style="padding-bottom:16px">
          <div style="background:#003d72;color:#fff;font-size:13px;font-weight:800;width:28px;height:28px;border-radius:50%;text-align:center;line-height:28px">2</div>
        </td>
        <td style="padding-left:14px;padding-bottom:16px;vertical-align:top">
          <strong style="display:block;font-size:14px;color:#003d72;margin-bottom:3px">Ingresá los datos del pozo de tu cliente</strong>
          <span style="font-size:13px;color:#5a6f84;line-height:1.6">El sistema elige el equipo correcto automáticamente y te muestra el precio con tu descuento.</span>
        </td>
      </tr>
      <tr>
        <td width="36" valign="top">
          <div style="background:#003d72;color:#fff;font-size:13px;font-weight:800;width:28px;height:28px;border-radius:50%;text-align:center;line-height:28px">3</div>
        </td>
        <td style="padding-left:14px;vertical-align:top">
          <strong style="display:block;font-size:14px;color:#003d72;margin-bottom:3px">Consultanos por cualquier duda</strong>
          <span style="font-size:13px;color:#5a6f84;line-height:1.6">Guillermo está disponible por WhatsApp para ayudarte a cerrar tus primeras ventas.</span>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px">
      <tr><td align="center" style="padding-bottom:12px">
        <a href="${portalUrl}" style="display:inline-block;background:#a8c61b;color:#003d72;padding:18px 48px;border-radius:12px;font-weight:800;font-size:17px;text-decoration:none">Acceder al portal →</a>
      </td></tr>
      <tr><td align="center">
        <p style="font-size:12px;color:#7a8fa5;margin:0">O ingresá tu código <strong>${token}</strong> en <a href="${portalUrl}" style="color:#7a8fa5">revendedores.febecos.com/portal</a></p>
      </td></tr>
    </table>

  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#f0f4f8;padding:24px 40px;text-align:center;border-top:1px solid #d6e0ea;border-radius:0 0 12px 12px">
    <p style="font-size:12px;color:#7a8fa5;line-height:1.8;margin:0">
      <strong style="color:#1a2a3a">Guillermo Sandler</strong> · Febecos Bombas Solares<br/>
      <a href="https://wa.me/5491125750323" style="color:#003d72;text-decoration:none;font-weight:600">WhatsApp: +54 9 11 2575-0323</a> ·
      <a href="mailto:revende@febecos.com" style="color:#003d72;text-decoration:none;font-weight:600">revende@febecos.com</a><br/>
      <a href="https://revendedores.febecos.com" style="color:#003d72;text-decoration:none;font-weight:600">revendedores.febecos.com</a>
    </p>
    <p style="font-size:11px;color:#9aacbe;margin:8px 0 0">Lun a Vie 10–17 hs</p>
  </td></tr>

</table>
</td></tr></table>
</body>
</html>`.trim()
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
    const result = await resend.emails.send({
      from: 'Febecos Revendedores <revende@febecos.com>',
      replyTo: 'revende@febecos.com',
      to: email,
      subject: `${nombre.split(' ')[0]}, tu acceso al portal Febecos está listo ✅`,
      html: htmlInvitacion(nombre, token, descuento),
    })

    if (result.error) {
      console.error('[invitar] Resend error:', result.error)
      return NextResponse.json({ ok: false, error: result.error.message, detail: result.error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id: result.data?.id })
  } catch (err) {
    console.error('[invitar] Error:', err)
    return NextResponse.json({ ok: false, error: 'error interno' }, { status: 500 })
  }
}
