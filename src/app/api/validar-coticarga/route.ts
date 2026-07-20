import { NextRequest, NextResponse } from 'next/server'

// GET /api/validar-coticarga?token=xxx
// Proxy SERVER-SIDE hacia el endpoint de COTICARGA (fuente única de la validación —
// evita leer instalador_coticarga por nuestra cuenta, [[trampa-dos-caminos-duplicados]]).
// Solo controla la VISIBILIDAD del botón; el acceso real lo re-valida COTICARGA en
// cada entrada con este mismo endpoint. Sin secret (no expone datos sensibles: solo
// devuelve si el token puede o no cotizar cargadores).
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ ok: false, habilitado: false }, { status: 400 })
  try {
    const r = await fetch(`https://febecos.com/api/admin?action=validar_rev_coticarga&token=${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(6000),
    })
    return NextResponse.json({ ok: true, habilitado: r.ok })
  } catch {
    // Sin conexión al validador → no mostrar el botón (fail-closed en la UX).
    return NextResponse.json({ ok: true, habilitado: false })
  }
}
