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
    const { nombre, apellido, email, whatsapp, empresa, provincia, localidad, cuit, tipo_revendedor, turnstileToken } = body

    if (!nombre || !email || !whatsapp || !provincia) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // Verificar Turnstile
    const tsRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET,
        response: turnstileToken,
      }),
    })
    const tsData = await tsRes.json()
    if (!tsData.success) {
      return NextResponse.json({ error: 'Verificación de seguridad fallida' }, { status: 400 })
    }

    // Generar token de verificación
    const token = randomBytes(32).toString('hex')

    // Guardar en Supabase
    const { error: dbError } = await supabase
      .from('solicitudes_revendedor')
      .insert([{
        nombre, apellido, email, whatsapp, empresa,
        provincia, localidad, cuit,
        tipo_revendedor,
        estado: 'pendiente',
        email_verificado: false,
        token_verificacion: token,
        aprobado: false,
      }])

    if (dbError) {
      console.error('Supabase error:', dbError)
      return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
    }

    // Determinar URL base
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://revendedores.febecos.com'

    // Email de verificación al solicitante
    await transporter.sendMail({
      from: `Febecos <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Verificá tu email — Portal Revendedores Febecos',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
          <img src="https://febecos.com/cdn/shop/files/logo-febecos.png" alt="Febecos" style="height:40px;margin-bottom:24px" />
          <h2 style="color:#1a3a5c;margin-bottom:8px">Hola ${nombre}, verificá tu email</h2>
          <p style="color:#555;line-height:1.7">
            Recibimos tu solicitud para acceder al Portal de Revendedores Febecos.<br/>
            Para completar el registro, hacé clic en el botón de abajo.
          </p>
          <a href="${baseUrl}/api/verificar?token=${token}"
             style="display:inline-block;margin:24px 0;padding:14px 28px;background:#e8681a;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
            Verificar mi email →
          </a>
          <p style="color:#999;font-size:13px;line-height:1.6">
            Una vez verificado, Guillermo revisa tu solicitud y te da acceso en 24 horas hábiles.<br/>
            Si no pediste este acceso, ignorá este email.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#aaa;font-size:12px">Febecos · cotiza@febecos.com · +54 9 11 2739-9430</p>
        </div>
      `,
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
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Tipo</td><td style="padding:8px;border:1px solid #ddd">${tiposLabel || '—'}</td></tr>
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
