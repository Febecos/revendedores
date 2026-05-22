// GET   /api/presupuestos-counter?anio=2026  — obtiene/crea el contador del año
// PATCH /api/presupuestos-counter            — incrementa el contador y devuelve el nuevo número
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const anio = Number(req.nextUrl.searchParams.get('anio') || new Date().getFullYear())
  try {
    const sql = getDb()
    // Upsert: si no existe el año, lo crea con 0
    const rows = await sql`
      INSERT INTO presupuestos_counter (anio, ultimo_numero)
      VALUES (${anio}, 0)
      ON CONFLICT (anio) DO UPDATE SET anio = EXCLUDED.anio
      RETURNING id, ultimo_numero
    `
    return NextResponse.json({ ok: true, id: rows[0].id, ultimo_numero: rows[0].ultimo_numero })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ultimo_numero } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: 'id requerido' }, { status: 400 })
    const sql = getDb()
    await sql`UPDATE presupuestos_counter SET ultimo_numero = ${ultimo_numero} WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
