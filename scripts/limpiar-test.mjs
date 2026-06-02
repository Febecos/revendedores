import { neon } from '@neondatabase/serverless'

const DB = 'postgresql://neondb_owner:npg_xSqkcepYGZ47@ep-muddy-shape-am1uev5m-pooler.c-5.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require'
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
