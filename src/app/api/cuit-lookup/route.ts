import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const cuit = req.nextUrl.searchParams.get('cuit')?.replace(/[-\s]/g, '')
  if (!cuit || !/^\d{11}$/.test(cuit)) {
    return NextResponse.json({ error: 'CUIT inválido' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://soa.afip.gob.ar/sr-padron/v2/persona/${cuit}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    const data = await res.json()
    const p = data?.data
    if (!p) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    const razonSocial: string =
      p.razonSocial ||
      [p.apellido, p.nombre].filter(Boolean).join(', ') ||
      ''

    return NextResponse.json({ razonSocial, tipo: p.tipoPersona || null })
  } catch {
    return NextResponse.json({ error: 'Error consultando ARCA' }, { status: 500 })
  }
}
