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

  // Ya estaba verificado — redirigir al portal si tiene token
  if (data.email_verificado && data.token_acceso) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://revendedores.febecos.com'
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://revendedores.febecos.com'

  return new NextResponse(paginaOk(data.nombre, tokenAcceso, baseUrl), { headers: { 'Content-Type': 'text/html' } })
}

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
</style>
</head>
<body>
  <div class="card">
    <div style="font-size:52px;margin-bottom:16px">🎉</div>
    <h2>¡Acceso aprobado, ${nombre}!</h2>
    <p>Tu email fue verificado y ya tenés acceso al Portal de Revendedores con <strong>7% de descuento</strong> en todos los equipos.</p>

    <a href="${portalUrl}" class="btn-portal">Ingresar al portal →</a>

    <p style="margin-top:24px;font-size:13px;color:#888">
      Guardá este link — es tu acceso personal:
    </p>
    <div class="token-box">${portalUrl}</div>

    <p style="font-size:13px;color:#888;margin-top:8px">
      ¿Necesitás ajustar tu descuento o tenés preguntas?
    </p>
    <a href="https://wa.me/5491125750323" class="btn-wa">Escribinos por WhatsApp</a>

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
