import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

export async function POST(req: NextRequest) {
  try {
    const { id, tipo } = await req.json()
    if (!id || !tipo) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const sql = getDb()
    const rows = await sql`SELECT * FROM solicitudes_revendedor WHERE id = ${id} LIMIT 1`
    if (!rows.length) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }
    const sol = rows[0]

    if (tipo === 'aprobar') {
      await sql`UPDATE solicitudes_revendedor SET aprobado = true, estado = 'aprobado' WHERE id = ${id}`
      await transporter.sendMail({
        from: `Febecos <${process.env.SMTP_FROM}>`,
        to: sol.email,
        subject: '¡Tu acceso al Portal Revendedores Febecos está listo!',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
            <h2 style="color:#1a3a5c;margin-bottom:8px">¡Hola ${sol.nombre}, tu acceso está aprobado!</h2>
            <p style="color:#555;line-height:1.7">
              Tu solicitud para el Portal de Revendedores Febecos fue aprobada.<br/>
              Ya podés acceder al catálogo mayorista y las herramientas de cotización.
            </p>
            <a href="https://wa.me/5491125750323"
               style="display:inline-block;margin:20px 0;padding:14px 28px;background:#25d366;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
              Escribir por WhatsApp →
            </a>
            <p style="color:#aaa;font-size:12px">Febecos · cotiza@febecos.com</p>
          </div>`,
      })
    }

    if (tipo === 'rechazar') {
      await sql`UPDATE solicitudes_revendedor SET estado = 'rechazado' WHERE id = ${id}`
    }

    if (tipo === 'toggle_marca') {
      // Solo aplica si tiene CUIT
      if (!sol.cuit) {
        return NextResponse.json({ error: 'El revendedor debe tener CUIT para habilitar marca propia' }, { status: 400 })
      }
      const nuevo = !sol.puede_cotizar_con_marca
      await sql`UPDATE solicitudes_revendedor SET puede_cotizar_con_marca = ${nuevo} WHERE id = ${id}`
      return NextResponse.json({ ok: true, puede_cotizar_con_marca: nuevo })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error en accion admin:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
