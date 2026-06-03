// Endpoint de migración temporal — BORRAR después de correr una vez
// POST /api/admin/migrate-transportistas con header x-migrate-token: feb-mig-2026-trp
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const TOKEN = 'feb-mig-2026-trp'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-migrate-token') !== TOKEN) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  try {
    const sql = getDb()
    await sql`ALTER TABLE solicitudes_revendedor ADD COLUMN IF NOT EXISTS transportista_1_id BIGINT`
    await sql`ALTER TABLE solicitudes_revendedor ADD COLUMN IF NOT EXISTS transportista_2_id BIGINT`
    return NextResponse.json({ ok: true, msg: 'Columnas transportista_1_id y transportista_2_id agregadas' })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
