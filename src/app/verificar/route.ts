
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return new NextResponse(paginaError('Token inválido', 'El link de verificación no es válido.'))
  }

  const { data, error } = await supabase
    .from('solicitudes_revendedor')
    .select('id, nombre, email_verificado')
    .eq('token_verificacion', token)
    .single()

  if (error || !data) {
    return new NextResponse(paginaError('Link no encontrado', 'Este link de verificación no existe o ya fue usado.'), { headers: { 'Content-Type': 'text/html' } })
  }

  if (data.email_verificado) {
    return new NextResponse(paginaOk(data.nombre, true), { headers: { 'Content-Type': 'text/html' } })
  }

  await supabase
    .from('solicitudes_revendedor')
    .update({ email_verificado: true, estado: 'verificado' })
    .eq('id', data.id)

  return new NextResponse(paginaOk(data.nombre, false), { headers: { 'Content-Type': 'text/html' } })
}

function paginaOk(nombre: string, yaVerificado: boolean) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email verificado — Febecos</title></head>
<body style="margin:0;background:#f5f5f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;box-sizing:border-box">
  <div style="background:#fff;border-radius:16px;padding:40px 36px;max-width:480px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.08);text-align:center">
    <div style="font-size:52px;margin-bottom:16px">✅</div>
    <h2 style="color:#1a3a5c;margin-bottom:8px">${yaVerificado ? 'Ya estabas verificado' : '¡Email verificado, ' + nombre + '!'}</h2>
    <p style="color:#555;line-height:1.7;margin-bottom:24px">
      ${yaVerificado
        ? 'Tu email ya había sido verificado anteriormente.'
        : 'Tu solicitud está en revisión. Guillermo te va a contactar por WhatsApp en las próximas 24 horas hábiles para darte acceso al portal.'
      }
    </p>
    <a href="https://wa.me/5491125750323"
       style="display:inline-block;padding:12px 24px;background:#25d366;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
      Escribinos por WhatsApp
    </a>
    <p style="margin-top:24px;color:#aaa;font-size:12px">Febecos · cotiza@febecos.com</p>
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
