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
//  - REQUIERE un revendedor_token VÁLIDO y activo para escribir: sin token
//    válido NO se escribe nada (403). Esto evita que un externo inyecte
//    clientes o falsifique atribución.
//  - el tipo de revendedor se DERIVA de la DB (no de b.rev_tipo, falsificable).
//    Externo válido → atribución; interno → sin atribución (sus clientes son
//    de Febecos), pero igual escribe.
export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => ({}))

    // Rate-limit por IP (mismo patrón que /api/registro y /api/demo).
    const limite = antiSpam(req, { email: b.email })
    if (limite) return limite

    // Token de revendedor OBLIGATORIO para escribir al CRM.
    const token = b.revendedor_token
    if (!token) {
      return NextResponse.json({ ok: false, error: 'token requerido' }, { status: 403 })
    }
    // Validar contra la DB: el token debe existir y estar activo.
    let rev: any = null
    try {
      const sql = getDb()
      const rows = await sql`
        SELECT tipo_usuario, nombre, apellido
        FROM solicitudes_revendedor
        WHERE token_acceso = ${token} AND token_acceso_activo = true
        LIMIT 1`
      rev = rows[0] || null
    } catch (e: any) {
      // Fallo de validación → NO escribir (fail-closed). El backfill recupera
      // después los clientes desde la tabla presupuestos si hiciera falta.
      console.error('registrar-cliente: validación de token falló', e?.message)
      return NextResponse.json({ ok: false, error: 'error de validación' }, { status: 503 })
    }
    if (!rev) {
      return NextResponse.json({ ok: false, error: 'token inválido' }, { status: 403 })
    }
    // Atribución derivada de la DB. Interno → sin atribución (pero igual escribe).
    const esInterno = rev.tipo_usuario === 'interno'
    const revTipo: string | null = rev.tipo_usuario || null
    const revToken: string | null = esInterno ? null : token
    const revNombre: string | null = esInterno
      ? null
      : [rev.nombre, rev.apellido].filter(Boolean).join(' ') || b.revendedor_nombre || null

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
      // Atribución validada contra la DB (null solo si el revendedor es interno;
      // los tokens inválidos ya fueron rechazados con 403 más arriba)
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
