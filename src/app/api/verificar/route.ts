import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return new NextResponse(paginaError('Token inválido', 'El link de verificación no es válido.'), { headers: { 'Content-Type': 'text/html' } })
  }

  const { data, error } = await supabase
    .from('solicitudes_revendedor')
    .select('id, nombre, email, email_verificado, token_acceso, aprobado')
    .eq('token_verificacion', token)
    .single()

  if (error || !data) {
    return new NextResponse(paginaError('Link no encontrado', 'Este link de verificación no existe o ya fue usado.'), { headers: { 'Content-Type': 'text/html' } })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://revendedores-six.vercel.app'

  // Ya estaba verificado — redirigir al portal si tiene token
  if (data.email_verificado && data.token_acceso) {
    return NextResponse.redirect(`${baseUrl}/portal?token=${data.token_acceso}`)
  }

  // Generar token de acceso único
  const tokenAcceso = randomBytes(24).toString('hex')

  // Auto-aprobar con 7% de descuento y generar token de acceso
  await supabase
    .from('solicitudes_revendedor')
    .update({
      email_verificado: true,
      estado: 'aprobado',
      aprobado: true,
      token_acceso: tokenAcceso,
      token_acceso_activo: true,
      descuento_pct: 7,
    })
    .eq('id', data.id)

  const portalUrl = `${baseUrl}/portal?token=${tokenAcceso}`

  // Mandar email de bienvenida con el link (no bloqueante — si falla, sigue igual)
  try {
    await enviarEmailBienvenida(data.nombre, data.email, portalUrl)
  } catch (e) {
    console.error('Error al enviar email de bienvenida:', e)
    // No bloqueamos el flujo si el email falla
  }

  return new NextResponse(paginaOk(data.nombre, tokenAcceso, baseUrl), { headers: { 'Content-Type': 'text/html' } })
}

// ── EMAIL DE BIENVENIDA ──────────────────────────────────────────────────────

async function enviarEmailBienvenida(nombre: string, email: string, portalUrl: string) {
  const RESEND_KEY = process.env.RESEND_API_KEY
  if (!RESEND_KEY) {
    console.warn('RESEND_API_KEY no configurada — email de bienvenida no enviado')
    return
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tu acceso al Portal Febecos</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 16px">
  <tr><td align="center">
    <table width="540" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

      <!-- Header -->
      <tr>
        <td style="background:#0d1a2a;padding:28px 36px">
          <p style="margin:0;color:#4ade80;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase">FEBECOS · BOMBEO SOLAR</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px">Portal de Revendedores</h1>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:36px 36px 24px">
          <p style="margin:0 0 16px;color:#333;font-size:16px">Hola <strong>${nombre}</strong>,</p>
          <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.7">
            Tu acceso al Portal de Revendedores está listo. Guardá este email — acá está tu link personal de acceso.
          </p>

          <!-- CTA principal -->
          <table cellpadding="0" cellspacing="0" style="margin:24px 0">
            <tr>
              <td style="background:#e8681a;border-radius:10px">
                <a href="${portalUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px">
                  Ingresar al portal →
                </a>
              </td>
            </tr>
          </table>

          <!-- Qué tiene -->
          <p style="margin:24px 0 12px;color:#1a3a5c;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px">¿QUÉ ENCONTRÁS EN EL PORTAL?</p>
          <table cellpadding="0" cellspacing="0" width="100%">
            ${[
              ['🔧', 'Calculadora hidráulica', 'Ingresás datos del pozo y te dice qué bomba corresponde'],
              ['💰', 'Precios mayoristas (7% OFF)', 'Precios actualizados en tiempo real, sin publicar'],
              ['📋', 'Presupuesto PDF al instante', 'Con tu nombre y datos. Listo para mandar al cliente'],
              ['📊', 'Análisis de ROI', 'Muestra al cliente cuánto ahorra vs generador. Cierra ventas'],
            ].map(([emoji, titulo, desc]) => `
            <tr>
              <td style="padding:8px 0;vertical-align:top">
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td width="36" style="vertical-align:top;padding-top:2px;font-size:20px">${emoji}</td>
                    <td>
                      <p style="margin:0;color:#1a3a5c;font-weight:700;font-size:14px">${titulo}</p>
                      <p style="margin:2px 0 0;color:#888;font-size:13px">${desc}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`).join('')}
          </table>

          <!-- Link copiable -->
          <p style="margin:28px 0 8px;color:#888;font-size:13px">Tu link personal de acceso (guardalo):</p>
          <div style="background:#f0f4f8;border:1px solid #d0dce8;border-radius:8px;padding:12px 16px;font-family:monospace;font-size:12px;color:#1a3a5c;word-break:break-all">
            ${portalUrl}
          </div>
          <p style="margin:8px 0 0;color:#aaa;font-size:12px">
            ⚠️ Este link es personal — no lo compartás con terceros.
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f9f9f7;padding:20px 36px;border-top:1px solid #eee">
          <p style="margin:0 0 8px;color:#888;font-size:13px">¿Tenés preguntas o sugerencias?</p>
          <a href="https://wa.me/5491125750323" style="display:inline-block;padding:10px 20px;background:#25d366;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px">
            Escribinos por WhatsApp
          </a>
          <p style="margin:16px 0 0;color:#ccc;font-size:12px">Febecos · cotiza@febecos.com · febecos.com</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Febecos Portal <portal@febecos.com>',
      to: [email],
      subject: `${nombre}, tu acceso al Portal de Revendedores está listo 🎉`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error ${res.status}: ${err}`)
  }
}

// ── PÁGINAS HTML ─────────────────────────────────────────────────────────────

function paginaOk(nombre: string, tokenAcceso: string, baseUrl: string) {
  const portalUrl = `${baseUrl}/portal?token=${tokenAcceso}`
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>¡Acceso aprobado! — Febecos</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#f5f5f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
  .card{background:#fff;border-radius:16px;padding:40px 36px;max-width:500px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.08);text-align:center}
  h2{color:#1a3a5c;margin-bottom:8px;font-size:22px}
  p{color:#555;line-height:1.7;margin-bottom:16px}
  .token-box{background:#f0f4f8;border:1px solid #d0dce8;border-radius:8px;padding:12px 16px;font-family:monospace;font-size:13px;color:#1a3a5c;word-break:break-all;margin:16px 0;text-align:left}
  .btn-portal{display:inline-block;padding:14px 32px;background:#e8681a;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;margin:8px 0}
  .btn-wa{display:inline-block;padding:12px 24px;background:#25d366;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin:8px 0}
  .nota{color:#aaa;font-size:12px;margin-top:24px}
  .check{background:#d1fae5;border-radius:8px;padding:10px 16px;color:#065f46;font-size:13px;margin:12px 0}
</style>
</head>
<body>
  <div class="card">
    <div style="font-size:52px;margin-bottom:16px">🎉</div>
    <h2>¡Acceso aprobado, ${nombre}!</h2>
    <p>Tu email fue verificado y ya tenés acceso al Portal de Revendedores con <strong>7% de descuento</strong> en todos los equipos.</p>

    <div class="check">✅ Te enviamos un email con tu link personal de acceso.</div>

    <a href="${portalUrl}" class="btn-portal">Ingresar al portal →</a>

    <p style="margin-top:24px;font-size:13px;color:#888">
      También podés usar este link directo (guardalo):
    </p>
    <div class="token-box">${portalUrl}</div>

    <p style="font-size:13px;color:#aaa;margin-top:4px;margin-bottom:16px">
      ⚠️ Este link es personal — no lo compartás con terceros.
    </p>

    <a href="https://wa.me/5491125750323" class="btn-wa">¿Preguntas? Escribinos por WhatsApp</a>

    <p class="nota">Febecos · cotiza@febecos.com</p>
  </div>
</body>
</html>`
}

function paginaError(titulo: string, mensaje: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Error — Febecos</title></head>
<body style="margin:0;background:#f5f5f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;box-sizing:border-box">
  <div style="background:#fff;border-radius:16px;padding:40px 36px;max-width:480px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.08);text-align:center">
    <div style="font-size:52px;margin-bottom:16px">❌</div>
    <h2 style="color:#c0392b;margin-bottom:8px">${titulo}</h2>
    <p style="color:#555;line-height:1.7">${mensaje}</p>
    <p style="margin-top:24px;color:#aaa;font-size:12px">Febecos · cotiza@febecos.com</p>
  </div>
</body>
</html>`
}
