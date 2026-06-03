// GET /api/transportistas?provincia=X&localidad=Y
// Devuelve lista de transportistas activos que cubren la zona indicada.
// Usa logistics.search_carriers — mismo cluster Neon, schema logistics.
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const provincia = req.nextUrl.searchParams.get('provincia') || null
  const localidad = req.nextUrl.searchParams.get('localidad') || null

  try {
    const sql = getDb()
    const rows = await sql`
      SELECT carrier_id AS id, name, confidence, match_level
      FROM logistics.search_carriers(${provincia}, ${localidad})
    `

    // Deduplicar por id (search_carriers puede devolver el mismo carrier por múltiples zonas)
    const seen = new Set<number>()
    const carriers = rows.filter(r => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return true
    })

    return NextResponse.json({ ok: true, carriers })
  } catch (err: any) {
    console.error('[transportistas] Error:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
