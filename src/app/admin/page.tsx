'use client'
import { useState } from 'react'

type Solicitud = {
  id: number
  nombre: string
  apellido: string
  email: string
  whatsapp: string
  empresa: string
  provincia: string
  localidad: string
  cuit: string
  tipo_revendedor: string[]
  estado: string
  email_verificado: boolean
  aprobado: boolean
  created_at: string
  puede_cotizar_con_marca: boolean
  logo_base64: string | null
  domicilio: string | null
  tipo_usuario: string | null
}

const TIPO_LABELS: Record<string, string> = {
  pocero: '🔩 Pocero',
  ferreteria: '🏪 Ferretería',
  instalador: '⚡ Instalador',
  distribuidor: '🚛 Distribuidor',
  pocero_instalador: '🔩⚡ Pocero+Inst.',
  otro: '📋 Otro',
}

export default function Admin() {
  const [usuario, setUsuario] = useState('')
  const [pass, setPass] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(false)
  const [filtro, setFiltro] = useState('todos')
  const [mensaje, setMensaje] = useState('')

  const login = async () => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass }),
      })
      if (res.ok) {
        setAutenticado(true)
        cargar()
      } else {
        alert('Usuario o contraseña incorrectos')
      }
    } catch {
      alert('Error de conexión')
    }
  }

  const cargar = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/solicitudes')
      const data = await res.json()
      setSolicitudes(data.solicitudes || [])
    } catch {
      alert('Error al cargar solicitudes')
    }
    setLoading(false)
  }

  const accion = async (id: number, tipo: 'aprobar' | 'rechazar' | 'borrar' | 'toggle_marca' | 'toggle_interno') => {
    if (tipo === 'borrar' && !confirm('¿Seguro que querés borrar este registro?')) return
    try {
      const res = await fetch('/api/admin/accion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, tipo })
      })
      const data = await res.json()
      if (res.ok) {
        setMensaje(
          tipo === 'aprobar' ? '✅ Aprobado y notificado por email' :
          tipo === 'rechazar' ? '❌ Rechazado' :
          tipo === 'toggle_marca' ? (data.puede_cotizar_con_marca ? '🏷 Marca propia habilitada' : '🏷 Marca propia deshabilitada') :
          tipo === 'toggle_interno' ? (data.tipo_usuario === 'interno' ? '🏠 Marcado como vendedor interno' : '🔄 Marcado como revendedor externo') :
          '🗑 Registro borrado'
        )
        setTimeout(() => setMensaje(''), 3000)
        if (tipo === 'borrar') {
          setSolicitudes(prev => prev.filter(s => s.id !== id))
        } else if (tipo === 'rechazar') {
          setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, estado: 'rechazado', aprobado: false } : s))
        } else if (tipo === 'aprobar') {
          setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, estado: 'aprobado', aprobado: true } : s))
        } else if (tipo === 'toggle_marca') {
          setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, puede_cotizar_con_marca: data.puede_cotizar_con_marca } : s))
        } else if (tipo === 'toggle_interno') {
          setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, tipo_usuario: data.tipo_usuario } : s))
        }
      } else {
        alert(data.error || 'Error al procesar la acción')
      }
    } catch {
      alert('Error de conexión')
    }
  }

  const filtradas = solicitudes.filter(s => {
    if (filtro === 'todos') return true
    if (filtro === 'pendientes') return !s.aprobado && s.email_verificado
    if (filtro === 'verificados') return s.email_verificado && !s.aprobado
    if (filtro === 'aprobados') return s.aprobado
    return true
  })

  if (!autenticado) return (
    <div style={s.wrap}>
      <div style={{ ...s.card, maxWidth: 360 }}>
        <h2 style={s.titulo}>Admin Revendedores</h2>
        <input
          style={s.input}
          type="email"
          placeholder="Email"
          value={usuario}
          onChange={e => setUsuario(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
        />
        <input
          style={s.input}
          type="password"
          placeholder="Contraseña"
          value={pass}
          onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
        />
        <button style={s.boton} onClick={login}>Entrar</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f0', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ color: '#1a3a5c', margin: 0 }}>Panel Revendedores</h1>
          <button style={{ ...s.boton, width: 'auto', padding: '8px 20px', fontSize: 14 }} onClick={cargar}>
            Actualizar
          </button>
        </div>

        {mensaje && (
          <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#2e7d32', fontWeight: 600 }}>
            {mensaje}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { id: 'todos', label: `Todos (${solicitudes.length})` },
            { id: 'pendientes', label: `Pendientes (${solicitudes.filter(s => !s.aprobado && s.email_verificado).length})` },
            { id: 'verificados', label: `Verificados (${solicitudes.filter(s => s.email_verificado && !s.aprobado).length})` },
            { id: 'aprobados', label: `Aprobados (${solicitudes.filter(s => s.aprobado).length})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              style={{
                padding: '8px 16px', borderRadius: 20, border: '2px solid #1a3a5c',
                background: filtro === f.id ? '#1a3a5c' : '#fff',
                color: filtro === f.id ? '#fff' : '#1a3a5c',
                cursor: 'pointer', fontWeight: 600, fontSize: 13,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: '#666' }}>Cargando...</p>
        ) : filtradas.length === 0 ? (
          <p style={{ color: '#666' }}>No hay solicitudes en este filtro.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtradas.map(sol => (
              <div key={sol.id} style={{
                background: '#fff', borderRadius: 12, padding: '20px 24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                borderLeft: `4px solid ${sol.aprobado ? '#27ae60' : sol.email_verificado ? '#e8681a' : '#bbb'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17, color: '#1a3a5c' }}>
                      {sol.nombre} {sol.apellido}
                      {sol.empresa && <span style={{ color: '#888', fontWeight: 400, fontSize: 14 }}> — {sol.empresa}</span>}
                    </div>
                    <div style={{ color: '#555', fontSize: 14, marginTop: 4 }}>
                      📍 {sol.localidad ? `${sol.localidad}, ` : ''}{sol.provincia}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {(sol.tipo_revendedor || []).map(t => (
                        <span key={t} style={{ background: '#e8f0fe', color: '#1a3a5c', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                          {TIPO_LABELS[t] || t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      background: sol.aprobado ? '#e8f5e9' : sol.email_verificado ? '#fff3e0' : '#f5f5f5',
                      color: sol.aprobado ? '#27ae60' : sol.email_verificado ? '#e8681a' : '#999'
                    }}>
                      {sol.aprobado ? '✅ Aprobado' : sol.email_verificado ? '📧 Verificado' : '⏳ Pendiente'}
                    </span>
                    <span style={{ fontSize: 12, color: '#aaa' }}>
                      {new Date(sol.created_at).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginTop: 12, fontSize: 13, color: '#555' }}>
                  <div>📧 <a href={`mailto:${sol.email}`} style={{ color: '#1a3a5c' }}>{sol.email}</a></div>
                  <div>📱 <a href={`https://wa.me/54${sol.whatsapp.replace(/\D/g,'')}`} style={{ color: '#25d366' }}>{sol.whatsapp}</a></div>
                  {sol.cuit && <div>🪪 {sol.cuit}</div>}
                </div>

                {/* Indicadores de marca propia */}
                {sol.aprobado && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    {sol.cuit ? (
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#e8f5e9', color: '#27ae60', fontWeight: 700 }}>
                        ✅ CUIT OK
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#fff3e0', color: '#e8681a', fontWeight: 700 }}>
                        ⚠ Sin CUIT — no elegible para marca
                      </span>
                    )}
                    {sol.logo_base64 && (
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#e8f0fe', color: '#1a3a5c', fontWeight: 700 }}>
                        🖼 Logo cargado
                      </span>
                    )}
                    {sol.puede_cotizar_con_marca && (
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#1a3a5c', color: '#fff', fontWeight: 700 }}>
                        🏷 Marca habilitada
                      </span>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {!sol.aprobado && sol.email_verificado && (
                    <button
                      onClick={() => accion(sol.id, 'aprobar')}
                      style={{ padding: '8px 20px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
                    >
                      ✅ Aprobar y notificar
                    </button>
                  )}
                  {!sol.aprobado && (
                    <button
                      onClick={() => accion(sol.id, 'rechazar')}
                      style={{ padding: '8px 20px', background: '#fff', color: '#c0392b', border: '2px solid #c0392b', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
                    >
                      ❌ Rechazar
                    </button>
                  )}
                  {/* Toggle vendedor interno — solo para aprobados */}
                  {sol.aprobado && (
                    <button
                      onClick={() => accion(sol.id, 'toggle_interno')}
                      style={{
                        padding: '8px 20px',
                        background: sol.tipo_usuario === 'interno' ? '#1a3a5c' : '#fff',
                        color: sol.tipo_usuario === 'interno' ? '#fff' : '#1a3a5c',
                        border: '2px solid #1a3a5c',
                        borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14,
                      }}
                    >
                      {sol.tipo_usuario === 'interno' ? '🏠 Vendedor interno' : '🔄 Marcar como interno'}
                    </button>
                  )}
                  {/* Toggle marca propia — solo para aprobados con CUIT */}
                  {sol.aprobado && sol.cuit && (
                    <button
                      onClick={() => accion(sol.id, 'toggle_marca')}
                      style={{
                        padding: '8px 20px',
                        background: sol.puede_cotizar_con_marca ? '#1a3a5c' : '#fff',
                        color: sol.puede_cotizar_con_marca ? '#fff' : '#1a3a5c',
                        border: '2px solid #1a3a5c',
                        borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14,
                      }}
                    >
                      {sol.puede_cotizar_con_marca ? '🏷 Deshabilitar marca' : '🏷 Habilitar marca propia'}
                    </button>
                  )}
                  <button
                    onClick={() => accion(sol.id, 'borrar')}
                    style={{ padding: '8px 20px', background: '#fff', color: '#999', border: '2px solid #ddd', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
                  >
                    🗑 Borrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', background: '#f5f5f0' },
  card: { background: '#fff', borderRadius: 16, padding: '40px 36px', maxWidth: 640, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  titulo: { fontSize: 22, fontWeight: 700, color: '#1a3a5c', marginBottom: 20, textAlign: 'center' },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 14, marginBottom: 12, boxSizing: 'border-box' as const },
  boton: { width: '100%', padding: '12px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
}
