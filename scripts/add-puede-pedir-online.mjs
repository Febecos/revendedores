import { neon } from '@neondatabase/serverless'
const DB = 'postgresql://neondb_owner:npg_xSqkcepYGZ47@ep-muddy-shape-am1uev5m-pooler.c-5.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require'
const sql = neon(DB)
const r = await sql`ALTER TABLE solicitudes_revendedor ADD COLUMN IF NOT EXISTS puede_pedir_online BOOLEAN NOT NULL DEFAULT false`
console.log('✓ Columna puede_pedir_online agregada (o ya existía)')
