'use client'
import { useState, useEffect, useRef } from 'react'

const TIPOS = [
  { id: 'pocero', label: '🔩 Soy pocero / perforista' },
  { id: 'ferreteria', label: '🏪 Tengo ferretería agropecuaria' },
  { id: 'instalador', label: '⚡ Hago instalaciones solares' },
  { id: 'pocero_instalador', label: '🔩⚡ Soy pocero e instalador' },
  { id: 'otro', label: '📋 Otro' },
]

const PROVINCIAS = [
  'Buenos Aires','CABA','Catamarca','Chaco','Chubut','Córdoba','Corrientes',
  'Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones',
  'Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe',
  'Santiago del Estero','Tierra del Fuego','Tucumán'
]

declare global {
  interface Window { turnstile: { render: (el: HTMLElement, opts: object) => void } }
}

export default function Home() {
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', whatsapp: '',
    empresa: '', provincia: '', localidad: '', cuit: ''
  })
  const [tipos, setTipos] = useState<string[]>([])
  const [estado, setEstado] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (turnstileRef.current && window.turnstile) {
        window.turnstile.render(turnstileRef.current, {
          sitekey: '0x4AAAAAADIqnVW-TocMScvY',
          callback: (token: string) => setTurnstileToken(token),
        })
      }
    }
    document.head.appendChild(script)
  }, [])

  const toggleTipo = (id: string) => {
    setTipos(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    if (!form.nombre || !form.email || !form.whatsapp || !form.provincia) {
      alert('Completá los campos obligatorios: nombre, email, WhatsApp y provincia.')
      return
    }
    if (tipos.length === 0) {
      alert('Seleccioná al menos un tipo de revendedor.')
      return
    }
    if (!turnstileToken) {
      alert('Completá la verificación de seguridad.')
      return
    }
    setEstado('loading')
    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tipo_revendedor: tipos, turnstileToken })
      })
      if (res.ok) setEstado('ok')
      else setEstado('error')
    } catch {
      setEstado('error')
    }
  }

  if (estado === 'ok') return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={{ fontSize: 48, marginBottom: 16, textAlign: 'center' }}>✅</div>
        <h2 style={{ color: '#1a3a5c', marginBottom: 8, textAlign: 'center' }}>¡Solicitud enviada!</h2>
        <p style={{ color: '#555', lineHeight: 1.7, textAlign: 'center' }}>
          Te mandamos un email a <strong>{form.email}</strong> para verificar tu dirección.<br />
          Hacé clic en el link del email para completar el registro.<br /><br />
          Una vez verificado, Guillermo revisa tu solicitud y te da acceso en 24 horas hábiles.
        </p>
      </div>
    </div>
  )

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h1 style={s.titulo}>Portal de Revendedores</h1>
        <p style={s.subtitulo}>
          Accedé al catálogo mayorista, herramientas de cotización con tu marca y precios diferenciados.
        </p>

        <div style={s.seccion}>
          <label style={s.labelGrande}>¿Qué rol tenés? *</label>
          <p style={s.hint}>Podés elegir más de una opción</p>
          <div style={s.tiposGrid}>
            {TIPOS.map(t => (
              <button
                key={t.id}
                onClick={() => toggleTipo(t.id)}
                style={{
                  ...s.tipoBtnBase,
                  ...(tipos.includes(t.id) ? s.tipoBtnActivo : s.tipoBtnInactivo)
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={s.grid2}>
          <div style={s.campo}>
            <label style={s.label}>Nombre *</label>
            <input style={s.input} name="nombre" value={form.nombre} onChange={handleChange} placeholder="Juan" />
          </div>
          <div style={s.campo}>
            <label style={s.label}>Apellido</label>
            <input style={s.input} name="apellido" value={form.apellido} onChange={handleChange} placeholder="Pérez" />
          </div>
        </div>

        <div style={s.grid2}>
          <div style={s.campo}>
            <label style={s.label}>Email *</label>
            <input style={s.input} name="email" type="email" value={form.email} onChange={handleChange} placeholder="juan@empresa.com" />
          </div>
          <div style={s.campo}>
            <label style={s.label}>WhatsApp *</label>
            <input style={s.input} name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="11 2345 6789" />
          </div>
        </div>

        <div style={s.grid2}>
          <div style={s.campo}>
            <label style={s.label}>Empresa / Negocio</label>
            <input style={s.input} name="empresa" value={form.empresa} onChange={handleChange} placeholder="Ferretería Agro Sur" />
          </div>
          <div style={s.campo}>
            <label style={s.label}>CUIT</label>
            <input style={s.input} name="cuit" value={form.cuit} onChange={handleChange} placeholder="20-12345678-9" />
          </div>
        </div>

        <div style={s.grid2}>
          <div style={s.campo}>
            <label style={s.label}>Provincia *</label>
            <select style={s.input} name="provincia" value={form.provincia} onChange={handleChange}>
              <option value="">Seleccioná...</option>
              {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div style={s.campo}>
            <label style={s.label}>Localidad</label>
            <input style={s.input} name="localidad" value={form.localidad} onChange={handleChange} placeholder="General Roca" />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div ref={turnstileRef} />
        </div>

        {estado === 'error' && (
          <p style={{ color: '#c0392b', fontSize: 14, marginBottom: 12 }}>
            Hubo un error al enviar. Intentá de nuevo o escribinos al{' '}
            <a href="https://wa.me/5491125750323" style={{ color: '#c0392b' }}>11 2575-0323</a>.
          </p>
        )}

        <button
          style={{ ...s.boton, opacity: estado === 'loading' ? 0.7 : 1 }}
          onClick={handleSubmit}
          disabled={estado === 'loading'}
        >
          {estado === 'loading' ? 'Enviando...' : 'Solicitar acceso al portal →'}
        </button>

        <p style={s.footer}>
          ¿Ya sos revendedor y tenés acceso? Escribinos por WhatsApp al{' '}
          <a href="https://wa.me/5491125750323" style={{ color: '#1a3a5c' }}>11 2575-0323</a>
        </p>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', background: '#f5f5f0' },
  card: { background: '#fff', borderRadius: 16, padding: '40px 36px', maxWidth: 640, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  titulo: { fontSize: 26, fontWeight: 700, color: '#1a3a5c', marginBottom: 8, textAlign: 'center' },
  subtitulo: { color: '#666', lineHeight: 1.6, marginBottom: 28, textAlign: 'center', fontSize: 15 },
  seccion: { marginBottom: 24 },
  labelGrande: { display: 'block', fontSize: 14, fontWeight: 700, color: '#222', marginBottom: 4 },
  hint: { fontSize: 12, color: '#999', margin: '0 0 12px' },
  tiposGrid: { display: 'flex', flexDirection: 'column', gap: 8 },
  tipoBtnBase: { padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', border: '2px solid' },
  tipoBtnActivo: { background: '#1a3a5c', color: '#fff', borderColor: '#1a3a5c' },
  tipoBtnInactivo: { background: '#fff', color: '#333', borderColor: '#ddd' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  campo: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 14, color: '#222', background: '#fafafa', boxSizing: 'border-box' },
  boton: { width: '100%', padding: '14px', background: '#e8681a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
  footer: { textAlign: 'center', marginTop: 20, fontSize: 13, color: '#888' }
}
