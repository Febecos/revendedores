'use client'
import { useState } from 'react'
import { C } from './colores'

interface Tramo { nivel: string; porcentaje: number }
interface NivelInfo { label: string; desc: string }

interface Props {
  tramos: Tramo[]
  nivelNombre: Record<number, NivelInfo>
  kitPrecio: number
  kitNombre: string
}

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('es-AR')
}

const COLORES_NIVEL = ['#003d72', '#1a4f8a', '#2D5A27', '#1a6b35', '#155a2a']

export default function MultiplicadorMargen({ tramos, nivelNombre, kitPrecio, kitNombre }: Props) {
  const [equipos, setEquipos] = useState(3)

  const cambiar = (delta: number) => setEquipos(e => Math.min(20, Math.max(1, e + delta)))

  return (
    <div style={{ background: C.acentoBg, border: `1px solid ${C.acentoBord}`, borderRadius: 12, padding: '28px 28px 24px' }}>

      {/* Cabecera */}
      <p style={{ fontSize: 13, fontWeight: 700, color: C.verde, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.08em' }}>
        📊 Calculador de margen — {kitNombre}
      </p>
      <p style={{ fontSize: 13, color: C.gris, marginBottom: 20 }}>
        Precio de lista: <strong style={{ color: C.azulTxt }}>{fmt(kitPrecio)}</strong> · Kit completo con paneles, cable y soga
      </p>

      {/* Selector de equipos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.azulTxt }}>Equipos / mes:</span>

        {/* Botones − / + */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: `1.5px solid ${C.verde}`, borderRadius: 8, overflow: 'hidden' }}>
          <button
            onClick={() => cambiar(-1)}
            disabled={equipos <= 1}
            style={{
              width: 36, height: 36, background: 'transparent', border: 'none',
              fontSize: 20, fontWeight: 700, color: C.verde, cursor: equipos <= 1 ? 'not-allowed' : 'pointer',
              opacity: equipos <= 1 ? 0.3 : 1, fontFamily: 'inherit',
            }}
          >−</button>
          <span style={{
            minWidth: 44, textAlign: 'center', fontSize: 22, fontWeight: 800,
            color: C.azulTxt, borderLeft: `1px solid ${C.acentoBord}`, borderRight: `1px solid ${C.acentoBord}`,
            padding: '0 6px', lineHeight: '36px',
          }}>
            {equipos}
          </span>
          <button
            onClick={() => cambiar(1)}
            disabled={equipos >= 20}
            style={{
              width: 36, height: 36, background: 'transparent', border: 'none',
              fontSize: 20, fontWeight: 700, color: C.verde, cursor: equipos >= 20 ? 'not-allowed' : 'pointer',
              opacity: equipos >= 20 ? 0.3 : 1, fontFamily: 'inherit',
            }}
          >+</button>
        </div>

        {/* Slider */}
        <input
          type="range"
          min={1} max={20} value={equipos}
          onChange={e => setEquipos(Number(e.target.value))}
          style={{ flex: 1, minWidth: 120, accentColor: C.verde, cursor: 'pointer' }}
        />
        <span style={{ fontSize: 13, color: C.gris, whiteSpace: 'nowrap' }}>máx. 20</span>
      </div>

      {/* Filas por nivel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
        {tramos.map((t, i) => {
          const margenKit = kitPrecio * t.porcentaje / 100
          const totalMes = margenKit * equipos
          const col = COLORES_NIVEL[i] ?? C.azulTxt
          const esMejor = i === tramos.length - 1 // resaltar el nivel máximo
          return (
            <div
              key={t.nivel}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: esMejor ? C.verde : C.blanco,
                border: `1.5px solid ${esMejor ? C.verde : C.grisB}`,
                borderRadius: 10, padding: '12px 16px',
                flexWrap: 'wrap',
              }}
            >
              {/* Nombre */}
              <div style={{ minWidth: 140, flex: '1 1 140px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: esMejor ? C.blanco : col }}>
                  {t.nivel} · {nivelNombre[i + 1]?.label ?? ''}
                </div>
                <div style={{ fontSize: 11, color: esMejor ? 'rgba(255,255,255,.75)' : C.gris }}>
                  {t.porcentaje}% de descuento
                </div>
              </div>

              {/* Fórmula */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: esMejor ? 'rgba(255,255,255,.8)' : C.gris, fontSize: 13, flex: '0 0 auto' }}>
                <span style={{ fontWeight: 600, color: esMejor ? C.blanco : C.azulTxt }}>{fmt(margenKit)}</span>
                <span>×</span>
                <span style={{ fontWeight: 700, color: esMejor ? C.blanco : C.azulTxt }}>{equipos}</span>
                <span>=</span>
              </div>

              {/* Total */}
              <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: esMejor ? 22 : 19, fontWeight: 800, color: esMejor ? C.blanco : col }}>
                  {fmt(totalMes)}
                </div>
                <div style={{ fontSize: 11, color: esMejor ? 'rgba(255,255,255,.75)' : C.gris }}>
                  / mes
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: 12, color: C.gris, marginTop: 16, textAlign: 'center' }}>
        * Margen bruto estimado antes de gastos operativos. Precio de lista al {new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}.
      </p>
    </div>
  )
}
