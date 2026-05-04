'use client'
import { useState } from 'react'

const TIPOS = [
  { id: 'pocero', label: '🔩 Pocero / perforista' },
  { id: 'ferreteria', label: '🏪 Ferretería agropecuaria' },
  { id: 'instalador', label: '⚡ Instalador solar' },
  { id: 'distribuidor', label: '🚛 Distribuidor' },
  { id: 'otro', label: '📋 Otro' },
]

const EXPERIENCIA_ANOS = [
  { id: 'menos1', label: 'Menos de 1 año' },
  { id: '1a3', label: '1 a 3 años' },
  { id: '3a5', label: '3 a 5 años' },
  { id: 'mas5', label: 'Más de 5 años' },
]

const EXPERIENCIA_SOLAR = [
  { id: 'si', label: '✅ Sí, tengo experiencia' },
  { id: 'no', label: '🌱 Estoy empezando' },
]

const EQUIPOS_MES = [
  { id: '1a2', label: '1 a 2' },
  { id: '3a5', label: '3 a 5' },
  { id: '6a10', label: '6 a 10' },
  { id: 'mas10', label: 'Más de 10' },
]

const PROVINCIAS = [
  'Buenos Aires','CABA','Catamarca','Chaco','Chubut','Córdoba','Corrientes',
  'Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones',
  'Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe',
  'Santiago del Estero','Tierra del Fuego','Tucumán'
]

export default function Home() {
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', whatsapp: '',
    empresa: '', provincia: '', localidad: '', cuit: ''
  })
  const [tipos, setTipos] = useState<string[]>([])
  const [expAnos, setExpAnos] = useState('')
  const [expSolar, setExpSolar] = useState('')
  const [equiposMes, setEquiposMes] = useState('')
  const [estado, setEstado] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

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
      alert('Seleccioná al menos un rol.')
      return
    }
    setEstado('loading')
    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tipo_revendedor: tipos,
          experiencia_anos: expAnos,
          experiencia_solar: expSolar,
          equipos_mes: equiposMes,
        })
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
        <a href="https://wa.me/5491125750323"
          style={{ display: 'block', textAlign: 'center', marginTop: 24, padding: '12px 24px', background: '#25d366', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>
          Escribinos por WhatsApp
        </a>
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

        {/* ROL */}
        <div style={s.seccion}>
          <label style={s.labelGrande}>¿Qué rol tenés? *</label>
          <p style={s.hint}>Podés elegir más de una opción</p>
          <div style={s.grid2btn}>
            {TIPOS.map(t => (
              <button
                key={t.id}
                onClick={() => toggleTipo(t.id)}
                style={{
                  ...s.btn,
                  background: tipos.includes(t.id) ? '#1a3a5c' : '#fff',
                  color: tipos.includes(t.id) ? '#fff' : '#333',
                  borderColor: tipos.includes(t.id) ? '#1a3a5c' : '#ddd',
                }}
              >
                {tipos.includes(t.id) ? '✓ ' : ''}{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* EXPERIENCIA AÑOS */}
        <div style={s.seccion}>
          <label style={s.labelGrande}>¿Cuántos años trabajás en el rubro?</label>
          <div style={s.grid2btn}>
            {EXPERIENCIA_ANOS.map(e => (
              <button
                key={e.id}
                onClick={() => setExpAnos(e.id)}
                style={{
                  ...s.btn,
                  background: expAnos === e.id ? '#1a3a5c' : '#fff',
                  color: expAnos === e.id ? '#fff' : '#333',
                  borderColor: expAnos === e.id ? '#1a3a5c' : '#ddd',
                }}
              >
                {expAnos === e.id ? '✓ ' : ''}{e.label}
              </button>
            ))}
          </div>
        </div>

        {/* EXPERIENCIA SOLAR */}
        <div style={s.seccion}>
          <label style={s.labelGrande}>¿Ya trabajaste con equipos solares?</label>
          <div style={s.grid2btn}>
            {EXPERIENCIA_SOLAR.map(e => (
              <button
                key={e.id}
                onClick={() => setExpSolar(e.id)}
                style={{
                  ...s.btn,
                  background: expSolar === e.id ? '#1a3a5c' : '#fff',
                  color: expSolar === e.id ? '#fff' : '#333',
                  borderColor: expSolar === e.id ? '#1a3a5c' : '#ddd',
                }}
              >
                {expSolar === e.id ? '✓ ' : ''}{e.label}
              </button>
            ))}
          </div>
        </div>

        {/* EQUIPOS POR MES */}
        <div style={s.seccion}>
          <label style={s.labelGrande}>¿Cuántos equipos por mes estimás manejar?</label>
          <div style={s.grid2btn}>
            {EQUIPOS_MES.map(e => (
              <button
                key={e.id}
                onClick={() => setEquiposMes(e.id)}
                style={{
                  ...s.btn,
                  background: equiposMes === e.id ? '#1a3a5c' : '#fff',
                  color: equiposMes === e.id ? '#fff' : '#333',
                  borderColor: equiposMes === e.id ? '#1a3a5c' : '#ddd',
                }}
              >
                {equiposMes === e.id ? '✓ ' : ''}{e.label}
              </button>
            ))}
          </div>
        </div>

        {/* DATOS PERSONALES */}
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
  hint: { fontSize: 12, color: '#999', margin: '0 0 10px' },
  grid2btn: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  btn: { padding: '11px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center', border: '2px solid', transition: 'all 0.15s' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  campo: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 14, color: '#222', background: '#fafafa', boxSizing: 'border-box' },
  boton: { width: '100%', padding: '14px', background: '#e8681a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
  footer: { textAlign: 'center', marginTop: 20, fontSize: 13, color: '#888' }
}
