// Endpoint de migración temporal — BORRAR después de correr una vez
// POST /api/admin/migrate-pedidos con header x-migrate-token: feb-mig-2026-ped
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const TOKEN = 'feb-mig-2026-ped'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-migrate-token') !== TOKEN) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  try {
    const sql = getDb()

    // Verificar si la tabla ya existe
    const check = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'pedidos'
      ) AS existe
    `

    if (check[0].existe) {
      return NextResponse.json({ ok: true, msg: 'La tabla pedidos ya existe' })
    }

    await sql`
      CREATE TABLE pedidos (
        id               SERIAL PRIMARY KEY,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        revendedor_id    INTEGER,
        revendedor_nombre TEXT,
        revendedor_email  TEXT,
        revendedor_token  TEXT,
        bomba_codigo      TEXT NOT NULL,
        bomba_descripcion TEXT,
        litros_dia        NUMERIC,
        altura_m          NUMERIC,
        precio_publico    NUMERIC NOT NULL,
        precio_final      NUMERIC NOT NULL,
        descuento_pct     NUMERIC DEFAULT 0,
        tipo_comprador    TEXT DEFAULT 'cliente_final',
        metodo_pago       TEXT NOT NULL,
        notas_cliente     TEXT,
        estado            TEXT DEFAULT 'pendiente_aprobacion'
      )
    `

    return NextResponse.json({ ok: true, msg: 'Tabla pedidos creada correctamente' })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
