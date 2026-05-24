// Server Component — lee comisiones_tramos y catálogo directo de Neon DB.
// force-dynamic: siempre re-renderiza en el servidor para reflejar cambios del admin.
export const dynamic = 'force-dynamic'

import { getDb } from '@/lib/db'
import { C } from './colores'
import FormularioWA from './FormularioWA'
import MockupSelectorAnimado from './MockupSelectorAnimado'
import MultiplicadorMargen from './MultiplicadorMargen'

interface Tramo {
  nivel: string
  desde_monto: number
  hasta_monto: number | null
  porcentaje: number
}
interface Modelo {
  codigo: string
  titulo_comercial: string
  diam_bomba: string
  watts: number
  precio_full: number
  cuota_mensual: number | null
  stock: number | null
}

// Precio real Kit 2" 210W — base para los ejemplos
const KIT_PRECIO = 1_580_820
const KIT_NOMBRE = 'Kit Solar 2" 210W'

// Nombre comercial por número de nivel
const NIVEL_NOMBRE: Record<number, { label: string; desc: string }> = {
  1: { label: 'Recomendador',       desc: 'Primeros kits, empezás a conocer el producto' },
  2: { label: 'Vendedor',           desc: 'Cartera activa, ventas regulares' },
  3: { label: 'Vendedor Instalador',desc: 'Vendés e instalás — mayor valor agregado' },
  4: { label: 'Vendedor Experto',   desc: 'Alto volumen, referente en tu zona' },
  5: { label: 'Distribuidor',       desc: 'Máximo nivel, red de clientes consolidada' },
}

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('es-AR')
}
function kitsPorUmbral(monto: number): string {
  if (monto === 0) return '1er kit'
  const k = Math.ceil(monto / KIT_PRECIO)
  return `≈ ${k} kit${k !== 1 ? 's' : ''}/mes`
}

// Fallback si la DB no responde o la tabla no tiene datos aún
// (deben coincidir con lo configurado en el panel admin)
const TRAMOS_FALLBACK: Tramo[] = [
  { nivel: 'Nivel 1', desde_monto: 0,           hasta_monto: 4_999_999,  porcentaje: 7  },
  { nivel: 'Nivel 2', desde_monto: 5_000_000,   hasta_monto: 9_999_999,  porcentaje: 10 },
  { nivel: 'Nivel 3', desde_monto: 10_000_000,  hasta_monto: 19_999_999, porcentaje: 12 },
  { nivel: 'Nivel 4', desde_monto: 20_000_000,  hasta_monto: 39_999_999, porcentaje: 15 },
  { nivel: 'Nivel 5', desde_monto: 40_000_000,  hasta_monto: null,        porcentaje: 20 },
]

async function getTramos(): Promise<Tramo[]> {
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT nivel, desde_monto, hasta_monto, porcentaje
      FROM comisiones_tramos
      WHERE tipo = 'externo' AND activo = true
      ORDER BY desde_monto ASC
    `
    return (rows as Tramo[]).length > 0 ? (rows as Tramo[]) : TRAMOS_FALLBACK
  } catch { return TRAMOS_FALLBACK }
}

async function getRevendedoresActivos(): Promise<number> {
  try {
    const sql = getDb()
    const rows = await sql`SELECT COUNT(*) AS total FROM revendedores WHERE activo = true`
    return Number((rows[0] as any)?.total ?? 0)
  } catch { return 0 }
}

async function getProvinciasLibres(): Promise<number> {
  // Argentina tiene 24 jurisdicciones (23 provincias + CABA)
  const TOTAL_PROVINCIAS = 24
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT COUNT(DISTINCT provincia) AS cubiertas
      FROM revendedores
      WHERE activo = true AND provincia IS NOT NULL AND provincia <> ''
    `
    const cubiertas = Number((rows[0] as any)?.cubiertas ?? 0)
    return Math.max(0, TOTAL_PROVINCIAS - cubiertas)
  } catch { return 8 /* fallback */ }
}

async function getConsultasSemanales(): Promise<string> {
  try {
    const sql = getDb()
    // Misma fuente que el admin dashboard: tabla "leads" del selector público
    const rows = await sql`
      SELECT COUNT(*) AS total
      FROM leads
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `
    const total = Number((rows[0] as any)?.total ?? 0)
    return total > 0 ? `${total}` : '—'
  } catch { return '—' }
}

async function getModelos(): Promise<Modelo[]> {
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT codigo, titulo_comercial, diam_bomba, watts, precio_full, cuota_mensual, stock
      FROM pumps
      WHERE activo_catalogo = true AND precio_full > 0
      ORDER BY watts ASC
    `
    return rows as Modelo[]
  } catch { return [] }
}

async function getTotalCatalogo(): Promise<number> {
  // Total de modelos en la tabla pumps (sin filtrar por flags)
  try {
    const sql = getDb()
    const rows = await sql`SELECT COUNT(*) AS total FROM pumps`
    return Number((rows[0] as any)?.total ?? 0)
  } catch { return 0 }
}

const BENEFICIOS = [
  { emoji: '⚡', titulo: 'Margen real desde la primera venta', desc: 'Descuento inmediato al registrarte. Sin cuota de ingreso, sin stock mínimo, sin compromisos de compra.' },
  { emoji: '🔧', titulo: 'Cotizador técnico incluido', desc: 'Portal exclusivo: ingresás profundidad del pozo, litros/día y diámetro — el sistema elige la bomba correcta y te muestra tu precio mayorista en segundos.' },
  { emoji: '🌾', titulo: 'Mercado con demanda activa', desc: 'El 53% de los productores que consultan buscan agua para animales. La demanda ya existe; lo que falta es quien llegue primero con la solución.' },
]

// Mockup visual del portal de revendedores (CSS puro, sin imagen)
function MockupPortal() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,61,114,.13)', maxWidth: 420, margin: '0 auto', border: `1px solid ${C.grisB}`, fontFamily: 'inherit' }}>
      {/* Barra de navegador */}
      <div style={{ background: '#f0f0f0', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #ddd' }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ff5f57','#ffbd2e','#28c840'].map(bg => <div key={bg} style={{ width: 10, height: 10, borderRadius: '50%', background: bg }} />)}
        </div>
        <div style={{ flex: 1, background: '#fff', borderRadius: 6, padding: '4px 12px', fontSize: 11, color: '#666', border: '1px solid #ddd' }}>
          🔒 revendedores.febecos.com
        </div>
      </div>
      {/* Header del portal */}
      <div style={{ background: C.azul, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: C.blanco, fontWeight: 700, fontSize: 13 }}>🌱 Portal Revendedores</span>
        <span style={{ background: C.acento, color: C.azul, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 800 }}>Nivel 2 · Vendedor</span>
      </div>
      {/* Contenido del portal */}
      <div style={{ padding: '16px 18px 18px' }}>
        {/* Saludo */}
        <div style={{ fontSize: 13, fontWeight: 600, color: C.azulTxt, marginBottom: 14 }}>
          Hola, Juan 👋 · PIN: <span style={{ fontFamily: 'monospace', background: C.grisBg, padding: '1px 6px', borderRadius: 4 }}>R-2847</span>
        </div>
        {/* Mini form cotizador */}
        <div style={{ background: C.grisBg, borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.gris, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Cotizador rápido</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[['Profundidad', '45 m'], ['Diámetro', '4"'], ['Litros/día', '2.000 L'], ['Uso', '🐄 Ganado']].map(([label, val]) => (
              <div key={label} style={{ background: C.blanco, border: `1px solid ${C.grisB}`, borderRadius: 6, padding: '6px 10px' }}>
                <div style={{ fontSize: 9, color: C.gris }}>{label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.azulTxt }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Resultado */}
        <div style={{ background: C.acentoBg, border: `1px solid ${C.acentoBord}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 10, color: C.verde, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.07em' }}>✓ Equipo recomendado</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.azulTxt, marginBottom: 2 }}>Kit Bomba Solar 4" 500W</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <div>
              <div style={{ fontSize: 10, color: C.gris }}>Tu precio mayorista (10% off)</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: C.azul }}>$1.995.006</div>
              <div style={{ fontSize: 10, color: C.gris, textDecoration: 'line-through' }}>Lista: $2.216.673</div>
            </div>
            <div style={{ background: C.azul, color: '#fff', borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 700 }}>Pedir →</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function UnirsePage() {
  const [tramos, modelos, revendedoresActivos, provinciasLibres, consultasSemanales, totalCatalogo] = await Promise.all([
    getTramos(), getModelos(), getRevendedoresActivos(), getProvinciasLibres(), getConsultasSemanales(), getTotalCatalogo()
  ])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;800&display=swap');
        #up, #up * { box-sizing:border-box; font-family:'Rubik',system-ui,sans-serif; }
        #up { background:${C.fondo}; color:${C.azulTxt}; min-height:100vh; }
        body { background:${C.fondo} !important; }
        #up a { text-decoration:none; }
        .u-cta:hover { background:#bcd430 !important; }
        .u-wa:hover  { background:#1da851 !important; }
        @media(max-width:680px){
          .u-nav-l { display:none !important; }
          .u-g3 { grid-template-columns:1fr !important; }
          .u-g2 { grid-template-columns:1fr !important; }
          .u-ej { flex-direction:column !important; }
          .u-strip { gap:20px !important; }
          .u-paso { grid-template-columns:1fr !important; }
          .u-tbl { font-size:12px !important; }
          .u-tbl td, .u-tbl th { padding:10px 10px !important; }
        }
      `}</style>

      <div id="up">

        {/* ── NAV ── */}
        <nav style={{ background:C.blanco, borderBottom:`1px solid ${C.grisB}`, height:68, display:'flex', alignItems:'center', position:'sticky', top:0, zIndex:200 }}>
          <div style={{ maxWidth:1060, margin:'0 auto', width:'100%', padding:'0 28px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <a href="https://febecos.com">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-febecos-nav.png" alt="Febecos" style={{ height:36, display:'block' }} />
            </a>
            <div style={{ display:'flex', gap:16, alignItems:'center' }}>
              <a className="u-nav-l" href="https://febecos.com/catalogo" style={{ color:C.gris, fontSize:13, fontWeight:500 }}>Catálogo</a>
              <a href="/portal" style={{ background:C.grisBg, color:C.azulTxt, border:`1px solid ${C.grisB}`, borderRadius:8, padding:'7px 16px', fontSize:13, fontWeight:600 }}>
                Ya tengo acceso →
              </a>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={{ background:C.azul, padding:'72px 28px 64px', textAlign:'center' }}>
          <div style={{ maxWidth:680, margin:'0 auto' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(168,198,27,.15)', border:`1px solid ${C.acento}`, borderRadius:100, padding:'5px 16px', fontSize:12, fontWeight:700, color:C.acento, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:28 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:C.acento, display:'inline-block' }} />
              Programa de Revendedores
            </div>
            <h1 style={{ fontSize:'clamp(28px,5vw,46px)', fontWeight:800, color:C.blanco, lineHeight:1.15, marginBottom:20, letterSpacing:-.5 }}>
              Vendé bombas solares.<br /><span style={{ color:C.acento }}>El campo te espera.</span>
            </h1>
            <p style={{ fontSize:17, color:'rgba(255,255,255,.8)', lineHeight:1.75, marginBottom:36, maxWidth:540, margin:'0 auto 36px' }}>
              Precios mayoristas, cotizador técnico y soporte completo de Febecos.<br />Sin cuota de ingreso. Sin stock mínimo.
            </p>
            <a href="#formulario" className="u-cta" style={{ display:'inline-block', background:C.acento, color:C.azul, padding:'15px 36px', borderRadius:10, fontWeight:800, fontSize:16, transition:'background .15s' }}>
              Quiero probar online →
            </a>
          </div>
        </section>

        {/* ── STRIP ── */}
        <div style={{ background:C.acentoBg, borderTop:`1px solid ${C.acentoBord}`, borderBottom:`1px solid ${C.acentoBord}`, padding:'18px 28px' }}>
          <div className="u-strip" style={{ maxWidth:860, margin:'0 auto', display:'flex', justifyContent:'center', gap:48, flexWrap:'wrap' }}>
            {[
              [`${tramos[0]?.porcentaje ?? 7}–${tramos[tramos.length-1]?.porcentaje ?? 20}%`, 'Descuento mayorista'],
              [`${totalCatalogo || modelos.length || '—'} bombas`, 'En catálogo'], ['24 hs', 'Para tener acceso'], ['12 m', 'Garantía del producto'],
            ].map(([v, l]) => (
              <div key={l as string} style={{ textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:800, color:C.verde }}>{v}</div>
                <div style={{ fontSize:12, color:C.gris, fontWeight:500 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── DEMANDA EN VIVO ── */}
        <section style={{ padding:'40px 28px', background:C.fondo }}>
          <div style={{ maxWidth:900, margin:'0 auto' }}>
            <p style={{ textAlign:'center', fontSize:12, fontWeight:700, color:C.gris, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:24 }}>
              📡 Qué está pasando ahora mismo
            </p>
            <div className="u-g3" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14 }}>
              {[
                { valor: consultasSemanales, label: 'Consultas esta semana',      detalle: 'Productores buscando solución',  emoji: '🔍' },
                { valor: '53%',              label: 'Son ganaderos',               detalle: 'Agua para animales: demanda fija', emoji: '🐄' },
                { valor: revendedoresActivos > 0 ? `${revendedoresActivos}` : '12+', label: 'Revendedores activos', detalle: 'En toda la Argentina', emoji: '🤝' },
                { valor: `${provinciasLibres} ${provinciasLibres === 1 ? 'provincia' : 'provincias'}`, label: 'Sin cobertura activa', detalle: 'Zonas libres disponibles', emoji: '📍' },
              ].map(s => (
                <div key={s.label} style={{ background:C.blanco, border:`1px solid ${C.grisB}`, borderRadius:12, padding:'18px 16px', textAlign:'center' }}>
                  <div style={{ fontSize:22, marginBottom:6 }}>{s.emoji}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:C.azulTxt, lineHeight:1.1 }}>{s.valor}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.azulTxt, margin:'4px 0 2px' }}>{s.label}</div>
                  <div style={{ fontSize:11, color:C.gris, lineHeight:1.4 }}>{s.detalle}</div>
                </div>
              ))}
            </div>
            <p style={{ textAlign:'center', fontSize:12, color:C.gris, marginTop:16 }}>
              Datos actualizados · El que llega primero a una zona captura el mercado.
            </p>
          </div>
        </section>

        {/* ── BENEFICIOS ── */}
        <section style={{ padding:'64px 28px', background:C.fondo }}>
          <div style={{ maxWidth:1000, margin:'0 auto' }}>
            <h2 style={{ fontSize:28, fontWeight:800, color:C.azulTxt, textAlign:'center', marginBottom:8 }}>Por qué tiene sentido</h2>
            <p style={{ color:C.gris, textAlign:'center', marginBottom:40, fontSize:15, lineHeight:1.7 }}>Una línea de producto con demanda real, margen desde el día 1 y todo el respaldo técnico de Febecos.</p>
            <div className="u-g3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
              {BENEFICIOS.map(b => (
                <div key={b.titulo} style={{ background:C.blanco, border:`1px solid ${C.grisB}`, borderRadius:14, padding:'28px 24px' }}>
                  <div style={{ fontSize:32, marginBottom:14 }}>{b.emoji}</div>
                  <h3 style={{ fontSize:16, fontWeight:700, color:C.azulTxt, marginBottom:8 }}>{b.titulo}</h3>
                  <p style={{ fontSize:14, color:C.gris, lineHeight:1.65 }}>{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMISIONES ── */}
        <section style={{ padding:'64px 28px', background:C.blanco, borderTop:`1px solid ${C.grisB}` }}>
          <div style={{ maxWidth:940, margin:'0 auto' }}>
            <h2 style={{ fontSize:28, fontWeight:800, color:C.azulTxt, textAlign:'center', marginBottom:8 }}>Niveles y comisiones</h2>
            <p style={{ color:C.gris, textAlign:'center', marginBottom:36, fontSize:15, lineHeight:1.7 }}>
              A mayor volumen mensual, mayor descuento. El nivel sube automáticamente.
            </p>

            {tramos.length > 0 && (
              <>
                <div style={{ borderRadius:14, overflow:'hidden', border:`1px solid ${C.grisB}`, marginBottom:32 }}>
                  <table className="u-tbl" style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ background:C.azul }}>
                        {['Nivel', 'Rol', 'Facturación/mes', 'Kits aprox.', 'Descuento', `Margen · ${KIT_NOMBRE}`].map(h => (
                          <th key={h} style={{ padding:'12px 16px', textAlign:'left', color:'rgba(255,255,255,.8)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tramos.map((t, i) => {
                        const num = i + 1
                        const info = NIVEL_NOMBRE[num] ?? { label: t.nivel, desc: '' }
                        const margen = KIT_PRECIO * t.porcentaje / 100
                        const colores = ['#203b61','#224a73','#2D5A27','#1a6b35','#155a2a']
                        const col = colores[i] ?? C.azulTxt
                        return (
                          <tr key={t.nivel} style={{ background: i % 2 === 0 ? C.blanco : C.grisBg, borderBottom:`1px solid ${C.grisB}` }}>
                            <td style={{ padding:'13px 16px', fontWeight:700, color:col, fontSize:14 }}>{t.nivel}</td>
                            <td style={{ padding:'13px 16px' }}>
                              <div style={{ fontWeight:700, color:col, fontSize:14 }}>{info.label}</div>
                              <div style={{ fontSize:11, color:C.gris, marginTop:2 }}>{info.desc}</div>
                            </td>
                            <td style={{ padding:'13px 16px', color:C.azulTxt, fontSize:13 }}>
                              {t.desde_monto === 0 ? '$0' : fmt(t.desde_monto)}
                              {t.hasta_monto != null
                                ? <> — {fmt(t.hasta_monto)}</>
                                : <span style={{ color:C.gris }}> en adelante</span>}
                            </td>
                            <td style={{ padding:'13px 16px', color:C.gris, fontSize:13 }}>
                              {kitsPorUmbral(t.desde_monto)}
                            </td>
                            <td style={{ padding:'13px 16px', fontWeight:800, color:col, fontSize:20 }}>{t.porcentaje}%</td>
                            <td style={{ padding:'13px 16px', fontWeight:700, color:col, fontSize:14 }}>{fmt(margen)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Calculador interactivo */}
                <MultiplicadorMargen
                  tramos={tramos}
                  nivelNombre={NIVEL_NOMBRE}
                  kitPrecio={KIT_PRECIO}
                  kitNombre={KIT_NOMBRE}
                />
              </>
            )}
          </div>
        </section>

        {/* ── CÓMO FUNCIONA + MOCKUP ── */}
        <section style={{ padding:'64px 28px', background:C.fondo }}>
          <div style={{ maxWidth:1000, margin:'0 auto' }}>
            <h2 style={{ fontSize:28, fontWeight:800, color:C.azulTxt, textAlign:'center', marginBottom:8 }}>Cómo funciona</h2>
            <p style={{ color:C.gris, textAlign:'center', marginBottom:48, fontSize:15, lineHeight:1.7 }}>
              Tres pasos. Sin complicaciones técnicas.
            </p>
            <div className="u-paso" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:40, alignItems:'center' }}>
              {/* Pasos */}
              <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
                {[
                  { n:'1', emoji:'📋', titulo:'Te registrás', desc:'Completás el formulario y en menos de 24 hs hábiles recibís tu PIN de acceso al portal exclusivo de revendedores.' },
                  { n:'2', emoji:'💻', titulo:'Cotizás desde el portal', desc:'Ingresás los datos del pozo de tu cliente: profundidad, litros/día y diámetro. El portal te muestra el equipo correcto con tu precio mayorista y descuento ya aplicado.' },
                  { n:'3', emoji:'💰', titulo:'Vendés y ganás', desc:'Vos definís el precio al cliente. La diferencia entre tu costo mayorista y lo que cobrás es tu margen, desde el primer kit.' },
                ].map(p => (
                  <div key={p.n} style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                    <div style={{ background:C.azul, color:C.blanco, width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:16, flexShrink:0 }}>
                      {p.n}
                    </div>
                    <div>
                      <div style={{ fontSize:16, fontWeight:700, color:C.azulTxt, marginBottom:4 }}>{p.emoji} {p.titulo}</div>
                      <p style={{ fontSize:14, color:C.gris, lineHeight:1.65, margin:0 }}>{p.desc}</p>
                    </div>
                  </div>
                ))}
                <a href="https://revendedores.febecos.com" target="_blank" rel="noopener noreferrer"
                  style={{ display:'inline-flex', alignItems:'center', gap:8, background:C.grisBg, border:`1px solid ${C.grisB}`, borderRadius:9, padding:'11px 20px', fontSize:13, fontWeight:600, color:C.azulTxt, width:'fit-content' }}>
                  🔑 Ver el portal de revendedores →
                </a>
              </div>
              {/* Mockup animado del selector */}
              <div>
                <MockupSelectorAnimado />
                <p style={{ textAlign:'center', fontSize:12, color:C.gris, marginTop:16 }}>
                  Así funciona el cotizador en el portal de revendedores
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── MODELOS ── */}
        <section style={{ padding:'64px 28px', background:C.blanco, borderTop:`1px solid ${C.grisB}` }}>
          <div style={{ maxWidth:1000, margin:'0 auto' }}>
            <h2 style={{ fontSize:28, fontWeight:800, color:C.azulTxt, textAlign:'center', marginBottom:8 }}>Los equipos</h2>
            <p style={{ color:C.gris, textAlign:'center', marginBottom:40, fontSize:15, lineHeight:1.7 }}>
              Toda la línea disponible. Cada kit incluye bomba, paneles, estructura, cable, soga y protecciones.
            </p>
            <div className="u-g3" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16 }}>
              {(modelos.length > 0 ? modelos : [
                { codigo:'HD-2SS', titulo_comercial:'Kit Solar 2" 210W', diam_bomba:'2"', watts:210, precio_full:1580820, cuota_mensual:305625, stock:0 },
                { codigo:'HD-3SS-300', titulo_comercial:'Kit Solar 3" 300W', diam_bomba:'3"', watts:300, precio_full:1656614, cuota_mensual:320279, stock:2 },
                { codigo:'HD-4SS-500', titulo_comercial:'Kit Solar 4" 500W', diam_bomba:'4"', watts:500, precio_full:2216673, cuota_mensual:428557, stock:3 },
                { codigo:'HD-3SS-600', titulo_comercial:'Kit Híbrido 3" 600W', diam_bomba:'3"', watts:600, precio_full:3013084, cuota_mensual:582530, stock:1 },
                { codigo:'HD-4SS-1100', titulo_comercial:'Kit Solar 4" 1100W', diam_bomba:'4"', watts:1100, precio_full:2718528, cuota_mensual:525582, stock:1 },
              ] as Modelo[]).map(m => {
                const sinStock = m.stock !== null && m.stock !== undefined && Number(m.stock) === 0
                return (
                  <div key={m.codigo} style={{ background:C.grisBg, border:`1px solid ${C.grisB}`, borderRadius:12, padding:'20px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:C.verde, letterSpacing:'.08em', textTransform:'uppercase' }}>
                      {m.diam_bomba} · {m.watts}W
                    </div>
                    <div style={{ fontSize:15, fontWeight:800, color:C.azulTxt, lineHeight:1.3 }}>
                      {m.titulo_comercial ?? `Kit ${m.diam_bomba} ${m.watts}W`}
                    </div>
                    <div style={{ marginTop:'auto', paddingTop:10, borderTop:`1px solid ${C.grisB}` }}>
                      <div style={{ fontSize:18, fontWeight:800, color:C.azul }}>{fmt(m.precio_full)}</div>
                      {m.cuota_mensual && (
                        <div style={{ fontSize:11, color:C.gris }}>o {fmt(m.cuota_mensual)}/mes</div>
                      )}
                    </div>
                    <div style={{ fontSize:11, fontWeight:600, color: sinStock ? '#d4870a' : C.verde }}>
                      {sinStock ? '⚠ Sin stock — consultar' : `✓ ${m.stock} disponible${Number(m.stock) !== 1 ? 's' : ''}`}
                    </div>
                  </div>
                )
              })}
            </div>
            <p style={{ textAlign:'center', fontSize:13, color:C.gris, marginTop:24 }}>
              Stock y precios actualizados en tiempo real desde el panel administrativo.
            </p>
          </div>
        </section>

        {/* ── FORMULARIO ── */}
        <section id="formulario" style={{ padding:'64px 28px', background:C.fondo, borderTop:`1px solid ${C.grisB}` }}>
          <div style={{ maxWidth:600, margin:'0 auto' }}>
            <h2 style={{ fontSize:28, fontWeight:800, color:C.azulTxt, textAlign:'center', marginBottom:8 }}>Empezá ahora</h2>
            <p style={{ color:C.gris, textAlign:'center', marginBottom:32, fontSize:15, lineHeight:1.7 }}>
              Completá tus datos y elegí cómo continuar — probá el portal gratis 7 días o hablá con nosotros por WhatsApp.
            </p>
            <FormularioWA />
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ background:C.azul, padding:'40px 28px', textAlign:'center' }}>
          <p style={{ color:'rgba(255,255,255,.9)', fontWeight:700, fontSize:16, marginBottom:8 }}>¿Preferís hablar primero?</p>
          <p style={{ color:'rgba(255,255,255,.6)', fontSize:14, marginBottom:24, lineHeight:1.7 }}>
            Escribinos directamente y te hacemos una demo del portal. Sin compromiso.
          </p>
          <a href="https://wa.me/5491125750323?text=Hola%2C%20me%20interesa%20el%20Programa%20de%20Revendedores%20Febecos."
            target="_blank" rel="noopener noreferrer" className="u-wa"
            style={{ display:'inline-block', background:'#25d366', color:C.blanco, padding:'13px 32px', borderRadius:10, fontWeight:800, fontSize:15, transition:'background .15s', marginBottom:28 }}>
            📱 +54 9 11 2575-0323
          </a>
          <div style={{ borderTop:'1px solid rgba(255,255,255,.1)', paddingTop:20, display:'flex', gap:20, justifyContent:'center', flexWrap:'wrap' }}>
            {[['revendedores.febecos.com','https://revendedores.febecos.com'],['febecos.com','https://febecos.com'],['selector.febecos.com','https://selector.febecos.com']].map(([l,h]) => (
              <a key={h} href={h} style={{ color:'rgba(255,255,255,.45)', fontSize:13 }}>{l}</a>
            ))}
          </div>
        </footer>

      </div>
    </>
  )
}
