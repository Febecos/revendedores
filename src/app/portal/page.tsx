'use client'
import { useState, useEffect } from 'react'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wlcmpqwmqwugjwrssatj.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const API_BOMBAS = 'https://simulador-roi-seven.vercel.app/api/suggest-pump'
const API_DETALLE = 'https://simulador-roi-seven.vercel.app/api/pump-detail'

interface Revendedor {
  id: number; nombre: string; apellido: string; empresa: string
  provincia: string; descuento_pct: number; token_acceso: string
  tipo_usuario?: string
}
interface ResultadoBomba {
  sugerencia: any; caudal_a_altura: any; es_fallback: boolean; nota: string; opciones: any[]
}
interface BombaCatalogo {
  codigo: string; marca: string; watts: number; diam_bomba: string
  diam_perf: string; cant_paneles: number; stock: number; precio_full: number
}

function precioMayorista(precio: number, descuento: number) {
  return Math.round(precio * (1 - descuento / 100))
}
function fmt(n: number) {
  return '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

// ── CURVA SVG ──
function CurvaGrafico({ curvas }: { curvas: any[] }) {
  if (!curvas || curvas.length < 2) return null
  const W = 560, H = 160, PL = 40, PR = 16, PT = 12, PB = 28
  const cw = W - PL - PR, ch = H - PT - PB
  const alturas = curvas.map(c => c.altura_m)
  const maxAlt = Math.max(...alturas), minAlt = Math.min(...alturas)
  const maxL = Math.max(...curvas.map(c => c.litros_verano))
  const x = (alt: number) => PL + ((alt - minAlt) / (maxAlt - minAlt || 1)) * cw
  const y = (l: number) => PT + ch - (l / (maxL || 1)) * ch
  const polyline = (vals: number[], color: string) => {
    const pts = curvas.map((c, i) => `${x(c.altura_m).toFixed(1)},${y(vals[i]).toFixed(1)}`).join(' ')
    return <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
  }
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(p => Math.round(maxL * p))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* Grid */}
      {yTicks.map(v => (
        <g key={v}>
          <line x1={PL} y1={y(v)} x2={W - PR} y2={y(v)} stroke="#1e3248" strokeWidth="1" />
          <text x={PL - 4} y={y(v) + 4} textAnchor="end" fontSize="9" fill="#3a5a7a">{(v / 1000).toFixed(1)}k</text>
        </g>
      ))}
      {alturas.map(a => (
        <g key={a}>
          <line x1={x(a)} y1={PT} x2={x(a)} y2={PT + ch} stroke="#1e3248" strokeWidth="1" strokeDasharray="3,3" />
          <text x={x(a)} y={H - 4} textAnchor="middle" fontSize="9" fill="#3a5a7a">{a}m</text>
        </g>
      ))}
      {/* Líneas */}
      {polyline(curvas.map(c => c.litros_verano), '#4ade80')}
      {polyline(curvas.map(c => c.litros_promedio), '#e8f0f8')}
      {polyline(curvas.map(c => c.litros_invierno), '#60a5fa')}
      {/* Puntos verano */}
      {curvas.map(c => <circle key={c.altura_m} cx={x(c.altura_m)} cy={y(c.litros_verano)} r="3" fill="#4ade80" />)}
      {/* Leyenda */}
      <g transform={`translate(${PL + 8}, ${PT + 8})`}>
        <rect width="80" height="42" fill="#0d1a2a" fillOpacity="0.8" rx="4" />
        {[['#4ade80', '☀️ Verano'], ['#e8f0f8', '📅 Promedio'], ['#60a5fa', '❄️ Invierno']].map(([color, label], i) => (
          <g key={label} transform={`translate(6, ${i * 13 + 8})`}>
            <line x1="0" y1="0" x2="12" y2="0" stroke={color as string} strokeWidth="2" />
            <text x="16" y="4" fontSize="9" fill={color as string}>{label}</text>
          </g>
        ))}
      </g>
    </svg>
  )
}

// ── MODAL DETALLE ──
function ModalDetalle({ codigo, descuento, mostrarPublico, onClose }: any) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_DETALLE}?codigo=${encodeURIComponent(codigo)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [codigo])

  const precio = data?.bomba?.precio_full
    ? (mostrarPublico ? data.bomba.precio_full : precioMayorista(data.bomba.precio_full, descuento))
    : null

  // Agrupar kit por familia
  const familias: Record<string, any[]> = {}
  if (data?.kit) {
    for (const item of data.kit) {
      const f = item.familia || 'otro'
      if (!familias[f]) familias[f] = []
      familias[f].push(item)
    }
  }

  // Panel solar del kit
  const panelKit = data?.kit?.find((i: any) => i.familia === 'panel')
  const panelDesc = panelKit
    ? `${panelKit.nombre}${panelKit.potencia_w ? ` — ${panelKit.potencia_w}W` : ''} × ${data?.bomba?.cant_paneles || panelKit.cantidad}`
    : data?.bomba?.cant_paneles ? `${data.bomba.cant_paneles} panel${data.bomba.cant_paneles > 1 ? 'es' : ''} solar${data.bomba.cant_paneles > 1 ? 'es' : ''}` : null

  // HSP (horas solares pico) usadas para el cálculo
  const HSP = { verano: 5.5, promedio: 4, invierno: 3.5 }

  const nombreFamilia: Record<string, string> = {
    panel: '☀️ Paneles solares', soporte: '🔩 Soportes', cable: '🔌 Cables',
    bomba: '⬇️ Bomba', caja: '📦 Controlador', accesorio: '🔧 Accesorios', otro: '📋 Otros'
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#0d1a2a', border: '1px solid #1e3248', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #1e3248', position: 'sticky', top: 0, background: '#0d1a2a', zIndex: 1 }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#e8681a' }}>{codigo}</div>
            <div style={{ fontSize: 11, color: '#7a9ab5', marginTop: 2 }}>Detalle del equipo — datos en tiempo real desde Febecos</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, background: 'transparent', border: '1px solid #1e3248', borderRadius: 8, color: '#7a9ab5', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <div style={{ padding: '20px 22px' }}>
          {loading && <div style={{ textAlign: 'center', padding: 40, color: '#7a9ab5' }}>⏳ Cargando datos...</div>}
          {!loading && !data?.ok && <div style={{ color: '#f87171', textAlign: 'center', padding: 24 }}>No se pudo cargar el detalle.</div>}
          {!loading && data?.ok && (
            <>
              {/* Specs técnicas */}
              <div style={{ background: '#132233', borderRadius: 10, padding: '16px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7a9ab5', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 12 }}>Especificaciones técnicas</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
                  {[
                    ['Marca', data.bomba.marca],
                    ['Tipo', data.bomba.tipo],
                    ['Energía', data.bomba.energia],
                    ['Impulsor', data.bomba.impulsor],
                    ['Potencia bomba', `${data.bomba.watts}W`],
                    ['Voltaje', data.bomba.voltaje],
                    ['Diámetro bomba', `${data.bomba.diam_bomba}"`],
                    ['Diám. perforación mín.', data.bomba.diam_perf],
                    ['Panel solar', panelDesc || `${data.bomba.cant_paneles} panel${data.bomba.cant_paneles > 1 ? 'es' : ''}`],
                    ['Stock disponible', data.bomba.stock > 0 ? `✅ ${data.bomba.stock} unidades` : '❌ Sin stock'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 10, color: '#3a5a7a', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 2 }}>{k}</div>
                      <div style={{ fontSize: 13, color: '#e8f0f8', fontWeight: 600 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Precio */}
              {precio && (
                <div style={{ background: '#132233', borderRadius: 10, padding: '16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7a9ab5', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 8 }}>
                    {mostrarPublico ? 'Precio público' : `Precio mayorista (${descuento}% OFF)`}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#4ade80' }}>{fmt(precio)}</div>
                </div>
              )}

              {/* Curvas de rendimiento */}
              {data.curvas?.length > 0 && (
                <div style={{ background: '#132233', borderRadius: 10, padding: '16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7a9ab5', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 4 }}>
                    Rendimiento (L/día por altura)
                  </div>
                  {/* Subtítulo HSP */}
                  <div style={{ fontSize: 11, color: '#3a5a7a', marginBottom: 12 }}>
                    Calculado con horas solares pico: ☀️ Verano {HSP.verano}h · 📅 Promedio {HSP.promedio}h · ❄️ Invierno {HSP.invierno}h
                  </div>

                  {/* Gráfico SVG */}
                  <div style={{ marginBottom: 16, background: '#0d1a2a', borderRadius: 8, padding: '8px 4px' }}>
                    <CurvaGrafico curvas={data.curvas} />
                  </div>

                  {/* Tabla */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #1e3248' }}>
                          <th style={{ padding: '6px 10px', textAlign: 'right', color: '#3a5a7a', fontWeight: 600 }}>Altura (m)</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right', color: '#4ade80', fontWeight: 600 }}>☀️ Verano ({HSP.verano}h)</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right', color: '#e8f0f8', fontWeight: 600 }}>📅 Promedio ({HSP.promedio}h)</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right', color: '#60a5fa', fontWeight: 600 }}>❄️ Invierno ({HSP.invierno}h)</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right', color: '#7a9ab5', fontWeight: 600 }}>L/hora</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.curvas.map((c: any) => (
                          <tr key={c.altura_m} style={{ borderBottom: '1px solid #162030' }}>
                            <td style={{ padding: '6px 10px', textAlign: 'right', color: '#e8681a', fontWeight: 700, fontFamily: 'monospace' }}>{c.altura_m}m</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', color: '#4ade80', fontFamily: 'monospace' }}>{c.litros_verano.toLocaleString('es-AR')}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', color: '#e8f0f8', fontFamily: 'monospace' }}>{c.litros_promedio.toLocaleString('es-AR')}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', color: '#60a5fa', fontFamily: 'monospace' }}>{c.litros_invierno.toLocaleString('es-AR')}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', color: '#7a9ab5', fontFamily: 'monospace' }}>{c.litros_hora.toLocaleString('es-AR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Kit completo */}
              {data.kit?.length > 0 && (
                <div style={{ background: '#132233', borderRadius: 10, padding: '16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7a9ab5', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 12 }}>Kit completo incluido</div>
                  {Object.entries(familias).map(([familia, items]) => (
                    <div key={familia} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: '#3a5a7a', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                        {nombreFamilia[familia] || familia}
                      </div>
                      {items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #162030' }}>
                          <div>
                            <span style={{ fontSize: 13, color: '#e8f0f8' }}>{item.nombre}</span>
                            {item.potencia_w && <span style={{ fontSize: 11, color: '#4ade80', marginLeft: 8 }}>{item.potencia_w}W</span>}
                            {item.notas && <span style={{ fontSize: 11, color: '#3a5a7a', marginLeft: 8 }}>({item.notas})</span>}
                          </div>
                          <span style={{ fontSize: 12, color: '#7a9ab5', fontFamily: 'monospace', fontWeight: 600 }}>×{item.cantidad}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Portal() {
  const [token, setToken] = useState<string | null>(null)
  const [rev, setRev] = useState<Revendedor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [altura, setAltura] = useState('')
  const [litros, setLitros] = useState('')
  const [diametro, setDiametro] = useState('3')
  const [buscando, setBuscando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoBomba | null>(null)
  const [errCalc, setErrCalc] = useState<string | null>(null)
  const [mostrarPublico, setMostrarPublico] = useState(false)
  const [vieneDeMCA, setVieneDeMCA] = useState(false)
  const [catalogo, setCatalogo] = useState<BombaCatalogo[]>([])
  const [verCatalogo, setVerCatalogo] = useState(false)
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false)
  const [filtroStock, setFiltroStock] = useState<'todos'|'local'|'deposito'>('todos')
  const [modalCodigo, setModalCodigo] = useState<string | null>(null)

  async function buscarBombaConParams(h: string, l: string, d: string) {
    setBuscando(true); setResultado(null); setErrCalc(null)
    try {
      const res = await fetch(`${API_BOMBAS}?height=${h}&liters=${l}&diameter=${d}&season=verano`)
      const data = await res.json()
      if (data.ok) setResultado(data)
      else setErrCalc(data.error || 'No se encontró bomba')
    } catch { setErrCalc('Error de red al buscar bomba.') }
    finally { setBuscando(false) }
  }

  async function cargarCatalogo() {
    if (catalogo.length > 0) { setVerCatalogo(true); return }
    setCargandoCatalogo(true)
    try {
      const res = await fetch(`${API_BOMBAS}?catalog=1`)
      const data = await res.json()
      if (data.ok) setCatalogo(data.catalog || [])
    } catch {}
    finally { setCargandoCatalogo(false) }
    setVerCatalogo(true)
  }

  async function verificarToken(t: string) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/solicitudes_revendedor?token_acceso=eq.${t}&token_acceso_activo=eq.true&select=id,nombre,apellido,empresa,provincia,descuento_pct,token_acceso,tipo_usuario`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      )
      const data = await res.json()
      if (!data || data.length === 0) { setError('token_invalido'); return }
      setRev(data[0])
    } catch { setError('error_red') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token') || localStorage.getItem('febecos-token')
    if (!t) { setError('no_token'); setLoading(false); return }
    // Si vino por URL, guardarlo para próximas veces
    if (params.get('token')) localStorage.setItem('febecos-token', params.get('token')!)
    setToken(t)
    const h = params.get('height'), l = params.get('liters'), d = params.get('diameter'), auto = params.get('auto')
    if (h) setAltura(h); if (l) setLitros(l); if (d) setDiametro(d)
    if (auto === '1') setVieneDeMCA(true)
    verificarToken(t).then(() => {
      if (auto === '1' && h && l && d) setTimeout(() => buscarBombaConParams(h, l, d), 600)
    }).catch(() => {})
  }, [])

  async function buscarBomba() {
    if (!altura || !litros) { setErrCalc('Completá altura y litros.'); return }
    await buscarBombaConParams(altura, litros, diametro)
  }

  function precioMostrar(precio: number) {
    if (!rev) return precio
    return mostrarPublico ? precio : precioMayorista(precio, rev.descuento_pct)
  }

  if (loading) return <Pantalla emoji="⏳" titulo="Verificando acceso..." sub="" />
  if (error === 'no_token') return <Pantalla emoji="🔒" titulo="Acceso restringido" sub="Este portal requiere un link de acceso personalizado." cta={{ label: 'Registrarme', href: 'https://revendedores-six.vercel.app' }} cta2={{ label: 'WhatsApp', href: 'https://wa.me/5491125750323' }} />
  if (error === 'token_invalido') return <Pantalla emoji="❌" titulo="Link inválido o desactivado" sub="Este link no es válido o fue desactivado." cta={{ label: 'Escribinos por WhatsApp', href: 'https://wa.me/5491125750323' }} />
  if (error || !rev) return <Pantalla emoji="⚠️" titulo="Error de conexión" sub="No pudimos verificar tu acceso. Intentá recargar." />

  const catalogoFiltrado = filtroStock === 'local'
    ? catalogo.filter(b => (b.stock || 0) > 0)
    : filtroStock === 'deposito'
    ? catalogo.filter(b => (b.stock || 0) === 0)
    : catalogo

  return (
    <div style={s.wrap}>
      {modalCodigo && (
        <ModalDetalle
          codigo={modalCodigo}
          descuento={rev.descuento_pct}
          mostrarPublico={mostrarPublico}
          onClose={() => setModalCodigo(null)}
        />
      )}

      <div style={s.header}>
        <div style={s.headerInner}>
          <div>
            <img src="https://dcdn-us.mitiendanube.com/stores/007/467/093/themes/common/logo-6209403414584676726-1775575296-91ab6514e309ebf33862eadc64bcbe161775575296-480-0.webp" alt="Febecos" style={{ height: 32, objectFit: 'contain' as const }} />
            <div style={s.headerSub}>Portal de Revendedores</div>
          </div>
          <div style={s.headerRight}>
            <div style={s.revendedorBadge}>
              <span style={{ fontSize: 18 }}>👤</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{rev.nombre} {rev.apellido}</div>
                <div style={{ fontSize: 11, color: '#7a9ab5' }}>{rev.empresa || rev.provincia}</div>
              </div>
            </div>
            <div style={s.descuentoBadge}>{rev.descuento_pct}% OFF</div>
            <button onClick={() => { localStorage.removeItem('febecos-token'); window.location.href = 'https://revendedores-six.vercel.app' }} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #1e3248', borderRadius: 8, color: '#7a9ab5', fontSize: 12, cursor: 'pointer' }}>
              Salir
            </button>
          </div>
        </div>
      </div>

      <div style={s.content}>

        {!vieneDeMCA && (
          <div style={s.bannerMCA}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>🔢 ¿Necesitás calcular la MCA primero?</div>
              <div style={{ fontSize: 13, color: '#7a9ab5' }}>Usá la calculadora hidráulica completa para instalaciones complejas</div>
            </div>
            <a href={`https://selector.febecos.com/calculadora-mca.html?token=${token}`} style={s.btnMCA} target="_blank" rel="noopener noreferrer">Ir a Calculadora MCA →</a>
          </div>
        )}

        {vieneDeMCA && (
          <div style={{ ...s.bannerMCA, background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.25)' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: '#4ade80' }}>✅ Datos cargados desde la Calculadora MCA</div>
              <div style={{ fontSize: 13, color: '#7a9ab5' }}>Altura: {altura}m · Litros: {parseInt(litros).toLocaleString('es-AR')} L/día · Diámetro: {diametro}"</div>
            </div>
            <a href={`https://selector.febecos.com/calculadora-mca.html?token=${token}`} style={{ ...s.btnMCA, background: 'transparent', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }}>← Volver a MCA</a>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap' as const, gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#7a9ab5' }}>Ver precios:</span>
            <div style={s.toggleBtns}>
              <button onClick={() => setMostrarPublico(false)} style={{ ...s.toggleBtn, ...(mostrarPublico ? {} : s.toggleBtnActive) }}>Mayorista ({rev.descuento_pct}% OFF)</button>
              <button onClick={() => setMostrarPublico(true)} style={{ ...s.toggleBtn, ...(mostrarPublico ? s.toggleBtnActive : {}) }}>Precio público</button>
            </div>
          </div>
          <button
            onClick={() => verCatalogo ? setVerCatalogo(false) : cargarCatalogo()}
            style={{
              padding: '7px 16px', background: verCatalogo ? '#1e3248' : 'rgba(232,104,26,0.12)',
              border: `1px solid ${verCatalogo ? '#2a4a6a' : '#e8681a'}`,
              borderRadius: 8, color: verCatalogo ? '#7a9ab5' : '#e8681a',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const,
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            {cargandoCatalogo ? '⏳ Cargando...' : verCatalogo ? '✕ Ocultar catálogo' : '📋 Ver catálogo de bombas'}
          </button>
        </div>

        {/* CALCULADORA */}
        <div style={s.card}>
          <div style={s.cardTitle}>🔍 Buscar bomba para tu cliente</div>
          <div style={s.calcGrid}>
            <div style={s.campo}>
              <label style={s.label}>Altura total (MCA)</label>
              <input style={s.input} type="number" placeholder="Ej: 45" value={altura} onChange={e => setAltura(e.target.value)} />
              <span style={s.hint}>Profundidad + almacenamiento + fricción</span>
            </div>
            <div style={s.campo}>
              <label style={s.label}>Litros/día necesarios</label>
              <input style={s.input} type="number" placeholder="Ej: 5000" value={litros} onChange={e => setLitros(e.target.value)} />
            </div>
            <div style={s.campo}>
              <label style={s.label}>Bomba que entra (diámetro)</label>
              <select style={s.input} value={diametro} onChange={e => setDiametro(e.target.value)}>
                <option value="2">2" — perforación 63mm o más</option>
                <option value="3">3" — perforación 80mm o más</option>
                <option value="4">4" — perforación 110mm o más</option>
                <option value="6">6" — perforación 160mm o más</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button style={{ ...s.btnBuscar, opacity: buscando ? 0.7 : 1 }} onClick={buscarBomba} disabled={buscando}>
                {buscando ? 'Buscando...' : '🔍 Buscar bomba'}
              </button>
            </div>
          </div>
          {errCalc && <p style={s.errorTxt}>{errCalc}</p>}
        </div>

        {/* RESULTADO BÚSQUEDA */}
        {resultado && (
          <div style={s.card}>
            <div style={s.cardTitle}>{resultado.es_fallback ? '⚠️ Opción más cercana' : '✅ Bomba recomendada'}</div>
            <BombaCard bomba={resultado.sugerencia} caudal={resultado.caudal_a_altura} nota={resultado.nota} descuento={rev.descuento_pct} mostrarPublico={mostrarPublico} precioMostrar={precioMostrar} wa={rev} litros={Number(litros)} altura={Number(altura)} onVerDetalle={setModalCodigo} />
            {resultado.opciones && resultado.opciones.length > 1 && (
              <>
                <div style={{ ...s.cardTitle, marginTop: 20, fontSize: 12 }}>Otras opciones válidas</div>
                {resultado.opciones.slice(1).map((b: any, i: number) => (
                  <BombaCard key={i} bomba={b} caudal={{ verano: b.caudal_verano, invierno: b.caudal_invierno, promedio: b.caudal_promedio || Math.round((b.caudal_verano + b.caudal_invierno) / 2) }} descuento={rev.descuento_pct} mostrarPublico={mostrarPublico} precioMostrar={precioMostrar} wa={rev} litros={Number(litros)} altura={Number(altura)} compact onVerDetalle={setModalCodigo} />
                ))}
              </>
            )}
          </div>
        )}

        {/* CATÁLOGO */}
        {verCatalogo && catalogo.length > 0 && (
          <div style={s.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ ...s.cardTitle, marginBottom: 0 }}>🔋 Catálogo de bombas</div>
              <div style={s.toggleBtns}>
                <button onClick={() => setFiltroStock('todos')} style={{ ...s.toggleBtn, ...(filtroStock==='todos' ? s.toggleBtnActive : {}) }}>Todos ({catalogo.length})</button>
                <button onClick={() => setFiltroStock('local')} style={{ ...s.toggleBtn, ...(filtroStock==='local' ? s.toggleBtnActive : {}), color: filtroStock==='local' ? '#e8f0f8' : '#22c55e' }}>✅ En local — 72hs ({catalogo.filter(b=>(b.stock||0)>0).length})</button>
                <button onClick={() => setFiltroStock('deposito')} style={{ ...s.toggleBtn, ...(filtroStock==='deposito' ? s.toggleBtnActive : {}), color: filtroStock==='deposito' ? '#e8f0f8' : '#fb923c' }}>📦 A verificar ({catalogo.filter(b=>(b.stock||0)===0).length})</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
              {catalogoFiltrado.map((b) => {
                const conStock = (b.stock || 0) > 0
                const precio = b.precio_full ? (mostrarPublico ? b.precio_full : precioMayorista(b.precio_full, rev.descuento_pct)) : null
                const msg = encodeURIComponent(`Hola Febecos! Soy revendedor (${rev.nombre} ${rev.apellido || ''}).\nConsulto disponibilidad de *${b.codigo}*${precio ? ` — precio mayorista: ${fmt(precio)}` : ''}.`)
                return (
                  <div key={b.codigo} style={{ ...s.bombaCard, padding: '14px 16px', opacity: conStock ? 1 : 0.65, borderColor: conStock ? '#1e3248' : '#162030' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: conStock ? '#e8681a' : '#7a9ab5', marginBottom: 6 }}>{b.codigo}</div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#7a9ab5', flexWrap: 'wrap' as const, marginBottom: 10 }}>
                      <span>{b.watts}W</span><span>·</span>
                      <span>{b.cant_paneles} panel{b.cant_paneles > 1 ? 'es' : ''}</span><span>·</span>
                      <span>Bomba {b.diam_bomba}"</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        {precio ? (
                          <>
                            <div style={{ fontSize: 15, fontWeight: 800, color: conStock ? '#4ade80' : '#7a9ab5' }}>{fmt(precio)}</div>
                            {!mostrarPublico && b.precio_full && <div style={{ fontSize: 10, color: '#3a5a7a' }}>Público: {fmt(b.precio_full)}</div>}
                          </>
                        ) : <div style={{ fontSize: 12, color: '#3a5a7a' }}>Precio a confirmar</div>}
                        <div style={{ fontSize: 11, fontWeight: 600, color: conStock ? '#22c55e' : '#fb923c', marginTop: 4 }}>
                          {conStock ? `✅ En local · Stock: ${b.stock} · Entrega 72hs` : '📦 A verificar en depósito'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                        <button onClick={() => setModalCodigo(b.codigo)} style={{ padding: '6px 10px', background: '#1e3248', border: '1px solid #2a4a6a', borderRadius: 7, color: '#e8f0f8', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                          Ver detalle →
                        </button>
                        <a href={`https://wa.me/5491125750323?text=${msg}`} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 10px', background: '#25d366', color: '#fff', borderRadius: 7, textDecoration: 'none', fontWeight: 700, fontSize: 11, textAlign: 'center' as const, whiteSpace: 'nowrap' as const }}>
                          Consultar →
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* INFO CARDS */}
        <div style={s.infoGrid}>
          <div style={s.infoCard}><div style={s.infoEmoji}>💰</div><div style={s.infoTitulo}>Tu descuento</div><div style={s.infoVal}>{rev.descuento_pct}%</div><div style={s.infoSub}>sobre precio de lista en todos los equipos</div></div>
          <div style={s.infoCard}><div style={s.infoEmoji}>🔢</div><div style={s.infoTitulo}>Calculadora MCA</div><div style={s.infoSub}><a href={`https://selector.febecos.com/calculadora-mca.html?token=${token}`} style={{ color: '#e8681a', fontWeight: 700 }} target="_blank" rel="noopener noreferrer">Abrir calculadora →</a></div></div>
          <div style={s.infoCard}><div style={s.infoEmoji}>🤝</div><div style={s.infoTitulo}>Soporte técnico</div><div style={s.infoSub}><a href="https://wa.me/5491125750323" style={{ color: '#e8681a', fontWeight: 700 }}>WhatsApp directo →</a></div></div>
          <div style={s.infoCard}><div style={s.infoEmoji}>📦</div><div style={s.infoTitulo}>Stock en tiempo real</div><div style={s.infoSub}>Precios y disponibilidad actualizados automáticamente</div></div>
        </div>

      </div>
    </div>
  )
}

function BombaCard({ bomba, caudal, nota, descuento, mostrarPublico, precioMostrar, wa, litros, altura, compact = false, onVerDetalle }: any) {
  const precio = precioMostrar(bomba.precio_full)
  const precioPublico = bomba.precio_full
  const msg = encodeURIComponent(
    `Hola Febecos! Soy revendedor (${wa.nombre} ${wa.apellido || ''}, ${wa.empresa || wa.provincia}).\n` +
    `Consulto por bomba *${bomba.codigo}* para cliente con ${litros} L/día a ${altura}m.\n` +
    `Precio mayorista: ${fmt(precioMayorista(precioPublico, descuento))}`
  )
  return (
    <div style={{ ...s.bombaCard, padding: compact ? '12px 16px' : '20px' }}>
      <div style={s.bombaCodigo}>{bomba.codigo}</div>
      <div style={s.bombaDetails}>
        <span>{bomba.watts}W</span><span>·</span>
        <span>{bomba.cant_paneles} panel{bomba.cant_paneles > 1 ? 'es' : ''}</span><span>·</span>
        <span>Bomba {bomba.diam_bomba || bomba.diam_perf || '—'}"</span><span>·</span>
        <span style={{ color: bomba.stock > 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
          {bomba.stock > 0 ? `Stock: ${bomba.stock}` : 'Sin stock'}
        </span>
      </div>
      {caudal && (
        <div style={s.caudalRow}>
          <div style={s.caudalItem}><span style={s.caudalLbl}>Verano</span><span style={s.caudalVal}>{(caudal.verano || 0).toLocaleString('es-AR')} L/día</span></div>
          <div style={s.caudalItem}><span style={s.caudalLbl}>Promedio</span><span style={s.caudalVal}>{(caudal.promedio || 0).toLocaleString('es-AR')} L/día</span></div>
          <div style={s.caudalItem}><span style={s.caudalLbl}>Invierno</span><span style={s.caudalVal}>{(caudal.invierno || 0).toLocaleString('es-AR')} L/día</span></div>
        </div>
      )}
      <div style={s.precioRow}>
        <div>
          <div style={s.precioLabel}>{mostrarPublico ? 'Precio público' : `Precio mayorista (${descuento}% OFF)`}</div>
          <div style={s.precioVal}>{fmt(precio)}</div>
          {!mostrarPublico && (
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 11, color: '#7a9ab5' }}>Precio público: {fmt(precioPublico)}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#4ade80', marginTop: 3 }}>
                {wa?.tipo_usuario === 'interno' ? '💼 Tu comisión:' : '💰 Tu ganancia:'} {fmt(precioPublico - precio)}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, alignItems: 'flex-end' }}>
          <button onClick={() => onVerDetalle(bomba.codigo)} style={{ padding: '8px 14px', background: '#1e3248', border: '1px solid #2a4a6a', borderRadius: 8, color: '#e8f0f8', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
            Ver detalle del equipo →
          </button>
          <a href={`https://wa.me/5491125750323?text=${msg}`} target="_blank" rel="noopener noreferrer" style={s.btnWA}>
            Consultar stock →
          </a>
        </div>
      </div>
      {nota && !compact && <div style={s.notaTxt}>{nota}</div>}
    </div>
  )
}

function Pantalla({ emoji, titulo, sub, cta, cta2 }: any) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1a2a', padding: 24 }}>
      <div style={{ background: '#132233', border: '1px solid #1e3248', borderRadius: 16, padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>{emoji}</div>
        <h2 style={{ color: '#e8f0f8', marginBottom: 12, fontSize: 20 }}>{titulo}</h2>
        <p style={{ color: '#7a9ab5', lineHeight: 1.7, marginBottom: 24 }}>{sub}</p>
        {cta && <a href={cta.href} style={{ display: 'inline-block', padding: '12px 24px', background: '#e8681a', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700, marginRight: 8 }}>{cta.label}</a>}
        {cta2 && <a href={cta2.href} style={{ display: 'inline-block', padding: '12px 24px', background: '#25d366', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>{cta2.label}</a>}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { minHeight: '100vh', background: '#0d1a2a', color: '#e8f0f8', fontFamily: "'DM Sans', sans-serif" },
  header: { background: '#0a1520', borderBottom: '1px solid #1e3248', padding: '0 24px' },
  headerInner: { maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' },
  headerSub: { fontSize: 11, color: '#7a9ab5', marginTop: 2 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  revendedorBadge: { display: 'flex', alignItems: 'center', gap: 8, background: '#132233', border: '1px solid #1e3248', borderRadius: 8, padding: '8px 12px' },
  descuentoBadge: { background: '#e8681a', color: '#fff', borderRadius: 8, padding: '6px 12px', fontWeight: 800, fontSize: 13 },
  content: { maxWidth: 900, margin: '0 auto', padding: '24px' },
  bannerMCA: { background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const },
  btnMCA: { padding: '8px 16px', background: '#60a5fa', color: '#0d1a2a', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' as const },
  toggleWrap: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  toggleBtns: { display: 'flex', gap: 4, background: '#132233', borderRadius: 8, padding: 4, border: '1px solid #1e3248' },
  toggleBtn: { padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: 'transparent', color: '#7a9ab5', transition: 'all 0.15s' },
  toggleBtnActive: { background: '#1e3248', color: '#e8f0f8' },
  card: { background: '#132233', border: '1px solid #1e3248', borderRadius: 12, padding: '20px 24px', marginBottom: 16 },
  cardTitle: { fontSize: 13, fontWeight: 700, color: '#7a9ab5', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 16 },
  calcGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 },
  campo: { display: 'flex', flexDirection: 'column' as const, gap: 4 },
  label: { fontSize: 12, fontWeight: 600, color: '#7a9ab5' },
  input: { padding: '10px 12px', background: '#0d1a2a', border: '1px solid #1e3248', borderRadius: 8, color: '#e8f0f8', fontSize: 14, fontFamily: 'inherit' },
  hint: { fontSize: 11, color: '#3a5a7a' },
  btnBuscar: { width: '100%', padding: '11px 16px', background: '#e8681a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  errorTxt: { color: '#f87171', fontSize: 13, marginTop: 12 },
  bombaCard: { background: '#0d1a2a', border: '1px solid #1e3248', borderRadius: 10, marginBottom: 10 },
  bombaCodigo: { fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#e8681a', marginBottom: 6 },
  bombaDetails: { display: 'flex', gap: 8, fontSize: 12, color: '#7a9ab5', flexWrap: 'wrap' as const, marginBottom: 12 },
  caudalRow: { display: 'flex', gap: 16, marginBottom: 16 },
  caudalItem: { display: 'flex', flexDirection: 'column' as const, gap: 2 },
  caudalLbl: { fontSize: 10, color: '#3a5a7a', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  caudalVal: { fontSize: 14, fontWeight: 600, color: '#e8f0f8' },
  precioRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' as const },
  precioLabel: { fontSize: 11, color: '#7a9ab5', marginBottom: 4 },
  precioVal: { fontSize: 24, fontWeight: 800, color: '#4ade80' },
  btnWA: { display: 'inline-block', padding: '8px 14px', background: '#25d366', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' as const },
  notaTxt: { fontSize: 12, color: '#7a9ab5', marginTop: 12, padding: '8px 12px', background: '#132233', borderRadius: 6 },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 8 },
  infoCard: { background: '#132233', border: '1px solid #1e3248', borderRadius: 10, padding: '16px 18px' },
  infoEmoji: { fontSize: 22, marginBottom: 8 },
  infoTitulo: { fontSize: 11, fontWeight: 700, color: '#7a9ab5', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 6 },
  infoVal: { fontSize: 28, fontWeight: 800, color: '#4ade80', marginBottom: 4 },
  infoSub: { fontSize: 12, color: '#3a5a7a', lineHeight: 1.5 },
}
