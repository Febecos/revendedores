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
  const [errores, setErrores] = useState<Record<string, boolean>>({})
  const [aceptaTerminos, setAceptaTerminos] = useState(false)

  const toggleTipo = (id: string) => {
    setTipos(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores(prev => ({ ...prev, [e.target.name]: false }))
  }

  const handleSubmit = async () => {
    const nuevosErrores: Record<string, boolean> = {}
    if (!form.nombre) nuevosErrores.nombre = true
    if (!form.apellido) nuevosErrores.apellido = true
    if (!form.email) nuevosErrores.email = true
    if (!form.whatsapp) nuevosErrores.whatsapp = true
    if (!form.empresa) nuevosErrores.empresa = true
    if (!form.cuit) nuevosErrores.cuit = true
    if (!form.provincia) nuevosErrores.provincia = true
    if (!form.localidad) nuevosErrores.localidad = true
    if (tipos.length === 0) nuevosErrores.tipos = true
    if (!expAnos) nuevosErrores.expAnos = true
    if (!expSolar) nuevosErrores.expSolar = true
    if (!equiposMes) nuevosErrores.equiposMes = true
    if (!aceptaTerminos) nuevosErrores.terminos = true

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      setTimeout(() => {
        const el = document.querySelector('[data-error="true"]')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
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
          acepta_terminos: aceptaTerminos,
          version_terminos: '1.1',
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
        {/* Logo en pantalla de éxito */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img
            src="https://selector.febecos.com/images/febecos-logo.png"
            alt="Febecos"
            style={{ height: 40, objectFit: 'contain' }}
          />
        </div>
        <div style={{ fontSize: 48, marginBottom: 16, textAlign: 'center' }}>✅</div>
        <h2 style={{ color: '#1a3a5c', marginBottom: 8, textAlign: 'center' }}>¡Solicitud enviada!</h2>
        <p style={{ color: '#555', lineHeight: 1.7, textAlign: 'center' }}>
          Te mandamos un email a <strong>{form.email}</strong> para verificar tu dirección.<br />
          Hacé clic en el link del email para completar el registro.<br /><br />
          Una vez verificado, tenés acceso automático con 7% de descuento.
        </p>
        <a href="https://wa.me/5491125750323"
          style={{ display: 'block', textAlign: 'center', marginTop: 24, padding: '12px 24px', background: '#25d366', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>
          Escribinos por WhatsApp
        </a>
      </div>
    </div>
  )

  const inputStyle = (campo: string) => ({
    ...s.input,
    borderColor: errores[campo] ? '#e53e3e' : '#ddd',
    background: errores[campo] ? '#fff5f5' : '#fafafa',
  })

  const btnGroupStyle = (campo: string) => ({
    outline: errores[campo] ? '2px solid #e53e3e' : 'none',
    borderRadius: 10,
    padding: errores[campo] ? 4 : 0,
  })

  return (
    <div style={s.wrap}>
      <div style={s.card}>

        {/* ── LOGO ── */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img
            src="https://selector.febecos.com/images/febecos-logo.png"
            alt="Febecos · Bombas Solares"
            style={{ height: 44, objectFit: 'contain' }}
          />
        </div>

        <h1 style={s.titulo}>Portal de Revendedores</h1>
        <p style={s.subtitulo}>
          Accedé al catálogo mayorista, herramientas de cotización y precios diferenciados.
        </p>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#e53e3e', marginBottom: 20 }}>
          * Todos los campos son obligatorios
        </p>

        {/* ROL */}
        <div style={s.seccion}>
          <label style={s.labelGrande}>¿Qué rol tenés? *</label>
          <p style={s.hint}>Podés elegir más de una opción</p>
          <div style={btnGroupStyle('tipos')} data-error={errores.tipos ? 'true' : undefined}>
            <div style={s.grid2btn}>
              {TIPOS.map(t => (
                <button
                  key={t.id}
                  onClick={() => { toggleTipo(t.id); setErrores(prev => ({ ...prev, tipos: false })) }}
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
          {errores.tipos && <p style={s.errorMsg}>Seleccioná al menos un rol</p>}
        </div>

        {/* EXPERIENCIA AÑOS */}
        <div style={s.seccion}>
          <label style={s.labelGrande}>¿Cuántos años trabajás en el rubro? *</label>
          <div style={btnGroupStyle('expAnos')} data-error={errores.expAnos ? 'true' : undefined}>
            <div style={s.grid2btn}>
              {EXPERIENCIA_ANOS.map(e => (
                <button
                  key={e.id}
                  onClick={() => { setExpAnos(e.id); setErrores(prev => ({ ...prev, expAnos: false })) }}
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
          {errores.expAnos && <p style={s.errorMsg}>Seleccioná una opción</p>}
        </div>

        {/* EXPERIENCIA SOLAR */}
        <div style={s.seccion}>
          <label style={s.labelGrande}>¿Ya trabajaste con equipos solares? *</label>
          <div style={btnGroupStyle('expSolar')} data-error={errores.expSolar ? 'true' : undefined}>
            <div style={s.grid2btn}>
              {EXPERIENCIA_SOLAR.map(e => (
                <button
                  key={e.id}
                  onClick={() => { setExpSolar(e.id); setErrores(prev => ({ ...prev, expSolar: false })) }}
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
          {errores.expSolar && <p style={s.errorMsg}>Seleccioná una opción</p>}
        </div>

        {/* EQUIPOS POR MES */}
        <div style={s.seccion}>
          <label style={s.labelGrande}>¿Cuántos equipos por mes estimás manejar? *</label>
          <div style={btnGroupStyle('equiposMes')} data-error={errores.equiposMes ? 'true' : undefined}>
            <div style={s.grid2btn}>
              {EQUIPOS_MES.map(e => (
                <button
                  key={e.id}
                  onClick={() => { setEquiposMes(e.id); setErrores(prev => ({ ...prev, equiposMes: false })) }}
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
          {errores.equiposMes && <p style={s.errorMsg}>Seleccioná una opción</p>}
        </div>

        {/* DATOS PERSONALES */}
        <div style={s.grid2}>
          <div style={s.campo}>
            <label style={s.label}>Nombre *</label>
            <input style={inputStyle('nombre')} name="nombre" value={form.nombre} onChange={handleChange} placeholder="Juan" data-error={errores.nombre ? 'true' : undefined} />
            {errores.nombre && <p style={s.errorMsg}>Campo obligatorio</p>}
          </div>
          <div style={s.campo}>
            <label style={s.label}>Apellido *</label>
            <input style={inputStyle('apellido')} name="apellido" value={form.apellido} onChange={handleChange} placeholder="Pérez" data-error={errores.apellido ? 'true' : undefined} />
            {errores.apellido && <p style={s.errorMsg}>Campo obligatorio</p>}
          </div>
        </div>

        <div style={s.grid2}>
          <div style={s.campo}>
            <label style={s.label}>Email *</label>
            <input style={inputStyle('email')} name="email" type="email" value={form.email} onChange={handleChange} placeholder="juan@empresa.com" data-error={errores.email ? 'true' : undefined} />
            {errores.email && <p style={s.errorMsg}>Campo obligatorio</p>}
          </div>
          <div style={s.campo}>
            <label style={s.label}>WhatsApp *</label>
            <input style={inputStyle('whatsapp')} name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="11 2345 6789" data-error={errores.whatsapp ? 'true' : undefined} />
            {errores.whatsapp && <p style={s.errorMsg}>Campo obligatorio</p>}
          </div>
        </div>

        <div style={s.grid2}>
          <div style={s.campo}>
            <label style={s.label}>Empresa / Negocio *</label>
            <input style={inputStyle('empresa')} name="empresa" value={form.empresa} onChange={handleChange} placeholder="Ferretería Agro Sur" data-error={errores.empresa ? 'true' : undefined} />
            {errores.empresa && <p style={s.errorMsg}>Campo obligatorio</p>}
          </div>
          <div style={s.campo}>
            <label style={s.label}>CUIT *</label>
            <input style={inputStyle('cuit')} name="cuit" value={form.cuit} onChange={handleChange} placeholder="20-12345678-9" data-error={errores.cuit ? 'true' : undefined} />
            {errores.cuit && <p style={s.errorMsg}>Campo obligatorio</p>}
          </div>
        </div>

        <div style={s.grid2}>
          <div style={s.campo}>
            <label style={s.label}>Provincia *</label>
            <select style={inputStyle('provincia')} name="provincia" value={form.provincia} onChange={handleChange} data-error={errores.provincia ? 'true' : undefined}>
              <option value="">Seleccioná...</option>
              {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {errores.provincia && <p style={s.errorMsg}>Campo obligatorio</p>}
          </div>
          <div style={s.campo}>
            <label style={s.label}>Localidad *</label>
            <input style={inputStyle('localidad')} name="localidad" value={form.localidad} onChange={handleChange} placeholder="General Roca" data-error={errores.localidad ? 'true' : undefined} />
            {errores.localidad && <p style={s.errorMsg}>Campo obligatorio</p>}
          </div>
        </div>

        {estado === 'error' && (
          <p style={{ color: '#c0392b', fontSize: 14, marginBottom: 12 }}>
            Hubo un error al enviar. Intentá de nuevo o escribinos al{' '}
            <a href="https://wa.me/5491125750323" style={{ color: '#c0392b' }}>11 2575-0323</a>.
          </p>
        )}

        {/* T&C checkbox */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16,
          padding: '12px 14px', borderRadius: 8,
          background: errores.terminos ? '#fff5f5' : '#f9f9f9',
          border: `1.5px solid ${errores.terminos ? '#e53e3e' : '#e0e0e0'}`,
        }}>
          <input
            type="checkbox"
            id="acepta-terminos"
            checked={aceptaTerminos}
            onChange={e => { setAceptaTerminos(e.target.checked); setErrores(prev => ({ ...prev, terminos: false })) }}
            style={{ marginTop: 2, width: 16, height: 16, cursor: 'pointer', accentColor: '#1a3a5c', flexShrink: 0 }}
          />
          <label htmlFor="acepta-terminos" style={{ fontSize: 12, color: '#555', lineHeight: 1.5, cursor: 'pointer' }}>
            Leí y acepto los{' '}
            <a href="/terminos#revendedores" target="_blank" rel="noopener noreferrer" style={{ color: '#1a3a5c', fontWeight: 600 }}>
              Términos y Condiciones del Programa de Revendedores
            </a>{' '}
            y la{' '}
            <a href="/terminos#privacidad" target="_blank" rel="noopener noreferrer" style={{ color: '#1a3a5c', fontWeight: 600 }}>
              Política de Privacidad
            </a>{' '}
            de Febecos.
          </label>
        </div>
        {errores.terminos && <p style={{ ...s.errorMsg, marginBottom: 10 }}>Debés aceptar los términos y condiciones para continuar.</p>}

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
        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#bbb' }}>
          <a href="/terminos" style={{ color: '#999', textDecoration: 'none' }}>Términos y Condiciones</a>
          {' · '}
          <a href="/terminos#privacidad" style={{ color: '#999', textDecoration: 'none' }}>Política de Privacidad</a>
        </p>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', background: '#f5f5f0' },
  card: { background: '#fff', borderRadius: 16, padding: '40px 36px', maxWidth: 640, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  titulo: { fontSize: 26, fontWeight: 700, color: '#1a3a5c', marginBottom: 8, textAlign: 'center' },
  subtitulo: { color: '#666', lineHeight: 1.6, marginBottom: 8, textAlign: 'center', fontSize: 15 },
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
  footer: { textAlign: 'center', marginTop: 20, fontSize: 13, color: '#888' },
  errorMsg: { color: '#e53e3e', fontSize: 11, marginTop: 4, fontWeight: 500 },
}
