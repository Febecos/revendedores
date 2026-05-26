// POST /api/presupuestos-counter  — incrementa atómicamente y devuelve el nuevo número
// (reemplaza el viejo GET + PATCH no-atómico por un solo POST atómico)
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const anio = new Date().getFullYear()
    const sql = getDb()
    // Upsert + incremento atómico en una sola query
    const rows = await sql`
      INSERT INTO presupuestos_counter (anio, ultimo_numero)
      VALUES (${anio}, 1)
      ON CONFLICT (anio) DO UPDATE
        SET ultimo_numero = presupuestos_counter.ultimo_numero + 1
      RETURNING ultimo_numero
    `
    const num = Number(rows[0].ultimo_numero)
    return NextResponse.json({
      ok: true,
      numero: `PREV-${anio}-${String(num).padStart(4, '0')}`,
      ultimo_numero: num,
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

// GET kept for backward compat (dashboard admin usa este endpoint para mostrar el último número)
export async function GET(req: NextRequest) {
  const anio = Number(req.nextUrl.searchParams.get('anio') || new Date().getFullYear())
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT id, ultimo_numero FROM presupuestos_counter WHERE anio = ${anio} LIMIT 1
    `
    return NextResponse.json({
      ok: true,
      id: rows[0]?.id ?? null,
      ultimo_numero: rows[0]?.ultimo_numero ?? 0,
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
