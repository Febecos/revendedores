import { NextResponse, type NextRequest } from 'next/server'

// Redirige los links de presupuestos que ya se compartieron con el dominio
// "revendedores" hacia el dominio neutro coti.febecos.com (oculta el dominio
// viejo al cliente final). La app se sirve igual en ambos dominios.
// El matcher limita el middleware SOLO a /p/* → el portal/login no se toca.
// En coti (u otros hosts) no hace nada → sin loop de redirección.
export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || ''
  if (host === 'revendedores.febecos.com') {
    const dest = new URL(req.nextUrl.pathname + req.nextUrl.search, 'https://coti.febecos.com')
    return NextResponse.redirect(dest, 308)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/p/:path*'],
}
