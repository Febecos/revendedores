// TEMPORAL — eliminar después de ejecutar una vez
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== 'febecos-migrate-2026') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    const sql = getDb()
    await sql`
      CREATE TABLE IF NOT EXISTS pedidos (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        revendedor_id   UUID,
        revendedor_nombre TEXT,
        revendedor_email  TEXT,
        revendedor_token  TEXT,
        bomba_codigo      TEXT NOT NULL,
        bomba_descripcion TEXT,
        litros_dia        INTEGER,
        altura_m          NUMERIC,
        precio_publico    INTEGER NOT NULL,
        precio_final      INTEGER NOT NULL,
        descuento_pct     INTEGER DEFAULT 0,
        tipo_comprador    TEXT DEFAULT 'cliente_final',
        metodo_pago       TEXT NOT NULL,
        estado            TEXT DEFAULT 'pendiente_aprobacion',
        mp_preference_id  TEXT,
        mp_payment_id     TEXT,
        notas_cliente     TEXT,
        notas_admin       TEXT,
        created_at        TIMESTAMPTZ DEFAULT NOW(),
        updated_at        TIMESTAMPTZ DEFAULT NOW()
      )
    `
    await sql`
      CREATE INDEX IF NOT EXISTS pedidos_estado_idx ON pedidos(estado)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS pedidos_created_idx ON pedidos(created_at DESC)
    `
    return NextResponse.json({ ok: true, msg: 'Tabla pedidos creada correctamente' })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
