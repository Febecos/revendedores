// Diagnóstico temporal — BORRAR después de usar
// GET /api/admin/diag-pedidos?t=feb-diag-2026
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('t') !== 'feb-diag-2026') {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const sql = getDb()
  const cols = await sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pedidos'
    ORDER BY ordinal_position
  `
  return NextResponse.json({ ok: true, columnas: cols })
}
