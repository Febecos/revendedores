'use client'
import { useState } from 'react'
import { C } from './colores'

export default function BtnDemo() {
  const [estado, setEstado] = useState<'idle' | 'cargando' | 'error'>('idle')

  async function iniciarDemo() {
    setEstado('cargando')
    try {
      const res = await fetch('/api/demo', { method: 'POST' })
      if (res.ok) {
        window.location.href = '/portal'
      } else {
        setEstado('error')
      }
    } catch {
      setEstado('error')
    }
  }

  return (
    <div style={{ textAlign: 'center', marginTop: 12 }}>
      <button
        onClick={iniciarDemo}
        disabled={estado === 'cargando'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'transparent',
          border: `1.5px solid ${C.grisB}`,
          borderRadius: 10, padding: '12px 28px',
          fontSize: 14, fontWeight: 600, color: C.azulTxt,
          cursor: estado === 'cargando' ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          opacity: estado === 'cargando' ? 0.7 : 1,
          transition: 'all .15s',
        }}
      >
        {estado === 'cargando' ? (
          '⏳ Abriendo portal...'
        ) : (
          <>👀 Probar el portal gratis — 7 días sin registro</>
        )}
      </button>
      {estado === 'error' && (
        <p style={{ fontSize: 12, color: '#E40044', marginTop: 6 }}>
          Error al iniciar la demo. Intentá de nuevo.
        </p>
      )}
      <p style={{ fontSize: 11, color: C.gris, marginTop: 6 }}>
        Sin tarjeta. Sin compromiso. Acceso completo por 7 días.
      </p>
    </div>
  )
}
