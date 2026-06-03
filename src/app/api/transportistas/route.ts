// GET /api/transportistas?provincia=X&localidad=Y           → carriers de la zona (dropdown inicial)
// GET /api/transportistas?nombre=villa                      → busca en TODOS los carriers por nombre
// GET /api/transportistas?provincia=X&nombre=villa          → combinado (primero zona, resto por nombre)
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const provincia = req.nextUrl.searchParams.get('provincia') || null
  const localidad = req.nextUrl.searchParams.get('localidad') || null
  const nombre    = req.nextUrl.searchParams.get('nombre')    || null

  try {
    const sql = getDb()

    // Modo búsqueda por nombre → busca en TODOS los carriers activos
    if (nombre && nombre.length >= 2) {
      const rows = await sql`
        SELECT
          c.id,
          c.name,
          'media' AS confidence,
          CASE
            WHEN EXISTS (
              SELECT 1 FROM logistics.carrier_coverage_zones z
              WHERE z.carrier_id = c.id AND z.active = true
                AND lower(coalesce(z.province,'')) = lower(coalesce(${provincia},''))
            ) THEN 'provincia'
            ELSE 'sin_match_directo'
          END AS match_level
        FROM logistics.carriers c
        WHERE c.active = true
          AND c.name ILIKE ${'%' + nombre + '%'}
        ORDER BY
          CASE WHEN EXISTS (
            SELECT 1 FROM logistics.carrier_coverage_zones z
            WHERE z.carrier_id = c.id AND z.active = true
              AND lower(coalesce(z.province,'')) = lower(coalesce(${provincia},''))
          ) THEN 0 ELSE 1 END,
          c.name
        LIMIT 20
      `
      return NextResponse.json({ ok: true, carriers: rows })
    }

    // Modo zona → search_carriers por provincia/localidad (dropdown inicial)
    const rows = await sql`
      SELECT carrier_id AS id, name, confidence, match_level
      FROM logistics.search_carriers(${provincia}, ${localidad})
    `
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
