import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// Endpoint de uso único: borra el duplicado PREV-2026-0119 (el id más alto)
// Requiere header X-Admin-Key para evitar ejecución accidental
export async function POST(req: NextRequest) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { numero } = await req.json().catch(() => ({}))
  if (!numero) return NextResponse.json({ error: 'numero requerido' }, { status: 400 })

  const sql = getDb()

  // Ver cuántos duplicados hay
  const dupes = await sql`
    SELECT id, created_at, cliente_nombre FROM presupuestos
    WHERE numero = ${numero}
    ORDER BY id ASC
  `

  if (dupes.length < 2) {
    return NextResponse.json({ ok: true, message: 'No hay duplicados', rows: dupes })
  }

  // Borrar todos excepto el primero (id más bajo = el original)
  const idsToDelete = dupes.slice(1).map((r: any) => r.id)
  await sql`DELETE FROM presupuestos WHERE id = ANY(${idsToDelete})`

  return NextResponse.json({ ok: true, deleted: idsToDelete, kept: dupes[0] })
}
