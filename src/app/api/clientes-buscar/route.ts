import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET /api/clientes-buscar?q=texto
// Solo para uso interno. Busca por nombre/apellido/razón social/teléfono/email/CUIT
// EXCLUSIVAMENTE en el CRM central (tabla `clientes`) — fuente ÚNICA de la identidad
// del cliente. (Antes mezclaba copias de `presupuestos`, que traían datos viejos /
// divergentes; eso se eliminó para que el cotizador siempre tome el dato del CRM.)
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ clientes: [] })

  try {
    const sql = getDb()
    const term = `%${q}%`
    const digits = q.replace(/\D/g, '')

    const clientes = await sql`
      SELECT nombre, apellido, whatsapp AS telefono, email,
             provincia AS zona, razon_social, cuit, 0 AS descuento
      FROM clientes
      WHERE (crm_eliminado IS NULL OR crm_eliminado = false)
        AND (
          nombre ILIKE ${term} OR apellido ILIKE ${term} OR razon_social ILIKE ${term}
          OR email ILIKE ${term} OR cuit ILIKE ${term}
          OR (${digits} <> '' AND regexp_replace(coalesce(whatsapp,''),'\D','','g') ILIKE ${'%' + digits + '%'})
        )
      ORDER BY ultimo_contacto_at DESC NULLS LAST
      LIMIT 12`

    return NextResponse.json({ clientes })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
