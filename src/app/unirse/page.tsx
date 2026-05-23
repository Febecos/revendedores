'use client'
import { useState } from 'react'

const PROVINCIAS = [
  'Buenos Aires','CABA','Catamarca','Chaco','Chubut','Córdoba','Corrientes',
  'Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones',
  'Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe',
  'Santiago del Estero','Tierra del Fuego','Tucumán'
]

const NIVELES = [
  { nivel: 'Nivel 1', desde: '$0',          pct: '7%',  color: '#4ade80' },
  { nivel: 'Nivel 2', desde: '$1.000.000',  pct: '10%', color: '#34d399' },
  { nivel: 'Nivel 3', desde: '$3.000.000',  pct: '12%', color: '#22c55e' },
  { nivel: 'Nivel 4', desde: '$7.000.000',  pct: '15%', color: '#16a34a' },
  { nivel: 'Nivel 5', desde: '$15.000.000', pct: '20%', color: '#15803d' },
]

const PASOS = [
  { emoji: '📋', titulo: 'Completás el formulario', desc: 'Nombre, teléfono y provincia. En menos de 24 hs hábiles te asignamos acceso al portal con PIN personal.' },
  { emoji: '💻', titulo: 'Cotizás desde el portal', desc: 'Ingresás profundidad, litros/día y diámetro. El sistema te devuelve la bomba correcta con tu precio mayorista.' },
  { emoji: '💰', titulo: 'Vendés y ganás', desc: 'Le cobrás al cliente lo que decidas. La diferencia entre tu costo mayorista y el precio al público es tu margen.' },
]

const BENEFICIOS = [
  { emoji: '⚡', titulo: 'Margen real desde el día 1', desc: '7% de descuento inmediato al registrarte. Sin cuota de ingreso, sin stock mínimo, sin compromisos.' },
  { emoji: '🔧', titulo: 'Herramienta técnica incluida', desc: 'Portal con cotizador: ingresás los datos del pozo y el sistema elige la bomba correcta. Fácil de usar, difícil de equivocar.' },
  { emoji: '🌱', titulo: 'Mercado con demanda real', desc: 'El 53% de los leads son ganaderos que necesitan agua para animales. La demanda existe — lo que falta es el producto.' },
]

export default function UnirsePage() {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', provincia: '' })
  const [errores, setErrores] = useState<Record<string, boolean>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores(prev => ({ ...prev, [e.target.name]: false }))
  }

  const handleSubmit = () => {
    const nuevosErrores: Record<string, boolean> = {}
    if (!form.nombre.trim()) nuevosErrores.nombre = true
    if (!form.email.trim()) nuevosErrores.email = true
    if (!form.telefono.trim()) nuevosErrores.telefono = true
    if (!form.provincia) nuevosErrores.provincia = true

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      return
    }

    const msg = encodeURIComponent(
      `Hola, me interesa el Programa de Revendedores Febecos.\n\n` +
      `Nombre: ${form.nombre}\n` +
      `Email: ${form.email}\n` +
      `Teléfono: ${form.telefono}\n` +
      `Provincia: ${form.provincia}\n\n` +
      `Quiero saber más sobre cómo empezar.`
    )
    window.open(`https://wa.me/5491125750323?text=${msg}`, '_blank')
  }

  return (
    <div style={s.page}>

      {/* ── HEADER ── */}
      <header style={s.header}>
        <img
          src="https://dcdn-us.mitiendanube.com/stores/007/467/093/themes/common/logo-6209403414584676726-1775575296-91ab6514e309ebf33862eadc64bcbe161775575296-480-0.webp"
          alt="Febecos"
          style={{ height: 36, objectFit: 'contain' }}
        />
        <a href="https://revendedores.febecos.com" style={s.headerLink}>
          Ya tengo acceso →
        </a>
      </header>

      {/* ── HERO ── */}
      <section style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.badge}>☀️ Programa de Revendedores</div>
          <h1 style={s.heroTitle}>
            Vendé bombas solares.<br />
            <span style={{ color: '#4ade80' }}>Ganás vos, el campo gana.</span>
          </h1>
          <p style={s.heroSubtitle}>
            Accedé a precios mayoristas, un cotizador técnico y soporte completo.
            Sin cuota de ingreso. Sin stock mínimo.
          </p>
          <a href="#formulario" style={s.ctaBtn}>
            Quiero sumarme →
          </a>
        </div>
      </section>

      {/* ── BENEFICIOS ── */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>Por qué tiene sentido</h2>
        <div style={s.grid3}>
          {BENEFICIOS.map(b => (
            <div key={b.titulo} style={s.card}>
              <div style={s.cardEmoji}>{b.emoji}</div>
              <h3 style={s.cardTitle}>{b.titulo}</h3>
              <p style={s.cardDesc}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TABLA DE COMISIONES ── */}
      <section style={{ ...s.section, background: '#0d1a2a' }}>
        <h2 style={s.sectionTitle}>Estructura de comisiones</h2>
        <p style={s.sectionSubtitle}>
          A mayor volumen mensual, mayor descuento. Automático, sin negociaciones.
        </p>

        {/* Tabla desktop */}
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Nivel</th>
                <th style={s.th}>Facturación mensual</th>
                <th style={s.th}>Tu descuento</th>
              </tr>
            </thead>
            <tbody>
              {NIVELES.map((n, i) => (
                <tr key={n.nivel} style={{ background: i % 2 === 0 ? '#0a1628' : '#0d1a2a' }}>
                  <td style={{ ...s.td, color: n.color, fontWeight: 700 }}>{n.nivel}</td>
                  <td style={s.td}>{n.desde}</td>
                  <td style={{ ...s.td, color: n.color, fontWeight: 800, fontSize: 20 }}>{n.pct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ejemplo numérico */}
        <div style={s.ejemplo}>
          <h3 style={{ color: '#4ade80', marginBottom: 12, fontSize: 16 }}>
            📊 Ejemplo: kit de $800.000 al cliente final
          </h3>
          <div style={s.ejemploGrid}>
            <div style={s.ejemploCard}>
              <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>Nivel 1 · 7%</div>
              <div style={{ color: '#4ade80', fontSize: 28, fontWeight: 800 }}>$56.000</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>de margen por venta</div>
            </div>
            <div style={{ color: '#4ade80', fontSize: 24, display: 'flex', alignItems: 'center' }}>→</div>
            <div style={{ ...s.ejemploCard, border: '2px solid #4ade80' }}>
              <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>Nivel 3 · 12%</div>
              <div style={{ color: '#4ade80', fontSize: 28, fontWeight: 800 }}>$96.000</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>de margen por venta</div>
            </div>
          </div>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 12, textAlign: 'center' }}>
            A 5 ventas/mes en Nivel 3: <strong style={{ color: '#e8f0f8' }}>$480.000 de margen bruto mensual</strong>
          </p>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>Cómo funciona</h2>
        <div style={s.grid3}>
          {PASOS.map((p, i) => (
            <div key={p.titulo} style={s.pasoCard}>
              <div style={s.pasoNumero}>{i + 1}</div>
              <div style={s.pasoEmoji}>{p.emoji}</div>
              <h3 style={s.cardTitle}>{p.titulo}</h3>
              <p style={s.cardDesc}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUCTO ── */}
      <section style={{ ...s.section, background: '#0d1a2a' }}>
        <h2 style={s.sectionTitle}>El producto</h2>
        <div style={s.grid2}>
          <div style={s.card}>
            <h3 style={{ ...s.cardTitle, marginBottom: 12 }}>🔋 Kit completo incluye:</h3>
            <ul style={s.lista}>
              {['Bomba solar sumergible (210W a 1100W)','Paneles solares','Estructura de soporte','Cable submersible + soga de seguridad','Protecciones eléctricas'].map(i => (
                <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: '#4ade80', flexShrink: 0 }}>✓</span>{i}
                </li>
              ))}
            </ul>
          </div>
          <div style={s.card}>
            <h3 style={{ ...s.cardTitle, marginBottom: 12 }}>✅ Respaldo Febecos:</h3>
            <ul style={s.lista}>
              {['Garantía 12 meses','Soporte técnico post-venta','Curvas de performance por modelo','Cotizador automático en el portal','Acceso 24/7 a precios mayoristas'].map(i => (
                <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: '#4ade80', flexShrink: 0 }}>✓</span>{i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── FORMULARIO ── */}
      <section id="formulario" style={s.section}>
        <h2 style={s.sectionTitle}>Quiero sumarme al programa</h2>
        <p style={s.sectionSubtitle}>
          Completá tus datos y te contactamos por WhatsApp.
        </p>
        <div style={s.formWrap}>
          <div style={s.formGrid}>
            <div style={s.campo}>
              <label style={s.label}>Nombre completo *</label>
              <input
                style={{ ...s.input, borderColor: errores.nombre ? '#ef4444' : '#1e3a52' }}
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Juan Pérez"
              />
              {errores.nombre && <p style={s.errorMsg}>Campo obligatorio</p>}
            </div>
            <div style={s.campo}>
              <label style={s.label}>Email *</label>
              <input
                style={{ ...s.input, borderColor: errores.email ? '#ef4444' : '#1e3a52' }}
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="juan@empresa.com"
              />
              {errores.email && <p style={s.errorMsg}>Campo obligatorio</p>}
            </div>
            <div style={s.campo}>
              <label style={s.label}>Teléfono / WhatsApp *</label>
              <input
                style={{ ...s.input, borderColor: errores.telefono ? '#ef4444' : '#1e3a52' }}
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="11 2345 6789"
              />
              {errores.telefono && <p style={s.errorMsg}>Campo obligatorio</p>}
            </div>
            <div style={s.campo}>
              <label style={s.label}>Provincia *</label>
              <select
                style={{ ...s.input, borderColor: errores.provincia ? '#ef4444' : '#1e3a52' }}
                name="provincia"
                value={form.provincia}
                onChange={handleChange}
              >
                <option value="">Seleccioná...</option>
                {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errores.provincia && <p style={s.errorMsg}>Seleccioná tu provincia</p>}
            </div>
          </div>
          <button style={s.submitBtn} onClick={handleSubmit}>
            💬 Contactarme por WhatsApp
          </button>
          <p style={{ color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 12 }}>
            Te redirigimos a WhatsApp con tus datos pre-completados. Respondemos en horario comercial.
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ ...s.section, background: '#0d1a2a', textAlign: 'center' }}>
        <h2 style={{ ...s.sectionTitle, marginBottom: 12 }}>
          ¿Preferís hablar primero?
        </h2>
        <p style={{ color: '#94a3b8', marginBottom: 24, lineHeight: 1.7 }}>
          Escribinos directamente y te hacemos una demo del portal.<br />
          Sin compromiso, sin presión.
        </p>
        <a
          href="https://wa.me/5491125750323?text=Hola%2C%20me%20interesa%20el%20Programa%20de%20Revendedores%20Febecos.%20%C2%BFPodr%C3%ADan%20contarme%20m%C3%A1s%3F"
          target="_blank"
          rel="noopener noreferrer"
          style={s.waBtn}
        >
          📱 +54 9 11 2575-0323
        </a>
        <p style={{ color: '#334155', fontSize: 13, marginTop: 32 }}>
          <a href="https://revendedores.febecos.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>
            revendedores.febecos.com
          </a>
          {' · '}
          <a href="https://febecos.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>
            febecos.com
          </a>
        </p>
      </section>

    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0a1628',
    color: '#e8f0f8',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #1a2d45',
    position: 'sticky' as const,
    top: 0,
    background: '#0a1628',
    zIndex: 100,
  },
  headerLink: {
    color: '#4ade80',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
  },

  // Hero
  hero: {
    padding: '80px 24px 64px',
    textAlign: 'center' as const,
    background: 'linear-gradient(180deg, #0a1628 0%, #0d1a2a 100%)',
  },
  heroInner: {
    maxWidth: 680,
    margin: '0 auto',
  },
  badge: {
    display: 'inline-block',
    background: '#0d2a1a',
    color: '#4ade80',
    border: '1px solid #166534',
    borderRadius: 20,
    padding: '4px 16px',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 'clamp(28px, 5vw, 48px)' as unknown as number,
    fontWeight: 800,
    lineHeight: 1.2,
    marginBottom: 20,
    color: '#e8f0f8',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#94a3b8',
    lineHeight: 1.7,
    marginBottom: 36,
  },
  ctaBtn: {
    display: 'inline-block',
    background: '#4ade80',
    color: '#0a1628',
    padding: '14px 32px',
    borderRadius: 10,
    fontWeight: 800,
    fontSize: 16,
    textDecoration: 'none',
    transition: 'transform 0.15s',
  },

  // Sections
  section: {
    padding: '64px 24px',
    background: '#0a1628',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 800,
    textAlign: 'center' as const,
    marginBottom: 12,
    color: '#e8f0f8',
  },
  sectionSubtitle: {
    color: '#94a3b8',
    textAlign: 'center' as const,
    marginBottom: 40,
    lineHeight: 1.7,
    maxWidth: 560,
    margin: '0 auto 40px',
  },

  // Grid
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 20,
    maxWidth: 960,
    margin: '0 auto',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 20,
    maxWidth: 800,
    margin: '0 auto',
  },

  // Cards
  card: {
    background: '#0d1a2a',
    border: '1px solid #1a2d45',
    borderRadius: 12,
    padding: '28px 24px',
  },
  cardEmoji: { fontSize: 32, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: 700, color: '#e8f0f8', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#94a3b8', lineHeight: 1.6 },

  // Pasos
  pasoCard: {
    background: '#0d1a2a',
    border: '1px solid #1a2d45',
    borderRadius: 12,
    padding: '28px 24px',
    position: 'relative' as const,
  },
  pasoNumero: {
    position: 'absolute' as const,
    top: -14,
    left: 24,
    background: '#4ade80',
    color: '#0a1628',
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 14,
  },
  pasoEmoji: { fontSize: 32, marginBottom: 12, marginTop: 8 },

  // Tabla
  tableWrap: {
    maxWidth: 640,
    margin: '0 auto 32px',
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #1a2d45',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    background: '#1a2d45',
    color: '#60a5fa',
    padding: '12px 16px',
    textAlign: 'left' as const,
    fontSize: 13,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  td: {
    padding: '14px 16px',
    fontSize: 15,
    color: '#e8f0f8',
    borderBottom: '1px solid #1a2d45',
  },

  // Ejemplo
  ejemplo: {
    maxWidth: 500,
    margin: '0 auto',
    background: '#0a1628',
    border: '1px solid #1a2d45',
    borderRadius: 12,
    padding: '24px',
  },
  ejemploGrid: {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ejemploCard: {
    background: '#0d1a2a',
    border: '1px solid #1a2d45',
    borderRadius: 10,
    padding: '16px 20px',
    textAlign: 'center' as const,
    flex: 1,
  },

  // Lista
  lista: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
    color: '#94a3b8',
    fontSize: 14,
  },


  // Formulario
  formWrap: {
    maxWidth: 600,
    margin: '0 auto',
    background: '#0d1a2a',
    border: '1px solid #1a2d45',
    borderRadius: 16,
    padding: '32px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  campo: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#94a3b8' },
  input: {
    background: '#0a1628',
    border: '1.5px solid #1e3a52',
    borderRadius: 8,
    padding: '10px 12px',
    color: '#e8f0f8',
    fontSize: 14,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    background: '#25d366',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
  },
  errorMsg: {
    color: '#ef4444',
    fontSize: 11,
    margin: 0,
    fontWeight: 500,
  },

  // WA button
  waBtn: {
    display: 'inline-block',
    background: '#25d366',
    color: '#fff',
    padding: '14px 32px',
    borderRadius: 10,
    fontWeight: 800,
    fontSize: 16,
    textDecoration: 'none',
  },
}
