import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { randomBytes } from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
)

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      nombre, apellido, email, whatsapp, empresa,
      provincia, localidad, cuit, tipo_revendedor,
      experiencia_anos, experiencia_solar, equipos_mes
    } = body

    if (!nombre || !email || !whatsapp || !provincia) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const token = randomBytes(32).toString('hex')

    const { error: dbError } = await supabase
      .from('solicitudes_revendedor')
      .insert([{
        nombre, apellido, email, whatsapp, empresa,
        provincia, localidad, cuit,
        tipo_revendedor,
        experiencia_anos,
        experiencia_solar,
        equipos_mes,
        estado: 'pendiente',
        email_verificado: false,
        token_verificacion: token,
        aprobado: false,
      }])

    if (dbError) {
      console.error('Supabase error:', dbError)
      return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://revendedores.febecos.com'
    const verificarUrl = `${baseUrl}/api/verificar?token=${token}`

    // Email de verificación al solicitante
    await transporter.sendMail({
      from: `Febecos <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Verificá tu email — Portal Revendedores Febecos',
      html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 16px">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

  <!-- Header -->
  <tr><td style="background:#0d1a2a;padding:24px 32px">
    <p style="margin:0;color:#4ade80;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">FEBECOS · BOMBEO SOLAR</p>
    <h1 style="margin:6px 0 0;color:#ffffff;font-size:20px">Portal de Revendedores</h1>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:32px">
    <h2 style="margin:0 0 12px;color:#1a3a5c;font-size:18px">Hola ${nombre}, verificá tu email</h2>
    <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.7">
      Recibimos tu solicitud para acceder al Portal de Revendedores Febecos.<br>
      Son <strong>2 pasos simples</strong> para tener tu acceso listo:
    </p>

    <!-- Paso 1 -->
    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px">
      <tr>
        <td width="48" style="vertical-align:top;padding-top:4px">
          <div style="background:#e8681a;color:#fff;font-size:16px;font-weight:800;width:32px;height:32px;border-radius:50%;text-align:center;line-height:32px">1</div>
        </td>
        <td style="vertical-align:top">
          <p style="margin:0 0 4px;color:#1a3a5c;font-size:15px;font-weight:700">👆 Hacé clic en "Verificar mi email"</p>
          <p style="margin:0;color:#888;font-size:13px;line-height:1.5">El botón naranja de abajo — es un solo clic.</p>
        </td>
      </tr>
    </table>

    <!-- Paso 2 -->
    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px">
      <tr>
        <td width="48" style="vertical-align:top;padding-top:4px">
          <div style="background:#1a6b3c;color:#fff;font-size:16px;font-weight:800;width:32px;height:32px;border-radius:50%;text-align:center;line-height:32px">2</div>
        </td>
        <td style="vertical-align:top">
          <p style="margin:0 0 4px;color:#1a3a5c;font-size:15px;font-weight:700">📬 Te llega un segundo email con tu acceso</p>
          <p style="margin:0;color:#888;font-size:13px;line-height:1.5">Automático e inmediato — tiene tu link personal al portal.</p>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px">
      <tr><td style="background:#e8681a;border-radius:10px;text-align:center">
        <a href="${verificarUrl}" style="display:inline-block;padding:16px 36px;color:#ffffff;text-decoration:none;font-weight:800;font-size:16px">
          Verificar mi email →
        </a>
      </td></tr>
    </table>

    <p style="margin:0;color:#aaa;font-size:12px;line-height:1.6;text-align:center">
      Si no pediste este acceso, ignorá este email.<br>
      El link expira en 48 horas.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f7f6f2;padding:16px 32px;border-top:1px solid #eee;text-align:center">
    <p style="margin:0;color:#aaa;font-size:12px">Febecos · cotiza@febecos.com · +54 9 11 2575-0323</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`,
    })

    // Email de notificación a Guille
    const tiposLabel = (tipo_revendedor || []).join(', ')
    await transporter.sendMail({
      from: `Febecos <${process.env.SMTP_FROM}>`,
      to: process.env.AGENT_EMAIL,
      subject: `Nueva solicitud revendedor — ${nombre} ${apellido || ''} (${provincia})`,
      html: `
        <h2 style="color:#1a3a5c">Nueva solicitud de revendedor</h2>
        <table style="border-collapse:collapse;width:100%;font-family:sans-serif">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Nombre</td><td style="padding:8px;border:1px solid #ddd">${nombre} ${apellido || ''}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${email}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">WhatsApp</td><td style="padding:8px;border:1px solid #ddd"><a href="https://wa.me/54${whatsapp.replace(/\D/g,'')}">${whatsapp}</a></td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Rol</td><td style="padding:8px;border:1px solid #ddd">${tiposLabel || '—'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Experiencia</td><td style="padding:8px;border:1px solid #ddd">${experiencia_anos || '—'} · Solar: ${experiencia_solar || '—'} · Equipos/mes: ${equipos_mes || '—'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Empresa</td><td style="padding:8px;border:1px solid #ddd">${empresa || '—'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">CUIT</td><td style="padding:8px;border:1px solid #ddd">${cuit || '—'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Provincia</td><td style="padding:8px;border:1px solid #ddd">${provincia}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Localidad</td><td style="padding:8px;border:1px solid #ddd">${localidad || '—'}</td></tr>
        </table>
        <p style="margin-top:16px;color:#666;font-size:13px">
          Solicitud recibida: ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
        </p>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error en registro revendedor:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
