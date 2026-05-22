// GET /api/verificar-token?token=xxx — valida token de acceso del revendedor
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ ok: false, error: 'token requerido' }, { status: 400 })

  try {
    const sql = getDb()
    const rows = await sql`
      SELECT id, nombre, apellido, empresa, provincia, descuento_pct,
             token_acceso, tipo_usuario, skip_pin
      FROM solicitudes_revendedor
      WHERE token_acceso = ${token}
        AND token_acceso_activo = true
      LIMIT 1
    `
    if (!rows.length) return NextResponse.json({ ok: false, error: 'token_invalido' })
    return NextResponse.json({ ok: true, revendedor: rows[0] })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
