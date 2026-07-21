// GET /api/verificar-token?token=xxx — valida token de acceso del revendedor
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ ok: false, error: 'token requerido' }, { status: 400 })

  try {
    const sql = getDb()
    // La columna pin_reset puede no existir todavía (la crea el admin al primer
    // reset). Garantizamos su existencia (idempotente) para que el SELECT no rompa
    // el login de los revendedores.
    await sql`ALTER TABLE solicitudes_revendedor ADD COLUMN IF NOT EXISTS pin_reset BOOLEAN DEFAULT false`.catch(() => {})
    const rows = await sql`
      SELECT id, nombre, apellido, empresa, provincia, descuento_pct,
             token_acceso, tipo_usuario, skip_pin, puede_pedir_online,
             cuit, domicilio, puede_cotizar_con_marca, logo_base64, email,
             puede_ver_fv, pin_reset
      FROM solicitudes_revendedor
      WHERE token_acceso = ${token}
        AND token_acceso_activo = true
        AND COALESCE(estado, 'pendiente') <> 'eliminado'
      LIMIT 1
    `
    if (!rows.length) return NextResponse.json({ ok: false, error: 'token_invalido' })

    // pin_reset es one-shot: si el admin lo activó, lo devolvemos una vez y lo
    // consumimos (false) acá mismo, así el portal borra el PIN viejo y pide uno
    // nuevo solo esta vez.
    if (rows[0].pin_reset) {
      await sql`UPDATE solicitudes_revendedor SET pin_reset = false WHERE id = ${rows[0].id}`.catch(() => {})
    }

    return NextResponse.json({ ok: true, revendedor: rows[0] })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
