'use client'
import { useState } from 'react'

export default function Home() {
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', whatsapp: '',
    empresa: '', provincia: '', localidad: '', cuit: '', mensaje: ''
  })
  const [estado, setEstado] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    if (!form.nombre || !form.email || !form.whatsapp || !form.provincia) {
      alert('Completá los campos obligatorios: nombre, email, WhatsApp y provincia.')
      return
    }
    setEstado('loading')
    try {
      const res = await fetch('/api/solicitud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) setEstado('ok')
      else setEstado('error')
    } catch {
      setEstado('error')
    }
  }

  const provincias = [
    'Buenos Aires','CABA','Catamarca','Chaco','Chubut','Córdoba','Corrientes',
    'Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones',
    'Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe',
    'Santiago del Estero','Tierra del Fuego','Tucumán'
  ]

  if (estado === 'ok') return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: '#1a3a5c', marginBottom: 8 }}>¡Solicitud enviada!</h2>
        <p style={{ color: '#555', lineHeight: 1.6 }}>
          Recibimos tu solicitud. Guillermo te va a contactar por WhatsApp en las próximas 24 horas hábiles para darte acceso al portal.
        </p>
      </div>
    </div>
  )

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <img src="https://febecos.com/cdn/shop/files/logo-febecos.png" alt="Febecos" style={{ height: 48 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        </div>
        <h1 style={styles.titulo}>Portal de Revendedores</h1>
        <p style={styles.subtitulo}>
          Completá el formulario y te damos acceso al catálogo mayorista, herramientas de cotización con tu marca, y precios diferenciados.
        </p>

        <div style={styles.grid2}>
          <div style={styles.campo}>
            <label style={styles.label}>Nombre *</label>
            <input style={styles.input} name="nombre" value={form.nombre} onChange={handleChange} placeholder="Juan" />
          </div>
          <div style={styles.campo}>
            <label style={styles.label}>Apellido</label>
            <input style={styles.input} name="apellido" value={form.apellido} onChange={handleChange} placeholder="Pérez" />
          </div>
        </div>

        <div style={styles.grid2}>
          <div style={styles.campo}>
            <label style={styles.label}>Email *</label>
            <input style={styles.input} name="email" type="email" value={form.email} onChange={handleChange} placeholder="juan@empresa.com" />
          </div>
          <div style={styles.campo}>
            <label style={styles.label}>WhatsApp *</label>
            <input style={styles.input} name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="11 2345 6789" />
          </div>
        </div>

        <div style={styles.grid2}>
          <div style={styles.campo}>
            <label style={styles.label}>Empresa / Negocio</label>
            <input style={styles.input} name="empresa" value={form.empresa} onChange={handleChange} placeholder="Ferretería Agro Sur" />
          </div>
          <div style={styles.campo}>
            <label style={styles.label}>CUIT</label>
            <input style={styles.input} name="cuit" value={form.cuit} onChange={handleChange} placeholder="20-12345678-9" />
          </div>
        </div>

        <div style={styles.grid2}>
          <div style={styles.campo}>
            <label style={styles.label}>Provincia *</label>
            <select style={styles.input} name="provincia" value={form.provincia} onChange={handleChange}>
              <option value="">Seleccioná...</option>
              {provincias.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div style={styles.campo}>
            <label style={styles.label}>Localidad</label>
            <input style={styles.input} name="localidad" value={form.localidad} onChange={handleChange} placeholder="General Roca" />
          </div>
        </div>

        <div style={styles.campo}>
          <label style={styles.label}>¿A qué te dedicás? ¿Por qué querés ser revendedor?</label>
          <textarea style={{ ...styles.input, height: 80, resize: 'vertical' }} name="mensaje" value={form.mensaje} onChange={handleChange} placeholder="Soy pocero, tengo ferretería agropecuaria, instalo sistemas de riego..." />
        </div>

        {estado === 'error' && (
          <p style={{ color: '#c0392b', fontSize: 14, marginBottom: 8 }}>
            Hubo un error al enviar. Intentá de nuevo o escribinos por WhatsApp al +54 9 11 2739-9430.
          </p>
        )}

        <button
          style={{ ...styles.boton, opacity: estado === 'loading' ? 0.7 : 1 }}
          onClick={handleSubmit}
          disabled={estado === 'loading'}
        >
          {estado === 'loading' ? 'Enviando...' : 'Solicitar acceso al portal →'}
        </button>

        <p style={styles.footer}>
          ¿Ya sos revendedor y tenés acceso? Escribinos por WhatsApp al{' '}
          <a href="https://wa.me/5491127399430" style={{ color: '#1a3a5c' }}>+54 9 11 2739-9430</a>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', background: '#f5f5f0' },
  card: { background: '#fff', borderRadius: 16, padding: '40px 36px', maxWidth: 640, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  logo: { marginBottom: 24, textAlign: 'center' },
  titulo: { fontSize: 26, fontWeight: 700, color: '#1a3a5c', marginBottom: 8, textAlign: 'center' },
  subtitulo: { color: '#666', lineHeight: 1.6, marginBottom: 28, textAlign: 'center', fontSize: 15 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 0 },
  campo: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 14, color: '#222', background: '#fafafa', boxSizing: 'border-box', outline: 'none' },
  boton: { width: '100%', padding: '14px', background: '#e8681a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
  footer: { textAlign: 'center', marginTop: 20, fontSize: 13, color: '#888' }
}
