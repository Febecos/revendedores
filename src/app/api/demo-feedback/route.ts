// GET /api/demo-feedback?token=XXX&motivo=YYY
// Registra el motivo elegido por un demo en la encuesta "¿qué te faltó?" y
// devuelve una página de gracias. No requiere auth (el token del rev hace de llave).
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const PORTAL = 'https://revendedores.febecos.com/portal'
const WA     = 'https://wa.me/5491125750323'

const MOTIVO_LABEL: Record<string, string> = {
  tiempo:   'No tuve tiempo todavía',
  complejo: 'Me resultó difícil de usar',
  rubro:    'No es para mi actividad / no lo necesito ahora',
  precio:   'Por los precios o condiciones',
  otro:     'Otro motivo',
}

function pagina(nombre: string, motivo: string, token: string): string {
  const primer = (nombre || '').split(' ')[0] || ''
  const label = MOTIVO_LABEL[motivo] || 'tu respuesta'
  const portalUrl = `${PORTAL}?token=${encodeURIComponent(token)}`
  const esOtro = motivo === 'otro'
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>¡Gracias! — Febecos</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d1a2a;font-family:'Helvetica Neue',Arial,sans-serif;color:#e8f0f8;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.card{background:#13263d;border:1px solid #1e3248;border-radius:18px;max-width:440px;width:100%;padding:40px 34px;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.4)}
.emoji{font-size:48px;margin-bottom:14px}
h1{font-size:22px;font-weight:800;margin-bottom:10px}
p{font-size:14px;line-height:1.75;color:#9fb3c8;margin-bottom:10px}
.tag{display:inline-block;background:rgba(232,104,26,.15);border:1px solid #e8681a;color:#e8681a;border-radius:8px;padding:5px 12px;font-size:13px;font-weight:700;margin:8px 0 20px}
.btn{display:block;text-decoration:none;border-radius:11px;padding:14px;font-weight:800;font-size:15px;margin-top:12px}
.btn-portal{background:#e8681a;color:#fff}
.btn-wa{background:#25d366;color:#fff}
.foot{margin-top:22px;font-size:12px;color:#5a7390}
</style></head>
<body><div class="card">
  <div class="emoji">🙏</div>
  <h1>¡Gracias${primer ? ', ' + primer : ''}!</h1>
  <div class="tag">${label}</div>
  <p>Tu respuesta nos ayuda a mejorar el portal. ${esOtro ? 'Contanos un poco más por WhatsApp y vemos cómo darte una mano.' : 'Si querés, tu acceso demo sigue activo y podés probarlo cuando quieras.'}</p>
  <a class="btn btn-wa" href="${WA}?text=${encodeURIComponent('Hola, soy ' + (primer || 'un revendedor') + ' del portal de revendedores Febecos')}">💬 Hablar por WhatsApp</a>
  <a class="btn btn-portal" href="${portalUrl}">☀️ Entrar al portal</a>
  <div class="foot">Febecos — Bombas Solares para el Campo</div>
</div></body></html>`
}

function htmlResponse(body: string, status = 200) {
  return new NextResponse(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

export async function GET(req: NextRequest) {
  const token  = req.nextUrl.searchParams.get('token') || ''
  const motivo = (req.nextUrl.searchParams.get('motivo') || '').toLowerCase().trim()

  if (!token || !MOTIVO_LABEL[motivo]) {
    return htmlResponse(pagina('', 'otro', token), 400)
  }

  try {
    const sql = getDb()
    await sql`
      CREATE TABLE IF NOT EXISTS demo_feedback (
        id         SERIAL PRIMARY KEY,
        token      TEXT,
        email      TEXT,
        nombre     TEXT,
        motivo     TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
    const rev = await sql`
      SELECT nombre, email FROM solicitudes_revendedor
      WHERE token_acceso = ${token} LIMIT 1
    `
    const nombre = rev.length ? rev[0].nombre : ''
    const email  = rev.length ? rev[0].email  : null

    await sql`
      INSERT INTO demo_feedback (token, email, nombre, motivo)
      VALUES (${token}, ${email}, ${nombre}, ${motivo})
    `
    return htmlResponse(pagina(nombre, motivo, token))
  } catch (err: any) {
    console.error('[demo-feedback]', err.message)
    // Igual mostramos gracias para no romper la experiencia del usuario
    return htmlResponse(pagina('', motivo, token))
  }
}
