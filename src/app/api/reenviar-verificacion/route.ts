// POST /api/reenviar-verificacion?key=GUARD   body: { id }
// Reenvía el mail "Verificá tu email" (el primer mail de registro que valida) a la
// dirección de email ACTUAL de la solicitud. Útil cuando el solicitante se equivocó
// de email: se corrige el email en el admin y se reenvía la verificación.
//
// Si ya está verificado, reenvía el link de acceso al portal en su lugar.
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { Resend } from 'resend'
import { randomBytes } from 'crypto'

const GUARD = process.env.RECORDATORIO_KEY || 'f0d9811cd021923ba50d50b1'
const BASE  = process.env.NEXT_PUBLIC_BASE_URL || 'https://revendedores.febecos.com'

function htmlVerificacion(nombre: string, verificarUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 16px"><tr><td align="center">
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
</td></tr></table>
</body></html>`
}

function htmlAcceso(nombre: string, portalUrl: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 16px"><tr><td align="center">
<table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden">
  <tr><td style="background:#0d1a2a;padding:28px 36px">
    <p style="margin:0;color:#4ade80;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase">FEBECOS · BOMBEO SOLAR</p>
    <h1 style="margin:8px 0 0;color:#fff;font-size:22px">Portal de Revendedores</h1>
  </td></tr>
  <tr><td style="padding:36px">
    <p style="margin:0 0 16px;color:#333;font-size:16px">Hola <strong>${nombre}</strong>,</p>
    <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.7">Tu acceso al Portal de Revendedores está listo.</p>
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
</td></tr></table></body></html>`
}

export async function POST(req: NextRequest) {
  if (req.nextUrl.searchParams.get('key') !== GUARD) {
    return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  }

  let id: number | string | undefined
  try { ({ id } = await req.json()) } catch { /* sin body */ }
  if (!id) return NextResponse.json({ ok: false, error: 'id requerido' }, { status: 400 })

  try {
    const sql = getDb()
    const rows = await sql`
      SELECT id, nombre, email, email_verificado, token_verificacion, token_acceso
      FROM solicitudes_revendedor WHERE id = ${id} LIMIT 1
    `
    if (!rows.length) return NextResponse.json({ ok: false, error: 'solicitud no encontrada' }, { status: 404 })
    const r = rows[0]
    if (!r.email) return NextResponse.json({ ok: false, error: 'la solicitud no tiene email' }, { status: 400 })

    const resend = new Resend(process.env.RESEND_API_KEY)

    // Ya verificado → reenviar el link de acceso al portal
    if (r.email_verificado && r.token_acceso) {
      const portalUrl = `${BASE}/portal?token=${r.token_acceso}`
      await resend.emails.send({
        from: 'Febecos Revendedores <revende@febecos.com>',
        replyTo: 'revende@febecos.com',
        to: r.email,
        subject: `${(r.nombre || '').split(' ')[0] || 'Hola'}, tu acceso al Portal de Revendedores`,
        html: htmlAcceso(r.nombre || '', portalUrl),
      })
      return NextResponse.json({ ok: true, modo: 'acceso', email: r.email })
    }

    // No verificado → asegurar token_verificacion y reenviar el mail de verificación
    let tokenVer = r.token_verificacion
    if (!tokenVer) {
      tokenVer = randomBytes(32).toString('hex')
      await sql`UPDATE solicitudes_revendedor SET token_verificacion = ${tokenVer} WHERE id = ${r.id}`
    }
    const verificarUrl = `${BASE}/api/verificar?token=${tokenVer}`
    await resend.emails.send({
      from: 'Febecos Revendedores <revende@febecos.com>',
      replyTo: 'revende@febecos.com',
      to: r.email,
      subject: 'Verificá tu email — Portal Revendedores Febecos',
      html: htmlVerificacion(r.nombre || '', verificarUrl),
    })
    return NextResponse.json({ ok: true, modo: 'verificacion', email: r.email })
  } catch (err: any) {
    console.error('[reenviar-verificacion]', err.message)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
