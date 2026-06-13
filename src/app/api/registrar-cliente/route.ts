import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { antiSpam } from '@/lib/anti-spam'

// POST /api/registrar-cliente
// Proxy SERVER-SIDE hacia el CRM central de Febecos (upsert_cliente).
// Necesario porque el endpoint del CRM exige INTERNAL_SERVICE_SECRET, que NO
// puede mandarse desde el navegador (es env de servidor, se expondría al cliente).
//
// SEGURIDAD: endpoint público (lo llama el portal sin sesión). Por eso:
//  - rate-limit por IP (anti-spam) para que no se inyecten clientes en masa.
//  - la atribución de revendedor NO se confía del body: se valida el
//    revendedor_token contra solicitudes_revendedor (existe + token activo) y el
//    tipo se DERIVA de la DB (no de b.rev_tipo, que es falsificable). Si el token
//    no es válido, el cliente se registra igual pero SIN atribución.
export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => ({}))

    // Rate-limit por IP (mismo patrón que /api/registro y /api/demo).
    const limite = antiSpam(req, { email: b.email })
    if (limite) return limite

    // Validar la atribución contra la DB. NO confiar en b.rev_tipo (spoofable).
    let revToken: string | null = null
    let revNombre: string | null = null
    let revTipo: string | null = null
    if (b.revendedor_token) {
      try {
        const sql = getDb()
        const rows = await sql`
          SELECT tipo_usuario, nombre, apellido
          FROM solicitudes_revendedor
          WHERE token_acceso = ${b.revendedor_token} AND token_acceso_activo = true
          LIMIT 1`
        const rev = rows[0]
        if (rev) {
          revTipo = rev.tipo_usuario || null
          // Solo se atribuye si es un revendedor EXTERNO válido. Los internos de
          // Febecos no marcan atribución (sus clientes son nuestros).
          if (rev.tipo_usuario !== 'interno') {
            revToken = b.revendedor_token
            revNombre = [rev.nombre, rev.apellido].filter(Boolean).join(' ') || b.revendedor_nombre || null
          }
        }
        // Si rev es null → token inválido/inactivo → se registra SIN atribución.
      } catch (e: any) {
        // Fallo de DB: registrar sin atribución (no bloquear el alta del cliente).
        console.error('registrar-cliente: validación de token falló', e?.message)
      }
    }

    const payload = {
      tipo: b.tipo || 'cliente_final',
      nombre: b.nombre || null,
      apellido: b.apellido || null,
      email: b.email || null,
      whatsapp: b.telefono || b.whatsapp || null,
      cuit: b.cuit || null,
      empresa: b.razonSocial || b.empresa || null,
      razon_social: b.razonSocial || b.razon_social || null,
      provincia: b.zona || b.provincia || null,
      origen: b.origen || 'presupuesto_bombas',
      bump: b.bump || 'presupuesto',
      monto: b.monto || 0,
      // Atribución YA validada contra la DB (null si el token no era válido o es interno)
      rev_tipo: revTipo,
      revendedor_token: revToken,
      revendedor_nombre: revNombre,
    }

    const r = await fetch('https://febecos.com/api/admin?action=upsert_cliente', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_SECRET || ''}`,
      },
      body: JSON.stringify(payload),
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) {
      console.error('registrar-cliente: CRM respondió', r.status, data)
      return NextResponse.json({ ok: false, error: data.error || `CRM ${r.status}` }, { status: 502 })
    }
    return NextResponse.json({ ok: true, id: data.id, accion: data.accion })
  } catch (err: any) {
    console.error('POST /api/registrar-cliente error:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
