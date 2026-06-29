// GET  /api/perfil?token=xxx  — devuelve datos del perfil del revendedor
// POST /api/perfil             — actualiza campos permitidos del perfil
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { upsertClienteGestion } from '@/lib/crm-upsert'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ ok: false, error: 'token requerido' }, { status: 400 })

  try {
    const sql = getDb()
    const rows = await sql`
      SELECT
        sr.id, sr.nombre, sr.apellido, sr.email, sr.whatsapp,
        sr.empresa, sr.provincia, sr.localidad, sr.cuit,
        sr.tipo_revendedor, sr.tipo_usuario, sr.descuento_pct,
        sr.experiencia_anos, sr.experiencia_solar, sr.equipos_mes,
        sr.created_at AS fecha_registro,
        sr.transportista_1_id,
        sr.transportista_2_id,
        c1.name AS transportista_1_nombre,
        c2.name AS transportista_2_nombre,
        sr.domicilio,
        sr.logo_base64,
        sr.puede_cotizar_con_marca
      FROM solicitudes_revendedor sr
      LEFT JOIN logistics.carriers c1 ON c1.id = sr.transportista_1_id
      LEFT JOIN logistics.carriers c2 ON c2.id = sr.transportista_2_id
      WHERE sr.token_acceso = ${token}
        AND sr.token_acceso_activo = true
      LIMIT 1
    `
    if (!rows.length) return NextResponse.json({ ok: false, error: 'token_invalido' }, { status: 401 })
    return NextResponse.json({ ok: true, perfil: rows[0] })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token } = body

    if (!token) return NextResponse.json({ ok: false, error: 'token requerido' }, { status: 400 })

    const sql = getDb()

    // 1. Verificar token y traer valores actuales
    const rows = await sql`
      SELECT id, nombre, apellido, email, estado, empresa, provincia, localidad, cuit, whatsapp, transportista_1_id, transportista_2_id, domicilio, logo_base64
      FROM solicitudes_revendedor
      WHERE token_acceso = ${token} AND token_acceso_activo = true
      LIMIT 1
    `
    if (!rows.length) return NextResponse.json({ ok: false, error: 'token_invalido' }, { status: 401 })

    const actual = rows[0]

    // 2. Merge: sólo los campos editables; si no viene en el body, queda el actual
    const empresa   = 'empresa'   in body ? (body.empresa   || null) : actual.empresa
    const provincia = 'provincia' in body ? (body.provincia || null) : actual.provincia
    const localidad = 'localidad' in body ? (body.localidad || null) : actual.localidad
    const cuit      = 'cuit'      in body ? (body.cuit      || null) : actual.cuit
    const whatsapp  = 'whatsapp'  in body ? (body.whatsapp  || null) : actual.whatsapp

    // transportista_X_id: viene como número o null; '' (vacío del form) → null
    const t1Raw = 'transportista_1_id' in body ? body.transportista_1_id : actual.transportista_1_id
    const t2Raw = 'transportista_2_id' in body ? body.transportista_2_id : actual.transportista_2_id
    const transportista_1_id = t1Raw ? Number(t1Raw) : null
    const transportista_2_id = t2Raw ? Number(t2Raw) : null
    const domicilio  = 'domicilio'  in body ? (body.domicilio  || null) : actual.domicilio
    const logo_base64 = 'logo_base64' in body ? (body.logo_base64 || null) : actual.logo_base64

    // 3. Guardar. Marca la fecha de actualización (recordatorio semestral) y,
    //    si estaba 'aprobado', lo deja 'activo' (confirmó que está operativo).
    const nuevoEstado = actual.estado === 'aprobado' ? 'activo' : actual.estado
    await sql`
      UPDATE solicitudes_revendedor
      SET
        empresa            = ${empresa},
        provincia          = ${provincia},
        localidad          = ${localidad},
        cuit               = ${cuit},
        whatsapp           = ${whatsapp},
        transportista_1_id = ${transportista_1_id},
        transportista_2_id = ${transportista_2_id},
        domicilio          = ${domicilio},
        logo_base64        = ${logo_base64},
        estado             = ${nuevoEstado},
        datos_actualizados_at = now()
      WHERE token_acceso = ${token}
    `

    // 4. Sincronizar al CRM central (clientes) — D1 (OBJETIVO-99): la ESCRITURA va por el
    //    endpoint único de Gestión (dueño del dato), NO por SQL directo. Resolvemos el
    //    cliente_id con un READ por revendedor_token OR email (misma resolución que antes,
    //    porque el endpoint resuelve por cuit/email/wa pero no por token) y se lo pasamos.
    //    No bloquea la respuesta si falla.
    try {
      const email = (actual.email || '').trim() || null
      const emailLower = email ? email.toLowerCase() : null
      const nombre = (actual.nombre || '').trim() || null
      const apellido = (actual.apellido || '').trim() || null
      // READ (no write): resolver el contacto existente igual que antes.
      const found = emailLower
        ? await sql`SELECT id FROM clientes WHERE crm_eliminado IS NOT TRUE AND (revendedor_token = ${token} OR lower(email) = ${emailLower}) LIMIT 1`
        : await sql`SELECT id FROM clientes WHERE crm_eliminado IS NOT TRUE AND revendedor_token = ${token} LIMIT 1`
      await upsertClienteGestion({
        cliente_id: found.length ? found[0].id : undefined,
        tipo: 'empresa',
        nombre: nombre ?? undefined,
        apellido: apellido ?? undefined,
        empresa: empresa ?? undefined,
        razon_social: empresa ?? undefined,
        email: email ?? undefined,
        whatsapp: whatsapp ?? undefined,
        cuit: cuit ?? undefined,
        domicilio: domicilio ?? undefined,
        localidad: localidad ?? undefined,
        provincia: provincia ?? undefined,
        origen: 'revendedor',
        origenes: ['revendedor'],
        revendedor_token: token,
        revendedor_nombre: [nombre, apellido].filter(Boolean).join(' ') || null,
      })
    } catch (e: any) {
      console.error('[perfil] sync CRM (endpoint Gestión) falló (no bloqueante):', e.message)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[perfil] Error al guardar:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
