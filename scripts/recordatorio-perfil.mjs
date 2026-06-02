// scripts/recordatorio-perfil.mjs
// Mail a revendedores aprobados/activos para que revisen y completen sus datos de perfil.
// Cada destinatario recibe un link personalizado con su token_acceso a /portal/perfil.
//
// Uso:
//   node scripts/recordatorio-perfil.mjs            -> DRY-RUN (no envía, lista destinatarios + escribe preview.html)
//   node scripts/recordatorio-perfil.mjs --send     -> ENVÍA de verdad
//
// Lee DATABASE_URL y RESEND_API_KEY de .env.local (no commitea secretos).

import { neon } from '@neondatabase/serverless'
import { Resend } from 'resend'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── cargar .env.local manualmente ────────────────────────────────────────────
function loadEnv() {
  const txt = readFileSync(join(ROOT, '.env.local'), 'utf8')
  for (const line of txt.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    let v = m[2].trim().replace(/^["']|["']$/g, '')
    if (!(m[1] in process.env)) process.env[m[1]] = v
  }
}
loadEnv()

const SEND = process.argv.includes('--send')
const testIdx = process.argv.indexOf('--test')
const TEST_EMAIL = testIdx >= 0 ? (process.argv[testIdx + 1] || '').toLowerCase() : null
const PORTAL = 'https://revendedores.febecos.com/portal/perfil'

// ── template ─────────────────────────────────────────────────────────────────
function html(nombre, token) {
  const primer = (nombre || '').split(' ')[0] || 'Hola'
  const url = `${PORTAL}?token=${token}`
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Revisá tus datos — Portal Revendedores Febecos</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#f0f4f8;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a2a3a}
.wrap{max-width:600px;margin:0 auto}
.header{background:#003d72;padding:36px 40px;text-align:center}
.header h1{color:#fff;font-size:23px;font-weight:800;line-height:1.35}
.header h1 span{color:#a8c61b}
.body{background:#fff;padding:36px 40px}
.greeting{font-size:16px;line-height:1.8;color:#2d3f55;margin-bottom:26px}
.greeting strong{color:#003d72}
.card{background:#f7f9fc;border:1px solid #d6e0ea;border-radius:12px;padding:22px 26px;margin-bottom:28px}
.card h3{font-size:13px;color:#003d72;text-transform:uppercase;letter-spacing:.06em;margin-bottom:14px}
.card ul{list-style:none;margin:0;padding:0}
.card li{font-size:14px;color:#2d3f55;padding:7px 0;border-bottom:1px solid #e8edf2;display:flex;gap:10px;align-items:center}
.card li:last-child{border-bottom:none}
.card li b{color:#003d72}
.cta-wrap{text-align:center;padding:6px 0 26px}
.cta-btn{display:inline-block;background:#a8c61b;color:#003d72;padding:16px 44px;border-radius:12px;font-weight:800;font-size:16px;text-decoration:none}
.note{font-size:12px;color:#7a8fa5;margin-top:12px;text-align:center}
.footer{background:#f0f4f8;padding:26px 40px;text-align:center;border-top:1px solid #d6e0ea}
.footer p{font-size:12px;color:#7a8fa5;line-height:1.8}
.footer a{color:#003d72;text-decoration:none;font-weight:600}
@media(max-width:600px){.header,.body,.footer{padding-left:20px;padding-right:20px}}
</style></head>
<body><div class="wrap">
  <div class="header">
    <h1>Revisá y completá tus datos<br/><span>Portal Revendedores Febecos</span></h1>
  </div>
  <div class="body">
    <p class="greeting">
      Hola <strong>${primer}</strong>,<br/><br/>
      Estamos poniendo al día la base de revendedores para mejorar el soporte, la facturación
      y los envíos. Te pedimos un minuto para revisar que tus datos estén completos y correctos.
    </p>
    <div class="card">
      <h3>Datos a confirmar</h3>
      <ul>
        <li>🏢 <b>Empresa / razón social</b></li>
        <li>📍 <b>Provincia y localidad</b></li>
        <li>🧾 <b>CUIT</b></li>
        <li>📱 <b>WhatsApp de contacto</b></li>
      </ul>
    </div>
    <div class="cta-wrap">
      <a href="${url}" class="cta-btn">Revisar mis datos →</a>
      <p class="note">El enlace es personal y te abre tu perfil directamente, sin contraseña.</p>
    </div>
    <p style="font-size:13px;color:#5a6f84;line-height:1.7">
      Si ya tenés todo cargado, igual entrá y confirmá que esté correcto. Cualquier duda,
      respondé este mail y te ayudamos.
    </p>
  </div>
  <div class="footer">
    <p>
      <strong>Patricio Ratto</strong> · Febecos Bombas Solares<br/>
      <a href="mailto:revende@febecos.com">revende@febecos.com</a> ·
      <a href="https://febecos.com">febecos.com</a>
    </p>
    <p style="margin-top:8px;">Lun a Vie 10–17 hs</p>
  </div>
</div></body></html>`
}

// ── main ─────────────────────────────────────────────────────────────────────
const sql = neon(process.env.DATABASE_URL)
let rows = await sql`
  SELECT nombre, email, token_acceso
  FROM solicitudes_revendedor
  WHERE estado IN ('aprobado','activo')
    AND token_acceso IS NOT NULL
    AND token_acceso_activo = true
    AND email IS NOT NULL AND email <> ''
  ORDER BY created_at DESC
`

// Modo prueba: enviar solo a una dirección (debe existir en la base)
if (TEST_EMAIL) {
  rows = rows.filter(r => (r.email || '').toLowerCase() === TEST_EMAIL)
  if (!rows.length) {
    console.error(`\n✗ No encontré "${TEST_EMAIL}" entre los aprobados con token. No envío nada.\n`)
    process.exit(1)
  }
  console.log(`\n=== MODO PRUEBA — envío solo a ${TEST_EMAIL} ===`)
  const resendT = new Resend(process.env.RESEND_API_KEY)
  const r = rows[0]
  const res = await resendT.emails.send({
    from: 'Febecos Revendedores <revende@febecos.com>',
    replyTo: 'revende@febecos.com',
    to: r.email,
    subject: `${(r.nombre || '').split(' ')[0] || 'Hola'}, revisá tus datos en el portal Febecos`,
    html: html(r.nombre, r.token_acceso),
  })
  if (res.error) { console.error('✗ Error:', res.error.message); process.exit(1) }
  console.log(`✓ Mail de prueba enviado a ${r.email} (id ${res.data?.id})\n`)
  process.exit(0)
}

console.log(`\n=== ${SEND ? 'ENVÍO REAL' : 'DRY-RUN (sin enviar)'} ===`)
console.log(`Destinatarios: ${rows.length}\n`)
rows.forEach((r, i) => console.log(`  ${i + 1}. ${r.nombre} <${r.email}>`))

if (!SEND) {
  writeFileSync(join(ROOT, 'scripts', 'preview-recordatorio.html'), html(rows[0]?.nombre || 'Juan', 'TOKEN_DEMO'))
  console.log(`\nPreview escrito en scripts/preview-recordatorio.html (con datos de ejemplo).`)
  console.log(`Para enviar de verdad: node scripts/recordatorio-perfil.mjs --send\n`)
  process.exit(0)
}

const resend = new Resend(process.env.RESEND_API_KEY)
let ok = 0, fail = 0
for (const r of rows) {
  try {
    const result = await resend.emails.send({
      from: 'Febecos Revendedores <revende@febecos.com>',
      replyTo: 'revende@febecos.com',
      to: r.email,
      subject: `${(r.nombre || '').split(' ')[0] || 'Hola'}, revisá tus datos en el portal Febecos`,
      html: html(r.nombre, r.token_acceso),
    })
    if (result.error) { console.log(`  ✗ ${r.email}: ${result.error.message}`); fail++ }
    else { console.log(`  ✓ ${r.email} (${result.data?.id})`); ok++ }
  } catch (e) {
    console.log(`  ✗ ${r.email}: ${e.message}`); fail++
  }
  await new Promise(res => setTimeout(res, 600)) // rate-limit amistoso
}
console.log(`\nEnviados: ${ok} · Fallidos: ${fail}\n`)
