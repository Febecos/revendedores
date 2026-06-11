'use client'
import { useState } from 'react'
import { C } from './colores'

export default function FormularioUnirse() {
  const [form, setForm] = useState({ nombre: '', email: '', whatsapp: '', localidad: '', website: '' })
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

  // Dispara el email de propuesta en background (no bloquea el flujo)
  function enviarPropuesta(via: 'whatsapp' | 'demo') {
    fetch('/api/propuesta-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, via }),
    }).catch(() => { /* silencioso — el email es best-effort */ })
  }

  // ── Camino 1: WhatsApp ────────────────────────────────────────────────────
  function irAWhatsApp() {
    if (!validar()) return
    enviarPropuesta('whatsapp')
    // Pixel: Lead — se registró como revendedor por WA
    try{ if((window as any).fbq) (window as any).fbq('track','Lead',{content_name:'revendedor_whatsapp'}); }catch(_){}
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
    enviarPropuesta('demo')
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        // Pixel: Lead — se registró como revendedor por Demo
        try{ if((window as any).fbq) (window as any).fbq('track','Lead',{content_name:'revendedor_demo'}); }catch(_){}
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

      {/* honeypot anti-bot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
        value={form.website} onChange={handleChange}
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />

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

        {estadoDemo === 'error' && (
          <p style={{ fontSize: 12, color: '#E40044', textAlign: 'center', margin: 0 }}>
            Error al iniciar el portal. Intentá de nuevo.
          </p>
        )}
      </div>

      {/* Texto legal */}
      <p style={{ marginTop: 16, fontSize: 11, color: C.gris, textAlign: 'center', lineHeight: 1.5 }}>
        Al continuar aceptás los{' '}
        <a href="https://febecos.com/terminos" target="_blank" style={{ color: C.azulTxt, fontWeight: 600 }}>Términos y Condiciones</a>
        {' '}y la{' '}
        <a href="https://febecos.com/terminos#privacidad" target="_blank" style={{ color: C.azulTxt, fontWeight: 600 }}>Política de Privacidad</a>
        {' '}de Febecos.
      </p>

    </div>
  )
}
