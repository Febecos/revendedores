'use client'
import { useState, useEffect } from 'react'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wlcmpqwmqwugjwrssatj.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const API_BOMBAS = 'https://simulador-roi-seven.vercel.app/api/suggest-pump'

interface Revendedor {
  id: number
  nombre: string
  apellido: string
  empresa: string
  provincia: string
  descuento_pct: number
  token_acceso: string
}

interface Bomba {
  codigo: string
  marca: string
  watts: number
  precio_full: number
  precio_6cuotas: number | null
  cuota_mensual: number | null
  stock: number
  diam_bomba: string
  diam_perf: string
  cant_paneles: number
}

interface ResultadoBomba {
  sugerencia: Bomba
  caudal_a_altura: { verano: number; invierno: number; promedio: number }
  es_fallback: boolean
  nota: string
  opciones: Bomba[]
}

function precioMayorista(precio: number, descuento: number) {
  return Math.round(precio * (1 - descuento / 100))
}

function fmt(n: number) {
  return '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 })
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

  async function buscarBombaConParams(h: string, l: string, d: string) {
    setBuscando(true)
    setResultado(null)
    setErrCalc(null)
    try {
      const url = `${API_BOMBAS}?height=${h}&liters=${l}&diameter=${d}&season=verano`
      const res = await fetch(url)
      const data = await res.json()
      if (data.ok) setResultado(data)
      else setErrCalc(data.error || 'No se encontró bomba')
    } catch {
      setErrCalc('Error de red al buscar bomba.')
    } finally {
      setBuscando(false)
    }
  }

  async function verificarToken(t: string) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/solicitudes_revendedor?token_acceso=eq.${t}&token_acceso_activo=eq.true&select=id,nombre,apellido,empresa,provincia,descuento_pct,token_acceso`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      )
      const data = await res.json()
      if (!data || data.length === 0) { setError('token_invalido'); return }
      setRev(data[0])
    } catch {
      setError('error_red')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (!t) { setError('no_token'); setLoading(false); return }
    setToken(t)

    // Parámetros de calculadora MCA
    const h = params.get('height')
    const l = params.get('liters')
    const d = params.get('diameter')
    const auto = params.get('auto')

    if (h) setAltura(h)
    if (l) setLitros(l)
    if (d) setDiametro(d)
    if (auto === '1') setVieneDeMCA(true)

    verificarToken(t).then(() => {
      if (auto === '1' && h && l && d) {
        setTimeout(() => buscarBombaConParams(h, l, d), 600)
      }
    })
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

  if (error === 'no_token') return (
    <Pantalla emoji="🔒" titulo="Acceso restringido"
      sub="Este portal requiere un link de acceso personalizado. Registrate o escribinos por WhatsApp."
      cta={{ label: 'Registrarme', href: 'https://revendedores-six.vercel.app' }}
      cta2={{ label: 'WhatsApp', href: 'https://wa.me/5491125750323' }}
    />
  )

  if (error === 'token_invalido') return (
    <Pantalla emoji="❌" titulo="Link inválido o desactivado"
      sub="Este link de acceso no es válido o fue desactivado. Escribinos para obtener uno nuevo."
      cta={{ label: 'Escribinos por WhatsApp', href: 'https://wa.me/5491125750323' }}
    />
  )

  if (error || !rev) return (
    <Pantalla emoji="⚠️" titulo="Error de conexión" sub="No pudimos verificar tu acceso. Intentá recargar la página." />
  )

  return (
    <div style={s.wrap}>
      {/* HEADER */}
      <div style={s.header}>
        <div style={s.headerInner}>
          <div>
            <img 
  src="https://dcdn-us.mitiendanube.com/stores/007/467/093/themes/common/logo-6209403414584676726-1775575296-91ab6514e309ebf33862eadc64bcbe161775575296-480-0.webp" 
  alt="Febecos" 
  style={{ height: 32, objectFit: 'contain' as const }} 
/>
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
          </div>
        </div>
      </div>

      <div style={s.content}>

        {/* BANNER CALCULADORA MCA */}
        {!vieneDeMCA && (
          <div style={s.bannerMCA}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>🔢 ¿Necesitás calcular la MCA primero?</div>
              <div style={{ fontSize: 13, color: '#7a9ab5' }}>Usá la calculadora hidráulica completa para instalaciones complejas</div>
            </div>
            <a
              href={`https://selector.febecos.com/calculadora-mca.html?token=${token}`}
              style={s.btnMCA}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ir a Calculadora MCA →
            </a>
          </div>
        )}

        {vieneDeMCA && (
          <div style={{ ...s.bannerMCA, background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.25)' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: '#4ade80' }}>✅ Datos cargados desde la Calculadora MCA</div>
              <div style={{ fontSize: 13, color: '#7a9ab5' }}>Altura: {altura}m · Litros: {parseInt(litros).toLocaleString('es-AR')} L/día · Diámetro: {diametro}"</div>
            </div>
            <a
              href={`https://selector.febecos.com/calculadora-mca.html?token=${token}`}
              style={{ ...s.btnMCA, background: 'transparent', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }}
            >
              ← Volver a MCA
            </a>
          </div>
        )}

        {/* TOGGLE PRECIO */}
        <div style={s.toggleWrap}>
          <span style={{ fontSize: 13, color: '#7a9ab5' }}>Ver precios:</span>
          <div style={s.toggleBtns}>
            <button onClick={() => setMostrarPublico(false)} style={{ ...s.toggleBtn, ...(mostrarPublico ? {} : s.toggleBtnActive) }}>
              Mayorista ({rev.descuento_pct}% OFF)
            </button>
            <button onClick={() => setMostrarPublico(true)} style={{ ...s.toggleBtn, ...(mostrarPublico ? s.toggleBtnActive : {}) }}>
              Precio público
            </button>
          </div>
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

        {/* RESULTADO */}
        {resultado && (
          <div style={s.card}>
            <div style={s.cardTitle}>
              {resultado.es_fallback ? '⚠️ Opción más cercana' : '✅ Bomba recomendada'}
            </div>
            <BombaCard
              bomba={resultado.sugerencia}
              caudal={resultado.caudal_a_altura}
              nota={resultado.nota}
              descuento={rev.descuento_pct}
              mostrarPublico={mostrarPublico}
              precioMostrar={precioMostrar}
              wa={rev}
              litros={Number(litros)}
              altura={Number(altura)}
            />
            {resultado.opciones && resultado.opciones.length > 1 && (
              <>
                <div style={{ ...s.cardTitle, marginTop: 20, fontSize: 12 }}>Otras opciones válidas</div>
                {resultado.opciones.slice(1).map((b, i) => (
                  <BombaCard key={i} bomba={b as any} descuento={rev.descuento_pct} mostrarPublico={mostrarPublico} precioMostrar={precioMostrar} wa={rev} litros={Number(litros)} altura={Number(altura)} compact />
                ))}
              </>
            )}
          </div>
        )}

        {/* INFO PORTAL */}
        <div style={s.infoGrid}>
          <div style={s.infoCard}>
            <div style={s.infoEmoji}>💰</div>
            <div style={s.infoTitulo}>Tu descuento</div>
            <div style={s.infoVal}>{rev.descuento_pct}%</div>
            <div style={s.infoSub}>sobre precio de lista en todos los equipos</div>
          </div>
          <div style={s.infoCard}>
            <div style={s.infoEmoji}>🔢</div>
            <div style={s.infoTitulo}>Calculadora MCA</div>
            <div style={s.infoSub}>
              <a href={`https://selector.febecos.com/calculadora-mca.html?token=${token}`} style={{ color: '#e8681a', fontWeight: 700 }} target="_blank" rel="noopener noreferrer">
                Abrir calculadora →
              </a>
            </div>
          </div>
          <div style={s.infoCard}>
            <div style={s.infoEmoji}>🤝</div>
            <div style={s.infoTitulo}>Soporte técnico</div>
            <div style={s.infoSub}>
              <a href="https://wa.me/5491125750323" style={{ color: '#e8681a', fontWeight: 700 }}>WhatsApp directo →</a>
            </div>
          </div>
          <div style={s.infoCard}>
            <div style={s.infoEmoji}>📦</div>
            <div style={s.infoTitulo}>Stock en tiempo real</div>
            <div style={s.infoSub}>Precios y disponibilidad actualizados automáticamente</div>
          </div>
        </div>

      </div>
    </div>
  )
}

function BombaCard({ bomba, caudal, nota, descuento, mostrarPublico, precioMostrar, wa, litros, altura, compact = false }: any) {
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
        <span>{bomba.watts}W</span>
        <span>·</span>
        <span>{bomba.cant_paneles} panel{bomba.cant_paneles > 1 ? 'es' : ''}</span>
        <span>·</span>
        <span>Bomba {bomba.diam_bomba || bomba.diam_perf || '—'}"</span>
        <span>·</span>
        <span style={{ color: bomba.stock > 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
          {bomba.stock > 0 ? `Stock: ${bomba.stock}` : 'Sin stock'}
        </span>
      </div>
      {caudal && !compact && (
        <div style={s.caudalRow}>
          <div style={s.caudalItem}><span style={s.caudalLbl}>Verano</span><span style={s.caudalVal}>{caudal.verano?.toLocaleString('es-AR')} L/día</span></div>
          <div style={s.caudalItem}><span style={s.caudalLbl}>Promedio</span><span style={s.caudalVal}>{caudal.promedio?.toLocaleString('es-AR')} L/día</span></div>
          <div style={s.caudalItem}><span style={s.caudalLbl}>Invierno</span><span style={s.caudalVal}>{caudal.invierno?.toLocaleString('es-AR')} L/día</span></div>
        </div>
      )}
      <div style={s.precioRow}>
        <div>
          <div style={s.precioLabel}>{mostrarPublico ? 'Precio público' : `Precio mayorista (${descuento}% OFF)`}</div>
          <div style={s.precioVal}>{fmt(precio)}</div>
          {!mostrarPublico && (
            <div style={{ fontSize: 11, color: '#7a9ab5' }}>
              Público: {fmt(precioPublico)} · Ahorrás {fmt(precioPublico - precio)}
            </div>
          )}

        </div>
        <a href={`https://wa.me/5491125750323?text=${msg}`} target="_blank" rel="noopener noreferrer" style={s.btnWA}>
          Consultar stock →
        </a>
      </div>
      {nota && !compact && <div style={s.notaTxt}>{nota}</div>}
    </div>
  )
}

function Pantalla({ emoji, titulo, sub, cta, cta2 }: { emoji: string, titulo: string, sub: string, cta?: { label: string, href: string }, cta2?: { label: string, href: string } }) {
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
  brand: { fontSize: 13, fontWeight: 800, letterSpacing: '0.15em', color: '#e8681a' },
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
  btnWA: { display: 'inline-block', padding: '10px 18px', background: '#25d366', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' as const },
  notaTxt: { fontSize: 12, color: '#7a9ab5', marginTop: 12, padding: '8px 12px', background: '#132233', borderRadius: 6 },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 8 },
  infoCard: { background: '#132233', border: '1px solid #1e3248', borderRadius: 10, padding: '16px 18px' },
  infoEmoji: { fontSize: 22, marginBottom: 8 },
  infoTitulo: { fontSize: 11, fontWeight: 700, color: '#7a9ab5', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 6 },
  infoVal: { fontSize: 28, fontWeight: 800, color: '#4ade80', marginBottom: 4 },
  infoSub: { fontSize: 12, color: '#3a5a7a', lineHeight: 1.5 },
}
