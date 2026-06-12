import { NextRequest, NextResponse } from 'next/server'

// POST /api/registrar-cliente
// Proxy SERVER-SIDE hacia el CRM central de Febecos (upsert_cliente).
// Necesario porque el endpoint del CRM exige INTERNAL_SERVICE_SECRET, que NO
// puede mandarse desde el navegador (es env de servidor, se expondría al cliente).
//
// Atribución: cuando el presupuesto lo genera un revendedor externo, el cliente
// se registra MARCADO como "cliente_revendedor" + el token/nombre del revendedor,
// para detectar si ese cliente luego contacta a Febecos directo y decidir si se
// deriva al mismo revendedor o lo seguimos nosotros.
export async function POST(req: NextRequest) {
  try {
    const b = await req.json()

    // Si viene atribución de revendedor (y NO es vendedor interno de Febecos),
    // marcamos el cliente con el token/nombre del revendedor (columnas dedicadas).
    // NO tocamos `tipo` para no pisar clientes que ya son directos de Febecos.
    const esInterno = b.rev_tipo === 'interno'

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
      // Atribución del revendedor (el CRM la guarda solo si no es interno)
      revendedor_token: (!esInterno && b.revendedor_token) ? b.revendedor_token : null,
      revendedor_nombre: (!esInterno && b.revendedor_nombre) ? b.revendedor_nombre : null,
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
