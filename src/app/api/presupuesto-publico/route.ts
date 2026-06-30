import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { emitEvento } from '@/lib/eventos'

// GET /api/presupuesto-publico?t=<token>
// Busca por TOKEN aleatorio → no enumerable (seguridad).
// Incluye branding del revendedor si habilitó marca propia y tiene logo cargado.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t')
  // rev = token del revendedor cuando ÉL abre su propio preview (la página lo pasa). Sirve
  // para NO contar como "vista del cliente" la apertura del propio revendedor (C2/abandono).
  const rev = req.nextUrl.searchParams.get('rev')
  if (!token || token.length < 8) return NextResponse.json({ error: 'token inválido' }, { status: 400 })
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT
        p.numero, p.created_at, p.cliente_id, p.revendedor_token, p.revendedor_nombre, p.revendedor_email,
        p.bomba_codigo, p.bomba_descripcion, p.bomba_watts, p.bomba_marca,
        p.litros_dia, p.altura_m, p.profundidad_m, p.longitud_total_m,
        p.tipo_precio, p.precio_publico, p.precio_ofrecido, p.descuento_pct, p.fv_items,
        p.cliente_nombre, p.cliente_apellido, p.cliente_telefono, p.cliente_zona,
        p.cliente_razon_social, p.cliente_cuit, p.cliente_domicilio,
        p.cliente_localidad, p.cliente_cod_postal, p.cliente_condicion_fiscal,
        sr.tipo_usuario AS rev_tipo, sr.provincia AS rev_provincia,
        -- Branding del revendedor (solo si tiene marca propia habilitada Y logo cargado)
        CASE WHEN sr.puede_cotizar_con_marca = true AND sr.logo_base64 IS NOT NULL
          THEN sr.logo_base64 ELSE NULL END AS rev_logo,
        CASE WHEN sr.puede_cotizar_con_marca = true AND sr.logo_base64 IS NOT NULL
          THEN sr.empresa ELSE NULL END AS rev_empresa,
        CASE WHEN sr.puede_cotizar_con_marca = true AND sr.logo_base64 IS NOT NULL
          THEN sr.domicilio ELSE NULL END AS rev_domicilio,
        CASE WHEN sr.puede_cotizar_con_marca = true AND sr.logo_base64 IS NOT NULL
          THEN sr.cuit ELSE NULL END AS rev_cuit
      FROM presupuestos p
      LEFT JOIN solicitudes_revendedor sr ON sr.token_acceso = p.revendedor_token
      WHERE p.public_token = ${token}
      LIMIT 1`
    if (!rows.length) return NextResponse.json({ error: 'no encontrado' }, { status: 404 })

    // C2 (OBJETIVO-99): emitir cotizacion.vista al bus (origen='revendedores'). Dedup por
    // public_token → registra la PRIMERA vista (lo que el abandono necesita). Se omite si el
    // que abre es el propio revendedor (preview/edición), para no falsear "la vio el cliente".
    const esPreviewDelRevendedor = !!(rev && rows[0].revendedor_token && rev === rows[0].revendedor_token)
    if (!esPreviewDelRevendedor) {
      await emitEvento(sql, {
        tipo: 'cotizacion.vista',
        entidad: 'presupuesto',
        entidadId: rows[0].numero,
        clienteId: rows[0].cliente_id ?? null,
        idempotencyKey: `revendedores:cotizacion.vista:${token}`,
        payload: { public_token: token, presupuesto_numero: rows[0].numero, ts: new Date().toISOString() },
      })
    }
    return NextResponse.json({ ok: true, presupuesto: rows[0] })
  } catch (err: any) {
    console.error('GET /api/presupuesto-publico error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
