import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
const DB = process.env.DATABASE_URL || (readFileSync(new URL('../.env.local', import.meta.url),'utf8').match(/DATABASE_URL\s*=\s*(.+)/)||[])[1]?.trim().replace(/^[\"']|[\"']$/g,'')
if (!DB) { console.error('Falta DATABASE_URL (.env.local o env)'); process.exit(1) }
const sql = neon(DB)
await sql`ALTER TABLE solicitudes_revendedor ADD COLUMN IF NOT EXISTS transportista_1_id BIGINT`
await sql`ALTER TABLE solicitudes_revendedor ADD COLUMN IF NOT EXISTS transportista_2_id BIGINT`
console.log('✓ Columnas transportista_1_id y transportista_2_id agregadas (o ya existían)')
