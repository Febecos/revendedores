import { neon } from '@neondatabase/serverless'

import { readFileSync } from 'fs'
const DB = process.env.DATABASE_URL || (readFileSync(new URL('../.env.local', import.meta.url),'utf8').match(/DATABASE_URL\s*=\s*(.+)/)||[])[1]?.trim().replace(/^[\"']|[\"']$/g,'')
if (!DB) { console.error('Falta DATABASE_URL (.env.local o env)'); process.exit(1) }
const sql = neon(DB)
const TEL = '1130291050'
const PAT = `%${TEL}%`

async function run() {
  // ── BUSCAR ───────────────────────────────────────────────────────────────
  const tryQuery = async (q) => { try { return await q } catch { return [] } }

  const [leads, demo, solicitudes, revs] = await Promise.all([
    tryQuery(sql`SELECT id, nombre, whatsapp, email, created_at FROM leads WHERE whatsapp LIKE ${PAT} ORDER BY created_at DESC`),
    tryQuery(sql`SELECT id, nombre, whatsapp, email FROM demo_leads WHERE whatsapp LIKE ${PAT}`),
    tryQuery(sql`SELECT id, nombre, whatsapp, email FROM solicitudes_revendedor WHERE whatsapp LIKE ${PAT}`),
    tryQuery(sql`SELECT id, nombre, whatsapp, email FROM revendedores WHERE whatsapp LIKE ${PAT}`),
  ])

  console.log('\n=== ENCONTRADOS ===')
  console.log('leads:', leads.length, leads.map(r => `[${r.id}] ${r.nombre} ${r.whatsapp}`))
  console.log('demo_leads:', demo.length, demo.map(r => `[${r.id}] ${r.nombre} ${r.whatsapp}`))
  console.log('solicitudes_revendedor:', solicitudes.length, solicitudes.map(r => `[${r.id}] ${r.nombre} ${r.whatsapp}`))
  console.log('revendedores:', revs.length, revs.map(r => `[${r.id}] ${r.nombre} ${r.whatsapp}`))

  // ── BORRAR ───────────────────────────────────────────────────────────────
  await tryQuery(sql`DELETE FROM leads WHERE whatsapp LIKE ${PAT}`)
  await tryQuery(sql`DELETE FROM demo_leads WHERE whatsapp LIKE ${PAT}`)
  await tryQuery(sql`DELETE FROM solicitudes_revendedor WHERE whatsapp LIKE ${PAT}`)
  // revendedores NO se borran — son cuentas reales

  console.log('\n=== BORRADOS ===')
  console.log('leads eliminados:', leads.length)
  console.log('demo_leads eliminados:', demo.length)
  console.log('solicitudes eliminados:', solicitudes.length)
  console.log('revendedores: NO se tocan (cuentas reales)')
}

run().catch(console.error)
