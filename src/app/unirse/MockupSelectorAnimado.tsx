'use client'
import { useEffect, useState } from 'react'
import { C } from './colores'

// Pasos del selector — simula al usuario eligiendo
const PASOS = [
  {
    titulo: '¿A qué profundidad está el agua?',
    subtitulo: 'Profundidad del pozo',
    input: '45 metros',
    emoji: '📏',
    color: C.azul,
  },
  {
    titulo: '¿Cuánta agua necesitás por día?',
    subtitulo: 'Consumo diario',
    input: '2.000 litros',
    emoji: '💧',
    color: C.azul,
  },
  {
    titulo: '¿Para qué usás el agua?',
    subtitulo: 'Tipo de uso',
    input: '🐄  Ganado / Bebederos',
    emoji: '🌾',
    color: C.azul,
  },
]

const RESULTADO = {
  kit: 'Kit Bomba Solar 4" 500W',
  desc: 'Cubre todo el año · profundidad máx. 80 m',
  precio: '$2.216.673',
  cuota: '$428.557/mes',
  paneles: '3 paneles solares incluidos',
}

export default function MockupSelectorAnimado() {
  const [paso, setPaso] = useState(0)         // 0-2 = pasos, 3 = resultado
  const [typing, setTyping] = useState(false)  // animación de "escribiendo"
  const [tapping, setTapping] = useState(false) // animación de tap en botón

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>
    let t2: ReturnType<typeof setTimeout>
    let t3: ReturnType<typeof setTimeout>

    if (paso < 3) {
      // Simula que el usuario está escribiendo/eligiendo
      t1 = setTimeout(() => setTyping(true), 600)
      // Luego toca el botón
      t2 = setTimeout(() => { setTyping(false); setTapping(true) }, 1800)
      // Avanza al siguiente paso
      t3 = setTimeout(() => {
        setTapping(false)
        setPaso(p => p + 1)
      }, 2400)
    } else {
      // En el resultado, espera y reinicia el loop
      t1 = setTimeout(() => {
        setPaso(0)
        setTyping(false)
        setTapping(false)
      }, 4000)
    }

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [paso])

  const pasoActual = PASOS[paso]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Marco del teléfono */}
      <div style={{
        width: 260,
        background: '#111',
        borderRadius: 36,
        padding: '12px 8px',
        boxShadow: '0 20px 60px rgba(0,0,0,.35), 0 4px 12px rgba(0,0,0,.2)',
        position: 'relative',
      }}>
        {/* Muesca superior */}
        <div style={{
          width: 80, height: 22, background: '#111',
          borderRadius: '0 0 16px 16px',
          margin: '0 auto 8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#333' }} />
          <div style={{ width: 40, height: 4, borderRadius: 4, background: '#333' }} />
        </div>

        {/* Pantalla */}
        <div style={{
          background: C.fondo,
          borderRadius: 24,
          overflow: 'hidden',
          minHeight: 400,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Header del selector */}
          <div style={{
            background: C.azul,
            padding: '14px 16px 12px',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: C.blanco, fontWeight: 800, fontSize: 13 }}>🌱 Febecos</span>
              <span style={{ color: 'rgba(255,255,255,.55)', fontSize: 10 }}>
                {paso < 3 ? `Paso ${paso + 1} de 3` : '¡Listo!'}
              </span>
            </div>
            {/* Barra de progreso */}
            <div style={{ height: 3, background: 'rgba(255,255,255,.2)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: C.acento,
                borderRadius: 3,
                width: paso < 3 ? `${((paso + 1) / 3) * 100}%` : '100%',
                transition: 'width .5s ease',
              }} />
            </div>
          </div>

          {/* Contenido */}
          <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {paso < 3 ? (
              <>
                {/* Pregunta */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{pasoActual.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.azulTxt, lineHeight: 1.3, marginBottom: 4 }}>
                    {pasoActual.titulo}
                  </div>
                  <div style={{ fontSize: 10, color: C.gris }}>{pasoActual.subtitulo}</div>
                </div>

                {/* Campo de input (simulado) */}
                <div style={{
                  background: C.blanco,
                  border: `2px solid ${typing ? C.azul : C.grisB}`,
                  borderRadius: 10,
                  padding: '12px 14px',
                  transition: 'border-color .3s',
                  position: 'relative',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: typing ? C.azulTxt : C.gris }}>
                    {typing ? pasoActual.input : (paso === 2 ? 'Seleccioná...' : 'Ingresá el valor...')}
                  </div>
                  {typing && (
                    <div style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      width: 2, height: 16, background: C.azul,
                      animation: 'blink 1s step-end infinite',
                    }} />
                  )}
                </div>

                {/* Opciones de uso (solo paso 3) */}
                {paso === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { emoji: '🐄', label: 'Ganado / Bebederos', active: typing },
                      { emoji: '🌿', label: 'Riego', active: false },
                      { emoji: '🏠', label: 'Uso doméstico', active: false },
                    ].map(op => (
                      <div key={op.label} style={{
                        background: op.active ? C.acentoBg : C.blanco,
                        border: `1.5px solid ${op.active ? C.acentoBord : C.grisB}`,
                        borderRadius: 8, padding: '9px 12px',
                        display: 'flex', alignItems: 'center', gap: 8,
                        transition: 'all .3s',
                      }}>
                        <span style={{ fontSize: 16 }}>{op.emoji}</span>
                        <span style={{ fontSize: 12, fontWeight: op.active ? 700 : 400, color: op.active ? C.azulTxt : C.gris }}>
                          {op.label}
                        </span>
                        {op.active && <span style={{ marginLeft: 'auto', color: C.verde, fontSize: 14 }}>✓</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Botón Siguiente */}
                <div style={{ marginTop: 'auto' }}>
                  <div style={{
                    background: tapping ? '#bcd430' : C.acento,
                    color: C.azul,
                    borderRadius: 10,
                    padding: '12px',
                    textAlign: 'center',
                    fontWeight: 800,
                    fontSize: 14,
                    transform: tapping ? 'scale(.96)' : 'scale(1)',
                    transition: 'all .15s',
                    cursor: 'pointer',
                  }}>
                    {paso < 2 ? 'Siguiente →' : 'Ver mi equipo ideal ✓'}
                  </div>

                  {/* Indicador de tap */}
                  {tapping && (
                    <div style={{
                      position: 'absolute',
                      bottom: 80,
                      right: 60,
                      width: 28, height: 28,
                      borderRadius: '50%',
                      background: 'rgba(0,61,114,.25)',
                      animation: 'ripple .4s ease-out',
                    }} />
                  )}
                </div>
              </>
            ) : (
              /* Resultado */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Badge éxito */}
                <div style={{
                  background: C.acentoBg,
                  border: `1px solid ${C.acentoBord}`,
                  borderRadius: 10,
                  padding: '10px 12px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.verde, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 2 }}>
                    ✓ Equipo ideal encontrado
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.azulTxt }}>
                    {RESULTADO.kit}
                  </div>
                  <div style={{ fontSize: 10, color: C.gris, marginTop: 2 }}>{RESULTADO.desc}</div>
                </div>

                {/* Precio */}
                <div style={{ background: C.azul, borderRadius: 10, padding: '14px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', marginBottom: 2 }}>Precio de lista</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: C.blanco }}>{RESULTADO.precio}</div>
                  <div style={{ fontSize: 11, color: C.acento }}>{RESULTADO.cuota}</div>
                </div>

                {/* Incluye */}
                {[
                  '✓ Bomba solar sumergible 500W',
                  '✓ 3 paneles solares incluidos',
                  '✓ Cable, soga y protecciones',
                  '✓ Garantía 12 meses Febecos',
                ].map(item => (
                  <div key={item} style={{ fontSize: 11, color: C.azulTxt, fontWeight: 500 }}>{item}</div>
                ))}

                {/* CTA */}
                <div style={{
                  background: '#25d366', color: C.blanco,
                  borderRadius: 10, padding: '11px 12px',
                  textAlign: 'center', fontWeight: 800, fontSize: 13,
                }}>
                  💬 Consultar por WhatsApp
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Barra home del teléfono */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
          <div style={{ width: 80, height: 4, background: '#333', borderRadius: 4 }} />
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes ripple { 0%{transform:scale(.5);opacity:.8} 100%{transform:scale(2);opacity:0} }
      `}</style>
    </div>
  )
}
