'use client'
import { useState } from 'react'

// ── Paleta Febecos (igual que selector y catálogo) ──────────────────────────
const C = {
  azul:      '#003d72',
  azulMid:   '#224a73',
  azulTxt:   '#203b61',
  verde:     '#2D5A27',
  acento:    '#a8c61b',
  acentoBg:  '#f5fadf',
  acentoBord:'#c8df6a',
  naranja:   '#f6861c',
  fondo:     '#f7f9fc',
  blanco:    '#ffffff',
  gris:      '#5a6a7a',
  grisB:     '#dce6f0',
  grisBg:    '#eef3f9',
}

const PROVINCIAS = [
  'Buenos Aires','CABA','Catamarca','Chaco','Chubut','Córdoba','Corrientes',
  'Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones',
  'Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe',
  'Santiago del Estero','Tierra del Fuego','Tucumán',
]

// Precios reales del Kit Solar 2" 210W (precio_full $1.580.820 según Neon DB)
const NIVELES = [
  { nivel: 'Nivel 1', desde: '$0',           pct: '7%',  ejemplo: '$110.657', color: C.azulTxt },
  { nivel: 'Nivel 2', desde: '$1.000.000',   pct: '10%', ejemplo: '$158.082', color: C.azulMid },
  { nivel: 'Nivel 3', desde: '$3.000.000',   pct: '12%', ejemplo: '$189.698', color: C.verde   },
  { nivel: 'Nivel 4', desde: '$7.000.000',   pct: '15%', ejemplo: '$237.123', color: '#1a6b35' },
  { nivel: 'Nivel 5', desde: '$15.000.000',  pct: '20%', ejemplo: '$316.164', color: '#155a2a' },
]

const BENEFICIOS = [
  { emoji: '⚡', titulo: 'Margen real desde el día 1', desc: '7% de descuento inmediato al registrarte. Sin cuota de ingreso, sin stock mínimo, sin compromisos de compra.' },
  { emoji: '🔧', titulo: 'Cotizador técnico incluido', desc: 'Portal exclusivo: ingresás profundidad, litros/día y diámetro del pozo — el sistema elige la bomba correcta y te muestra tu precio mayorista.' },
  { emoji: '🌾', titulo: 'Mercado con demanda activa', desc: '53% de los productores que consultan buscan agua para animales. La demanda ya existe; lo que falta es quien llegue primero con la solución.' },
]

const PASOS = [
  { n: '1', emoji: '📋', titulo: 'Te registrás', desc: 'Completás el formulario y en menos de 24 hs hábiles te asignamos acceso al portal con tu PIN personal.' },
  { n: '2', emoji: '💻', titulo: 'Cotizás desde el portal', desc: 'Ingresás los datos del pozo del cliente. El sistema devuelve la bomba correcta con tu precio mayorista aplicado.' },
  { n: '3', emoji: '💰', titulo: 'Vendés y ganás', desc: 'Vos definís el precio al público. La diferencia entre tu costo mayorista y lo que cobrás al cliente es tu margen.' },
]

export default function UnirsePage() {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', provincia: '' })
  const [errores, setErrores] = useState<Record<string, boolean>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrores(prev => ({ ...prev, [e.target.name]: false }))
  }

  const handleSubmit = () => {
    const errs: Record<string, boolean> = {}
    if (!form.nombre.trim())    errs.nombre    = true
    if (!form.email.trim())     errs.email     = true
    if (!form.telefono.trim())  errs.telefono  = true
    if (!form.provincia)        errs.provincia = true
    if (Object.keys(errs).length) { setErrores(errs); return }

    const msg = encodeURIComponent(
      `Hola, me interesa el Programa de Revendedores Febecos.\n\n` +
      `Nombre: ${form.nombre}\nEmail: ${form.email}\nTeléfono: ${form.telefono}\nProvincia: ${form.provincia}\n\n` +
      `¿Me pueden contar más para empezar?`
    )
    window.open(`https://wa.me/5491125750323?text=${msg}`, '_blank')
  }

  return (
    <>
      {/* Fuente Rubik + reset del body oscuro del layout global */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;800&display=swap');
        #unirse-page, #unirse-page * { box-sizing: border-box; font-family: 'Rubik', system-ui, sans-serif; }
        #unirse-page { background: ${C.fondo}; color: ${C.azulTxt}; min-height: 100vh; }
        body { background: ${C.fondo} !important; }
        #unirse-page a { text-decoration: none; }
        #unirse-page input, #unirse-page select { font-family: 'Rubik', system-ui, sans-serif; }
        #unirse-page input:focus, #unirse-page select:focus {
          outline: none;
          border-color: ${C.azul} !important;
          box-shadow: 0 0 0 3px rgba(0,61,114,.12);
        }
        .unirse-cta-btn:hover { background: #bcd430 !important; }
        .unirse-wa-btn:hover  { background: #1da851 !important; }
        .unirse-back:hover    { color: ${C.azul} !important; border-color: ${C.azul} !important; }
        @media(max-width:640px){
          .unirse-nav-link { display: none !important; }
          .unirse-grid3    { grid-template-columns: 1fr !important; }
          .unirse-grid2    { grid-template-columns: 1fr !important; }
          .unirse-ej-grid  { flex-direction: column !important; }
          .unirse-form-grid{ grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div id="unirse-page">

        {/* ── NAV ─────────────────────────────────────────────────────────── */}
        <nav style={{ background: C.blanco, borderBottom: `1px solid ${C.grisB}`, height: 68, display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 200 }}>
          <div style={{ maxWidth: 1060, margin: '0 auto', width: '100%', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <a href="https://febecos.com" style={{ color: C.azul, fontWeight: 800, fontSize: 20, letterSpacing: -.5 }}>
              🌱 Febecos
            </a>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <a className="unirse-nav-link" href="https://febecos.com/catalogo" style={{ color: C.gris, fontSize: 13, fontWeight: 500 }}>Catálogo</a>
              <a className="unirse-nav-link" href="https://selector.febecos.com" style={{ color: C.gris, fontSize: 13, fontWeight: 500 }}>Selector</a>
              <a href="https://revendedores.febecos.com" style={{ background: C.grisBg, color: C.azulTxt, border: `1px solid ${C.grisB}`, borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600 }}>
                Ya tengo acceso →
              </a>
            </div>
          </div>
        </nav>

        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <section style={{ background: C.azul, padding: '72px 28px 64px', textAlign: 'center' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(168,198,27,.15)', border: `1px solid ${C.acento}`, borderRadius: 100, padding: '5px 16px', fontSize: 12, fontWeight: 700, color: C.acento, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.acento, display: 'inline-block' }} />
              Programa de Revendedores
            </div>
            <h1 style={{ fontSize: 'clamp(28px,5vw,46px)', fontWeight: 800, color: C.blanco, lineHeight: 1.15, marginBottom: 20, letterSpacing: -.5 }}>
              Vendé bombas solares.<br />
              <span style={{ color: C.acento }}>El campo te espera.</span>
            </h1>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,.8)', lineHeight: 1.75, marginBottom: 36, maxWidth: 540, margin: '0 auto 36px' }}>
              Precios mayoristas, cotizador técnico y soporte completo de Febecos.<br />Sin cuota de ingreso. Sin stock mínimo.
            </p>
            <a href="#formulario" className="unirse-cta-btn" style={{ display: 'inline-block', background: C.acento, color: C.azul, padding: '15px 36px', borderRadius: 10, fontWeight: 800, fontSize: 16, transition: 'background .15s' }}>
              Quiero sumarme →
            </a>
          </div>
        </section>

        {/* ── STRIP DE DATOS ──────────────────────────────────────────────── */}
        <div style={{ background: C.acentoBg, borderBottom: `1px solid ${C.acentoBord}`, borderTop: `1px solid ${C.acentoBord}`, padding: '18px 28px' }}>
          <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
            {[['53%', 'Ganaderos'], ['7-20%', 'Descuento mayorista'], ['24 hs', 'Para tener acceso'], ['12 m', 'Garantía del producto']].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.verde }}>{val}</div>
                <div style={{ fontSize: 12, color: C.gris, fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── BENEFICIOS ──────────────────────────────────────────────────── */}
        <section style={{ padding: '64px 28px', background: C.fondo }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: C.azulTxt, textAlign: 'center', marginBottom: 8 }}>Por qué tiene sentido</h2>
            <p style={{ color: C.gris, textAlign: 'center', marginBottom: 40, fontSize: 15, lineHeight: 1.7 }}>Una línea de producto con demanda real, margen desde el día 1 y todo el respaldo técnico de Febecos.</p>
            <div className="unirse-grid3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              {BENEFICIOS.map(b => (
                <div key={b.titulo} style={{ background: C.blanco, border: `1px solid ${C.grisB}`, borderRadius: 14, padding: '28px 24px' }}>
                  <div style={{ fontSize: 32, marginBottom: 14 }}>{b.emoji}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.azulTxt, marginBottom: 8 }}>{b.titulo}</h3>
                  <p style={{ fontSize: 14, color: C.gris, lineHeight: 1.65 }}>{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMISIONES ──────────────────────────────────────────────────── */}
        <section style={{ padding: '64px 28px', background: C.blanco, borderTop: `1px solid ${C.grisB}` }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: C.azulTxt, textAlign: 'center', marginBottom: 8 }}>Estructura de comisiones</h2>
            <p style={{ color: C.gris, textAlign: 'center', marginBottom: 36, fontSize: 15, lineHeight: 1.7 }}>
              A mayor volumen mensual, mayor descuento. Automático, sin negociaciones.
            </p>

            {/* Tabla */}
            <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.grisB}`, marginBottom: 32 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: C.azul }}>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: 'rgba(255,255,255,.8)', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Nivel</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: 'rgba(255,255,255,.8)', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Facturación mensual</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: 'rgba(255,255,255,.8)', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Descuento</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: 'rgba(255,255,255,.8)', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Tu margen · Kit 2" 210W</th>
                  </tr>
                </thead>
                <tbody>
                  {NIVELES.map((n, i) => (
                    <tr key={n.nivel} style={{ background: i % 2 === 0 ? C.blanco : C.grisBg, borderBottom: `1px solid ${C.grisB}` }}>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: n.color, fontSize: 15 }}>{n.nivel}</td>
                      <td style={{ padding: '14px 20px', color: C.azulTxt, fontSize: 15 }}>{n.desde}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 800, color: n.color, fontSize: 18 }}>{n.pct}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: n.color, fontSize: 15 }}>{n.ejemplo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Ejemplo visual */}
            <div style={{ background: C.acentoBg, border: `1px solid ${C.acentoBord}`, borderRadius: 12, padding: '24px 28px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.verde, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.08em' }}>📊 Ejemplo real — Kit Bomba Solar 2" 210W</p>
              <p style={{ fontSize: 13, color: C.gris, marginBottom: 16 }}>Precio de lista: <strong style={{ color: C.azulTxt }}>$1.580.820</strong> · Kit completo con paneles, cable y soga</p>
              <div className="unirse-ej-grid" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ background: C.blanco, border: `1px solid ${C.grisB}`, borderRadius: 10, padding: '16px 20px', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 12, color: C.gris, marginBottom: 2 }}>Nivel 1 · 7%</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: C.azulTxt }}>$110.657</div>
                  <div style={{ fontSize: 11, color: C.gris }}>por venta</div>
                </div>
                <div style={{ color: C.acento, fontSize: 22, fontWeight: 800, flexShrink: 0 }}>→</div>
                <div style={{ background: C.blanco, border: `2px solid ${C.verde}`, borderRadius: 10, padding: '16px 20px', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 12, color: C.gris, marginBottom: 2 }}>Nivel 3 · 12%</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: C.verde }}>$189.698</div>
                  <div style={{ fontSize: 11, color: C.gris }}>por venta</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: C.azulTxt, marginTop: 14, textAlign: 'center', fontWeight: 600 }}>
                5 ventas/mes en Nivel 3 → <span style={{ color: C.verde }}>$948.490 de margen bruto</span>
              </p>
              <p style={{ fontSize: 12, color: C.gris, marginTop: 4, textAlign: 'center' }}>
                El nivel sube automáticamente según tu volumen mensual acumulado.
              </p>
            </div>
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ───────────────────────────────────────────────── */}
        <section style={{ padding: '64px 28px', background: C.fondo }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: C.azulTxt, textAlign: 'center', marginBottom: 40 }}>Cómo funciona</h2>
            <div className="unirse-grid3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
              {PASOS.map(p => (
                <div key={p.titulo} style={{ background: C.blanco, border: `1px solid ${C.grisB}`, borderRadius: 14, padding: '32px 24px 24px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: -14, left: 24, background: C.azul, color: C.blanco, width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>
                    {p.n}
                  </div>
                  <div style={{ fontSize: 30, marginBottom: 12, marginTop: 4 }}>{p.emoji}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.azulTxt, marginBottom: 8 }}>{p.titulo}</h3>
                  <p style={{ fontSize: 14, color: C.gris, lineHeight: 1.65 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRODUCTO ────────────────────────────────────────────────────── */}
        <section style={{ padding: '64px 28px', background: C.blanco, borderTop: `1px solid ${C.grisB}` }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: C.azulTxt, textAlign: 'center', marginBottom: 40 }}>El producto</h2>
            <div className="unirse-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {[
                { title: '🔋 Kit completo incluye:', items: ['Bomba solar sumergible (210W a 1100W)','Paneles solares','Estructura de soporte','Cable submersible + soga de seguridad','Protecciones eléctricas'] },
                { title: '✅ Respaldo Febecos:', items: ['Garantía 12 meses','Soporte técnico post-venta','Curvas de performance por modelo','Cotizador automático en el portal','Acceso 24/7 a precios mayoristas'] },
              ].map(col => (
                <div key={col.title} style={{ background: C.grisBg, border: `1px solid ${C.grisB}`, borderRadius: 14, padding: '24px 24px' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: C.azulTxt, marginBottom: 16 }}>{col.title}</h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {col.items.map(item => (
                      <li key={item} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14, color: C.gris }}>
                        <span style={{ color: C.verde, fontWeight: 700, flexShrink: 0 }}>✓</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FORMULARIO ──────────────────────────────────────────────────── */}
        <section id="formulario" style={{ padding: '64px 28px', background: C.fondo, borderTop: `1px solid ${C.grisB}` }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: C.azulTxt, textAlign: 'center', marginBottom: 8 }}>Quiero sumarme</h2>
            <p style={{ color: C.gris, textAlign: 'center', marginBottom: 32, fontSize: 15, lineHeight: 1.7 }}>
              Completá tus datos y te contactamos por WhatsApp. Sin presión, sin compromisos.
            </p>
            <div style={{ background: C.blanco, border: `1px solid ${C.grisB}`, borderRadius: 16, padding: '32px 28px' }}>
              <div className="unirse-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {[
                  { name: 'nombre',   label: 'Nombre completo',       type: 'text',  placeholder: 'Juan Pérez' },
                  { name: 'email',    label: 'Email',                  type: 'email', placeholder: 'juan@empresa.com' },
                  { name: 'telefono', label: 'Teléfono / WhatsApp',    type: 'tel',   placeholder: '11 2345 6789' },
                ].map(f => (
                  <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: C.azulTxt }}>{f.label} *</label>
                    <input
                      name={f.name}
                      type={f.type}
                      placeholder={f.placeholder}
                      value={(form as any)[f.name]}
                      onChange={handleChange}
                      style={{ padding: '11px 14px', border: `1.5px solid ${errores[f.name] ? '#E40044' : C.grisB}`, borderRadius: 8, fontSize: 14, color: C.azulTxt, background: C.grisBg, width: '100%' }}
                    />
                    {errores[f.name] && <span style={{ fontSize: 11, color: '#E40044' }}>Campo obligatorio</span>}
                  </div>
                ))}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.azulTxt }}>Provincia *</label>
                  <select
                    name="provincia"
                    value={form.provincia}
                    onChange={handleChange}
                    style={{ padding: '11px 14px', border: `1.5px solid ${errores.provincia ? '#E40044' : C.grisB}`, borderRadius: 8, fontSize: 14, color: C.azulTxt, background: C.grisBg, width: '100%', appearance: 'none' }}
                  >
                    <option value="">Seleccioná tu provincia...</option>
                    {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {errores.provincia && <span style={{ fontSize: 11, color: '#E40044' }}>Seleccioná tu provincia</span>}
                </div>
              </div>
              <button
                onClick={handleSubmit}
                className="unirse-wa-btn"
                style={{ width: '100%', padding: '14px', background: '#25d366', color: C.blanco, border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 800, cursor: 'pointer', transition: 'background .15s' }}
              >
                💬 Contactarme por WhatsApp
              </button>
              <p style={{ fontSize: 12, color: C.gris, textAlign: 'center', marginTop: 10 }}>
                Te abrimos WhatsApp con tus datos pre-completados. Respondemos en horario comercial.
              </p>
            </div>
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <footer style={{ background: C.azul, padding: '40px 28px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,.9)', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>¿Preferís hablar primero?</p>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}>
            Escribinos directamente y te hacemos una demo del portal. Sin compromiso.
          </p>
          <a
            href="https://wa.me/5491125750323?text=Hola%2C%20me%20interesa%20el%20Programa%20de%20Revendedores%20Febecos.%20%C2%BFPodr%C3%ADan%20contarme%20m%C3%A1s%3F"
            target="_blank"
            rel="noopener noreferrer"
            className="unirse-wa-btn"
            style={{ display: 'inline-block', background: '#25d366', color: C.blanco, padding: '13px 32px', borderRadius: 10, fontWeight: 800, fontSize: 15, transition: 'background .15s', marginBottom: 28 }}
          >
            📱 +54 9 11 2575-0323
          </a>
          <div style={{ borderTop: `1px solid rgba(255,255,255,.1)`, paddingTop: 20, display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['revendedores.febecos.com','https://revendedores.febecos.com'], ['febecos.com','https://febecos.com'], ['selector.febecos.com','https://selector.febecos.com']].map(([label, href]) => (
              <a key={href} href={href} style={{ color: 'rgba(255,255,255,.45)', fontSize: 13 }}>{label}</a>
            ))}
          </div>
        </footer>

      </div>
    </>
  )
}
