// Endpoint de migración temporal — BORRAR después de correr una vez
// POST /api/admin/migrate-marca con header x-migrate-token: feb-mig-2026-marca
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const TOKEN = 'feb-mig-2026-marca'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-migrate-token') !== TOKEN) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  try {
    const sql = getDb()
    await sql`ALTER TABLE solicitudes_revendedor ADD COLUMN IF NOT EXISTS domicilio TEXT`
    await sql`ALTER TABLE solicitudes_revendedor ADD COLUMN IF NOT EXISTS logo_base64 TEXT`
    await sql`ALTER TABLE solicitudes_revendedor ADD COLUMN IF NOT EXISTS puede_cotizar_con_marca BOOLEAN NOT NULL DEFAULT false`
    return NextResponse.json({ ok: true, msg: 'Columnas domicilio, logo_base64 y puede_cotizar_con_marca agregadas' })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
