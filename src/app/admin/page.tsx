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

  const login = () => {
    if (usuario === 'admin@febecos.com' && pass === 'febecos2024admin') {
      setAutenticado(true)
      cargar()
    } else {
      alert('Usuario o contraseña incorrectos')
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

  const accion = async (id: number, tipo: 'aprobar' | 'rechazar' | 'borrar') => {
    if (tipo === 'borrar' && !confirm('¿Seguro que querés borrar este registro?')) return
    try {
      const res = await fetch('/api/admin/accion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, tipo })
      })
      if (res.ok) {
        setMensaje(
          tipo === 'aprobar' ? '✅ Aprobado y notificado por email' :
          tipo === 'rechazar' ? '❌ Rechazado' :
          '🗑 Registro borrado'
        )
        setTimeout(() => setMensaje(''), 3000)
        if (tipo === 'borrar') {
          setSolicitudes(prev => prev.filter(s => s.id !== id))
        } else if (tipo === 'rechazar') {
          setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, estado: 'rechazado', aprobado: false } : s))
        } else if (tipo === 'aprobar') {
          setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, estado: 'aprobado', aprobado: true } : s))
        }
      } else {
        alert('Error al procesar la acción')
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

                <div
