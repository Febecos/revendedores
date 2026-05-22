import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { randomBytes } from 'crypto'
import nodemailer from 'nodemailer'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return new NextResponse(paginaError('Token inválido', 'El link de verificación no es válido.'), { headers: { 'Content-Type': 'text/html' } })
  }

  const sql = getDb()
  const rows = await sql`
    SELECT id, nombre, email, email_verificado, token_acceso, aprobado
    FROM solicitudes_revendedor
    WHERE token_verificacion = ${token}
    LIMIT 1
  `

  if (!rows.length) {
    return new NextResponse(paginaError('Link no encontrado', 'Este link de verificación no existe o ya fue usado.'), { headers: { 'Content-Type': 'text/html' } })
  }

  const data = rows[0]
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://revendedores-six.vercel.app'

  // Ya verificado — redirigir al portal
  if (data.email_verificado && data.token_acceso) {
    return NextResponse.redirect(`${baseUrl}/portal?token=${data.token_acceso}`)
  }

  const tokenAcceso = randomBytes(24).toString('hex')

  await sql`
    UPDATE solicitudes_revendedor
    SET email_verificado = true, estado = 'aprobado', aprobado = true,
        token_acceso = ${tokenAcceso}, token_acceso_activo = true, descuento_pct = 7
    WHERE id = ${data.id}
  `

  const portalUrl = `${baseUrl}/portal?token=${tokenAcceso}`

  try {
    await enviarEmailBienvenida(data.nombre, data.email, portalUrl)
  } catch (e) {
    console.error('Error al enviar email de bienvenida:', e)
  }

  return new NextResponse(paginaOk(data.nombre, tokenAcceso, baseUrl), { headers: { 'Content-Type': 'text/html' } })
}

async function enviarEmailBienvenida(nombre: string, email: string, portalUrl: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  await transporter.sendMail({
    from: `"Febecos Portal" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `${nombre}, tu acceso al Portal de Revendedores está listo 🎉`,
    html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 16px"><tr><td align="center">
<table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden">
  <tr><td style="background:#0d1a2a;padding:28px 36px">
    <p style="margin:0;color:#4ade80;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase">FEBECOS · BOMBEO SOLAR</p>
    <h1 style="margin:8px 0 0;color:#fff;font-size:22px">Portal de Revendedores</h1>
  </td></tr>
  <tr><td style="padding:36px">
    <p style="margin:0 0 16px;color:#333;font-size:16px">Hola <strong>${nombre}</strong>,</p>
    <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.7">Tu acceso al Portal de Revendedores está listo con <strong>7% de descuento</strong> en todos los equipos.</p>
    <table cellpadding="0" cellspacing="0" style="margin:24px 0">
      <tr><td style="background:#e8681a;border-radius:10px">
        <a href="${portalUrl}" style="display:inline-block;padding:14px 32px;color:#fff;text-decoration:none;font-weight:700;font-size:16px">Ingresar al portal →</a>
      </td></tr>
    </table>
    <p style="margin:16px 0 4px;color:#aaa;font-size:12px">Tu link personal (guardalo):</p>
    <div style="background:#f0f4f8;border:1px solid #d0dce8;border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#1a3a5c;word-break:break-all">${portalUrl}</div>
  </td></tr>
  <tr><td style="background:#f9f9f7;padding:20px 36px;border-top:1px solid #eee">
    <p style="margin:0;color:#aaa;font-size:12px">Febecos · cotiza@febecos.com · febecos.com</p>
  </td></tr>
</table>
</td></tr></table></body></html>`,
  })
}

function paginaOk(nombre: string, tokenAcceso: string, baseUrl: string) {
  const portalUrl = `${baseUrl}/portal?token=${tokenAcceso}`
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>¡Acceso aprobado! — Febecos</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#f5f5f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}.card{background:#fff;border-radius:16px;padding:40px 36px;max-width:500px;width:100%;text-align:center}.token-box{background:#f0f4f8;border:1px solid #d0dce8;border-radius:8px;padding:12px;font-family:monospace;font-size:13px;color:#1a3a5c;word-break:break-all;margin:16px 0;text-align:left}.btn{display:inline-block;padding:14px 32px;background:#e8681a;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;margin:8px 0}</style>
</head><body><div class="card">
  <div style="font-size:52px;margin-bottom:16px">🎉</div>
  <h2 style="color:#1a3a5c;margin-bottom:12px">¡Acceso aprobado, ${nombre}!</h2>
  <p style="color:#555;line-height:1.7;margin-bottom:16px">Tu email fue verificado. Ya tenés acceso con <strong>7% de descuento</strong>.</p>
  <a href="${portalUrl}" class="btn">Ingresar al portal →</a>
  <p style="margin-top:24px;font-size:13px;color:#888">Tu link personal (guardalo):</p>
  <div class="token-box">${portalUrl}</div>
  <p style="color:#aaa;font-size:12px;margin-top:8px">⚠️ Este link es personal — no lo compartás.</p>
</div></body></html>`
}

function paginaError(titulo: string, mensaje: string) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Error — Febecos</title></head>
<body style="margin:0;background:#f5f5f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;box-sizing:border-box">
<div style="background:#fff;border-radius:16px;padding:40px 36px;max-width:480px;width:100%;text-align:center">
  <div style="font-size:52px;margin-bottom:16px">❌</div>
  <h2 style="color:#c0392b;margin-bottom:8px">${titulo}</h2>
  <p style="color:#555;line-height:1.7">${mensaje}</p>
  <p style="margin-top:24px;color:#aaa;font-size:12px">Febecos · cotiza@febecos.com</p>
</div></body></html>`
}
