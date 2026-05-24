// RUTA TEMPORAL — borrar después de usar
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const SECRET = 'febecos-cleanup-2026'

export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams.get('secret')
  if (s !== SECRET) return NextResponse.json({ error: 'no' }, { status: 401 })

  const email = req.nextUrl.searchParams.get('email') || ''
  const action = req.nextUrl.searchParams.get('action') || 'search'
  const sql = getDb()

  if (action === 'search') {
    const rows = await sql`
      SELECT id, nombre, apellido, email, estado, created_at
      FROM solicitudes_revendedor
      WHERE email ILIKE ${'%' + email + '%'}
      ORDER BY created_at DESC
    `
    return NextResponse.json({ rows })
  }

  if (action === 'delete') {
    const rows = await sql`
      DELETE FROM solicitudes_revendedor
      WHERE email ILIKE ${'%' + email + '%'}
      RETURNING id, nombre, email
    `
    return NextResponse.json({ deleted: rows })
  }

  return NextResponse.json({ error: 'action inválida' })
}
