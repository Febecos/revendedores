// D1 (OBJETIVO-99): escribir `clientes` SOLO vía el endpoint único de Gestión (dueño del dato).
// Reemplaza los UPDATE/INSERT directos a `clientes` del Portal (perfil + presupuestos).
// Server-side: auth Bearer INTERNAL_SERVICE_SECRET (fallback de rollout; migrará a JWT scope
// clientes:write cuando Seguridad lo cierre). Best-effort: NUNCA rompe el flujo del caller.
// Contrato: febo-gestion/src/app/api/clientes/upsert/route.ts — resuelve cliente_id > cuit > email > wa;
// UPDATE con COALESCE (no pisa con null); MERGE tags[]/origenes[]; devuelve { ok, cliente_id, accion }.

const GESTION_BASE = (process.env.GESTION_API_URL || 'https://gestion.febecos.com').replace(/\/$/, '')
const UPSERT_URL = `${GESTION_BASE}/api/clientes/upsert`

export async function upsertClienteGestion(
  payload: Record<string, unknown>
): Promise<{ cliente_id: number; accion: string } | null> {
  const secret = process.env.INTERNAL_SERVICE_SECRET
  if (!secret) return null // sin identidad de servicio no escribimos (rollout)
  try {
    const res = await fetch(UPSERT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return null
    const d = await res.json().catch(() => null)
    return d?.ok ? { cliente_id: d.cliente_id, accion: d.accion } : null
  } catch {
    return null // el fallo del CRM no frena al caller
  }
}
