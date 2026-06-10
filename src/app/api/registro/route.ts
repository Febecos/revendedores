import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { Resend } from 'resend'
import { randomBytes } from 'crypto'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      nombre, apellido, email, whatsapp, empresa,
      provincia, localidad, cuit, tipo_revendedor,
      experiencia_anos, experiencia_solar, equipos_mes,
      acepta_terminos, acepta_marketing, version_terminos
    } = body

    if (!nombre || !email || !whatsapp || !provincia) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const token = randomBytes(32).toString('hex')
    const sql = getDb()

    await sql`
      INSERT INTO solicitudes_revendedor
        (nombre, apellido, email, whatsapp, empresa, provincia, localidad, cuit,
         tipo_revendedor, experiencia_anos, experiencia_solar, equipos_mes,
         estado, email_verificado, token_verificacion, aprobado,
         acepta_terminos, acepta_marketing, version_terminos)
      VALUES
        (${nombre}, ${apellido || null}, ${email}, ${whatsapp}, ${empresa || null},
         ${provincia}, ${localidad || null}, ${cuit || null},
         ${tipo_revendedor || null}, ${experiencia_anos || null},
         ${experiencia_solar || null}, ${equipos_mes || null},
         'pendiente', false, ${token}, false,
         ${acepta_terminos ?? false}, ${acepta_marketing ?? false}, ${version_terminos || '1.1'})
    `

    // Base de clientes unificada (fire-and-forget, no bloquea el registro)
    fetch('https://febecos.com/api/admin?action=upsert_cliente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'revendedor', nombre, apellido, empresa, razon_social: empresa,
        email, whatsapp, cuit, provincia, localidad, origen: 'alta_rev',
      }),
    }).catch(() => {})

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://revendedores.febecos.com'
    const verificarUrl = `${baseUrl}/api/verificar?token=${token}`
    const resend = getResend()

    // Email de verificación al solicitante
    await resend.emails.send({
      from: 'Febecos Revendedores <revende@febecos.com>',
      replyTo: 'revende@febecos.com',
      to: email,
      subject: 'Verificá tu email — Portal Revendedores Febecos',
      html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 16px">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
  <tr><td style="background:#0d1a2a;padding:24px 32px">
    <p style="margin:0;color:#4ade80;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">FEBECOS · BOMBEO SOLAR</p>
    <h1 style="margin:6px 0 0;color:#ffffff;font-size:20px">Portal de Revendedores</h1>
  </td></tr>
  <tr><td style="padding:32px">
    <h2 style="margin:0 0 12px;color:#1a3a5c;font-size:18px">Hola ${nombre}, verificá tu email</h2>
    <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.7">
      Recibimos tu solicitud para acceder al Portal de Revendedores Febecos.<br>
      Hacé clic en el botón para confirmar tu email y obtener acceso.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px">
      <tr><td style="background:#e8681a;border-radius:10px;text-align:center">
        <a href="${verificarUrl}" style="display:inline-block;padding:16px 36px;color:#ffffff;text-decoration:none;font-weight:800;font-size:16px">
          Verificar mi email →
        </a>
      </td></tr>
    </table>
    <p style="margin:0;color:#aaa;font-size:12px;text-align:center">Si no pediste este acceso, ignorá este email.</p>
  </td></tr>
  <tr><td style="background:#f7f6f2;padding:16px 32px;border-top:1px solid #eee;text-align:center">
    <p style="margin:0;color:#aaa;font-size:12px">Febecos · ventas@febecos.com</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
    })

    // Notificación a Guille
    const tiposLabel = (tipo_revendedor || []).join(', ')
    const adminEmail = process.env.AGENT_EMAIL
    if (adminEmail) {
      await resend.emails.send({
        from: 'Febecos Revendedores <revende@febecos.com>',
        replyTo: 'revende@febecos.com',
        to: adminEmail,
        subject: `Nueva solicitud revendedor — ${nombre} ${apellido || ''} (${provincia})`,
        html: `
          <h2 style="color:#1a3a5c">Nueva solicitud de revendedor</h2>
          <table style="border-collapse:collapse;width:100%;font-family:sans-serif">
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Nombre</td><td style="padding:8px;border:1px solid #ddd">${nombre} ${apellido || ''}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${email}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">WhatsApp</td><td style="padding:8px;border:1px solid #ddd"><a href="https://wa.me/54${whatsapp.replace(/\D/g,'')}">${whatsapp}</a></td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Rol</td><td style="padding:8px;border:1px solid #ddd">${tiposLabel || '—'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Provincia</td><td style="padding:8px;border:1px solid #ddd">${provincia} — ${localidad || '—'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Empresa</td><td style="padding:8px;border:1px solid #ddd">${empresa || '—'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">CUIT</td><td style="padding:8px;border:1px solid #ddd">${cuit || '—'}</td></tr>
          </table>`,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error en registro revendedor:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
