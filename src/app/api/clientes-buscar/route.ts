import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET /api/clientes-buscar?q=texto
// Solo para uso interno — busca clientes en presupuestos existentes
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ clientes: [] })

  try {
    const sql = getDb()
    const term = `%${q}%`
    const rows = await sql`
      SELECT DISTINCT ON (coalesce(nullif(cliente_telefono,''), cliente_nombre || cliente_apellido))
        cliente_nombre       AS nombre,
        cliente_apellido     AS apellido,
        cliente_telefono     AS telefono,
        cliente_email        AS email,
        cliente_zona         AS zona,
        cliente_razon_social AS razon_social,
        cliente_cuit         AS cuit,
        descuento_pct        AS descuento
      FROM presupuestos
      WHERE
        cliente_nombre IS NOT NULL
        AND (
          cliente_nombre       ILIKE ${term}
          OR cliente_apellido  ILIKE ${term}
          OR cliente_razon_social ILIKE ${term}
          OR cliente_telefono  ILIKE ${term}
        )
      ORDER BY coalesce(nullif(cliente_telefono,''), cliente_nombre || cliente_apellido), created_at DESC
      LIMIT 8
    `
    return NextResponse.json({ clientes: rows })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
