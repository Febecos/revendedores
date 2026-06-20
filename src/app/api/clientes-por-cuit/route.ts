import { NextRequest, NextResponse } from 'next/server'

// GET /api/clientes-por-cuit?cuit=XXXXXXXXXXX
// Proxy SERVER-SIDE al CRM central (action=clientes_por_cuit). Devuelve si el CUIT
// ya existe en el CRM y la lista de CONTACTOS relacionados (un mismo CUIT puede tener
// varios contactos: distintos nombre/email/whatsapp). Se usa SOLO para "¿existe?" +
// elegir/crear contacto — la razón social autoritativa la trae ARCA (cuit-lookup).
//
// Requiere INTERNAL_SERVICE_SECRET (env de servidor) → por eso es server-side: el
// navegador NO puede mandar el secret.
export async function GET(req: NextRequest) {
  const cuit = req.nextUrl.searchParams.get('cuit')?.replace(/\D/g, '')
  if (!cuit || !/^\d{11}$/.test(cuit)) {
    return NextResponse.json({ ok: false, error: 'CUIT inválido' }, { status: 400 })
  }
  try {
    const r = await fetch(`https://febecos.com/api/admin?action=clientes_por_cuit&cuit=${cuit}`, {
      headers: { 'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_SECRET || ''}` },
      signal: AbortSignal.timeout(9000),
    })
    const d = await r.json().catch(() => ({} as any))
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: d?.error || `CRM ${r.status}` }, { status: 502 })
    }
    return NextResponse.json({
      ok: true,
      existe: !!d?.existe,
      contactos: Array.isArray(d?.contactos) ? d.contactos : [],
      razon_social: d?.razon_social || null,
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Error consultando CRM' }, { status: 500 })
  }
}
