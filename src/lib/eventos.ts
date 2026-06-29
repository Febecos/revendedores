// Productor del BUS DE EVENTOS central (OBJETIVO-99, C2). Dueño del schema: DEV Gestión.
// origen='revendedores'. Fire-and-forget + idempotente: NUNCA rompe el flujo (try/catch silencioso).
// Tabla `eventos` (Neon central): tipo, origen, entidad, entidad_id, payload, idempotency_key, cliente_id.
// Contrato confirmado por DEV Gestión (29/06): INSERT directo + ON CONFLICT (idempotency_key) DO NOTHING.
// Convención de tipo: entidad.acción (lower). cliente_id top-level además del payload (filtrar sin parsear JSONB).

type EmitArgs = {
  tipo: string                    // 'cotizacion.creada' | 'cotizacion.vista'
  entidad?: string | null         // 'presupuesto'
  entidadId?: string | null       // 'PREV-2026-0223'
  payload?: unknown               // snapshot mínimo para reaccionar
  idempotencyKey?: string | null  // dedupe del productor (re-emisión segura)
  clienteId?: number | null       // clientes.id resuelto (top-level)
}

// `sql` = instancia neon ya abierta (la del handler). NUNCA throwea (el bus no debe afectar el flujo).
export async function emitEvento(sql: any, a: EmitArgs): Promise<void> {
  try {
    await sql`
      INSERT INTO eventos (tipo, origen, entidad, entidad_id, payload, idempotency_key, cliente_id)
      VALUES (${a.tipo}, 'revendedores', ${a.entidad ?? null}, ${a.entidadId ?? null},
              ${JSON.stringify(a.payload ?? {})}::jsonb, ${a.idempotencyKey ?? null}, ${a.clienteId ?? null})
      ON CONFLICT (idempotency_key) DO NOTHING`
  } catch (e: any) {
    console.error('[emitEvento] no se pudo emitir', a.tipo, e?.message)
  }
}
