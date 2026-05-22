// POST /api/pedidos — crea un nuevo pedido (estado: pendiente_aprobacion)
// GET  /api/pedidos — lista todos los pedidos (admin), soporta ?estado=xxx&limit=50
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      revendedor_id, revendedor_nombre, revendedor_email, revendedor_token,
      bomba_codigo, bomba_descripcion, litros_dia, altura_m,
      precio_publico, precio_final, descuento_pct,
      tipo_comprador, metodo_pago, notas_cliente
    } = body

    if (!bomba_codigo || !precio_publico || !precio_final || !metodo_pago) {
      return NextResponse.json({ ok: false, error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const sql = getDb()
    const rows = await sql`
      INSERT INTO pedidos (
        revendedor_id, revendedor_nombre, revendedor_email, revendedor_token,
        bomba_codigo, bomba_descripcion, litros_dia, altura_m,
        precio_publico, precio_final, descuento_pct,
        tipo_comprador, metodo_pago, notas_cliente,
        estado
      ) VALUES (
        ${revendedor_id || null},
        ${revendedor_nombre || null},
        ${revendedor_email || null},
        ${revendedor_token || null},
        ${bomba_codigo},
        ${bomba_descripcion || null},
        ${litros_dia || null},
        ${altura_m || null},
        ${precio_publico},
        ${precio_final},
        ${descuento_pct || 0},
        ${tipo_comprador || 'cliente_final'},
        ${metodo_pago},
        ${notas_cliente || null},
        'pendiente_aprobacion'
      )
      RETURNING id, created_at
    `
    return NextResponse.json({ ok: true, id: rows[0].id, created_at: rows[0].created_at })
  } catch (err: any) {
    console.error('[pedidos POST]', err.message)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const estado = req.nextUrl.searchParams.get('estado')
    const limit = Number(req.nextUrl.searchParams.get('limit') || 100)
    const sql = getDb()

    const rows = estado
      ? await sql`SELECT * FROM pedidos WHERE estado = ${estado} ORDER BY created_at DESC LIMIT ${limit}`
      : await sql`SELECT * FROM pedidos ORDER BY created_at DESC LIMIT ${limit}`

    return NextResponse.json({ ok: true, pedidos: rows })
  } catch (err: any) {
    console.error('[pedidos GET]', err.message)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
