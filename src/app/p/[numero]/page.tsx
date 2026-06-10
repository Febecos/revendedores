'use client'
import { useEffect, useState } from 'react'

const fmt = (n: number | null | undefined) =>
  n != null ? '$ ' + Math.round(n).toLocaleString('es-AR') : '—'

const FAM_ORDEN: Record<string, number> = { bomba: 0, panel: 1, soporte: 2, caja: 3, proteccion: 3, cable: 4, accesorio: 5, otros: 6, otro: 6 }
const HSP = { verano: 5.5, promedio: 4, invierno: 3.5 }

export default function PresupuestoPublico({ params }: { params: { numero: string } }) {
  const [p, setP] = useState<any>(null)
  const [bomba, setBomba] = useState<any>(null)
  const [kit, setKit] = useState<any[]>([])
  const [curvas, setCurvas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/api/presupuesto-publico?t=${encodeURIComponent(params.numero)}`)
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
  const descuento = p.descuento_pct ? Number(p.descuento_pct) : 0
  const mostrarPublico = descuento === 0
  const fecha = p.created_at ? new Date(p.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
  const nombreCliente = [p.cliente_nombre, p.cliente_apellido].filter(Boolean).join(' ')
  const profundidadM: number = parseFloat(p.profundidad_m) || 0
  const busquedaMCA: number | null = p.altura_m ? parseFloat(p.altura_m) : null
  const busquedaLitros: number | null = p.litros_dia ? parseFloat(p.litros_dia) : null

  // Kit: bomba + items reales con notas, ordenado por familia — cantidades base ×N
  const items: { nombre: string; notas: string; cantidad: number; _f: number }[] = []
  items.push({ nombre: `Bomba ${bomba?.marca || p.bomba_marca || ''} ${bomba?.watts || p.bomba_watts || ''}W — ${bomba?.impulsor || 'centrifuga'}`, notas: '', cantidad: 1, _f: 0 })
  for (const it of kit) {
    if ((it.nombre || '').toLowerCase().includes('bomba')) continue
    if (/\bmc4\b|ficha mc/i.test(it.nombre || '')) continue
    items.push({ nombre: it.nombre + (it.potencia_w ? ` ${it.potencia_w}W` : ''), notas: it.notas || '', cantidad: it.cantidad, _f: FAM_ORDEN[(it.familia || '').toLowerCase()] ?? 6 })
  }
  items.sort((a, b) => a._f - b._f)

  // Panel del kit para descripción técnica
  const panelKit = kit.find((i: any) => i.familia === 'panel')

  // IVA desglose (solo para mayoristas o con CUIT)
  const mostrarDesglose = !mostrarPublico || !!p.cliente_cuit
  const panelPublico = kit.filter((i: any) => (i.familia || '').toLowerCase() === 'panel').reduce((s: number, i: any) => s + (i.precio_ars || 0) * (i.cantidad || 1), 0)
  const factorDesc = mostrarPublico ? 1 : (1 - descuento / 100)
  const panelEnPrecio = panelPublico * factorDesc
  const netoPanel = precio ? Math.round(panelEnPrecio / 1.105) : 0
  const netoResto = precio ? Math.round((precio - panelEnPrecio) / 1.21) : 0
  const netoTotal = netoPanel + netoResto
  const ivaTotal  = precio ? precio - netoTotal : 0

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .sheet { box-shadow: none !important; margin: 0 !important; padding: 16px 24px !important; border-radius: 0 !important; }
          .page-break { page-break-before: always; }
        }
        @page { size: A4; margin: 12mm; }
      `}</style>
      <div style={{ minHeight: '100vh', background: '#0d1a2a', padding: '24px 12px 60px' }}>
        {/* Barra de acciones */}
        <div className="no-print" style={{ maxWidth: 720, margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <a href="https://www.febecos.com" style={{ color: '#7a9ab5', textDecoration: 'none', fontSize: 13 }}>← Febecos Bombeo Solar</a>
          <button onClick={() => window.print()} style={{ padding: '10px 18px', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>📥 Descargar PDF</button>
        </div>

        {/* ── PÁGINA 1: Presupuesto completo ──────────────────────────────── */}
        <div className="sheet" style={{ maxWidth: 720, margin: '0 auto', background: '#fff', borderRadius: 12, padding: '28px 32px', color: '#1a1a18', fontFamily: 'Arial, sans-serif', boxShadow: '0 10px 40px rgba(0,0,0,.4)' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #1a6b3c', paddingBottom: 12, marginBottom: 16 }}>
            {p.rev_logo ? (
              <div>
                <img src={p.rev_logo} alt={p.rev_empresa || 'Logo'} style={{ height: 42, maxWidth: 200, objectFit: 'contain' }} />
                {p.rev_empresa && <div style={{ fontSize: 10, color: '#555', marginTop: 3 }}>{p.rev_empresa}{p.rev_cuit ? ` · CUIT ${p.rev_cuit}` : ''}</div>}
                {p.rev_domicilio && <div style={{ fontSize: 10, color: '#888' }}>📍 {p.rev_domicilio}</div>}
              </div>
            ) : (
              <div>
                <img src="https://selector.febecos.com/images/febecos-logo.png" alt="Febecos" style={{ height: 40, objectFit: 'contain' }} />
                <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>Bombeo Solar — febecos.com</div>
              </div>
            )}
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: 16, margin: 0 }}>Presupuesto N° {p.numero}</h2>
              <p style={{ margin: '3px 0', color: '#666', fontSize: 11 }}>Fecha: {fecha}</p>
              <p style={{ margin: '3px 0', color: '#666', fontSize: 11 }}>⏱ Válido por 48 horas</p>
            </div>
          </div>

          {/* Cliente — con "Sr./Sra." si es persona física */}
          {(nombreCliente || p.cliente_razon_social) && (
            <div style={{ background: '#f0f9f4', border: '2px solid #1a6b3c', borderRadius: 10, padding: '12px 18px', marginBottom: 16 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4a7a5a', fontWeight: 700, marginBottom: 5 }}>Presupuesto para</div>
              {p.cliente_razon_social
                ? <>
                    <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{p.cliente_razon_social}</div>
                    {nombreCliente && <div style={{ fontSize: 12, color: '#1a6b3c', fontWeight: 600, marginTop: 2 }}>Contacto: {nombreCliente}</div>}
                  </>
                : <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>Sr./Sra. {nombreCliente}</div>
              }
              <div style={{ fontSize: 13, color: '#1a6b3c', fontWeight: 600, marginTop: 3 }}>
                {p.cliente_cuit && <>🏢 CUIT {p.cliente_cuit}&nbsp;&nbsp;·&nbsp;&nbsp;</>}
                {p.cliente_telefono && <>📱 {p.cliente_telefono}</>}
                {p.cliente_telefono && p.cliente_zona && <>&nbsp;&nbsp;·&nbsp;&nbsp;</>}
                {p.cliente_zona && <>📍 {p.cliente_zona}</>}
              </div>
            </div>
          )}

          {/* Equipo */}
          <h3 style={sectionTitle}>Equipo de bombeo solar</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px 16px', marginBottom: 14 }}>
            <Spec label="Marca"              val={bomba?.marca    || p.bomba_marca || '—'} />
            <Spec label="Tipo"               val={bomba?.impulsor || '—'} />
            <Spec label="Potencia"           val={`${bomba?.watts || p.bomba_watts || '—'} W`} />
            <Spec label="Voltaje"            val={bomba?.voltaje  || '—'} />
            <Spec label="Paneles solares"    val={bomba?.cant_paneles ?? '—'} />
            <Spec label="Diám. bomba"        val={bomba?.diam_bomba ? `${bomba.diam_bomba}"` : '—'} />
            <Spec label="Diám. perf. mín."   val={bomba?.diam_perf || '—'} />
            <Spec label="Disponibilidad"     val={bomba ? (bomba.stock > 0 ? `✅ ${bomba.stock} en stock` : '⚠ Sin stock') : '—'} color={bomba?.stock > 0 ? '#1a6b3c' : '#c45c00'} />
          </div>

          {/* Precio */}
          {precio != null && (
            <>
              <div style={{ background: '#f0f9f4', border: '2px solid #1a6b3c', borderRadius: 8, padding: '10px 16px', margin: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>
                    {mostrarPublico ? 'Precio público' : `Precio especial (${descuento}% descuento)`}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#1a6b3c' }}>{fmt(precio)}</div>
                </div>
                {!mostrarPublico && bomba?.precio_full && (
                  <div style={{ fontSize: 11, color: '#666' }}>Precio de lista: {fmt(bomba.precio_full)}</div>
                )}
              </div>
              {mostrarDesglose && precio > 0 && (
                <div style={{ border: '1px solid #dde8dd', borderRadius: 6, padding: '8px 14px', margin: '-6px 0 10px', fontSize: 10, color: '#555', display: 'flex', gap: 28, flexWrap: 'wrap' as const }}>
                  <div><span style={{ color: '#888' }}>Neto gravado total:</span> <strong style={{ color: '#1a1a18' }}>{fmt(netoTotal)}</strong></div>
                  <div><span style={{ color: '#888' }}>IVA incluido total:</span> <strong style={{ color: '#1a1a18' }}>{fmt(ivaTotal)}</strong></div>
                  <div style={{ fontSize: 9, color: '#aaa', alignSelf: 'center' }}>Paneles 10,5% · Resto 21%</div>
                </div>
              )}
            </>
          )}

          {/* Curva de rendimiento — INLINE (misma página) */}
          {curvas.length > 0 && (
            <>
              <h3 style={sectionTitle}>Rendimiento (L/día por altura)</h3>
              <div style={{ fontSize: 10, color: '#888', marginBottom: 6 }}>
                Calculado con horas solares pico regionales · ☀️ Verano {HSP.verano}h · 📅 Promedio {HSP.promedio}h · ❄️ Invierno {HSP.invierno}h
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 8 }}>
                <thead>
                  <tr style={{ background: '#1a6b3c', color: '#fff' }}>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Altura</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Verano</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Promedio</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Invierno</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>L/hora</th>
                  </tr>
                </thead>
                <tbody>
                  {curvas.map((c: any, i: number) => {
                    const esPozo = profundidadM > 0 && Math.abs(c.altura_m - profundidadM) <= 5
                    return (
                      <tr key={i} style={{ background: esPozo ? '#e8f5ee' : (i % 2 === 0 ? '#fafafa' : '#fff'), fontWeight: esPozo ? 700 : 400 }}>
                        <td style={{ padding: '4px 8px', textAlign: 'right', color: esPozo ? '#1a6b3c' : '#e8681a' }}>{c.altura_m}m{esPozo ? ' ◄' : ''}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right' }}>{(c.litros_verano || 0).toLocaleString('es-AR')}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right' }}>{(c.litros_promedio || 0).toLocaleString('es-AR')}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right' }}>{(c.litros_invierno || 0).toLocaleString('es-AR')}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', color: '#888' }}>{(c.litros_hora || 0).toLocaleString('es-AR')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </>
          )}

          {/* Kit */}
          {items.length > 1 && (
            <>
              <h3 style={sectionTitle}>Kit completo incluido</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 8, tableLayout: 'fixed' }}>
                <thead><tr style={{ background: '#f7f6f2' }}>
                  <th style={{ textAlign: 'left', padding: '5px 8px', fontSize: 10, color: '#666', width: '88%' }}>Componente</th>
                  <th style={{ width: '12%', textAlign: 'center', padding: '5px 8px', fontSize: 10, color: '#666' }}>Cant.</th>
                </tr></thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f0eeea' }}>
                      <td style={{ padding: '4px 8px', fontSize: 11 }}>
                        {it.nombre}
                        {it.notas && <span style={{ color: '#888', fontSize: 9.5 }}> — {it.notas}</span>}
                      </td>
                      <td style={{ textAlign: 'center', padding: '4px 8px', whiteSpace: 'nowrap' }}>
                        ×{it.cantidad}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Footer */}
          <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid #e2e0d8', fontSize: 10, color: '#888', lineHeight: 1.6 }}>
            {p.rev_logo
              ? <>{p.rev_empresa || p.revendedor_nombre}<br /></>
              : p.revendedor_nombre
                ? <>Revendedor: <strong>{p.revendedor_nombre}</strong><br /></>
                : null
            }
            Cotización realizada a través de la plataforma de cotizaciones de <strong>febecos.com</strong> · Bombeo Solar Argentina<br />
            Válido por 48 horas desde la fecha de emisión. Sujeto a disponibilidad de stock.
          </div>
        </div>

        {/* ── PÁGINA 2: Por qué este equipo (solo si hay datos técnicos) ──── */}
        {(busquedaMCA || busquedaLitros || profundidadM > 0) && (
          <div className="sheet page-break" style={{ maxWidth: 720, margin: '32px auto 0', background: '#fff', borderRadius: 12, padding: '28px 32px', color: '#1a1a18', fontFamily: 'Arial, sans-serif', boxShadow: '0 10px 40px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #1a6b3c', paddingBottom: 12, marginBottom: 16 }}>
              {p.rev_logo
                ? <div><img src={p.rev_logo} alt={p.rev_empresa || 'Logo'} style={{ height: 32, maxWidth: 160, objectFit: 'contain' }} /></div>
                : <div><span style={{ fontSize: 16, fontWeight: 800, color: '#1a6b3c' }}>Febecos</span><span style={{ fontSize: 11, color: '#666' }}> · Bombeo Solar Argentina</span></div>
              }
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: 13, margin: 0 }}>Análisis técnico — Pres. {p.numero}</h2>
                <p style={{ margin: '3px 0', color: '#888', fontSize: 11 }}>Documento complementario</p>
              </div>
            </div>

            <h3 style={sectionTitleGreen}>Necesidad relevada del sistema</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px 20px', marginBottom: 16 }}>
              {busquedaMCA != null && <InfoBox label="Altura manométrica total" val={`${busquedaMCA.toFixed(1)} MCA`} />}
              {busquedaLitros != null && <InfoBox label="Caudal requerido" val={`${busquedaLitros.toLocaleString('es-AR')} L/día`} />}
              {profundidadM > 0 && <InfoBox label="Profundidad del pozo" val={`${profundidadM} m`} />}
            </div>

            <h3 style={sectionTitleGreen}>Por qué se seleccionó este equipo</h3>
            <div style={{ background: '#f7f6f2', borderRadius: 8, padding: '12px 16px', marginBottom: 14, fontSize: 12, lineHeight: 1.7, color: '#333' }}>
              {busquedaMCA != null && busquedaLitros != null
                ? <>La búsqueda requería una bomba capaz de elevar al menos <strong>{busquedaLitros.toLocaleString('es-AR')} litros por día</strong> a una altura manométrica de <strong>{busquedaMCA.toFixed(1)} MCA</strong> desde un pozo de <strong>{profundidadM} metros</strong> de profundidad.</>
                : <>La bomba fue seleccionada considerando la profundidad del pozo ({profundidadM} m) y las características del sistema.</>
              }
              <br />
              El equipo <strong>{bomba?.marca || p.bomba_marca || ''} {bomba?.watts || p.bomba_watts || ''}W</strong> cumple con estos requerimientos operando con <strong>{bomba?.cant_paneles || '?'} panel{(bomba?.cant_paneles || 1) > 1 ? 'es' : ''} solar{(bomba?.cant_paneles || 1) > 1 ? 'es' : ''} de {panelKit?.potencia_w || panelKit?.nombre?.match(/(\d+)\s*[Ww]/)?.[1] || bomba?.watts || '?'}W</strong> en condiciones de irradiación solar típicas de la región.
            </div>

            <div style={{ marginTop: 24, paddingTop: 10, borderTop: '1px solid #e2e0d8', fontSize: 10, color: '#888', lineHeight: 1.6 }}>
              Este análisis es orientativo. Los caudales reales pueden variar según la irradiación solar local, la temperatura del agua y el estado del pozo.<br />
              {p.rev_logo
                ? <>Para consultas: <strong>{p.revendedor_email || ''}</strong></>
                : <>Para asesoramiento técnico: <strong>ventas@febecos.com</strong> · febecos.com</>
              }
            </div>
          </div>
        )}

        {/* CTA al final */}
        <div className="no-print" style={{ maxWidth: 720, margin: '20px auto 0', textAlign: 'center' }}>
          <a href="https://wa.me/5491127399430" target="_blank" rel="noopener" style={{ display: 'inline-block', padding: '12px 24px', background: '#25d366', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>💬 Consultanos por WhatsApp</a>
        </div>
      </div>
    </>
  )
}

const sectionTitle = { fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: '#666', borderBottom: '1px solid #e2e0d8', paddingBottom: 4, margin: '14px 0 10px' as const }
const sectionTitleGreen = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: '#1a6b3c', borderBottom: '2px solid #1a6b3c', paddingBottom: 5, margin: '18px 0 12px' as const }

function Spec({ label, val, color }: { label: string; val: any; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: 1 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: color || '#1a1a18' }}>{val || '—'}</span>
    </div>
  )
}

function InfoBox({ label, val }: { label: string; val: string }) {
  return (
    <div style={{ background: '#f0f9f4', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 9, textTransform: 'uppercase' as const, color: '#4a7a5a', letterSpacing: '.06em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#1a6b3c' }}>{val}</div>
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
