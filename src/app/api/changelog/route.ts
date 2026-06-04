// GET  /api/changelog?dias=30&key=GUARD  → entradas visibles del período
// POST /api/changelog                    → crear nueva entrada (key en body)
// PATCH /api/changelog                   → editar entrada (key en body)
// DELETE /api/changelog?id=X&key=GUARD  → ocultar entrada
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const GUARD = process.env.RECORDATORIO_KEY || 'f0d9811cd021923ba50d50b1'

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('key') !== GUARD) {
    return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  }
  const dias = parseInt(req.nextUrl.searchParams.get('dias') || '30')
  const sql = getDb()
  const rows = await sql`
    SELECT id, fecha, titulo, descripcion, tipo, visible
    FROM plataforma_changelog
    WHERE visible = true
      AND fecha > NOW() - (${dias} || ' days')::INTERVAL
    ORDER BY fecha DESC
  `
  return NextResponse.json({ ok: true, entradas: rows })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (body.key !== GUARD) {
    return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  }
  const { titulo, descripcion, tipo = 'mejora', fecha } = body
  if (!titulo) return NextResponse.json({ ok: false, error: 'titulo requerido' }, { status: 400 })

  const sql = getDb()
  const rows = await sql`
    INSERT INTO plataforma_changelog (titulo, descripcion, tipo, fecha)
    VALUES (
      ${titulo},
      ${descripcion || null},
      ${['mejora','novedad','fix','importante'].includes(tipo) ? tipo : 'mejora'},
      ${fecha ? new Date(fecha) : new Date()}
    )
    RETURNING id, fecha, titulo, descripcion, tipo, visible
  `
  return NextResponse.json({ ok: true, entrada: rows[0] })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  if (body.key !== GUARD) {
    return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  }
  const { id, titulo, descripcion, tipo, visible, fecha } = body
  if (!id) return NextResponse.json({ ok: false, error: 'id requerido' }, { status: 400 })

  const sql = getDb()
  await sql`
    UPDATE plataforma_changelog SET
      titulo      = COALESCE(${titulo || null}, titulo),
      descripcion = COALESCE(${descripcion !== undefined ? descripcion : null}, descripcion),
      tipo        = COALESCE(${tipo || null}, tipo),
      visible     = COALESCE(${visible !== undefined ? visible : null}, visible),
      fecha       = COALESCE(${fecha ? new Date(fecha) : null}, fecha)
    WHERE id = ${id}
  `
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (req.nextUrl.searchParams.get('key') !== GUARD) {
    return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  }
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ ok: false, error: 'id requerido' }, { status: 400 })

  const sql = getDb()
  await sql`UPDATE plataforma_changelog SET visible = false WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
