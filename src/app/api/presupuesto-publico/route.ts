import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET /api/presupuesto-publico?numero=PREV-2026-0060
// Devuelve los datos públicos de un presupuesto para mostrarlo en /p/[numero].
// NO expone teléfono del cliente, email ni token del revendedor (privacidad).
export async function GET(req: NextRequest) {
  const numero = req.nextUrl.searchParams.get('numero')
  if (!numero) return NextResponse.json({ error: 'numero requerido' }, { status: 400 })
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT numero, created_at, revendedor_nombre,
             bomba_codigo, bomba_descripcion, bomba_watts, bomba_marca,
             tipo_precio, precio_publico, precio_ofrecido, descuento_pct,
             cliente_nombre, cliente_apellido, cliente_telefono, cliente_zona
      FROM presupuestos
      WHERE numero = ${numero}
      ORDER BY created_at DESC LIMIT 1`
    if (!rows.length) return NextResponse.json({ error: 'no encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true, presupuesto: rows[0] })
  } catch (err: any) {
    console.error('GET /api/presupuesto-publico error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
