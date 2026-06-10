import { NextResponse } from 'next/server'
import { checkAdminPassword, createSessionToken, ADMIN_COOKIE_NAME, ADMIN_COOKIE_MAX_AGE } from '@/lib/admin-auth'

export async function POST(req: Request) {
  let password = ''
  try {
    const body = await req.json()
    password = typeof body?.password === 'string' ? body.password : ''
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  if (!checkAdminPassword(password)) {
    return NextResponse.json({ ok: false, error: 'Credenciales inválidas' }, { status: 401 })
  }

  const token = createSessionToken()
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Auth no configurada' }, { status: 500 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_COOKIE_MAX_AGE,
  })
  return res
}
