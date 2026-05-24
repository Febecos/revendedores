// POST /api/propuesta-email
// Envía propuesta comercial al lead + notificación al administrador.
// Llamado desde FormularioWA.tsx en ambos flujos (WA y demo).

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

function htmlPropuesta(nombre: string): string {
  const primerNombre = nombre.split(' ')[0] || nombre
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Propuesta Revendedores – Febecos</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f0f4f8; font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a2a3a; }
    .wrap { max-width: 640px; margin: 0 auto; }
    .header { background: #003d72; padding: 36px 40px 28px; text-align: center; }
    .header img { height: 36px; margin-bottom: 16px; }
    .header h1 { color: #ffffff; font-size: 22px; font-weight: 800; line-height: 1.35; letter-spacing: -.3px; }
    .header p  { color: rgba(255,255,255,.75); font-size: 14px; margin-top: 8px; }
    .hook { background: #a8c61b; padding: 22px 40px; text-align: center; }
    .hook p { color: #003d72; font-size: 17px; font-weight: 800; line-height: 1.45; }
    .body { background: #ffffff; padding: 36px 40px; }
    .greeting { font-size: 16px; line-height: 1.7; color: #2d3f55; margin-bottom: 28px; }
    .greeting strong { color: #003d72; }
    h2 { font-size: 16px; font-weight: 800; color: #003d72; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 2px solid #e8edf2; text-transform: uppercase; letter-spacing: .05em; }
    .margin-table { width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 14px; }
    .margin-table th { background: #003d72; color: rgba(255,255,255,.85); padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; }
    .margin-table td { padding: 11px 14px; border-bottom: 1px solid #e8edf2; color: #2d3f55; }
    .margin-table tr:nth-child(even) td { background: #f7f9fc; }
    .margin-table .num { font-weight: 800; color: #1a6b35; font-size: 15px; }
    .vol-table { width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 14px; }
    .vol-table th { background: #1a6b35; color: rgba(255,255,255,.9); padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; }
    .vol-table td { padding: 10px 14px; border-bottom: 1px solid #e8edf2; }
    .vol-table tr:last-child td { border-bottom: none; }
    .vol-table .nivel { font-weight: 700; color: #003d72; }
    .vol-table .margen { font-weight: 800; color: #1a6b35; font-size: 15px; }
    .beneficios { display: table; width: 100%; margin-bottom: 28px; }
    .ben-row { display: table-row; }
    .ben-icon { display: table-cell; width: 44px; padding: 0 0 16px 0; vertical-align: top; font-size: 24px; }
    .ben-text { display: table-cell; padding: 0 0 16px 12px; vertical-align: top; }
    .ben-text strong { display: block; font-size: 14px; color: #003d72; margin-bottom: 2px; }
    .ben-text span { font-size: 13px; color: #5a6f84; line-height: 1.6; }
    .kit-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px; }
    .kit-item { background: #f0f4f8; border: 1px solid #d6e0ea; border-radius: 6px; padding: 7px 13px; font-size: 13px; font-weight: 600; color: #003d72; }
    .niveles { border-radius: 10px; overflow: hidden; border: 1px solid #d6e0ea; margin-bottom: 28px; }
    .nivel-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 16px; border-bottom: 1px solid #e8edf2; }
    .nivel-row:last-child { border-bottom: none; }
    .nivel-row:nth-child(even) { background: #f7f9fc; }
    .nivel-name { font-size: 13px; font-weight: 700; color: #2d3f55; }
    .nivel-desc { font-size: 12px; color: #5a6f84; }
    .nivel-pct { font-size: 18px; font-weight: 800; color: #003d72; }
    .cta-wrap { text-align: center; padding: 28px 0; }
    .cta-btn { display: inline-block; background: #a8c61b; color: #003d72; padding: 15px 36px; border-radius: 10px; font-weight: 800; font-size: 16px; text-decoration: none; letter-spacing: -.2px; }
    .cta-wa  { display: inline-block; background: #25d366; color: #ffffff; padding: 13px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none; margin-top: 12px; }
    .note { font-size: 12px; color: #7a8fa5; margin-top: 10px; text-align: center; }
    .footer { background: #f0f4f8; padding: 24px 40px; text-align: center; border-top: 1px solid #d6e0ea; }
    .footer p { font-size: 12px; color: #7a8fa5; line-height: 1.7; }
    .footer a { color: #003d72; text-decoration: none; font-weight: 600; }
    @media (max-width: 600px) {
      .header, .hook, .body, .footer { padding-left: 20px; padding-right: 20px; }
    }
  </style>
</head>
<body>
<div class="wrap">

  <!-- HEADER -->
  <div class="header">
    <h1>Programa de Revendedores<br /><span style="color:#a8c61b;">Bombas Solares Febecos</span></h1>
    <p>Propuesta comercial exclusiva · Acceso a precios mayoristas</p>
  </div>

  <!-- HOOK -->
  <div class="hook">
    <p>¿Cuánto dejaste de ganar el último mes?<br />
    Hay instaladores en tu zona generando <strong>$400.000–$800.000 de margen mensual.</strong></p>
  </div>

  <!-- CUERPO -->
  <div class="body">

    <p class="greeting">
      Hola <strong>${primerNombre}</strong>, gracias por tu interés en el Programa de Revendedores Febecos.<br /><br />
      Te enviamos la propuesta completa con todos los números para que evalúes si tiene sentido para tu negocio.
      <strong>Spoiler: la demanda ya existe. Lo que falta es quien llegue primero con la solución.</strong>
    </p>

    <!-- MÁRGENES -->
    <h2>💰 Ejemplo de margen real — Kit 3" 300W</h2>
    <table class="margin-table">
      <thead>
        <tr>
          <th>Nivel</th>
          <th>Precio de compra</th>
          <th>Precio cliente final</th>
          <th>Margen bruto</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Revendedor</strong><br /><span style="font-size:11px;color:#5a6f84;">7–12% descuento</span></td>
          <td>$1.475.671</td>
          <td>$1.694.404</td>
          <td class="num">$218.733</td>
        </tr>
        <tr>
          <td><strong>Distribuidor</strong><br /><span style="font-size:11px;color:#5a6f84;">15–20% descuento</span></td>
          <td>$1.249.556</td>
          <td>$1.694.404</td>
          <td class="num">$444.848</td>
        </tr>
      </tbody>
    </table>
    <p style="font-size:12px;color:#5a6f84;margin-top:-20px;margin-bottom:28px;">
      * Precios de referencia. El precio mayorista exacto se calcula con tu nivel de descuento en el portal.
    </p>

    <!-- VOLUMEN -->
    <h2>📊 Proyección mensual por volumen</h2>
    <table class="vol-table">
      <thead>
        <tr>
          <th>Nivel</th>
          <th>Equipos / mes</th>
          <th>Margen mensual estimado</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="nivel">Revendedor</td>
          <td>3 equipos</td>
          <td class="margen">$656.199 / mes</td>
        </tr>
        <tr>
          <td class="nivel">Distribuidor</td>
          <td>6 equipos</td>
          <td class="margen">$2.669.088 / mes</td>
        </tr>
        <tr>
          <td class="nivel">Distribuidor</td>
          <td>12 equipos</td>
          <td class="margen">$5.338.176 / mes</td>
        </tr>
      </tbody>
    </table>

    <!-- KIT INCLUYE -->
    <h2>📦 Qué incluye cada equipo FULL</h2>
    <div class="kit-grid">
      <span class="kit-item">🔋 Panel solar</span>
      <span class="kit-item">⚡ Protecciones DC</span>
      <span class="kit-item">🔌 Cableado dimensionado</span>
      <span class="kit-item">🌍 Puesta a tierra</span>
      <span class="kit-item">📄 Documentación técnica</span>
      <span class="kit-item">🛠 Soporte postventa</span>
      <span class="kit-item">🪢 Cable y soga incluidos</span>
      <span class="kit-item">✅ Garantía integral 12 meses</span>
    </div>
    <p style="font-size:13px;color:#5a6f84;margin-bottom:28px;">
      Más de 260 configuraciones disponibles: sistemas directos, híbridos, solarizados y de alto caudal. Una solución para cada pozo.
    </p>

    <!-- NIVELES -->
    <h2>⬆️ Niveles de comisión (automáticos)</h2>
    <div class="niveles">
      <div class="nivel-row"><div><div class="nivel-name">Nivel 1 · Recomendador</div><div class="nivel-desc">Primeras ventas · Desde $0</div></div><div class="nivel-pct">7%</div></div>
      <div class="nivel-row"><div><div class="nivel-name">Nivel 2 · Vendedor</div><div class="nivel-desc">Cartera activa · Desde $5.000.000/mes</div></div><div class="nivel-pct">10%</div></div>
      <div class="nivel-row"><div><div class="nivel-name">Nivel 3 · Vendedor Instalador</div><div class="nivel-desc">Vendés e instalás · Desde $10.000.000/mes</div></div><div class="nivel-pct">12%</div></div>
      <div class="nivel-row"><div><div class="nivel-name">Nivel 4 · Vendedor Experto</div><div class="nivel-desc">Alto volumen · Desde $20.000.000/mes</div></div><div class="nivel-pct">15%</div></div>
      <div class="nivel-row"><div><div class="nivel-name">Nivel 5 · Distribuidor</div><div class="nivel-desc">Red consolidada · Desde $40.000.000/mes</div></div><div class="nivel-pct">20%</div></div>
    </div>
    <p style="font-size:13px;color:#5a6f84;margin-bottom:28px;">
      Los niveles suben automáticamente según tu facturación mensual. No hay cuota de ingreso, no hay stock mínimo para empezar.
    </p>

    <!-- BENEFICIOS -->
    <h2>🎯 Por qué tiene sentido</h2>
    <div class="beneficios">
      <div class="ben-row">
        <div class="ben-icon">🌾</div>
        <div class="ben-text">
          <strong>Mercado con demanda real</strong>
          <span>El 53% de los productores que consultan buscan agua para animales. La demanda ya existe — falta quien llegue primero con la solución.</span>
        </div>
      </div>
      <div class="ben-row">
        <div class="ben-icon">💻</div>
        <div class="ben-text">
          <strong>Portal técnico exclusivo</strong>
          <span>Cotizador que elige automáticamente el equipo correcto según el pozo del cliente. Precio mayorista calculado al instante.</span>
        </div>
      </div>
      <div class="ben-row">
        <div class="ben-icon">📣</div>
        <div class="ben-text">
          <strong>Material de ventas listo</strong>
          <span>Fichas técnicas, propuestas comerciales y soporte de Febecos para cerrar más rápido.</span>
        </div>
      </div>
      <div class="ben-row">
        <div class="ben-icon">🤝</div>
        <div class="ben-text">
          <strong>Soporte técnico incluido</strong>
          <span>Equipo de Febecos disponible para ayudarte a dimensionar proyectos complejos y asistir en la postventa.</span>
        </div>
      </div>
    </div>

    <!-- CÓMO EMPEZAR -->
    <h2>🚀 Cómo empezar</h2>
    <ol style="padding-left:20px;font-size:14px;color:#2d3f55;line-height:2;margin-bottom:16px;">
      <li>Completá el formulario o contactanos por WhatsApp</li>
      <li>Revisamos tu solicitud — en algunos casos te llamamos antes de activar el acceso</li>
      <li>Recibís tu acceso al portal y empezás a cotizar desde el día 1</li>
    </ol>
    <p style="font-size:13px;color:#5a6f84;background:#f7f9fc;border-left:3px solid #a8c61b;padding:12px 16px;border-radius:0 6px 6px 0;margin-bottom:28px;">
      ⏱ La activación es manual y personalizada. Si tenemos alguna consulta sobre tu perfil, te contactamos primero.
    </p>

    <!-- CTA -->
    <div class="cta-wrap">
      <a href="https://revendedores.febecos.com/unirse#formulario" class="cta-btn">
        🚀 Ver el portal gratis — 7 días
      </a>
      <br />
      <a href="https://wa.me/5491125750323?text=Hola%20Guillermo%2C%20recib%C3%AD%20la%20propuesta%20de%20revendedores%20Febecos%20y%20quiero%20empezar." class="cta-wa">
        💬 Hablar con Guillermo por WhatsApp
      </a>
      <p class="note">Sin cuota de ingreso · Sin stock mínimo · Activación manual y personalizada</p>
    </div>

  </div>

  <!-- FOOTER -->
  <div class="footer">
    <p>
      <strong>Guillermo Sandler</strong> · Febecos Bombas Solares<br />
      <a href="tel:+5491125750323">+54 9 11 2575-0323</a> ·
      <a href="https://febecos.com">febecos.com</a>
    </p>
    <p style="margin-top:12px;">Lun a Vie 10–17 hs · Respondemos en el día</p>
  </div>

</div>
</body>
</html>
`.trim()
}

function htmlAdmin(nombre: string, email: string, whatsapp: string, localidad: string, via: string): string {
  return `
<div style="font-family:sans-serif;font-size:14px;color:#1a2a3a;max-width:480px;">
  <h2 style="color:#003d72;margin-bottom:16px;">🔔 Nuevo lead — Programa Revendedores</h2>
  <table style="border-collapse:collapse;width:100%;">
    <tr><td style="padding:8px 0;border-bottom:1px solid #e8edf2;font-weight:700;width:120px;">Nombre</td><td style="padding:8px 0;border-bottom:1px solid #e8edf2;">${nombre}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #e8edf2;font-weight:700;">Email</td><td style="padding:8px 0;border-bottom:1px solid #e8edf2;">${email}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #e8edf2;font-weight:700;">WhatsApp</td><td style="padding:8px 0;border-bottom:1px solid #e8edf2;">${whatsapp}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #e8edf2;font-weight:700;">Localidad</td><td style="padding:8px 0;border-bottom:1px solid #e8edf2;">${localidad}</td></tr>
    <tr><td style="padding:8px 0;font-weight:700;">Vía</td><td style="padding:8px 0;">${via}</td></tr>
  </table>
  <p style="margin-top:20px;color:#5a6f84;font-size:12px;">Se envió propuesta comercial automáticamente al lead.</p>
</div>
`.trim()
}

export async function POST(req: NextRequest) {
  let nombre = '', email = '', whatsapp = '', localidad = '', via = 'formulario'

  try {
    const body = await req.json()
    nombre    = (body.nombre    || '').trim()
    email     = (body.email     || '').trim()
    whatsapp  = (body.whatsapp  || '').trim()
    localidad = (body.localidad || '').trim()
    via       = (body.via       || 'formulario').trim()
  } catch {
    return NextResponse.json({ ok: false, error: 'body inválido' }, { status: 400 })
  }

  if (!email) {
    return NextResponse.json({ ok: false, error: 'email requerido' }, { status: 400 })
  }

  try {
    const resend = getResend()

    // ── 1. Email al lead ─────────────────────────────────────────────────────
    await resend.emails.send({
      from: 'Febecos Revendedores <revende@febecos.com>',
      replyTo: 'revende@febecos.com',
      to: email,
      subject: `${nombre ? nombre.split(' ')[0] + ', tu' : 'Tu'} propuesta de revendedor Febecos ✅`,
      html: htmlPropuesta(nombre || 'Hola'),
    })

    // ── 2. Notificación al admin ─────────────────────────────────────────────
    const adminEmail = process.env.AGENT_EMAIL
    if (adminEmail) {
      await resend.emails.send({
        from: 'Febecos Revendedores <revende@febecos.com>',
        replyTo: 'revende@febecos.com',
        to: adminEmail,
        subject: `[Lead] ${nombre || email} — ${localidad || 'sin localidad'} (${via})`,
        html: htmlAdmin(nombre, email, whatsapp, localidad, via),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[propuesta-email] Error Resend:', err)
    return NextResponse.json({ ok: false, error: 'error al enviar' }, { status: 500 })
  }
}
