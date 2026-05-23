// Server Component — lee comisiones_tramos y catálogo directo de Neon DB.
import { getDb } from '@/lib/db'
import { C } from './colores'
import FormularioWA from './FormularioWA'

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

async function getTramos(): Promise<Tramo[]> {
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT nivel, desde_monto, hasta_monto, porcentaje
      FROM comisiones_tramos
      WHERE tipo = 'externo' AND activo = true
      ORDER BY desde_monto ASC
    `
    return rows as Tramo[]
  } catch { return [] }
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

const BENEFICIOS = [
  { emoji: '⚡', titulo: 'Margen real desde la primera venta', desc: 'Descuento inmediato al registrarte. Sin cuota de ingreso, sin stock mínimo, sin compromisos de compra.' },
  { emoji: '🔧', titulo: 'Cotizador técnico incluido', desc: 'Portal exclusivo: ingresás profundidad del pozo, litros/día y diámetro — el sistema elige la bomba correcta y te muestra tu precio mayorista en segundos.' },
  { emoji: '🌾', titulo: 'Mercado con demanda activa', desc: 'El 53% de los productores que consultan buscan agua para animales. La demanda ya existe; lo que falta es quien llegue primero con la solución.' },
]

// Mockup visual del cotizador (CSS puro, sin imagen)
function MockupCotizador() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,61,114,.13)', maxWidth: 420, margin: '0 auto', border: `1px solid ${C.grisB}`, fontFamily: 'inherit' }}>
      {/* Barra de título */}
      <div style={{ background: C.azul, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ff5f57','#ffbd2e','#28c840'].map(bg => <div key={bg} style={{ width: 10, height: 10, borderRadius: '50%', background: bg }} />)}
        </div>
        <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, marginLeft: 6 }}>selector.febecos.com</span>
      </div>
      {/* Contenido del cotizador */}
      <div style={{ padding: '20px 20px 22px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.azul, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          ● Calculando tu equipo ideal…
        </div>
        {/* Barra de progreso */}
        <div style={{ height: 3, background: C.grisB, borderRadius: 3, marginBottom: 18, overflow: 'hidden' }}>
          <div style={{ width: '75%', height: '100%', background: `linear-gradient(90deg, ${C.azul}, ${C.acento})`, borderRadius: 3 }} />
        </div>
        {/* Datos del pozo */}
        <div style={{ background: C.grisBg, borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: C.gris, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.07em' }}>Datos del pozo</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[['Profundidad', '45 m'], ['Diámetro', '4"'], ['Litros/día', '2.000 L'], ['Uso', '🐄 Ganado']].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: C.gris }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.azulTxt }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Resultado */}
        <div style={{ background: C.acentoBg, border: `1px solid ${C.acentoBord}`, borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: C.verde, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.07em' }}>✓ Equipo sugerido</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.azulTxt, marginBottom: 2 }}>Kit Bomba Solar 4" 500W</div>
          <div style={{ fontSize: 12, color: C.gris }}>Cubre todo el año · 3 paneles · profundidad máx. 80m</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: C.gris }}>Tu precio mayorista</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.azul }}>$1.954.673</div>
            </div>
            <div style={{ background: C.azul, color: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700 }}>Ver cotización →</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: C.gris, textAlign: 'center' }}>
          🔒 Precio mayorista con tu descuento aplicado
        </div>
      </div>
    </div>
  )
}

export default async function UnirsePage() {
  const [tramos, modelos] = await Promise.all([getTramos(), getModelos()])

  const nivelBase  = tramos[0]
  const nivelMedio = tramos[Math.floor(tramos.length / 2)] ?? tramos[1]
  const margenBase  = nivelBase  ? KIT_PRECIO * nivelBase.porcentaje  / 100 : 0
  const margenMedio = nivelMedio ? KIT_PRECIO * nivelMedio.porcentaje / 100 : 0

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
            <a href="https://febecos.com" style={{ color:C.azul, fontWeight:800, fontSize:20, letterSpacing:-.5 }}>🌱 Febecos</a>
            <div style={{ display:'flex', gap:16, alignItems:'center' }}>
              <a className="u-nav-l" href="https://febecos.com/catalogo" style={{ color:C.gris, fontSize:13, fontWeight:500 }}>Catálogo</a>
              <a className="u-nav-l" href="https://selector.febecos.com" style={{ color:C.gris, fontSize:13, fontWeight:500 }}>Selector</a>
              <a href="https://revendedores.febecos.com" style={{ background:C.grisBg, color:C.azulTxt, border:`1px solid ${C.grisB}`, borderRadius:8, padding:'7px 16px', fontSize:13, fontWeight:600 }}>
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
              Quiero sumarme →
            </a>
          </div>
        </section>

        {/* ── STRIP ── */}
        <div style={{ background:C.acentoBg, borderTop:`1px solid ${C.acentoBord}`, borderBottom:`1px solid ${C.acentoBord}`, padding:'18px 28px' }}>
          <div className="u-strip" style={{ maxWidth:860, margin:'0 auto', display:'flex', justifyContent:'center', gap:48, flexWrap:'wrap' }}>
            {[
              [nivelBase ? `${nivelBase.porcentaje}–${tramos[tramos.length-1]?.porcentaje ?? '?'}%` : '7–20%', 'Descuento mayorista'],
              ['53%', 'Leads ganaderos'], ['24 hs', 'Para tener acceso'], ['12 m', 'Garantía del producto'],
            ].map(([v, l]) => (
              <div key={l as string} style={{ textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:800, color:C.verde }}>{v}</div>
                <div style={{ fontSize:12, color:C.gris, fontWeight:500 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

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
                              {t.desde_monto === 0 ? 'Desde $0' : `Desde ${fmt(t.desde_monto)}`}
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

                {/* Ejemplo */}
                <div style={{ background:C.acentoBg, border:`1px solid ${C.acentoBord}`, borderRadius:12, padding:'24px 28px' }}>
                  <p style={{ fontSize:13, fontWeight:700, color:C.verde, marginBottom:4, textTransform:'uppercase', letterSpacing:'.08em' }}>
                    📊 Ejemplo real — {KIT_NOMBRE}
                  </p>
                  <p style={{ fontSize:13, color:C.gris, marginBottom:16 }}>
                    Precio de lista: <strong style={{ color:C.azulTxt }}>{fmt(KIT_PRECIO)}</strong> · Kit completo con paneles, cable y soga
                  </p>
                  <div className="u-ej" style={{ display:'flex', gap:16, alignItems:'center' }}>
                    <div style={{ background:C.blanco, border:`1px solid ${C.grisB}`, borderRadius:10, padding:'16px 20px', textAlign:'center', flex:1 }}>
                      <div style={{ fontSize:12, color:C.gris, marginBottom:2 }}>{nivelBase?.nivel} · {NIVEL_NOMBRE[1]?.label} · {nivelBase?.porcentaje}%</div>
                      <div style={{ fontSize:26, fontWeight:800, color:C.azulTxt }}>{fmt(margenBase)}</div>
                      <div style={{ fontSize:11, color:C.gris }}>por venta</div>
                    </div>
                    <div style={{ color:C.acento, fontSize:22, fontWeight:800, flexShrink:0 }}>→</div>
                    <div style={{ background:C.blanco, border:`2px solid ${C.verde}`, borderRadius:10, padding:'16px 20px', textAlign:'center', flex:1 }}>
                      <div style={{ fontSize:12, color:C.gris, marginBottom:2 }}>{nivelMedio?.nivel} · {NIVEL_NOMBRE[Math.floor(tramos.length/2)+1]?.label} · {nivelMedio?.porcentaje}%</div>
                      <div style={{ fontSize:26, fontWeight:800, color:C.verde }}>{fmt(margenMedio)}</div>
                      <div style={{ fontSize:11, color:C.gris }}>por venta</div>
                    </div>
                  </div>
                  <p style={{ fontSize:13, color:C.azulTxt, marginTop:14, textAlign:'center', fontWeight:600 }}>
                    5 ventas/mes como {NIVEL_NOMBRE[Math.floor(tramos.length/2)+1]?.label} → <span style={{ color:C.verde }}>{fmt(margenMedio * 5)} de margen bruto</span>
                  </p>
                </div>
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
                  { n:'1', emoji:'📋', titulo:'Te registrás', desc:'Completás el formulario y en menos de 24 hs hábiles recibís tu PIN de acceso al portal.' },
                  { n:'2', emoji:'💻', titulo:'Cotizás en segundos', desc:'Ingresás profundidad del pozo, litros/día y diámetro. El sistema elige la bomba correcta y te muestra el precio mayorista con tu descuento ya aplicado.' },
                  { n:'3', emoji:'💰', titulo:'Vendés y ganás', desc:'Vos definís el precio al cliente. La diferencia entre tu costo mayorista y lo que cobrás es tu margen.' },
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
                <a href="https://selector.febecos.com" target="_blank" rel="noopener noreferrer"
                  style={{ display:'inline-flex', alignItems:'center', gap:8, background:C.grisBg, border:`1px solid ${C.grisB}`, borderRadius:9, padding:'11px 20px', fontSize:13, fontWeight:600, color:C.azulTxt, width:'fit-content' }}>
                  👀 Probá el selector antes de inscribirte →
                </a>
              </div>
              {/* Mockup */}
              <div>
                <MockupCotizador />
                <p style={{ textAlign:'center', fontSize:12, color:C.gris, marginTop:12 }}>
                  Así se ve el cotizador en el portal de revendedores
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
            <h2 style={{ fontSize:28, fontWeight:800, color:C.azulTxt, textAlign:'center', marginBottom:8 }}>Quiero sumarme</h2>
            <p style={{ color:C.gris, textAlign:'center', marginBottom:32, fontSize:15, lineHeight:1.7 }}>
              Completá tus datos y te contactamos por WhatsApp. Sin presión, sin compromisos.
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
