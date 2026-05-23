'use client'
import { useState } from 'react'
import { C } from './colores'

export default function FormularioUnirse() {
  const [form, setForm] = useState({ nombre: '', email: '', whatsapp: '', localidad: '' })
  const [errores, setErrores] = useState<Record<string, boolean>>({})
  const [estadoDemo, setEstadoDemo] = useState<'idle' | 'cargando' | 'error'>('idle')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrores(prev => ({ ...prev, [e.target.name]: false }))
  }

  function validar() {
    const errs: Record<string, boolean> = {}
    if (!form.nombre.trim())    errs.nombre    = true
    if (!form.email.trim())     errs.email     = true
    if (!form.whatsapp.trim())  errs.whatsapp  = true
    if (!form.localidad.trim()) errs.localidad = true
    setErrores(errs)
    return Object.keys(errs).length === 0
  }

  // ── Camino 1: WhatsApp ────────────────────────────────────────────────────
  function irAWhatsApp() {
    if (!validar()) return
    const msg = encodeURIComponent(
      `Hola, quiero sumarme al Programa de Revendedores Febecos.\n\n` +
      `Nombre: ${form.nombre}\nEmail: ${form.email}\nWhatsApp: ${form.whatsapp}\nLocalidad: ${form.localidad}\n\n` +
      `¿Me pueden contar más para empezar?`
    )
    window.open(`https://wa.me/5491125750323?text=${msg}`, '_blank')
  }

  // ── Camino 2: Demo 7 días ─────────────────────────────────────────────────
  async function iniciarDemo() {
    if (!validar()) return
    setEstadoDemo('cargando')
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        window.location.href = '/portal'
      } else {
        setEstadoDemo('error')
      }
    } catch {
      setEstadoDemo('error')
    }
  }

  const campos = [
    { name: 'nombre',    label: 'Nombre completo',    type: 'text',  placeholder: 'Juan Pérez' },
    { name: 'email',     label: 'Email',               type: 'email', placeholder: 'juan@empresa.com' },
    { name: 'whatsapp',  label: 'WhatsApp',            type: 'tel',   placeholder: '11 2345 6789' },
    { name: 'localidad', label: 'Ciudad / Localidad',  type: 'text',  placeholder: 'General Roca, Río Negro' },
  ]

  return (
    <div style={{ background: C.blanco, border: `1px solid ${C.grisB}`, borderRadius: 16, padding: '32px 28px' }}>

      {/* Campos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
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
                outline: 'none',
              }}
            />
            {errores[f.name] && (
              <span style={{ fontSize: 11, color: '#E40044' }}>Campo obligatorio</span>
            )}
          </div>
        ))}
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* CTA principal: Demo 7 días */}
        <button
          onClick={iniciarDemo}
          disabled={estadoDemo === 'cargando'}
          style={{
            width: '100%', padding: '15px',
            background: estadoDemo === 'cargando' ? C.grisB : C.azul,
            color: C.blanco, border: 'none', borderRadius: 10,
            fontSize: 16, fontWeight: 800, cursor: estadoDemo === 'cargando' ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'background .15s',
          }}
        >
          {estadoDemo === 'cargando' ? '⏳ Abriendo el portal...' : '🚀 Ver el portal gratis — 7 días'}
        </button>

        {/* CTA secundario: WhatsApp */}
        <button
          onClick={irAWhatsApp}
          style={{
            width: '100%', padding: '13px',
            background: '#25d366', color: C.blanco,
            border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', transition: 'background .15s',
          }}
        >
          💬 Contactarme por WhatsApp
        </button>

        {estadoDemo === 'error' && (
          <p style={{ fontSize: 12, color: '#E40044', textAlign: 'center', margin: 0 }}>
            Error al iniciar el portal. Intentá de nuevo.
          </p>
        )}
      </div>

      {/* Llamada telefónica */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.grisB}`, textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: C.gris, margin: 0 }}>
          ¿Preferís hablar primero?{' '}
          <a href="tel:+5491125750323" style={{ color: C.azulTxt, fontWeight: 700, textDecoration: 'none' }}>
            📞 +54 9 11 2575-0323
          </a>
        </p>
        <p style={{ fontSize: 11, color: C.gris, marginTop: 4, marginBottom: 0 }}>
          Respondemos en horario comercial · Lun a Vie 9–18 hs
        </p>
      </div>

    </div>
  )
}
