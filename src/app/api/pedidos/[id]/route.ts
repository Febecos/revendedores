// PATCH /api/pedidos/[id] — actualiza estado y campos del pedido (admin)
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await req.json()
    const { estado, notas_admin, mp_preference_id, mp_payment_id } = body

    if (!id) return NextResponse.json({ ok: false, error: 'id requerido' }, { status: 400 })

    const sql = getDb()
    await sql`
      UPDATE pedidos SET
        estado            = COALESCE(${estado || null}, estado),
        notas_admin       = COALESCE(${notas_admin || null}, notas_admin),
        mp_preference_id  = COALESCE(${mp_preference_id || null}, mp_preference_id),
        mp_payment_id     = COALESCE(${mp_payment_id || null}, mp_payment_id),
        updated_at        = NOW()
      WHERE id = ${id}
    `
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[pedidos PATCH]', err.message)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
