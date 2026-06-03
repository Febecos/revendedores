'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface Transportista {
  id: number
  name: string
  confidence: string
  match_level: string
}

const PROVINCIAS = [
  'Buenos Aires','CABA','Catamarca','Chaco','Chubut','Córdoba','Corrientes',
  'Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones',
  'Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe',
  'Santiago del Estero','Tierra del Fuego','Tucumán',
]

interface Perfil {
  id: number
  nombre: string; apellido: string; email: string; whatsapp: string
  empresa: string; provincia: string; localidad: string; cuit: string
  tipo_revendedor: string[] | null; tipo_usuario: string; descuento_pct: number
  experiencia_anos: string; experiencia_solar: string; equipos_mes: string
  fecha_registro: string
  transportista_1_id: number | null; transportista_1_nombre: string | null
  transportista_2_id: number | null; transportista_2_nombre: string | null
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#7a9ab5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const ci: React.CSSProperties = {
  padding: '10px 12px',
  background: '#0d1a2a',
  border: '1px solid #1e3248',
  borderRadius: 8,
  color: '#e8f0f8',
  fontSize: 14,
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
}
const ciRo: React.CSSProperties = {
  ...ci,
  color: '#7a9ab5',
  cursor: 'default',
  background: '#0a1218',
  border: '1px solid #162232',
}

function PerfilInner() {
  const params = useSearchParams()
  const token = params.get('token')

  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [form, setForm] = useState({
    empresa: '', provincia: '', localidad: '', cuit: '', whatsapp: '',
    transportista_1_id: '', transportista_2_id: '',
  })
  const [transportistas, setTransportistas] = useState<Transportista[]>([])
  const [cargandoTransp, setCargandoTransp] = useState(false)
  const [busqueda1, setBusqueda1] = useState('')
  const [busqueda2, setBusqueda2] = useState('')
  const [abierto1, setAbierto1] = useState(false)
  const [abierto2, setAbierto2] = useState(false)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [ok, setOk] = useState(false)
  const [error, setError] = useState('')
  const [tokenError, setTokenError] = useState(false)

  const cargar = useCallback(async () => {
    if (!token) { setTokenError(true); setLoading(false); return }
    try {
      const r = await fetch(`/api/perfil?token=${token}`)
      const d = await r.json()
      if (!d.ok) { setTokenError(true); setLoading(false); return }
      setPerfil(d.perfil)
      setForm({
        empresa:   d.perfil.empresa   || '',
        provincia: d.perfil.provincia || '',
        localidad: d.perfil.localidad || '',
        cuit:      d.perfil.cuit      || '',
        whatsapp:  d.perfil.whatsapp  || '',
        transportista_1_id: d.perfil.transportista_1_id ? String(d.perfil.transportista_1_id) : '',
        transportista_2_id: d.perfil.transportista_2_id ? String(d.perfil.transportista_2_id) : '',
      })
      setBusqueda1(d.perfil.transportista_1_nombre || '')
      setBusqueda2(d.perfil.transportista_2_nombre || '')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    if (!form.provincia) { setTransportistas([]); return }
    const params = new URLSearchParams({ provincia: form.provincia })
    if (form.localidad) params.set('localidad', form.localidad)
    setCargandoTransp(true)
    fetch(`/api/transportistas?${params}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setTransportistas(d.carriers) })
      .catch(() => {})
      .finally(() => setCargandoTransp(false))
  }, [form.provincia, form.localidad])

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setGuardando(true)
    setOk(false)
    setError('')
    try {
      const r = await fetch('/api/perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          ...form,
          transportista_1_id: form.transportista_1_id ? Number(form.transportista_1_id) : null,
          transportista_2_id: form.transportista_2_id ? Number(form.transportista_2_id) : null,
        }),
      })
      const d = await r.json()
      if (d.ok) {
        setOk(true)
        setTimeout(() => setOk(false), 3000)
      } else {
        setError(d.error || 'Error al guardar')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setGuardando(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1a2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#7a9ab5', fontSize: 14 }}>Cargando perfil…</div>
      </div>
    )
  }

  // ── Token inválido ────────────────────────────────────────────────────────────
  if (tokenError || !perfil) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#132233', border: '1px solid #1e3248', borderRadius: 16, padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ color: '#e8f0f8', marginBottom: 12 }}>Acceso no válido</h2>
          <p style={{ color: '#7a9ab5', lineHeight: 1.7 }}>El link de acceso no es válido o expiró. Volvé al portal.</p>
          <a href="/portal" style={{ display: 'inline-block', marginTop: 24, padding: '10px 24px', background: '#e8681a', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>
            Ir al portal
          </a>
        </div>
      </div>
    )
  }

  const portalUrl = `/portal?token=${token}`

  return (
    <div style={{ minHeight: '100vh', background: '#0d1a2a', color: '#e8f0f8', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────────── */}
      <div style={{ background: '#0a1520', borderBottom: '1px solid #1e3248', padding: '0 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
          <div>
            <a href={portalUrl}>
              <img
                src="https://selector.febecos.com/images/febecos-logo.png"
                alt="Febecos" style={{ height: 32, objectFit: 'contain' }}
              />
            </a>
            <div style={{ fontSize: 11, color: '#7a9ab5', marginTop: 2 }}>Mi perfil</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#132233', border: '1px solid #1e3248', borderRadius: 8, padding: '8px 12px' }}>
              <span style={{ fontSize: 18 }}>👤</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{perfil.nombre} {perfil.apellido}</div>
                <div style={{ fontSize: 11, color: '#7a9ab5' }}>{perfil.empresa || perfil.provincia}</div>
              </div>
            </div>
            <div style={{ background: '#e8681a', color: '#fff', borderRadius: 8, padding: '6px 12px', fontWeight: 800, fontSize: 13 }}>
              {perfil.descuento_pct}% OFF
            </div>
            <a href={portalUrl} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #1e3248', borderRadius: 8, color: '#7a9ab5', fontSize: 12, cursor: 'pointer', textDecoration: 'none' }}>
              ← Volver
            </a>
          </div>
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>

        {/* Título */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Mi perfil</h1>
          <p style={{ fontSize: 13, color: '#7a9ab5', marginTop: 6 }}>
            Actualizá tus datos de contacto y empresa. Los cambios son inmediatos.
          </p>
        </div>

        {/* ── DATOS DE CUENTA (solo lectura) ─────────────────────────────────── */}
        <div style={{ background: '#132233', border: '1px solid #1e3248', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7a9ab5', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
            Datos de cuenta
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Campo label="Nombre completo">
              <input style={ciRo} readOnly value={`${perfil.nombre} ${perfil.apellido || ''}`} />
            </Campo>
            <Campo label="Email">
              <input style={ciRo} readOnly value={perfil.email || '—'} />
            </Campo>
            <Campo label="Descuento mayorista">
              <input style={{ ...ciRo, color: '#4ade80', fontWeight: 700 }} readOnly value={`${perfil.descuento_pct}% OFF`} />
            </Campo>
            <Campo label="Tipo de usuario">
              <input style={ciRo} readOnly value={perfil.tipo_usuario || 'revendedor'} />
            </Campo>
          </div>
          <p style={{ fontSize: 11, color: '#3a5a7a', marginTop: 12, marginBottom: 0 }}>
            Estos datos son gestionados por el equipo Febecos. Escribinos si necesitás cambiarlos.
          </p>
        </div>

        {/* ── FORMULARIO EDITABLE ─────────────────────────────────────────────── */}
        <form onSubmit={guardar}>
          <div style={{ background: '#132233', border: '1px solid #1e3248', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#7a9ab5', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
              Empresa y ubicación
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Campo label="Nombre de empresa / razón social">
                  <input
                    style={ci} type="text" placeholder="Ej: Agropecuaria San Martín S.R.L."
                    value={form.empresa}
                    onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))}
                  />
                </Campo>
              </div>
              <Campo label="Provincia">
                <select
                  style={ci}
                  value={form.provincia}
                  onChange={e => {
                    const v = e.target.value
                    setForm(f => ({ ...f, provincia: v, transportista_1_id: '', transportista_2_id: '' }))
                    setBusqueda1(''); setBusqueda2('')
                  }}
                >
                  <option value="">Seleccioná...</option>
                  {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Campo>
              <Campo label="Localidad">
                <input
                  style={ci} type="text" placeholder="Ej: Rosario"
                  value={form.localidad}
                  onChange={e => setForm(f => ({ ...f, localidad: e.target.value }))}
                />
              </Campo>
              <Campo label="CUIT">
                <input
                  style={ci} type="text" placeholder="Ej: 20-12345678-9"
                  value={form.cuit}
                  onChange={e => setForm(f => ({ ...f, cuit: e.target.value }))}
                />
              </Campo>
              <Campo label="WhatsApp">
                <input
                  style={ci} type="tel" placeholder="Ej: 3416123456"
                  value={form.whatsapp}
                  onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                />
              </Campo>
            </div>
          </div>

          {/* ── TRANSPORTE ─────────────────────────────────────────────────────── */}
          <div style={{ background: '#132233', border: '1px solid #1e3248', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#7a9ab5', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
              Transporte preferido
            </div>
            <p style={{ fontSize: 12, color: '#3a5a7a', marginTop: 0, marginBottom: 16 }}>
              {form.provincia
                ? `Transportistas disponibles en ${form.provincia}${cargandoTransp ? ' (cargando…)' : ` (${transportistas.length} encontrados)`}`
                : 'Completá tu provincia para ver los transportistas disponibles.'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

              {/* ── Combobox Transporte 1 ── */}
              <Campo label="Transporte 1">
                {form.transportista_1_id ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ ...ci, flex: 1, color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                      {transportistas.find(t => String(t.id) === form.transportista_1_id)?.name || busqueda1}
                    </div>
                    <button type="button"
                      onClick={() => { setForm(f => ({ ...f, transportista_1_id: '', transportista_2_id: '' })); setBusqueda1(''); setBusqueda2('') }}
                      style={{ padding: '0 12px', background: '#1e3248', border: '1px solid #2a4a6a', borderRadius: 8, color: '#7a9ab5', cursor: 'pointer', fontSize: 16 }}>
                      ✕
                    </button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <input
                      style={ci}
                      placeholder={!form.provincia ? 'Primero elegí tu provincia' : cargandoTransp ? 'Cargando…' : 'Buscar transportista…'}
                      value={busqueda1}
                      disabled={!form.provincia || cargandoTransp}
                      onFocus={() => setAbierto1(true)}
                      onBlur={() => setTimeout(() => setAbierto1(false), 150)}
                      onChange={e => { setBusqueda1(e.target.value); setAbierto1(true) }}
                    />
                    {abierto1 && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#0d1a2a', border: '1px solid #1e3248', borderRadius: 8, zIndex: 200, maxHeight: 220, overflowY: 'auto', boxShadow: '0 6px 24px rgba(0,0,0,0.5)' }}>
                        {transportistas
                          .filter(t => !busqueda1 || t.name.toLowerCase().includes(busqueda1.toLowerCase()))
                          .filter(t => String(t.id) !== form.transportista_2_id)
                          .map(t => (
                            <div key={t.id}
                              onMouseDown={() => { setForm(f => ({ ...f, transportista_1_id: String(t.id) })); setBusqueda1(t.name); setAbierto1(false) }}
                              style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, color: '#e8f0f8', borderBottom: '1px solid #162232', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>{t.name}</span>
                              {t.match_level === 'provincia_localidad' && <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 700, letterSpacing: '0.05em' }}>TU ZONA</span>}
                            </div>
                          ))}
                        {transportistas.filter(t => !busqueda1 || t.name.toLowerCase().includes(busqueda1.toLowerCase())).length === 0 && (
                          <div style={{ padding: '10px 14px', color: '#7a9ab5', fontSize: 13 }}>Sin resultados para "{busqueda1}"</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Campo>

              {/* ── Combobox Transporte 2 ── */}
              <Campo label="Transporte 2 (alternativo)">
                {form.transportista_2_id ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ ...ci, flex: 1, color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                      {transportistas.find(t => String(t.id) === form.transportista_2_id)?.name || busqueda2}
                    </div>
                    <button type="button"
                      onClick={() => { setForm(f => ({ ...f, transportista_2_id: '' })); setBusqueda2('') }}
                      style={{ padding: '0 12px', background: '#1e3248', border: '1px solid #2a4a6a', borderRadius: 8, color: '#7a9ab5', cursor: 'pointer', fontSize: 16 }}>
                      ✕
                    </button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <input
                      style={{ ...ci, opacity: !form.transportista_1_id || !form.provincia || cargandoTransp ? 0.4 : 1 }}
                      placeholder={!form.transportista_1_id ? 'Primero elegí el transporte 1' : 'Buscar transportista…'}
                      value={busqueda2}
                      disabled={!form.transportista_1_id || !form.provincia || cargandoTransp}
                      onFocus={() => setAbierto2(true)}
                      onBlur={() => setTimeout(() => setAbierto2(false), 150)}
                      onChange={e => { setBusqueda2(e.target.value); setAbierto2(true) }}
                    />
                    {abierto2 && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#0d1a2a', border: '1px solid #1e3248', borderRadius: 8, zIndex: 200, maxHeight: 220, overflowY: 'auto', boxShadow: '0 6px 24px rgba(0,0,0,0.5)' }}>
                        {transportistas
                          .filter(t => !busqueda2 || t.name.toLowerCase().includes(busqueda2.toLowerCase()))
                          .filter(t => String(t.id) !== form.transportista_1_id)
                          .map(t => (
                            <div key={t.id}
                              onMouseDown={() => { setForm(f => ({ ...f, transportista_2_id: String(t.id) })); setBusqueda2(t.name); setAbierto2(false) }}
                              style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, color: '#e8f0f8', borderBottom: '1px solid #162232', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>{t.name}</span>
                              {t.match_level === 'provincia_localidad' && <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 700, letterSpacing: '0.05em' }}>TU ZONA</span>}
                            </div>
                          ))}
                        {transportistas.filter(t => !busqueda2 || t.name.toLowerCase().includes(busqueda2.toLowerCase())).length === 0 && (
                          <div style={{ padding: '10px 14px', color: '#7a9ab5', fontSize: 13 }}>Sin resultados para "{busqueda2}"</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Campo>

            </div>
            {form.provincia && !cargandoTransp && transportistas.length === 0 && (
              <p style={{ fontSize: 12, color: '#7a9ab5', marginTop: 12, marginBottom: 0 }}>
                No hay transportistas registrados para tu zona aún.
              </p>
            )}
            <p style={{ fontSize: 11, color: '#3a5a7a', marginTop: 12, marginBottom: 0 }}>
              ★ = cubre tu localidad específica. Se guardan con el botón de abajo.
            </p>
          </div>

          {/* ── Feedback ──────────────────────────────────────────────────────── */}
          {error && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 14 }}>
              ⚠️ {error}
            </div>
          )}
          {ok && (
            <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#4ade80', marginBottom: 14 }}>
              ✅ Perfil actualizado correctamente
            </div>
          )}

          {/* ── Botón guardar ─────────────────────────────────────────────────── */}
          <button
            type="submit"
            disabled={guardando}
            style={{
              width: '100%', padding: '13px', background: guardando ? '#1e3248' : '#e8681a',
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700,
              cursor: guardando ? 'not-allowed' : 'pointer', letterSpacing: 0.2,
            }}
          >
            {guardando ? '⏳ Guardando…' : '💾 Guardar cambios'}
          </button>
        </form>

        {/* ── INFO ADICIONAL (solo lectura) ────────────────────────────────────── */}
        {(perfil.tipo_revendedor?.length || perfil.experiencia_anos || perfil.equipos_mes) && (
          <div style={{ background: '#132233', border: '1px solid #1e3248', borderRadius: 12, padding: '20px 24px', marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#7a9ab5', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
              Perfil comercial
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
              {perfil.tipo_revendedor?.length ? (
                <div>
                  <div style={{ fontSize: 11, color: '#3a5a7a', marginBottom: 6 }}>Tipo de revendedor</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {perfil.tipo_revendedor.map(t => (
                      <span key={t} style={{ background: '#1e3248', borderRadius: 6, padding: '3px 10px', fontSize: 12, color: '#e8f0f8' }}>{t}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              {perfil.experiencia_anos && (
                <div>
                  <div style={{ fontSize: 11, color: '#3a5a7a', marginBottom: 4 }}>Experiencia</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{perfil.experiencia_anos}</div>
                </div>
              )}
              {perfil.equipos_mes && (
                <div>
                  <div style={{ fontSize: 11, color: '#3a5a7a', marginBottom: 4 }}>Equipos / mes</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{perfil.equipos_mes}</div>
                </div>
              )}
              {perfil.fecha_registro && (
                <div>
                  <div style={{ fontSize: 11, color: '#3a5a7a', marginBottom: 4 }}>Miembro desde</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {new Date(perfil.fecha_registro).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              )}
            </div>
            <p style={{ fontSize: 11, color: '#3a5a7a', marginTop: 14, marginBottom: 0 }}>
              Estos datos fueron declarados al registrarte y son visibles para el equipo Febecos.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

export default function PerfilPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0d1a2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#7a9ab5', fontSize: 14 }}>Cargando…</div>
      </div>
    }>
      <PerfilInner />
    </Suspense>
  )
}
