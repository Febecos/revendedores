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
        sr.id, sr.nombre, sr.apellido, sr.email, sr.whatsapp,
        sr.empresa, sr.provincia, sr.localidad, sr.cuit,
        sr.tipo_revendedor, sr.tipo_usuario, sr.descuento_pct,
        sr.experiencia_anos, sr.experiencia_solar, sr.equipos_mes,
        sr.created_at AS fecha_registro,
        sr.transportista_1_id,
        sr.transportista_2_id,
        c1.name AS transportista_1_nombre,
        c2.name AS transportista_2_nombre
      FROM solicitudes_revendedor sr
      LEFT JOIN logistics.carriers c1 ON c1.id = sr.transportista_1_id
      LEFT JOIN logistics.carriers c2 ON c2.id = sr.transportista_2_id
      WHERE sr.token_acceso = ${token}
        AND sr.token_acceso_activo = true
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
      SELECT id, empresa, provincia, localidad, cuit, whatsapp, transportista_1_id, transportista_2_id
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

    // transportista_X_id: viene como número o null; '' (vacío del form) → null
    const t1Raw = 'transportista_1_id' in body ? body.transportista_1_id : actual.transportista_1_id
    const t2Raw = 'transportista_2_id' in body ? body.transportista_2_id : actual.transportista_2_id
    const transportista_1_id = t1Raw ? Number(t1Raw) : null
    const transportista_2_id = t2Raw ? Number(t2Raw) : null

    // 3. Guardar
    await sql`
      UPDATE solicitudes_revendedor
      SET
        empresa            = ${empresa},
        provincia          = ${provincia},
        localidad          = ${localidad},
        cuit               = ${cuit},
        whatsapp           = ${whatsapp},
        transportista_1_id = ${transportista_1_id},
        transportista_2_id = ${transportista_2_id}
      WHERE token_acceso = ${token}
    `

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[perfil] Error al guardar:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
