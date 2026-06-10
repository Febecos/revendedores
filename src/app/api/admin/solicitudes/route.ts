import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT * FROM solicitudes_revendedor
      ORDER BY created_at DESC
    `
    return NextResponse.json(
      { solicitudes: rows },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    )
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
