import { NextRequest, NextResponse } from 'next/server'

// GET /api/cuit-lookup?cuit=XXXXXXXXXXX
// Consulta el padrón ARCA/AFIP reutilizando el endpoint del selector
// (action=consultar_cuit), que usa credenciales reales (cert/key) y SÍ funciona.
// El endpoint público directo de AFIP (sr-padron/v2) quedó muerto (404).
export async function GET(req: NextRequest) {
  const cuit = req.nextUrl.searchParams.get('cuit')?.replace(/[-\s]/g, '')
  if (!cuit || !/^\d{11}$/.test(cuit)) {
    return NextResponse.json({ error: 'CUIT inválido' }, { status: 400 })
  }

  try {
    const r = await fetch(`https://febecos.com/api/admin?action=consultar_cuit&cuit=${cuit}`, {
      signal: AbortSignal.timeout(9000),
    })
    const d = await r.json().catch(() => ({} as any))
    if (!r.ok || d?.ok === false || (!d?.denominacion && !d?.razonSocial)) {
      return NextResponse.json({ error: d?.error || 'No encontrado' }, { status: 404 })
    }
    const dom = d.domicilio || {}
    return NextResponse.json({
      denominacion: d.denominacion || null,   // nombre completo o razón social
      razonSocial: d.razonSocial || null,     // empresa (null si persona física)
      tipoPersona: d.tipoPersona || null,
      tipo: d.tipoPersona || null,            // compat con el front anterior
      provincia: dom.provincia || null,
      localidad: dom.localidad || null,
      domicilio: dom.direccion || null,
      codPostal: dom.codPostal || null,
      // La constancia básica (A13) NO expone IVA/Monotributo → suele venir null.
      // Se incluye por si el endpoint lo expone a futuro; si no, el vendedor la elige.
      condicionFiscal: d.condicionFiscal || null,
    })
  } catch {
    return NextResponse.json({ error: 'Error consultando ARCA' }, { status: 500 })
  }
}
