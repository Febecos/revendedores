
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

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
    const { id, tipo } = await req.json()

    if (!id || !tipo) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const { data: sol, error: fetchError } = await supabase
      .from('solicitudes_revendedor')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !sol) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (tipo === 'aprobar') {
      await supabase
        .from('solicitudes_revendedor')
        .update({ aprobado: true, estado: 'aprobado' })
        .eq('id', id)

      await transporter.sendMail({
        from: `Febecos <${process.env.SMTP_FROM}>`,
        to: sol.email,
        subject: '¡Tu acceso al Portal Revendedores Febecos está listo!',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
            <img src="https://febecos.com/cdn/shop/files/logo-febecos.png" alt="Febecos" style="height:40px;margin-bottom:24px" />
            <h2 style="color:#1a3a5c;margin-bottom:8px">¡Hola ${sol.nombre}, tu acceso está aprobado!</h2>
            <p style="color:#555;line-height:1.7">
              Tu solicitud para el Portal de Revendedores Febecos fue aprobada.<br/>
              Ya podés acceder al catálogo mayorista y las herramientas de cotización.
            </p>
            <p style="color:#555;line-height:1.7;margin-top:16px">
              Para coordinar tu acceso completo y los próximos pasos, escribinos por WhatsApp:
            </p>
            <a href="https://wa.me/5491125750323"
               style="display:inline-block;margin:20px 0;padding:14px 28px;background:#25d366;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
              Escribir por WhatsApp →
            </a>
            <p style="color:#999;font-size:13px;line-height:1.6">
              Nuestro equipo te va a guiar para configurar tu perfil con tu logo y datos de contacto.
            </p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
            <p style="color:#aaa;font-size:12px">Febecos · cotiza@febecos.com · +54 9 11 2575-0323</p>
          </div>
        `,
      })
    }

    if (tipo === 'rechazar') {
      await supabase
        .from('solicitudes_revendedor')
        .update({ estado: 'rechazado' })
        .eq('id', id)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error en accion admin:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
