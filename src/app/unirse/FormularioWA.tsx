'use client'
import { useState } from 'react'
import { C } from './colores'

const PROVINCIAS = [
  'Buenos Aires','CABA','Catamarca','Chaco','Chubut','Córdoba','Corrientes',
  'Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones',
  'Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe',
  'Santiago del Estero','Tierra del Fuego','Tucumán',
]

export default function FormularioWA() {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', provincia: '' })
  const [errores, setErrores] = useState<Record<string, boolean>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrores(prev => ({ ...prev, [e.target.name]: false }))
  }

  const handleSubmit = () => {
    const errs: Record<string, boolean> = {}
    if (!form.nombre.trim())   errs.nombre    = true
    if (!form.email.trim())    errs.email     = true
    if (!form.telefono.trim()) errs.telefono  = true
    if (!form.provincia)       errs.provincia = true
    if (Object.keys(errs).length) { setErrores(errs); return }

    const msg = encodeURIComponent(
      `Hola, me interesa el Programa de Revendedores Febecos.\n\n` +
      `Nombre: ${form.nombre}\nEmail: ${form.email}\nTeléfono: ${form.telefono}\nProvincia: ${form.provincia}\n\n` +
      `¿Me pueden contar más para empezar?`
    )
    window.open(`https://wa.me/5491125750323?text=${msg}`, '_blank')
  }

  const campos = [
    { name: 'nombre',   label: 'Nombre completo',    type: 'text',  placeholder: 'Juan Pérez' },
    { name: 'email',    label: 'Email',               type: 'email', placeholder: 'juan@empresa.com' },
    { name: 'telefono', label: 'Teléfono / WhatsApp', type: 'tel',   placeholder: '11 2345 6789' },
  ]

  return (
    <div style={{ background: C.blanco, border: `1px solid ${C.grisB}`, borderRadius: 16, padding: '32px 28px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        {campos.map(f => (
          <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.azulTxt }}>{f.label} *</label>
            <input
              name={f.name}
              type={f.type}
              placeholder={f.placeholder}
              value={(form as any)[f.name]}
              onChange={handleChange}
              style={{
                padding: '11px 14px',
                border: `1.5px solid ${errores[f.name] ? '#E40044' : C.grisB}`,
                borderRadius: 8, fontSize: 14, color: C.azulTxt,
                background: C.grisBg, width: '100%', fontFamily: 'inherit',
              }}
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
            style={{
              padding: '11px 14px',
              border: `1.5px solid ${errores.provincia ? '#E40044' : C.grisB}`,
              borderRadius: 8, fontSize: 14, color: C.azulTxt,
              background: C.grisBg, width: '100%', appearance: 'none', fontFamily: 'inherit',
            }}
          >
            <option value="">Seleccioná tu provincia...</option>
            {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {errores.provincia && <span style={{ fontSize: 11, color: '#E40044' }}>Seleccioná tu provincia</span>}
        </div>
      </div>
      <button
        onClick={handleSubmit}
        style={{
          width: '100%', padding: '14px', background: '#25d366', color: C.blanco,
          border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 800,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        💬 Contactarme por WhatsApp
      </button>
      <p style={{ fontSize: 12, color: C.gris, textAlign: 'center', marginTop: 10 }}>
        Te abrimos WhatsApp con tus datos pre-completados. Respondemos en horario comercial.
      </p>
    </div>
  )
}
