import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nombre, apellido, email, whatsapp, empresa, provincia, localidad, cuit, mensaje } = body

    if (!nombre || !email || !whatsapp || !provincia) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // Guardar en Supabase
    const { error: dbError } = await supabase
      .from('solicitudes_revendedor')
      .insert([{ nombre, apellido, email, whatsapp, empresa, provincia, localidad, cuit, mensaje, estado: 'pendiente', created_at: new Date().toISOString() }])

    if (dbError) {
      console.error('Supabase error:', dbError)
      // No bloqueamos si falla la DB — igual mandamos el email
    }

    // Mandar email a Guille
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.AGENT_EMAIL,
      subject: `Nueva solicitud de revendedor — ${nombre} ${apellido || ''} (${provincia})`,
      html: `
        <h2>Nueva solicitud de revendedor</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Nombre</td><td style="padding:8px;border:1px solid #ddd">${nombre} ${apellido || ''}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${email}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">WhatsApp</td><td style="padding:8px;border:1px solid #ddd"><a href="https://wa.me/54${whatsapp.replace(/\D/g,'')}">${whatsapp}</a></td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Empresa</td><td style="padding:8px;border:1px solid #ddd">${empresa || '—'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">CUIT</td><td style="padding:8px;border:1px solid #ddd">${cuit || '—'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Provincia</td><td style="padding:8px;border:1px solid #ddd">${provincia}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Localidad</td><td style="padding:8px;border:1px solid #ddd">${localidad || '—'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Mensaje</td><td style="padding:8px;border:1px solid #ddd">${mensaje || '—'}</td></tr>
        </table>
        <p style="margin-top:16px;color:#666;font-size:13px">Solicitud recibida: ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</p>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error en solicitud revendedor:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
