import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
const DB = process.env.DATABASE_URL || (readFileSync(new URL('../.env.local', import.meta.url),'utf8').match(/DATABASE_URL\s*=\s*(.+)/)||[])[1]?.trim().replace(/^[\"']|[\"']$/g,'')
if (!DB) { console.error('Falta DATABASE_URL (.env.local o env)'); process.exit(1) }
const sql = neon(DB)
const r = await sql`ALTER TABLE solicitudes_revendedor ADD COLUMN IF NOT EXISTS puede_pedir_online BOOLEAN NOT NULL DEFAULT false`
console.log('✓ Columna puede_pedir_online agregada (o ya existía)')
