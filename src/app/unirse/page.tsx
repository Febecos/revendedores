// Server Component — lee comisiones_tramos directo de Neon DB en cada render.
// Si el admin cambia un tramo, la próxima visita (≤60s por CDN cache) lo refleja.
import { getDb } from '@/lib/db'
import { C } from './colores'
import FormularioWA from './FormularioWA'

interface Tramo {
  nivel: string
  desde_monto: number
  hasta_monto: number | null
  porcentaje: number
}

// Precio real Kit 2" 210W desde Neon DB (precio_full)
const KIT_PRECIO = 1_580_820
const KIT_NOMBRE = 'Kit Solar 2" 210W'

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('es-AR')
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
  } catch {
    return []
  }
}

// Cuántos kits equivale el umbral desde_monto
function kitsPorUmbral(monto: number): string {
  if (monto === 0) return '1er kit'
  const kits = Math.ceil(monto / KIT_PRECIO)
  return `≈ ${kits} kit${kits !== 1 ? 's' : ''}/mes`
}

const BENEFICIOS = [
  { emoji: '⚡', titulo: 'Margen real desde la primera venta', desc: 'Descuento inmediato al registrarte. Sin cuota de ingreso, sin stock mínimo, sin compromisos de compra.' },
  { emoji: '🔧', titulo: 'Cotizador técnico incluido', desc: 'Portal exclusivo: ingresás profundidad, litros/día y diámetro del pozo — el sistema elige la bomba correcta y te muestra tu precio mayorista.' },
  { emoji: '🌾', titulo: 'Mercado con demanda activa', desc: 'El 53% de los productores que consultan buscan agua para animales. La demanda ya existe; lo que falta es quien llegue primero con la solución.' },
]

const PASOS = [
  { n: '1', emoji: '📋', titulo: 'Te registrás', desc: 'Completás el formulario y en menos de 24 hs hábiles te asignamos acceso al portal con tu PIN personal.' },
  { n: '2', emoji: '💻', titulo: 'Cotizás desde el portal', desc: 'Ingresás los datos del pozo del cliente. El sistema devuelve la bomba correcta con tu precio mayorista aplicado.' },
  { n: '3', emoji: '💰', titulo: 'Vendés y ganás', desc: 'Vos definís el precio al público. La diferencia entre tu costo mayorista y lo que le cobrás al cliente es tu margen.' },
]

export default async function UnirsePage() {
  const tramos = await getTramos()

  // Primer tramo = nivel base (el descuento de entrada)
  const nivelBase = tramos[0]
  const nivelMedio = tramos[Math.floor(tramos.length / 2)] ?? tramos[1]

  const margenBase  = nivelBase  ? KIT_PRECIO * (nivelBase.porcentaje  / 100) : 0
  const margenMedio = nivelMedio ? KIT_PRECIO * (nivelMedio.porcentaje / 100) : 0

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;800&display=swap');
        #unirse-page, #unirse-page * { box-sizing:border-box; font-family:'Rubik',system-ui,sans-serif; }
        #unirse-page { background:${C.fondo}; color:${C.azulTxt}; min-height:100vh; }
        body { background:${C.fondo} !important; }
        #unirse-page a { text-decoration:none; }
        .u-cta:hover  { background:#bcd430 !important; }
        .u-wa:hover   { background:#1da851 !important; }
        .u-back:hover { color:${C.azul} !important; border-color:${C.azul} !important; }
        @media(max-width:640px){
          .u-nav-link { display:none !important; }
          .u-g3 { grid-template-columns:1fr !important; }
          .u-g2 { grid-template-columns:1fr !important; }
          .u-ej { flex-direction:column !important; }
          .u-fg { grid-template-columns:1fr !important; }
          .u-strip { gap:24px !important; }
        }
      `}</style>

      <div id="unirse-page">

        {/* NAV */}
        <nav style={{ background:C.blanco, borderBottom:`1px solid ${C.grisB}`, height:68, display:'flex', alignItems:'center', position:'sticky', top:0, zIndex:200 }}>
          <div style={{ maxWidth:1060, margin:'0 auto', width:'100%', padding:'0 28px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <a href="https://febecos.com" style={{ color:C.azul, fontWeight:800, fontSize:20, letterSpacing:-.5 }}>🌱 Febecos</a>
            <div style={{ display:'flex', gap:20, alignItems:'center' }}>
              <a className="u-nav-link" href="https://febecos.com/catalogo" style={{ color:C.gris, fontSize:13, fontWeight:500 }}>Catálogo</a>
              <a className="u-nav-link" href="https://selector.febecos.com" style={{ color:C.gris, fontSize:13, fontWeight:500 }}>Selector</a>
              <a href="https://revendedores.febecos.com" style={{ background:C.grisBg, color:C.azulTxt, border:`1px solid ${C.grisB}`, borderRadius:8, padding:'7px 16px', fontSize:13, fontWeight:600 }}>
                Ya tengo acceso →
              </a>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section style={{ background:C.azul, padding:'72px 28px 64px', textAlign:'center' }}>
          <div style={{ maxWidth:680, margin:'0 auto' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(168,198,27,.15)', border:`1px solid ${C.acento}`, borderRadius:100, padding:'5px 16px', fontSize:12, fontWeight:700, color:C.acento, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:28 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:C.acento, display:'inline-block' }} />
              Programa de Revendedores
            </div>
            <h1 style={{ fontSize:'clamp(28px,5vw,46px)', fontWeight:800, color:C.blanco, lineHeight:1.15, marginBottom:20, letterSpacing:-.5 }}>
              Vendé bombas solares.<br />
              <span style={{ color:C.acento }}>El campo te espera.</span>
            </h1>
            <p style={{ fontSize:17, color:'rgba(255,255,255,.8)', lineHeight:1.75, marginBottom:36, maxWidth:540, margin:'0 auto 36px' }}>
              Precios mayoristas, cotizador técnico y soporte completo de Febecos.<br />Sin cuota de ingreso. Sin stock mínimo.
            </p>
            <a href="#formulario" className="u-cta" style={{ display:'inline-block', background:C.acento, color:C.azul, padding:'15px 36px', borderRadius:10, fontWeight:800, fontSize:16, transition:'background .15s' }}>
              Quiero sumarme →
            </a>
          </div>
        </section>

        {/* STRIP DATOS */}
        <div style={{ background:C.acentoBg, borderTop:`1px solid ${C.acentoBord}`, borderBottom:`1px solid ${C.acentoBord}`, padding:'18px 28px' }}>
          <div className="u-strip" style={{ maxWidth:860, margin:'0 auto', display:'flex', justifyContent:'center', gap:48, flexWrap:'wrap' }}>
            {[
              [nivelBase ? `${nivelBase.porcentaje}–${tramos[tramos.length-1]?.porcentaje ?? '?'}%` : '7–20%', 'Descuento mayorista'],
              ['53%',  'Leads ganaderos'],
              ['24 hs', 'Para tener acceso'],
              ['12 m',  'Garantía del producto'],
            ].map(([val, label]) => (
              <div key={label as string} style={{ textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:800, color:C.verde }}>{val}</div>
                <div style={{ fontSize:12, color:C.gris, fontWeight:500 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* BENEFICIOS */}
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

        {/* COMISIONES — datos dinámicos desde DB */}
        <section style={{ padding:'64px 28px', background:C.blanco, borderTop:`1px solid ${C.grisB}` }}>
          <div style={{ maxWidth:860, margin:'0 auto' }}>
            <h2 style={{ fontSize:28, fontWeight:800, color:C.azulTxt, textAlign:'center', marginBottom:8 }}>Estructura de comisiones</h2>
            <p style={{ color:C.gris, textAlign:'center', marginBottom:36, fontSize:15, lineHeight:1.7 }}>
              A mayor volumen mensual, mayor descuento. Automático, sin negociaciones.
            </p>

            {tramos.length > 0 ? (
              <>
                <div style={{ borderRadius:14, overflow:'hidden', border:`1px solid ${C.grisB}`, marginBottom:32 }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ background:C.azul }}>
                        {['Nivel', 'Facturación mensual', 'Equivale aprox.', 'Descuento', `Tu margen · ${KIT_NOMBRE}`].map(h => (
                          <th key={h} style={{ padding:'12px 18px', textAlign:'left', color:'rgba(255,255,255,.8)', fontSize:12, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tramos.map((t, i) => {
                        const margen = KIT_PRECIO * (t.porcentaje / 100)
                        const colorNivel = i === 0 ? C.azulTxt : i === tramos.length - 1 ? '#155a2a' : C.verde
                        return (
                          <tr key={t.nivel} style={{ background: i % 2 === 0 ? C.blanco : C.grisBg, borderBottom:`1px solid ${C.grisB}` }}>
                            <td style={{ padding:'13px 18px', fontWeight:700, color:colorNivel, fontSize:15 }}>{t.nivel}</td>
                            <td style={{ padding:'13px 18px', color:C.azulTxt, fontSize:14 }}>
                              {t.desde_monto === 0 ? 'Desde $0' : `Desde ${fmt(t.desde_monto)}`}
                            </td>
                            <td style={{ padding:'13px 18px', color:C.gris, fontSize:13 }}>
                              {kitsPorUmbral(t.desde_monto)}
                            </td>
                            <td style={{ padding:'13px 18px', fontWeight:800, color:colorNivel, fontSize:20 }}>{t.porcentaje}%</td>
                            <td style={{ padding:'13px 18px', fontWeight:700, color:colorNivel, fontSize:15 }}>{fmt(margen)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Ejemplo con precios reales */}
                <div style={{ background:C.acentoBg, border:`1px solid ${C.acentoBord}`, borderRadius:12, padding:'24px 28px' }}>
                  <p style={{ fontSize:13, fontWeight:700, color:C.verde, marginBottom:4, textTransform:'uppercase', letterSpacing:'.08em' }}>
                    📊 Ejemplo real — {KIT_NOMBRE}
                  </p>
                  <p style={{ fontSize:13, color:C.gris, marginBottom:16 }}>
                    Precio de lista: <strong style={{ color:C.azulTxt }}>{fmt(KIT_PRECIO)}</strong> · Kit completo con paneles, cable y soga
                  </p>
                  <div className="u-ej" style={{ display:'flex', gap:16, alignItems:'center' }}>
                    <div style={{ background:C.blanco, border:`1px solid ${C.grisB}`, borderRadius:10, padding:'16px 20px', textAlign:'center', flex:1 }}>
                      <div style={{ fontSize:12, color:C.gris, marginBottom:2 }}>
                        {nivelBase?.nivel} · {nivelBase?.porcentaje}%
                      </div>
                      <div style={{ fontSize:26, fontWeight:800, color:C.azulTxt }}>{fmt(margenBase)}</div>
                      <div style={{ fontSize:11, color:C.gris }}>por venta</div>
                    </div>
                    <div style={{ color:C.acento, fontSize:22, fontWeight:800, flexShrink:0 }}>→</div>
                    <div style={{ background:C.blanco, border:`2px solid ${C.verde}`, borderRadius:10, padding:'16px 20px', textAlign:'center', flex:1 }}>
                      <div style={{ fontSize:12, color:C.gris, marginBottom:2 }}>
                        {nivelMedio?.nivel} · {nivelMedio?.porcentaje}%
                      </div>
                      <div style={{ fontSize:26, fontWeight:800, color:C.verde }}>{fmt(margenMedio)}</div>
                      <div style={{ fontSize:11, color:C.gris }}>por venta</div>
                    </div>
                  </div>
                  <p style={{ fontSize:13, color:C.azulTxt, marginTop:14, textAlign:'center', fontWeight:600 }}>
                    5 ventas/mes en {nivelMedio?.nivel} → <span style={{ color:C.verde }}>{fmt(margenMedio * 5)} de margen bruto</span>
                  </p>
                  <p style={{ fontSize:12, color:C.gris, marginTop:4, textAlign:'center' }}>
                    El nivel sube automáticamente según tu volumen mensual acumulado.
                  </p>
                </div>
              </>
            ) : (
              <p style={{ textAlign:'center', color:C.gris }}>Cargando estructura de comisiones…</p>
            )}
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section style={{ padding:'64px 28px', background:C.fondo }}>
          <div style={{ maxWidth:860, margin:'0 auto' }}>
            <h2 style={{ fontSize:28, fontWeight:800, color:C.azulTxt, textAlign:'center', marginBottom:40 }}>Cómo funciona</h2>
            <div className="u-g3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
              {PASOS.map(p => (
                <div key={p.titulo} style={{ background:C.blanco, border:`1px solid ${C.grisB}`, borderRadius:14, padding:'32px 24px 24px', position:'relative' }}>
                  <div style={{ position:'absolute', top:-14, left:24, background:C.azul, color:C.blanco, width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14 }}>
                    {p.n}
                  </div>
                  <div style={{ fontSize:30, marginBottom:12, marginTop:4 }}>{p.emoji}</div>
                  <h3 style={{ fontSize:16, fontWeight:700, color:C.azulTxt, marginBottom:8 }}>{p.titulo}</h3>
                  <p style={{ fontSize:14, color:C.gris, lineHeight:1.65 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRODUCTO */}
        <section style={{ padding:'64px 28px', background:C.blanco, borderTop:`1px solid ${C.grisB}` }}>
          <div style={{ maxWidth:820, margin:'0 auto' }}>
            <h2 style={{ fontSize:28, fontWeight:800, color:C.azulTxt, textAlign:'center', marginBottom:40 }}>El producto</h2>
            <div className="u-g2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              {[
                { title:'🔋 Kit completo incluye:', items:['Bomba solar sumergible (210W a 1100W)','Paneles solares','Estructura de soporte','Cable submersible + soga de seguridad','Protecciones eléctricas'] },
                { title:'✅ Respaldo Febecos:',    items:['Garantía 12 meses','Soporte técnico post-venta','Curvas de performance por modelo','Cotizador automático en el portal','Acceso 24/7 a precios mayoristas'] },
              ].map(col => (
                <div key={col.title} style={{ background:C.grisBg, border:`1px solid ${C.grisB}`, borderRadius:14, padding:'24px' }}>
                  <h3 style={{ fontSize:15, fontWeight:700, color:C.azulTxt, marginBottom:16 }}>{col.title}</h3>
                  <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:10 }}>
                    {col.items.map(item => (
                      <li key={item} style={{ display:'flex', gap:8, alignItems:'flex-start', fontSize:14, color:C.gris }}>
                        <span style={{ color:C.verde, fontWeight:700, flexShrink:0 }}>✓</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FORMULARIO */}
        <section id="formulario" style={{ padding:'64px 28px', background:C.fondo, borderTop:`1px solid ${C.grisB}` }}>
          <div style={{ maxWidth:600, margin:'0 auto' }}>
            <h2 style={{ fontSize:28, fontWeight:800, color:C.azulTxt, textAlign:'center', marginBottom:8 }}>Quiero sumarme</h2>
            <p style={{ color:C.gris, textAlign:'center', marginBottom:32, fontSize:15, lineHeight:1.7 }}>
              Completá tus datos y te contactamos por WhatsApp. Sin presión, sin compromisos.
            </p>
            <FormularioWA />
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background:C.azul, padding:'40px 28px', textAlign:'center' }}>
          <p style={{ color:'rgba(255,255,255,.9)', fontWeight:700, fontSize:16, marginBottom:8 }}>¿Preferís hablar primero?</p>
          <p style={{ color:'rgba(255,255,255,.6)', fontSize:14, marginBottom:24, lineHeight:1.7 }}>
            Escribinos directamente y te hacemos una demo del portal. Sin compromiso.
          </p>
          <a
            href="https://wa.me/5491125750323?text=Hola%2C%20me%20interesa%20el%20Programa%20de%20Revendedores%20Febecos."
            target="_blank" rel="noopener noreferrer"
            className="u-wa"
            style={{ display:'inline-block', background:'#25d366', color:C.blanco, padding:'13px 32px', borderRadius:10, fontWeight:800, fontSize:15, transition:'background .15s', marginBottom:28 }}
          >
            📱 +54 9 11 2575-0323
          </a>
          <div style={{ borderTop:'1px solid rgba(255,255,255,.1)', paddingTop:20, display:'flex', gap:20, justifyContent:'center', flexWrap:'wrap' }}>
            {[['revendedores.febecos.com','https://revendedores.febecos.com'],['febecos.com','https://febecos.com'],['selector.febecos.com','https://selector.febecos.com']].map(([label,href]) => (
              <a key={href} href={href} style={{ color:'rgba(255,255,255,.45)', fontSize:13 }}>{label}</a>
            ))}
          </div>
        </footer>

      </div>
    </>
  )
}
