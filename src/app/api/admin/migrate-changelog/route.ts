// Endpoint temporal — BORRAR después de correr una vez
// POST /api/admin/migrate-changelog  con header x-migrate-token: feb-mig-2026-chg
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const TOKEN = 'feb-mig-2026-chg'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-migrate-token') !== TOKEN) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const sql = getDb()

  await sql`
    CREATE TABLE IF NOT EXISTS plataforma_changelog (
      id          SERIAL PRIMARY KEY,
      fecha       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      titulo      TEXT NOT NULL,
      descripcion TEXT,
      tipo        TEXT NOT NULL DEFAULT 'mejora'
                  CHECK (tipo IN ('mejora', 'novedad', 'fix', 'importante')),
      visible     BOOLEAN NOT NULL DEFAULT true,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  // Semilla con cambios recientes (sesión 2026-06-04)
  await sql`
    INSERT INTO plataforma_changelog (fecha, titulo, descripcion, tipo) VALUES
    (NOW() - INTERVAL '1 day', 'Presupuestos con logo propio (marca blanca)',
     'Los revendedores habilitados pueden subir su logo y cotizar con sus propios datos. El PDF reemplaza el logo de Febecos por el del revendedor, incluyendo empresa, CUIT y domicilio.',
     'novedad'),
    (NOW() - INTERVAL '1 day', 'Transportistas preferidos en el perfil',
     'Cada revendedor puede guardar hasta 2 transportistas de su zona directamente en su perfil. El buscador encuentra cualquier transportista por nombre en toda la base.',
     'mejora'),
    (NOW() - INTERVAL '1 day', 'Pedidos online habilitados',
     'Los revendedores con acceso a pedidos online pueden confirmar compras directamente desde el portal por transferencia, cuotas NAVE o Mercado Pago.',
     'novedad'),
    (NOW() - INTERVAL '1 day', 'Domicilio comercial en el perfil',
     'Se agregó el campo domicilio comercial al perfil del revendedor. Aparece en los presupuestos cuando se usa la función de marca propia.',
     'mejora')
    ON CONFLICT DO NOTHING
  `

  return NextResponse.json({ ok: true, msg: 'Tabla plataforma_changelog creada y sembrada' })
}
