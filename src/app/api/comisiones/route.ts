import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// Lee los tramos de comisión para revendedores externos desde Neon DB.
// La landing /unirse consume este endpoint para mostrar los niveles actualizados.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT nivel, desde_monto, hasta_monto, porcentaje
      FROM comisiones_tramos
      WHERE tipo = 'externo' AND activo = true
      ORDER BY desde_monto ASC
    `
    return NextResponse.json(
      { ok: true, tramos: rows },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
