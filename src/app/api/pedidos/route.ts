// POST /api/pedidos — crea un nuevo pedido (estado: pendiente_aprobacion) + notifica tienda@febecos.com
// GET  /api/pedidos — lista todos los pedidos (admin), soporta ?estado=xxx&limit=50
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('es-AR')
}

const METODO_LABEL: Record<string, string> = {
  transferencia: '🏦 Transferencia bancaria',
  nave:          '📅 6 cuotas NAVE',
  mercadopago:   '💳 Mercado Pago',
}
const TIPO_LABEL: Record<string, string> = {
  revendedor:    '👤 Revendedor (precio mayorista)',
  cliente_final: '🧑 Cliente final (precio público)',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      revendedor_id, revendedor_nombre, revendedor_email, revendedor_token,
      bomba_codigo, bomba_descripcion, litros_dia, altura_m,
      precio_publico, precio_final, descuento_pct,
      tipo_comprador, metodo_pago, notas_cliente
    } = body

    if (!bomba_codigo || !precio_publico || !precio_final || !metodo_pago) {
      return NextResponse.json({ ok: false, error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const sql = getDb()
    const rows = await sql`
      INSERT INTO pedidos (
        revendedor_id, revendedor_nombre, revendedor_email, revendedor_token,
        bomba_codigo, bomba_descripcion, litros_dia, altura_m,
        precio_publico, precio_final, descuento_pct,
        tipo_comprador, metodo_pago, notas_cliente,
        estado
      ) VALUES (
        ${revendedor_id || null},
        ${revendedor_nombre || null},
        ${revendedor_email || null},
        ${revendedor_token || null},
        ${bomba_codigo},
        ${bomba_descripcion || null},
        ${litros_dia || null},
        ${altura_m || null},
        ${precio_publico},
        ${precio_final},
        ${descuento_pct || 0},
        ${tipo_comprador || 'cliente_final'},
        ${metodo_pago},
        ${notas_cliente || null},
        'pendiente_aprobacion'
      )
      RETURNING id, created_at
    `

    const pedidoId = rows[0].id
    const fechaStr = new Date(rows[0].created_at).toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

    // ── Notificación email a tienda@febecos.com ──────────────────────────────
    try {
      await transporter.sendMail({
        from: `Febecos Portal <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: 'tienda@febecos.com',
        subject: `🛒 Nuevo pedido — ${bomba_codigo} — ${METODO_LABEL[metodo_pago] || metodo_pago}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#f7f9fc;padding:24px">
            <div style="background:#fff;border-radius:12px;padding:28px 32px;box-shadow:0 2px 8px rgba(0,0,0,0.07)">

              <h2 style="color:#1a6b3c;margin:0 0 4px">🛒 Nuevo pedido recibido</h2>
              <p style="color:#888;font-size:13px;margin:0 0 24px">${fechaStr} · ID: ${pedidoId}</p>

              <table style="width:100%;border-collapse:collapse;font-size:14px">
                <tr style="border-bottom:1px solid #eee">
                  <td style="padding:10px 0;color:#666;width:40%">Bomba</td>
                  <td style="padding:10px 0;font-weight:700;color:#1a1a18">${bomba_codigo}</td>
                </tr>
                ${bomba_descripcion ? `<tr style="border-bottom:1px solid #eee">
                  <td style="padding:10px 0;color:#666">Descripción</td>
                  <td style="padding:10px 0;color:#333">${bomba_descripcion}</td>
                </tr>` : ''}
                <tr style="border-bottom:1px solid #eee">
                  <td style="padding:10px 0;color:#666">Revendedor</td>
                  <td style="padding:10px 0;font-weight:600">${revendedor_nombre || '—'}${revendedor_email ? `<br><span style="font-weight:400;color:#666;font-size:12px">${revendedor_email}</span>` : ''}</td>
                </tr>
                <tr style="border-bottom:1px solid #eee">
                  <td style="padding:10px 0;color:#666">Tipo</td>
                  <td style="padding:10px 0">${TIPO_LABEL[tipo_comprador] || tipo_comprador}</td>
                </tr>
                <tr style="border-bottom:1px solid #eee">
                  <td style="padding:10px 0;color:#666">Método de pago</td>
                  <td style="padding:10px 0;font-weight:600">${METODO_LABEL[metodo_pago] || metodo_pago}</td>
                </tr>
                <tr style="border-bottom:1px solid #eee">
                  <td style="padding:10px 0;color:#666">Precio público</td>
                  <td style="padding:10px 0;color:#666">${fmt(precio_publico)}</td>
                </tr>
                <tr style="border-bottom:1px solid #eee">
                  <td style="padding:10px 0;color:#666">Precio a cobrar</td>
                  <td style="padding:10px 0;font-size:18px;font-weight:800;color:#1a6b3c">${fmt(precio_final)}${descuento_pct ? ` <span style="font-size:12px;color:#888;font-weight:400">(${descuento_pct}% OFF)</span>` : ''}</td>
                </tr>
                ${litros_dia || altura_m ? `<tr style="border-bottom:1px solid #eee">
                  <td style="padding:10px 0;color:#666">Instalación</td>
                  <td style="padding:10px 0;font-size:12px;color:#555">${litros_dia ? litros_dia + ' L/día' : ''} ${altura_m ? '· ' + altura_m + 'm altura' : ''}</td>
                </tr>` : ''}
                ${notas_cliente ? `<tr>
                  <td style="padding:10px 0;color:#666">Notas</td>
                  <td style="padding:10px 0;font-size:13px;color:#333">${notas_cliente}</td>
                </tr>` : ''}
              </table>

              <div style="margin-top:24px;padding:16px;background:#fff8e1;border-left:4px solid #f59e0b;border-radius:4px;font-size:13px;color:#856404">
                <strong>⚠️ Acción requerida:</strong> Este pedido está <strong>pendiente de aprobación</strong>. Verificá el stock y aprobalo desde el panel de administración.
              </div>

              <div style="margin-top:20px;text-align:center">
                <a href="https://selector.febecos.com/admin.html#pedidos"
                   style="display:inline-block;padding:14px 28px;background:#1a6b3c;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
                  Ver en el Admin →
                </a>
              </div>

              <p style="color:#aaa;font-size:11px;margin-top:24px;text-align:center">
                Febecos · tienda@febecos.com · Este email es automático, no responder.
              </p>
            </div>
          </div>
        `,
      })
    } catch (emailErr: any) {
      // El pedido ya está guardado — no fallar por email
      console.error('[pedidos POST] email error:', emailErr.message)
    }

    return NextResponse.json({ ok: true, id: pedidoId, created_at: rows[0].created_at })
  } catch (err: any) {
    console.error('[pedidos POST]', err.message)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const estado = req.nextUrl.searchParams.get('estado')
    const limit = Number(req.nextUrl.searchParams.get('limit') || 100)
    const sql = getDb()

    const rows = estado
      ? await sql`SELECT * FROM pedidos WHERE estado = ${estado} ORDER BY created_at DESC LIMIT ${limit}`
      : await sql`SELECT * FROM pedidos ORDER BY created_at DESC LIMIT ${limit}`

    return NextResponse.json({ ok: true, pedidos: rows })
  } catch (err: any) {
    console.error('[pedidos GET]', err.message)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
