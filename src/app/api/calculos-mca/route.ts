// POST  /api/calculos-mca  — crea un cálculo MCA en Neon
// PATCH /api/calculos-mca  — actualiza bomba sugerida / litros / caudal de un cálculo
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const sql = getDb()
    const rows = await sql`
      INSERT INTO calculos_mca (
        tipo_instalacion, diametro, material, longitud_total_m, caudal_m3h,
        litros_dia, mca_total, perdida_friccion_m, origen,
        revendedor_token, revendedor_nombre,
        bomba_sugerida, zona, provincia
      ) VALUES (
        ${body.tipo_instalacion || null},
        ${body.diametro || null},
        ${body.material || null},
        ${body.longitud_total_m || null},
        ${body.caudal_m3h || null},
        ${body.litros_dia || null},
        ${body.mca_total || null},
        ${body.perdida_friccion_m || null},
        ${body.origen || 'portal_revendedor'},
        ${body.revendedor_token || null},
        ${body.revendedor_nombre || null},
        ${body.bomba_sugerida || null},
        ${body.zona || null},
        ${body.provincia || null}
      )
      RETURNING id
    `
    return NextResponse.json({ ok: true, id: rows[0]?.id }, { headers: CORS })
  } catch (err: any) {
    console.error('[calculos-mca POST]', err.message)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500, headers: CORS })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...fields } = body
    if (!id) return NextResponse.json({ ok: false, error: 'id requerido' }, { status: 400, headers: CORS })

    const sql = getDb()

    // Solo actualiza los campos que vienen en el body
    if (fields.bomba_sugerida !== undefined) {
      await sql`
        UPDATE calculos_mca SET
          bomba_sugerida    = ${fields.bomba_sugerida || null},
          litros_dia        = COALESCE(${fields.litros_dia || null}, litros_dia),
          caudal_m3h        = COALESCE(${fields.caudal_m3h || null}, caudal_m3h),
          caudal_verano     = COALESCE(${fields.caudal_verano || null}, caudal_verano),
          caudal_invierno   = COALESCE(${fields.caudal_invierno || null}, caudal_invierno),
          zona              = COALESCE(${fields.zona ?? null}, zona)
        WHERE id = ${id}
      `
    }

    return NextResponse.json({ ok: true }, { headers: CORS })
  } catch (err: any) {
    console.error('[calculos-mca PATCH]', err.message)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500, headers: CORS })
  }
}
