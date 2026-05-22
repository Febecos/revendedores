// POST /api/mp-preference — crea preferencia de pago en Mercado Pago
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { monto, titulo, token } = await req.json()
    if (!monto || !titulo) {
      return NextResponse.json({ ok: false, error: 'monto y titulo requeridos' }, { status: 400 })
    }

    const accessToken = process.env.MP_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: 'MP_ACCESS_TOKEN no configurado' }, { status: 500 })
    }

    const baseUrl = 'https://revendedores-six.vercel.app'
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : ''

    const body = {
      items: [
        {
          title: titulo,
          quantity: 1,
          unit_price: Math.round(monto),
          currency_id: 'ARS',
        },
      ],
      back_urls: {
        success: `${baseUrl}/portal?pago=ok${tokenParam}`,
        failure: `${baseUrl}/portal?pago=error${tokenParam}`,
        pending: `${baseUrl}/portal?pago=pendiente${tokenParam}`,
      },
      auto_return: 'approved',
      statement_descriptor: 'FEBECOS SOLAR',
      external_reference: `portal-${Date.now()}`,
    }

    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[mp-preference]', data)
      return NextResponse.json({ ok: false, error: data.message || 'Error MP' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, init_point: data.init_point })
  } catch (err: any) {
    console.error('[mp-preference]', err.message)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
