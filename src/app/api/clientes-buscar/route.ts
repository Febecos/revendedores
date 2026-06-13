import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET /api/clientes-buscar?q=texto
// Solo para uso interno (el buscador "Buscar cliente existente" está gateado a
// vendedores internos). Busca por nombre/apellido/razón social/teléfono/email/CUIT
// en DOS fuentes: el CRM central (tabla clientes, incluye contactos de Febo Rev /
// WhatsApp / cursos) y los presupuestos ya cotizados (que además traen descuento).
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ clientes: [] })

  try {
    const sql = getDb()
    const term = `%${q}%`

    // 1) CRM central — todos los contactos (Febo Rev, WhatsApp, cursos, etc.)
    let desdeCrm: any[] = []
    try {
      desdeCrm = await sql`
        SELECT nombre, apellido, whatsapp AS telefono, email,
               provincia AS zona, razon_social, cuit, 0 AS descuento
        FROM clientes
        WHERE (
          nombre ILIKE ${term} OR apellido ILIKE ${term} OR razon_social ILIKE ${term}
          OR whatsapp ILIKE ${term} OR email ILIKE ${term} OR cuit ILIKE ${term}
        )
        ORDER BY ultimo_contacto_at DESC NULLS LAST
        LIMIT 10`
    } catch { /* si la tabla/columna no existe, seguimos con presupuestos */ }

    // 2) Presupuestos ya cotizados (traen el descuento usado)
    const desdePres = await sql`
      SELECT DISTINCT ON (coalesce(nullif(cliente_telefono,''), cliente_nombre || cliente_apellido))
        cliente_nombre       AS nombre,
        cliente_apellido     AS apellido,
        cliente_telefono     AS telefono,
        cliente_email        AS email,
        cliente_zona         AS zona,
        cliente_razon_social AS razon_social,
        cliente_cuit         AS cuit,
        descuento_pct        AS descuento
      FROM presupuestos
      WHERE
        cliente_nombre IS NOT NULL
        AND (
          cliente_nombre       ILIKE ${term}
          OR cliente_apellido  ILIKE ${term}
          OR cliente_razon_social ILIKE ${term}
          OR cliente_telefono  ILIKE ${term}
          OR cliente_cuit      ILIKE ${term}
        )
      ORDER BY coalesce(nullif(cliente_telefono,''), cliente_nombre || cliente_apellido), created_at DESC
      LIMIT 10`

    // Merge + dedupe. Clave: CUIT → teléfono → email → nombre+apellido.
    // Prioriza la entrada de presupuestos (trae descuento real).
    const norm = (s: any) => String(s ?? '').replace(/\D/g, '') || String(s ?? '').trim().toLowerCase()
    const keyOf = (c: any) =>
      (c.cuit && norm(c.cuit)) ||
      (c.telefono && norm(c.telefono)) ||
      (c.email && String(c.email).trim().toLowerCase()) ||
      `${c.nombre || ''}|${c.apellido || ''}`.toLowerCase()

    const map = new Map<string, any>()
    for (const c of [...desdePres, ...desdeCrm]) {
      const k = keyOf(c)
      if (!map.has(k)) map.set(k, c)
    }
    const clientes = Array.from(map.values()).slice(0, 10)

    return NextResponse.json({ clientes })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
