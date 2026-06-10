import { readFileSync } from 'fs'
const DB = process.env.DATABASE_URL || (readFileSync(new URL('../.env.local', import.meta.url),'utf8').match(/DATABASE_URL\s*=\s*(.+)/)||[])[1]?.trim().replace(/^[\"']|[\"']$/g,'')
if (!DB) { console.error('Falta DATABASE_URL'); process.exit(1) }
import { neon } from '@neondatabase/serverless'
const sql = neon(DB)
const rows = await sql`
  SELECT codigo, marca, watts, precio_full, activo, stock
  FROM pumps
  WHERE (lower(marca) LIKE '%handuro%' OR lower(marca) LIKE '%hyco%')
    AND watts = 500
  ORDER BY precio_full`
console.table(rows)
