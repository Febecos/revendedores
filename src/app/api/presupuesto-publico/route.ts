import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET /api/presupuesto-publico?t=<token>
// Busca por TOKEN aleatorio (no por número) → no se puede enumerar (seguridad).
// NO expone email ni token del revendedor.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t')
  if (!token || token.length < 8) return NextResponse.json({ error: 'token inválido' }, { status: 400 })
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT numero, created_at, revendedor_nombre,
             bomba_codigo, bomba_descripcion, bomba_watts, bomba_marca,
             tipo_precio, precio_publico, precio_ofrecido, descuento_pct,
             cliente_nombre, cliente_apellido, cliente_telefono, cliente_zona,
             cliente_razon_social, cliente_cuit
      FROM presupuestos
      WHERE public_token = ${token}
      LIMIT 1`
    if (!rows.length) return NextResponse.json({ error: 'no encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true, presupuesto: rows[0] })
  } catch (err: any) {
    console.error('GET /api/presupuesto-publico error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
