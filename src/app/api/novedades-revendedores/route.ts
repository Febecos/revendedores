// /api/novedades-revendedores — Mail de novedades a revendedores activos
//
//   GET  ?key=GUARD                           → dry-run: muestra destinatarios y preview de novedades
//   POST ?key=GUARD&dias=7                    → envía a TODOS los activos
//   POST ?key=GUARD&test=EMAIL&dias=7         → envía SOLO a EMAIL (prueba)
//
// Body opcional: { asunto?: string, intro?: string, items?: string[] }
// Si no se pasa body, usa defaults + auto-detecta cambios en Neon (bombas nuevas/actualizadas)
//
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getDb } from '@/lib/db'

const GUARD  = process.env.RECORDATORIO_KEY || 'f0d9811cd021923ba50d50b1'
const PORTAL = 'https://revendedores.febecos.com/portal'

// ── Detecta novedades del catálogo en los últimos N días ─────────────────────
async function detectarNovedades(dias: number) {
  const sql = getDb()
  const [catalogoRows, changelogRows] = await Promise.all([
    sql`
      SELECT titulo_comercial, marca, watts, precio_full, activo, stock,
             created_at, updated_at
      FROM pumps
      WHERE activo = true
        AND updated_at > NOW() - (${dias} || ' days')::INTERVAL
      ORDER BY updated_at DESC
      LIMIT 20
    `,
    sql`
      SELECT id, fecha, titulo, descripcion, tipo
      FROM plataforma_changelog
      WHERE visible = true
        AND fecha > NOW() - (${dias} || ' days')::INTERVAL
      ORDER BY fecha DESC
    `,
  ])

  const umbralMs = dias * 24 * 60 * 60 * 1000
  const nuevas = catalogoRows.filter((r: any) =>
    Date.now() - new Date(r.created_at).getTime() < umbralMs
  )
  const actualizadas = catalogoRows.filter((r: any) =>
    Date.now() - new Date(r.created_at).getTime() >= umbralMs
  )

  return { nuevas, actualizadas, changelog: changelogRows }
}

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('es-AR')
}

// ── HTML del email ────────────────────────────────────────────────────────────
const TIPO_ICON: Record<string, string> = {
  novedad:    '🆕',
  mejora:     '⚡',
  fix:        '🔧',
  importante: '🔔',
}
const TIPO_COLOR: Record<string, string> = {
  novedad:    '#1a3a5c',
  mejora:     '#1a6b3c',
  fix:        '#7a5c00',
  importante: '#b91c1c',
}

function html(
  nombre: string,
  token: string,
  dias: number,
  intro: string,
  items: string[],
  nuevas: any[],
  actualizadas: any[],
  changelog: any[],
): string {
  const primer = (nombre || '').split(' ')[0] || 'Hola'
  const url = `${PORTAL}?token=${token}`
  const periodoLabel = dias === 7 ? 'esta semana' : dias === 14 ? 'estas dos semanas' : `los últimos ${dias} días`

  // Changelog de la plataforma (desde DB)
  const changelogHtml = changelog.length
    ? changelog.map(c => {
        const icon  = TIPO_ICON[c.tipo]  || '✨'
        const color = TIPO_COLOR[c.tipo] || '#1a3a5c'
        return `<div style="padding:12px 0;border-bottom:1px solid #e8edf2">
          <div style="display:flex;align-items:flex-start;gap:10px">
            <span style="font-size:18px;line-height:1.2">${icon}</span>
            <div>
              <div style="font-size:13px;font-weight:700;color:${color}">${c.titulo}</div>
              ${c.descripcion ? `<div style="font-size:12px;color:#5a6f84;margin-top:3px;line-height:1.6">${c.descripcion}</div>` : ''}
            </div>
          </div>
        </div>`
      }).join('')
    : ''

  // Items manuales del admin (escritos en el textarea)
  const itemsHtml = items.length
    ? items.map(i => `<li style="padding:6px 0;border-bottom:1px solid #e8edf2;font-size:14px;color:#2d3f55">${i}</li>`).join('')
    : ''

  // Bombas nuevas del catálogo
  const nuevasHtml = nuevas.length
    ? `<div style="margin-top:20px">
        <div style="font-size:11px;font-weight:700;color:#1a3a5c;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px">🆕 Equipos nuevos en catálogo</div>
        ${nuevas.map((b: any) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #e8edf2">
            <span style="font-size:13px;font-weight:600;color:#1a3a5c">${b.titulo_comercial || b.marca + ' ' + b.watts + 'W'}</span>
            <span style="font-size:12px;color:#e8681a;font-weight:700">${b.precio_full ? fmt(b.precio_full) : '—'}</span>
          </div>`).join('')}
      </div>`
    : ''

  // Bombas actualizadas
  const actualizadasHtml = actualizadas.length
    ? `<div style="margin-top:20px">
        <div style="font-size:11px;font-weight:700;color:#1a3a5c;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px">🔄 Equipos con precio o stock actualizado</div>
        ${actualizadas.map((b: any) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #e8edf2">
            <span style="font-size:13px;color:#2d3f55">${b.titulo_comercial || b.marca + ' ' + b.watts + 'W'}</span>
            <span style="font-size:12px;color:#555">${b.precio_full ? fmt(b.precio_full) : '—'} · Stock: ${b.stock ?? '—'}</span>
          </div>`).join('')}
      </div>`
    : ''

  const sinCambiosProductos = !nuevas.length && !actualizadas.length
    ? `<p style="font-size:13px;color:#7a8fa5;margin-top:16px">No hubo cambios en el catálogo ${periodoLabel}.</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Novedades — Portal Revendedores Febecos</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#f0f4f8;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a2a3a}
.wrap{max-width:600px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)}
.header{background:#1a3a5c;padding:36px 40px;text-align:center;border-radius:16px 16px 0 0}
.header img{height:42px;object-fit:contain;margin-bottom:14px;display:block;margin-left:auto;margin-right:auto}
.header h1{color:#fff;font-size:21px;font-weight:800;line-height:1.4}
.header h1 span{color:#e8681a}
.badge-periodo{display:inline-block;background:rgba(255,255,255,.15);color:#fff;border-radius:20px;padding:4px 14px;font-size:11px;font-weight:600;margin-top:10px;letter-spacing:.04em}
.body{background:#fff;padding:36px 40px}
.greeting{font-size:15px;line-height:1.85;color:#2d3f55;margin-bottom:24px}
.greeting strong{color:#1a3a5c}
.card{background:#f7f9fc;border:1px solid #d6e0ea;border-radius:12px;padding:22px 26px;margin-bottom:24px}
.card h3{font-size:12px;color:#1a3a5c;text-transform:uppercase;letter-spacing:.07em;font-weight:700;margin-bottom:12px}
.cta-wrap{text-align:center;padding:8px 0 28px}
.cta-btn{display:inline-block;background:#e8681a;color:#fff;padding:15px 44px;border-radius:12px;font-weight:800;font-size:15px;text-decoration:none;letter-spacing:.02em}
.footer{background:#f0f4f8;padding:26px 40px;text-align:center;border-top:1px solid #d6e0ea}
.footer p{font-size:12px;color:#7a8fa5;line-height:1.9}
.footer a{color:#1a3a5c;text-decoration:none;font-weight:600}
@media(max-width:600px){.header,.body,.footer{padding-left:20px;padding-right:20px}}
</style></head>
<body><div class="wrap">

  <div class="header">
    <img src="https://selector.febecos.com/images/febecos-logo.png" alt="Febecos"/>
    <h1>Novedades del portal<br/><span>${periodoLabel.charAt(0).toUpperCase() + periodoLabel.slice(1)}</span></h1>
    <div class="badge-periodo">📅 Período: últimos ${dias} días</div>
  </div>

  <div class="body">
    <p class="greeting">
      Hola <strong>${primer}</strong>,<br/><br/>
      ${intro || `Te compartimos las novedades y actualizaciones del portal de revendedores de Febecos de ${periodoLabel}.`}
    </p>

    ${changelogHtml ? `<div class="card">
      <h3>🚀 Novedades y mejoras del portal</h3>
      ${changelogHtml}
    </div>` : ''}

    ${itemsHtml ? `<div class="card">
      <h3>📌 Más novedades</h3>
      <ul style="list-style:none;padding:0;margin:0">${itemsHtml}</ul>
    </div>` : ''}

    ${nuevasHtml || actualizadasHtml || sinCambiosProductos ? `<div class="card">
      <h3>📦 Catálogo</h3>
      ${nuevasHtml}${actualizadasHtml}${sinCambiosProductos}
    </div>` : ''}

    <div class="cta-wrap">
      <a href="${url}" class="cta-btn">Ir al portal →</a>
    </div>

    <p style="font-size:13px;color:#5a6f84;line-height:1.7;text-align:center">
      Respondé este mail o escribinos por WhatsApp si tenés consultas.
    </p>
  </div>

  <div class="footer">
    <p>
      <strong>Patricio Ratto</strong> · Febecos Bombas Solares<br/>
      <a href="mailto:revende@febecos.com">revende@febecos.com</a> ·
      <a href="https://febecos.com">febecos.com</a>
    </p>
    <p style="margin-top:6px">Lun a Vie 10–17 hs · Argentina</p>
  </div>

</div></body></html>`
}

// ── Destinatarios activos ─────────────────────────────────────────────────────
async function getDestinatarios() {
  const sql = getDb()
  return await sql`
    SELECT nombre, email, token_acceso
    FROM solicitudes_revendedor
    WHERE estado IN ('aprobado','activo')
      AND token_acceso IS NOT NULL
      AND token_acceso_activo = true
      AND email IS NOT NULL AND email <> ''
    ORDER BY created_at DESC
  `
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('key') !== GUARD) {
    return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  }
  const dias = parseInt(req.nextUrl.searchParams.get('dias') || '7')
  const [rows, novedades] = await Promise.all([getDestinatarios(), detectarNovedades(dias)])
  return NextResponse.json({
    ok: true,
    total: rows.length,
    periodo_dias: dias,
    novedades_catalogo: {
      nuevas: novedades.nuevas.length,
      actualizadas: novedades.actualizadas.length,
    },
    destinatarios: rows.map((r: any) => ({ nombre: r.nombre, email: r.email })),
  })
}

export async function POST(req: NextRequest) {
  if (req.nextUrl.searchParams.get('key') !== GUARD) {
    return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  }

  const dias = parseInt(req.nextUrl.searchParams.get('dias') || '7')
  const testEmail = (req.nextUrl.searchParams.get('test') || '').toLowerCase().trim()

  // Body opcional con contenido personalizado del admin
  let body: any = {}
  try { body = await req.json() } catch {}
  const { asunto, intro, items = [] } = body

  const [novedades, todosRows] = await Promise.all([detectarNovedades(dias), getDestinatarios()])

  let rows = todosRows
  if (testEmail) {
    const sql = getDb()
    const fallback = await sql`
      SELECT nombre, email, token_acceso FROM solicitudes_revendedor
      WHERE lower(email) = ${testEmail} AND token_acceso IS NOT NULL LIMIT 1
    `
    rows = fallback.length ? fallback : []
    if (!rows.length) {
      return NextResponse.json({ ok: false, error: `"${testEmail}" no encontrado con token activo` }, { status: 404 })
    }
  }

  const asuntoFinal = asunto || `Novedades del portal de revendedores — últimos ${dias} días`
  const resend = new Resend(process.env.RESEND_API_KEY)
  const enviados: any[] = []
  const fallidos: any[] = []

  for (const r of rows as any[]) {
    try {
      const res = await resend.emails.send({
        from: 'Febecos Revendedores <revende@febecos.com>',
        replyTo: 'revende@febecos.com',
        to: r.email,
        subject: asuntoFinal,
        html: html(r.nombre, r.token_acceso, dias, intro || '', items, novedades.nuevas, novedades.actualizadas, novedades.changelog),
      })
      if (res.error) fallidos.push({ email: r.email, error: res.error.message })
      else enviados.push({ email: r.email, id: res.data?.id })
    } catch (e: any) {
      fallidos.push({ email: r.email, error: e.message })
    }
    await new Promise(res => setTimeout(res, 500))
  }

  return NextResponse.json({ ok: true, modo: testEmail ? 'prueba' : 'masivo', enviados, fallidos })
}
