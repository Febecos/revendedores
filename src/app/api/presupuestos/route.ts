import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

async function ensureTable(sql: any) {
  await sql`
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
  await sql`ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS cliente_razon_social TEXT`
  await sql`ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS cliente_cuit TEXT`
  await sql`ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS cliente_email TEXT`
  await sql`ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS public_token TEXT`
  await sql`ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS profundidad_m NUMERIC`
  await sql`CREATE INDEX IF NOT EXISTS idx_presupuestos_token ON presupuestos(public_token)`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      numero, revendedor_token, revendedor_nombre, revendedor_email,
      bomba_codigo, bomba_descripcion, bomba_watts, bomba_marca,
      litros_dia, altura_m, longitud_total_m, profundidad_m,
      tipo_precio, precio_publico, precio_ofrecido, descuento_pct,
      cliente_nombre, cliente_apellido, cliente_telefono, cliente_email, cliente_zona,
      cliente_razon_social, cliente_cuit, public_token,
    } = body

    if (!numero) return NextResponse.json({ error: 'numero requerido' }, { status: 400 })

    const sql = getDb()
    await ensureTable(sql)

    const rows = await sql`
      INSERT INTO presupuestos (
        numero, revendedor_token, revendedor_nombre, revendedor_email,
        bomba_codigo, bomba_descripcion, bomba_watts, bomba_marca,
        litros_dia, altura_m, longitud_total_m, profundidad_m,
        tipo_precio, precio_publico, precio_ofrecido, descuento_pct,
        cliente_nombre, cliente_apellido, cliente_telefono, cliente_email, cliente_zona,
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
        ${cliente_telefono || null}, ${cliente_email || null}, ${cliente_zona || null},
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

export async function PATCH(req: NextRequest) {
  try {
    const { numero, descuento_pct, precio_ofrecido, tipo_precio } = await req.json()
    if (!numero) return NextResponse.json({ error: 'numero requerido' }, { status: 400 })

    const sql = getDb()
    await sql`
      UPDATE presupuestos
      SET
        descuento_pct  = ${descuento_pct ?? null},
        precio_ofrecido = ${precio_ofrecido ?? null},
        tipo_precio    = ${tipo_precio || 'publico'}
      WHERE numero = ${numero}
    `
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('PATCH /api/presupuestos error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')
    const sql = getDb()

    await ensureTable(sql)

    const rows = token
      ? await sql`SELECT * FROM presupuestos WHERE revendedor_token = ${token} ORDER BY created_at DESC LIMIT ${limit}`
      : await sql`SELECT * FROM presupuestos ORDER BY created_at DESC LIMIT ${limit}`

    return NextResponse.json({ ok: true, presupuestos: rows })
  } catch (err: any) {
    console.error('GET /api/presupuestos error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
