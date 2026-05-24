import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// Crear tabla si no existe (se ejecuta en el primer POST)
const CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS presupuestos (
  id                SERIAL PRIMARY KEY,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  numero            TEXT NOT NULL,                -- ej: PREV-2026-0012
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
  tipo_precio       TEXT DEFAULT 'mayorista',     -- 'mayorista' | 'publico'
  precio_publico    NUMERIC,
  precio_ofrecido   NUMERIC,
  descuento_pct     NUMERIC,
  cliente_nombre    TEXT,
  cliente_apellido  TEXT,
  cliente_telefono  TEXT,                         -- KEY para atribución futura
  cliente_zona      TEXT,
  estado            TEXT DEFAULT 'emitido'        -- 'emitido' | 'convertido' | 'perdido'
);
`

let tableReady = false

async function ensureTable(client: any) {
  if (!tableReady) {
    await client.query(CREATE_TABLE)
    tableReady = true
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      numero,
      revendedor_token,
      revendedor_nombre,
      revendedor_email,
      bomba_codigo,
      bomba_descripcion,
      bomba_watts,
      bomba_marca,
      litros_dia,
      altura_m,
      longitud_total_m,
      tipo_precio,
      precio_publico,
      precio_ofrecido,
      descuento_pct,
      cliente_nombre,
      cliente_apellido,
      cliente_telefono,
      cliente_zona,
    } = body

    if (!numero) {
      return NextResponse.json({ error: 'numero requerido' }, { status: 400 })
    }

    const client = await pool.connect()
    try {
      await ensureTable(client)
      const res = await client.query(
        `INSERT INTO presupuestos (
          numero, revendedor_token, revendedor_nombre, revendedor_email,
          bomba_codigo, bomba_descripcion, bomba_watts, bomba_marca,
          litros_dia, altura_m, longitud_total_m,
          tipo_precio, precio_publico, precio_ofrecido, descuento_pct,
          cliente_nombre, cliente_apellido, cliente_telefono, cliente_zona
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
        RETURNING id, numero, created_at`,
        [
          numero,
          revendedor_token || null,
          revendedor_nombre || null,
          revendedor_email || null,
          bomba_codigo || null,
          bomba_descripcion || null,
          bomba_watts || null,
          bomba_marca || null,
          litros_dia || null,
          altura_m || null,
          longitud_total_m || null,
          tipo_precio || 'mayorista',
          precio_publico || null,
          precio_ofrecido || null,
          descuento_pct || null,
          cliente_nombre || null,
          cliente_apellido || null,
          cliente_telefono || null,
          cliente_zona || null,
        ]
      )
      return NextResponse.json({ ok: true, presupuesto: res.rows[0] })
    } finally {
      client.release()
    }
  } catch (err: any) {
    console.error('POST /api/presupuestos error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const limit = parseInt(searchParams.get('limit') || '50')

    const client = await pool.connect()
    try {
      await ensureTable(client)
      let query = `SELECT * FROM presupuestos`
      const params: any[] = []
      if (token) {
        query += ` WHERE revendedor_token = $1`
        params.push(token)
      }
      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`
      params.push(limit)
      const res = await client.query(query, params)
      return NextResponse.json({ ok: true, presupuestos: res.rows })
    } finally {
      client.release()
    }
  } catch (err: any) {
    console.error('GET /api/presupuestos error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
