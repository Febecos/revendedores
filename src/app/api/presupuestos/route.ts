import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { upsertClienteGestion } from '@/lib/crm-upsert'

async function ensureTable(sql: any) {
  await sql`
    CREATE TABLE IF NOT EXISTS presupuestos (
      id                SERIAL PRIMARY KEY,
      created_at        TIMESTAMPTZ DEFAULT NOW(),
      numero            TEXT NOT NULL,
      revendedor_token  TEXT,
      revendedor_nombre TEXT,
      revendedor_email  TEXT,
      bomba_codigo      TEXT,
      bomba_descripcion TEXT,
      bomba_watts       INTEGER,
      bomba_marca       TEXT,
      litros_dia        NUMERIC,
      altura_m          NUMERIC,
      longitud_total_m  NUMERIC,
      profundidad_m     NUMERIC,
      tipo_precio       TEXT DEFAULT 'mayorista',
      precio_publico    NUMERIC,
      precio_ofrecido   NUMERIC,
      descuento_pct     NUMERIC,
      cliente_nombre    TEXT,
      cliente_apellido  TEXT,
      cliente_telefono  TEXT,
      cliente_zona      TEXT,
      estado            TEXT DEFAULT 'emitido'
    )
  `
  await sql`ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS cliente_razon_social TEXT`
  await sql`ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS cliente_cuit TEXT`
  await sql`ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS cliente_email TEXT`
  await sql`ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS public_token TEXT`
  await sql`ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS cliente_id INT`
  await sql`ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS profundidad_m NUMERIC`
  await sql`ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS cliente_domicilio TEXT`
  await sql`ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS cliente_localidad TEXT`
  await sql`ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS cliente_cod_postal TEXT`
  await sql`ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS cliente_condicion_fiscal TEXT`
  await sql`CREATE INDEX IF NOT EXISTS idx_presupuestos_token ON presupuestos(public_token)`
  await sql`ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS fv_items JSONB`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      numero, revendedor_token, revendedor_nombre, revendedor_email,
      bomba_codigo, bomba_descripcion, bomba_watts, bomba_marca,
      litros_dia, altura_m, longitud_total_m, profundidad_m,
      tipo_precio, precio_publico, precio_ofrecido, descuento_pct,
      cliente_nombre, cliente_apellido, cliente_telefono, cliente_email, cliente_zona,
      cliente_razon_social, cliente_cuit, cliente_domicilio,
      cliente_localidad, cliente_cod_postal, cliente_condicion_fiscal, cliente_id, forzar, public_token,
      fv_items,
    } = body

    if (!numero) return NextResponse.json({ error: 'numero requerido' }, { status: 400 })

    const sql = getDb()
    await ensureTable(sql)

    // Fallback server-side: si el cliente no mandó fv_items (data.kit no estaba cargado)
    // pero hay bomba_codigo, lo buscamos desde el endpoint de ROI que ya tiene la lógica de metros.
    let resolvedFvItems = fv_items || null
    if (!resolvedFvItems && bomba_codigo) {
      try {
        const params = new URLSearchParams({ codigo: bomba_codigo })
        if (profundidad_m)    params.set('profundidad',       String(profundidad_m))
        if (longitud_total_m) params.set('distancia_sensor',  String(longitud_total_m))
        const kitRes = await fetch(`https://roi.febecos.com/api/kit-items?${params}`)
        if (kitRes.ok) {
          const kitData = await kitRes.json().catch(() => null)
          if (Array.isArray(kitData?.fv_items)) resolvedFvItems = kitData.fv_items
        }
      } catch { /* silencioso — el presupuesto se guarda igual, Gestión lo marca "kit sin desglosar" */ }
    }
    const fvItemsJson = resolvedFvItems ? JSON.stringify(resolvedFvItems) : null
    const rows = await sql`
      INSERT INTO presupuestos (
        numero, revendedor_token, revendedor_nombre, revendedor_email,
        bomba_codigo, bomba_descripcion, bomba_watts, bomba_marca,
        litros_dia, altura_m, longitud_total_m, profundidad_m,
        tipo_precio, precio_publico, precio_ofrecido, descuento_pct,
        cliente_nombre, cliente_apellido, cliente_telefono, cliente_email, cliente_zona,
        cliente_razon_social, cliente_cuit, cliente_domicilio,
        cliente_localidad, cliente_cod_postal, cliente_condicion_fiscal, cliente_id, public_token,
        fv_items
      ) VALUES (
        ${numero},
        ${revendedor_token || null}, ${revendedor_nombre || null}, ${revendedor_email || null},
        ${bomba_codigo || null}, ${bomba_descripcion || null},
        ${bomba_watts || null}, ${bomba_marca || null},
        ${litros_dia || null}, ${altura_m || null}, ${longitud_total_m || null}, ${profundidad_m || null},
        ${tipo_precio || 'mayorista'},
        ${precio_publico || null}, ${precio_ofrecido || null}, ${descuento_pct || null},
        ${cliente_nombre || null}, ${cliente_apellido || null},
        ${cliente_telefono || null}, ${cliente_email || null}, ${cliente_zona || null},
        ${cliente_razon_social || null}, ${cliente_cuit || null}, ${cliente_domicilio || null},
        ${cliente_localidad || null}, ${cliente_cod_postal || null}, ${cliente_condicion_fiscal || null}, ${cliente_id || null}, ${public_token || null},
        ${fvItemsJson}::jsonb
      )
      RETURNING id, numero, created_at
    `

    // CRM: registrar/actualizar el cliente automáticamente (dedup en upsert_cliente).
    // Fire & forget — garantiza que TODO presupuesto de bombas tenga su cliente en el CRM.
    // La atribución revendedor (interno/externo) la maneja el portal vía /api/registrar-cliente;
    // acá NO atribuimos para no falsear (solo aseguramos la existencia del cliente).
    if (cliente_nombre || cliente_email || cliente_telefono || cliente_cuit) {
      try {
        const up = await fetch('https://febecos.com/api/admin?action=upsert_cliente', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_SECRET || ''}`,
          },
          body: JSON.stringify({
            tipo: 'cliente_final',
            nombre: [cliente_nombre, cliente_apellido].filter(Boolean).join(' ') || null,
            email: cliente_email || null,
            whatsapp: cliente_telefono || null,
            cuit: cliente_cuit || null,
            razon_social: cliente_razon_social || null,
            domicilio: cliente_domicilio || null,
            localidad: cliente_localidad || null,
            cod_postal: cliente_cod_postal || null,
            condicion_fiscal: cliente_condicion_fiscal || null,
            provincia: cliente_zona || null,
            // Vínculo de contacto: cliente_id = actualizar ese contacto; forzar = crear nuevo
            // con CUIT repetido (confirmado en el front). Sin esto, upsert dedup por CUIT.
            cliente_id: cliente_id || null,
            forzar: forzar || false,
            origen: 'cotizador_bombas',
            bump: 'presupuesto',
          }),
        })
        // CRM = fuente única: si el presupuesto se guardó SIN cliente_id, vincularlo con el id
        // que devolvió el upsert (antes quedaba null → no aparecía la ficha 👤 en gestión).
        const d = await up.json().catch(() => ({} as any))
        if (!cliente_id && d && d.ok && d.id) {
          await sql`UPDATE presupuestos SET cliente_id = ${d.id} WHERE numero = ${numero} AND cliente_id IS NULL`.catch(() => {})
        }
      } catch { /* el presupuesto ya quedó guardado; el match difuso de gestión lo resuelve igual */ }
    }

    return NextResponse.json({ ok: true, presupuesto: rows[0] })
  } catch (err: any) {
    console.error('POST /api/presupuestos error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const {
      public_token, numero, descuento_pct, precio_ofrecido, precio_publico, tipo_precio,
      cliente_nombre, cliente_apellido, cliente_telefono, cliente_email,
      cliente_zona, cliente_razon_social, cliente_cuit, cliente_domicilio,
      cliente_localidad, cliente_cod_postal, cliente_condicion_fiscal, cliente_id,
    } = await req.json()
    if (!public_token && !numero) return NextResponse.json({ error: 'public_token o numero requerido' }, { status: 400 })

    const sql = getDb()
    await ensureTable(sql)

    // NOTE: @neondatabase/serverless NO soporta fragmentos sql anidados
    // (sql`... WHERE ${sql`...`}`) → binda el fragmento como valor y rompe.
    // Por eso se duplica la query según la clave disponible.
    const updated = public_token
      ? await sql`
          UPDATE presupuestos SET
            descuento_pct        = COALESCE(${descuento_pct ?? null}, descuento_pct),
            precio_ofrecido      = COALESCE(${precio_ofrecido ?? null}, precio_ofrecido),
            precio_publico       = COALESCE(${precio_publico ?? null}, precio_publico),
            tipo_precio          = COALESCE(${tipo_precio ?? null}, tipo_precio),
            cliente_nombre       = COALESCE(${cliente_nombre ?? null}, cliente_nombre),
            cliente_apellido     = COALESCE(${cliente_apellido ?? null}, cliente_apellido),
            cliente_telefono     = COALESCE(${cliente_telefono ?? null}, cliente_telefono),
            cliente_email        = COALESCE(${cliente_email ?? null}, cliente_email),
            cliente_zona         = COALESCE(${cliente_zona ?? null}, cliente_zona),
            cliente_razon_social = COALESCE(${cliente_razon_social ?? null}, cliente_razon_social),
            cliente_cuit         = COALESCE(${cliente_cuit ?? null}, cliente_cuit),
            cliente_domicilio    = COALESCE(${cliente_domicilio ?? null}, cliente_domicilio),
            cliente_localidad    = COALESCE(${cliente_localidad ?? null}, cliente_localidad),
            cliente_cod_postal   = COALESCE(${cliente_cod_postal ?? null}, cliente_cod_postal),
            cliente_condicion_fiscal = COALESCE(${cliente_condicion_fiscal ?? null}, cliente_condicion_fiscal),
            cliente_id           = COALESCE(${cliente_id ?? null}, cliente_id)
          WHERE public_token = ${public_token}
          RETURNING id, numero, cliente_id, cliente_nombre, cliente_apellido
        `
      : await sql`
          UPDATE presupuestos SET
            descuento_pct        = COALESCE(${descuento_pct ?? null}, descuento_pct),
            precio_ofrecido      = COALESCE(${precio_ofrecido ?? null}, precio_ofrecido),
            precio_publico       = COALESCE(${precio_publico ?? null}, precio_publico),
            tipo_precio          = COALESCE(${tipo_precio ?? null}, tipo_precio),
            cliente_nombre       = COALESCE(${cliente_nombre ?? null}, cliente_nombre),
            cliente_apellido     = COALESCE(${cliente_apellido ?? null}, cliente_apellido),
            cliente_telefono     = COALESCE(${cliente_telefono ?? null}, cliente_telefono),
            cliente_email        = COALESCE(${cliente_email ?? null}, cliente_email),
            cliente_zona         = COALESCE(${cliente_zona ?? null}, cliente_zona),
            cliente_razon_social = COALESCE(${cliente_razon_social ?? null}, cliente_razon_social),
            cliente_cuit         = COALESCE(${cliente_cuit ?? null}, cliente_cuit),
            cliente_domicilio    = COALESCE(${cliente_domicilio ?? null}, cliente_domicilio),
            cliente_localidad    = COALESCE(${cliente_localidad ?? null}, cliente_localidad),
            cliente_cod_postal   = COALESCE(${cliente_cod_postal ?? null}, cliente_cod_postal),
            cliente_condicion_fiscal = COALESCE(${cliente_condicion_fiscal ?? null}, cliente_condicion_fiscal),
            cliente_id           = COALESCE(${cliente_id ?? null}, cliente_id)
          WHERE numero = ${numero}
          RETURNING id, numero, cliente_id, cliente_nombre, cliente_apellido
        `
    if (!updated.length) {
      console.error('PATCH /api/presupuestos: no rows matched', { public_token, numero })
      return NextResponse.json({ ok: false, error: 'Presupuesto no encontrado', rows_updated: 0 }, { status: 404 })
    }
    // D1 (OBJETIVO-99): la escritura a `clientes` va por el endpoint único de Gestión
    // (dueño del dato), NO por SQL directo. Propaga descuento (bidireccional) + datos
    // fiscales por cliente_id. COALESCE del lado del endpoint → no pisa con null. Best-effort.
    if (updated[0].cliente_id && (descuento_pct != null || cliente_domicilio || cliente_localidad || cliente_cod_postal || cliente_condicion_fiscal || cliente_zona)) {
      await upsertClienteGestion({
        cliente_id: updated[0].cliente_id,
        descuento_pct: descuento_pct ?? undefined,
        domicilio: cliente_domicilio ?? undefined,
        localidad: cliente_localidad ?? undefined,
        cod_postal: cliente_cod_postal ?? undefined,
        condicion_fiscal: cliente_condicion_fiscal ?? undefined,
        provincia: cliente_zona ?? undefined,
      })
    }
    return NextResponse.json({ ok: true, rows_updated: updated.length, presupuesto: updated[0] })
  } catch (err: any) {
    console.error('PATCH /api/presupuestos error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')
    const sql = getDb()

    await ensureTable(sql)

    const rows = token
      ? await sql`SELECT * FROM presupuestos WHERE revendedor_token = ${token} ORDER BY created_at DESC LIMIT ${limit}`
      : await sql`SELECT * FROM presupuestos ORDER BY created_at DESC LIMIT ${limit}`

    return NextResponse.json({ ok: true, presupuestos: rows })
  } catch (err: any) {
    console.error('GET /api/presupuestos error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
