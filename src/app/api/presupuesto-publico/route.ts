import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET /api/presupuesto-publico?t=<token>
// Busca por TOKEN aleatorio → no enumerable (seguridad).
// Incluye branding del revendedor si habilitó marca propia y tiene logo cargado.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t')
  if (!token || token.length < 8) return NextResponse.json({ error: 'token inválido' }, { status: 400 })
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT
        p.numero, p.created_at, p.revendedor_nombre,
        p.bomba_codigo, p.bomba_descripcion, p.bomba_watts, p.bomba_marca,
        p.tipo_precio, p.precio_publico, p.precio_ofrecido, p.descuento_pct,
        p.cliente_nombre, p.cliente_apellido, p.cliente_telefono, p.cliente_zona,
        p.cliente_razon_social, p.cliente_cuit,
        -- Branding del revendedor (solo si tiene marca propia habilitada Y logo cargado)
        CASE WHEN sr.puede_cotizar_con_marca = true AND sr.logo_base64 IS NOT NULL
          THEN sr.logo_base64 ELSE NULL END AS rev_logo,
        CASE WHEN sr.puede_cotizar_con_marca = true AND sr.logo_base64 IS NOT NULL
          THEN sr.empresa ELSE NULL END AS rev_empresa,
        CASE WHEN sr.puede_cotizar_con_marca = true AND sr.logo_base64 IS NOT NULL
          THEN sr.domicilio ELSE NULL END AS rev_domicilio,
        CASE WHEN sr.puede_cotizar_con_marca = true AND sr.logo_base64 IS NOT NULL
          THEN sr.cuit ELSE NULL END AS rev_cuit
      FROM presupuestos p
      LEFT JOIN solicitudes_revendedor sr ON sr.token_acceso = p.revendedor_token
      WHERE p.public_token = ${token}
      LIMIT 1`
    if (!rows.length) return NextResponse.json({ error: 'no encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true, presupuesto: rows[0] })
  } catch (err: any) {
    console.error('GET /api/presupuesto-publico error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
