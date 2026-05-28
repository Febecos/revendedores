// GET  /api/perfil?token=xxx  — devuelve datos del perfil del revendedor
// POST /api/perfil             — actualiza campos permitidos del perfil
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ ok: false, error: 'token requerido' }, { status: 400 })

  try {
    const sql = getDb()
    const rows = await sql`
      SELECT
        id, nombre, apellido, email, whatsapp,
        empresa, provincia, localidad, cuit,
        tipo_revendedor, tipo_usuario, descuento_pct,
        experiencia_anos, experiencia_solar, equipos_mes,
        created_at AS fecha_registro
      FROM solicitudes_revendedor
      WHERE token_acceso = ${token}
        AND token_acceso_activo = true
      LIMIT 1
    `
    if (!rows.length) return NextResponse.json({ ok: false, error: 'token_invalido' }, { status: 401 })
    return NextResponse.json({ ok: true, perfil: rows[0] })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token } = body

    if (!token) return NextResponse.json({ ok: false, error: 'token requerido' }, { status: 400 })

    const sql = getDb()

    // 1. Verificar token y traer valores actuales
    const rows = await sql`
      SELECT id, empresa, provincia, localidad, cuit, whatsapp
      FROM solicitudes_revendedor
      WHERE token_acceso = ${token} AND token_acceso_activo = true
      LIMIT 1
    `
    if (!rows.length) return NextResponse.json({ ok: false, error: 'token_invalido' }, { status: 401 })

    const actual = rows[0]

    // 2. Merge: sólo los campos editables; si no viene en el body, queda el actual
    const empresa   = 'empresa'   in body ? (body.empresa   || null) : actual.empresa
    const provincia = 'provincia' in body ? (body.provincia || null) : actual.provincia
    const localidad = 'localidad' in body ? (body.localidad || null) : actual.localidad
    const cuit      = 'cuit'      in body ? (body.cuit      || null) : actual.cuit
    const whatsapp  = 'whatsapp'  in body ? (body.whatsapp  || null) : actual.whatsapp

    // 3. Guardar
    await sql`
      UPDATE solicitudes_revendedor
      SET
        empresa   = ${empresa},
        provincia = ${provincia},
        localidad = ${localidad},
        cuit      = ${cuit},
        whatsapp  = ${whatsapp}
      WHERE token_acceso = ${token}
    `

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[perfil] Error al guardar:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
