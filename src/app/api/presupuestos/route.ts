import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const COLS_EXTRA = [
  `ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS cliente_razon_social TEXT`,
  `ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS cliente_cuit TEXT`,
  `ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS public_token TEXT`,
  `ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS profundidad_m NUMERIC`,
  `CREATE INDEX IF NOT EXISTS idx_presupuestos_token ON presupuestos(public_token)`,
]

const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS presupuestos (
    id                SERIAL PRIMARY KEY,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    numero            TEXT NOT NULL,
    revendedor_token  TEXT,
    revendedor_nombre TEXT,
    revendedor_email  TEXT,
    bomba_codigo      TEXT,
    bomba_descripcion TEXT,
    bomba_watts       INTEGER,
    bomba_marca       TEXT,
    litros_dia        NUMERIC,
    altura_m          NUMERIC,
    longitud_total_m  NUMERIC,
    profundidad_m     NUMERIC,
    tipo_precio       TEXT DEFAULT 'mayorista',
    precio_publico    NUMERIC,
    precio_ofrecido   NUMERIC,
    descuento_pct     NUMERIC,
    cliente_nombre    TEXT,
    cliente_apellido  TEXT,
    cliente_telefono  TEXT,
    cliente_zona      TEXT,
    estado            TEXT DEFAULT 'emitido'
  )
`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      numero, revendedor_token, revendedor_nombre, revendedor_email,
      bomba_codigo, bomba_descripcion, bomba_watts, bomba_marca,
      litros_dia, altura_m, longitud_total_m, profundidad_m,
      tipo_precio, precio_publico, precio_ofrecido, descuento_pct,
      cliente_nombre, cliente_apellido, cliente_telefono, cliente_zona,
      cliente_razon_social, cliente_cuit, public_token,
    } = body

    if (!numero) return NextResponse.json({ error: 'numero requerido' }, { status: 400 })

    const sql = getDb()
    await sql.unsafe(CREATE_TABLE)
    for (const q of COLS_EXTRA) await sql.unsafe(q)

    const rows = await sql`
      INSERT INTO presupuestos (
        numero, revendedor_token, revendedor_nombre, revendedor_email,
        bomba_codigo, bomba_descripcion, bomba_watts, bomba_marca,
        litros_dia, altura_m, longitud_total_m, profundidad_m,
        tipo_precio, precio_publico, precio_ofrecido, descuento_pct,
        cliente_nombre, cliente_apellido, cliente_telefono, cliente_zona,
        cliente_razon_social, cliente_cuit, public_token
      ) VALUES (
        ${numero},
        ${revendedor_token || null}, ${revendedor_nombre || null}, ${revendedor_email || null},
        ${bomba_codigo || null}, ${bomba_descripcion || null},
        ${bomba_watts || null}, ${bomba_marca || null},
        ${litros_dia || null}, ${altura_m || null}, ${longitud_total_m || null}, ${profundidad_m || null},
        ${tipo_precio || 'mayorista'},
        ${precio_publico || null}, ${precio_ofrecido || null}, ${descuento_pct || null},
        ${cliente_nombre || null}, ${cliente_apellido || null},
        ${cliente_telefono || null}, ${cliente_zona || null},
        ${cliente_razon_social || null}, ${cliente_cuit || null}, ${public_token || null}
      )
      RETURNING id, numero, created_at
    `

    return NextResponse.json({ ok: true, presupuesto: rows[0] })
  } catch (err: any) {
    console.error('POST /api/presupuestos error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')
    const sql = getDb()

    await sql.unsafe(CREATE_TABLE)
    for (const q of COLS_EXTRA) await sql.unsafe(q)

    const rows = token
      ? await sql`SELECT * FROM presupuestos WHERE revendedor_token = ${token} ORDER BY created_at DESC LIMIT ${limit}`
      : await sql`SELECT * FROM presupuestos ORDER BY created_at DESC LIMIT ${limit}`

    return NextResponse.json({ ok: true, presupuestos: rows })
  } catch (err: any) {
    console.error('GET /api/presupuestos error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
