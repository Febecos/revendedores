'use client'
import { useEffect, useState } from 'react'

const fmt = (n: number | null | undefined) =>
  n != null ? '$ ' + Math.round(n).toLocaleString('es-AR') : '—'

const FAM_ORDEN: Record<string, number> = { bomba: 0, panel: 1, soporte: 2, caja: 3, proteccion: 3, cable: 4, accesorio: 5, otros: 6, otro: 6 }

export default function PresupuestoPublico({ params }: { params: { numero: string } }) {
  const [p, setP] = useState<any>(null)
  const [bomba, setBomba] = useState<any>(null)
  const [kit, setKit] = useState<any[]>([])
  const [curvas, setCurvas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/api/presupuesto-publico?numero=${encodeURIComponent(params.numero)}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(async d => {
        setP(d.presupuesto)
        if (d.presupuesto?.bomba_codigo) {
          try {
            const r = await fetch(`https://roi.febecos.com/api/pump-detail?codigo=${encodeURIComponent(d.presupuesto.bomba_codigo)}`)
            if (r.ok) { const dd = await r.json(); setBomba(dd.bomba); setKit(dd.kit || []); setCurvas(dd.curvas || []) }
          } catch { /* sin datos extra */ }
        }
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [params.numero])

  if (loading) return <Center>⏳ Cargando presupuesto…</Center>
  if (error || !p) return <Center>❌ Presupuesto no encontrado o no disponible.</Center>

  const precio = p.precio_ofrecido ?? p.precio_publico
  const fecha = p.created_at ? new Date(p.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
  const cliente = [p.cliente_nombre, p.cliente_apellido].filter(Boolean).join(' ')

  // Kit: bomba + items reales con notas, ordenado por familia
  const items: { nombre: string; notas: string; cantidad: number; _f: number }[] = []
  items.push({ nombre: `Bomba ${bomba?.marca || p.bomba_marca || ''} ${bomba?.watts || p.bomba_watts || ''}W — ${bomba?.impulsor || 'centrifuga'}`, notas: '', cantidad: 1, _f: 0 })
  for (const it of kit) {
    if ((it.nombre || '').toLowerCase().includes('bomba')) continue
    items.push({ nombre: it.nombre, notas: it.notas || '', cantidad: it.cantidad, _f: FAM_ORDEN[(it.familia || '').toLowerCase()] ?? 6 })
  }
  items.sort((a, b) => a._f - b._f)

  return (
    <>
      <style>{`
        @media print { .no-print { display: none !important; } body { background: #fff !important; } .sheet { box-shadow: none !important; margin: 0 !important; } }
        @page { size: A4; margin: 12mm; }
      `}</style>
      <div style={{ minHeight: '100vh', background: '#0d1a2a', padding: '24px 12px 60px' }}>
        {/* Barra de acciones */}
        <div className="no-print" style={{ maxWidth: 720, margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <a href="https://www.febecos.com" style={{ color: '#7a9ab5', textDecoration: 'none', fontSize: 13 }}>← Febecos Bombeo Solar</a>
          <button onClick={() => window.print()} style={{ padding: '10px 18px', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>📥 Descargar PDF</button>
        </div>

        {/* Hoja */}
        <div className="sheet" style={{ maxWidth: 720, margin: '0 auto', background: '#fff', borderRadius: 12, padding: '28px 32px', color: '#1a1a18', fontFamily: 'Arial, sans-serif', boxShadow: '0 10px 40px rgba(0,0,0,.4)' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #1a6b3c', paddingBottom: 12, marginBottom: 16 }}>
            <img src="https://www.febecos.com/images/febecos-logo-nav.png" alt="Febecos" style={{ height: 40 }} />
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: 16, margin: 0 }}>Presupuesto {p.numero}</h2>
              <p style={{ margin: '3px 0', color: '#666', fontSize: 11 }}>{fecha}</p>
            </div>
          </div>

          {/* Cliente */}
          {(cliente || p.cliente_razon_social) && (
            <div style={{ background: '#f0f9f4', border: '2px solid #1a6b3c', borderRadius: 10, padding: '12px 18px', marginBottom: 16 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4a7a5a', fontWeight: 700, marginBottom: 5 }}>Presupuesto para</div>
              {p.cliente_razon_social
                ? <>
                    <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{p.cliente_razon_social}</div>
                    {cliente && <div style={{ fontSize: 12, color: '#1a6b3c', fontWeight: 600, marginTop: 2 }}>Contacto: {cliente}</div>}
                  </>
                : <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{cliente}</div>}
              <div style={{ fontSize: 13, color: '#1a6b3c', fontWeight: 600, marginTop: 3 }}>
                {p.cliente_cuit && <>🏢 CUIT {p.cliente_cuit}&nbsp;&nbsp;·&nbsp;&nbsp;</>}
                {p.cliente_telefono && <>📱 {p.cliente_telefono}</>}
                {p.cliente_telefono && p.cliente_zona && <>&nbsp;&nbsp;·&nbsp;&nbsp;</>}
                {p.cliente_zona && <>📍 {p.cliente_zona}</>}
              </div>
            </div>
          )}

          {/* Bomba */}
          <h3 style={sectionTitle}>Equipo</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: 8 }}>
            <Spec label="Código" val={p.bomba_codigo} />
            <Spec label="Modelo" val={`${p.bomba_marca || bomba?.marca || ''} ${p.bomba_watts || bomba?.watts || ''}W`} />
          </div>

          {/* Kit */}
          {items.length > 1 && (
            <>
              <h3 style={sectionTitle}>Kit completo incluido</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 8 }}>
                <thead><tr style={{ background: '#f0f9f4' }}>
                  <th style={{ textAlign: 'left', padding: '5px 8px', fontSize: 10, color: '#666' }}>Componente</th>
                  <th style={{ width: '12%', textAlign: 'center', padding: '5px 8px', fontSize: 10, color: '#666' }}>Cant.</th>
                </tr></thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '4px 8px', fontSize: 11 }}>{it.nombre}{it.notas && <span style={{ color: '#888', fontSize: 9.5 }}> — {it.notas}</span>}</td>
                      <td style={{ textAlign: 'center', padding: '4px 8px', whiteSpace: 'nowrap' }}>×{it.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Precio */}
          {precio != null && (
            <div style={{ background: '#f0f9f4', border: '2px solid #1a6b3c', borderRadius: 8, padding: '12px 18px', margin: '14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, color: '#666' }}>Precio final</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#1a6b3c' }}>{fmt(precio)}</div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid #e2e0d8', fontSize: 11, color: '#666', lineHeight: 1.6 }}>
            {p.revendedor_nombre && <>Asesor: <strong>{p.revendedor_nombre}</strong><br /></>}
            Cotización realizada a través de <strong>febecos.com</strong> · Bombeo Solar Argentina<br />
            Válido por 48 horas desde la fecha de emisión. Sujeto a disponibilidad de stock.
          </div>
        </div>

        {/* CTA al final */}
        <div className="no-print" style={{ maxWidth: 720, margin: '20px auto 0', textAlign: 'center' }}>
          <a href="https://wa.me/5491127399430" target="_blank" rel="noopener" style={{ display: 'inline-block', padding: '12px 24px', background: '#25d366', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>💬 Consultanos por WhatsApp</a>
        </div>
      </div>
    </>
  )
}

const sectionTitle = { fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: '#666', borderBottom: '1px solid #e2e0d8', paddingBottom: 4, margin: '14px 0 10px' }

function Spec({ label, val }: { label: string; val: any }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: 1 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600 }}>{val || '—'}</span>
    </div>
  )
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1a2a', color: '#e8f0f8', fontFamily: 'system-ui, sans-serif', fontSize: 16, padding: 24, textAlign: 'center' }}>
      {children}
    </div>
  )
}
