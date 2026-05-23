'use client'
import { useEffect, useState } from 'react'

/* ── Paleta exacta del selector real (formulario.html) ── */
const azul     = '#003d72'
const azulMid  = '#224a73'
const azulTxt  = '#203b61'
const verde    = '#2D5A27'
const acento   = '#a8c61b'
const acentoBg = '#f5fadf'
const acentoBord = '#c8df6a'
const fondo    = '#f7f9fc'
const blanco   = '#ffffff'
const gris     = '#5a6a7a'
const grisB    = '#dce6f0'
const grisBg   = '#eef3f9'

/* ── Cada "frame" es lo que se ve en pantalla ── */
const FRAMES = [
  {
    paso: '1 de 4', pct: 25,
    pregunta: '¿Para qué necesitás el agua?',
    sub: 'Elegí el uso principal',
    tipo: 'opts',
    opts: [
      { emoji: '🐄', label: 'Ganado', sel: true  },
      { emoji: '🌱', label: 'Riego',  sel: false },
      { emoji: '🏡', label: 'Mixto',  sel: false },
    ],
    seleccionando: '🐄 Ganado',
  },
  {
    paso: '2 de 4', pct: 50,
    pregunta: '¿Cuántos animales tenés?',
    sub: 'Usamos 60 L/animal/día (consumo verano)',
    tipo: 'input',
    placeholder: 'Ej: 200',
    unit: 'cabezas',
    valor: '200',
    calc: '≈ 12.000 L/día de consumo estimado',
  },
  {
    paso: '3 de 4', pct: 75,
    pregunta: '¿Cuál es el diámetro de la perforación?',
    sub: 'El diámetro determina qué bomba puede entrar al pozo',
    tipo: 'opts2',
    opts: [
      { label: '75mm — 3"',     desc: 'Angosto estándar', sel: false },
      { label: '100mm — 4"',    desc: 'Mayor caudal',     sel: true  },
    ],
    seleccionando: '100mm — 4"',
  },
  {
    paso: '4 de 4', pct: 100,
    tipo: 'resultado',
  },
]

// Duración de cada frame antes de "tocar" Continuar (ms)
const HOLD_MS    = 1800
const TAP_MS     = 600
const RESULT_MS  = 3400

export default function MockupSelectorAnimado() {
  const [frame, setFrame]    = useState(0)
  const [tapping, setTapping] = useState(false)

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>
    let t2: ReturnType<typeof setTimeout>

    const isResult = FRAMES[frame].tipo === 'resultado'
    const hold = isResult ? RESULT_MS : HOLD_MS

    t1 = setTimeout(() => {
      if (!isResult) setTapping(true)
      t2 = setTimeout(() => {
        setTapping(false)
        setFrame(f => (f + 1) % FRAMES.length)
      }, isResult ? 0 : TAP_MS)
    }, hold)

    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [frame])

  const f = FRAMES[frame]

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, fontFamily:"'Rubik',system-ui,sans-serif" }}>

      {/* ── Marco del teléfono ── */}
      <div style={{
        width: 268,
        background: '#1a1a1a',
        borderRadius: 38,
        padding: '10px 7px 14px',
        boxShadow: '0 24px 64px rgba(0,0,0,.40), 0 4px 16px rgba(0,0,0,.25)',
      }}>

        {/* Muesca */}
        <div style={{ width:76, height:20, background:'#1a1a1a', borderRadius:'0 0 14px 14px', margin:'0 auto 6px', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#333' }}/>
          <div style={{ width:36, height:4, borderRadius:4, background:'#333' }}/>
        </div>

        {/* Pantalla */}
        <div style={{ background:fondo, borderRadius:26, overflow:'hidden', minHeight:440 }}>

          {/* Cabecera del selector */}
          <div style={{ background:azul, padding:'12px 16px 10px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ color:blanco, fontWeight:800, fontSize:13, letterSpacing:-.3 }}>🌱 Febecos</span>
              <span style={{ color:'rgba(255,255,255,.5)', fontSize:10 }}>Paso {f.paso}</span>
            </div>
            {/* Barra de progreso real */}
            <div style={{ height:3, background:'rgba(255,255,255,.2)', borderRadius:3, overflow:'hidden' }}>
              <div style={{
                height:'100%', borderRadius:3,
                background:`linear-gradient(90deg,${azul},${acento})`,
                width:`${f.pct}%`,
                transition:'width .5s cubic-bezier(.4,0,.2,1)',
              }}/>
            </div>
          </div>

          {/* Cuerpo */}
          <div style={{ padding:'14px 14px 16px' }}>

            {f.tipo !== 'resultado' ? (
              <>
                {/* Card estilo .fc */}
                <div style={{
                  background:blanco, border:`1px solid ${grisB}`,
                  borderRadius:10, overflow:'hidden', marginBottom:10,
                  animation:'fu .28s ease both',
                }}>
                  {/* .fch */}
                  <div style={{ background:azul, padding:'10px 14px' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:blanco, marginBottom:1 }}>Completá los datos</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,.65)' }}>Te lleva 2 minutos</div>
                  </div>
                  {/* .fcb */}
                  <div style={{ padding:'14px 14px 12px' }}>

                    {/* Pregunta .ql */}
                    <div style={{ fontSize:13, fontWeight:600, color:azulTxt, marginBottom:4, lineHeight:1.35 }}>
                      {f.pregunta}
                    </div>
                    {/* Sub .qs */}
                    <div style={{ fontSize:10, color:gris, marginBottom:11, lineHeight:1.4 }}>
                      {f.sub}
                    </div>

                    {/* Opciones icono (.opts.row / .opt.il) */}
                    {f.tipo === 'opts' && (
                      <div style={{ display:'flex', gap:6 }}>
                        {(f as any).opts.map((o: any) => (
                          <div key={o.label} style={{
                            flex:1,
                            border:`1.5px solid ${o.sel ? azul : grisB}`,
                            borderRadius:7,
                            background: o.sel ? grisBg : grisBg,
                            padding:'8px 4px',
                            textAlign:'center',
                            boxShadow: o.sel ? `0 0 0 2px rgba(0,61,114,.15)` : 'none',
                            transition:'all .15s',
                          }}>
                            <div style={{ fontSize:18, marginBottom:2 }}>{o.emoji}</div>
                            <div style={{ fontSize:10, fontWeight:500, color: o.sel ? azulTxt : gris }}>{o.label}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Input numérico */}
                    {f.tipo === 'input' && (
                      <>
                        <div style={{ position:'relative', marginBottom:6 }}>
                          <div style={{
                            padding:'9px 42px 9px 10px',
                            border:`1.5px solid ${azul}`,
                            borderRadius:7, fontSize:13, fontWeight:600,
                            color:azulTxt, background:blanco,
                            boxShadow:`0 0 0 2px rgba(0,61,114,.12)`,
                          }}>
                            {(f as any).valor}
                          </div>
                          <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:11, color:gris, fontWeight:500 }}>
                            {(f as any).unit}
                          </span>
                        </div>
                        {(f as any).calc && (
                          <div style={{ fontSize:11, color:verde, fontWeight:500 }}>
                            ✓ {(f as any).calc}
                          </div>
                        )}
                      </>
                    )}

                    {/* Opciones con radio (.opts.g2) */}
                    {f.tipo === 'opts2' && (
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {(f as any).opts.map((o: any) => (
                          <div key={o.label} style={{
                            display:'flex', alignItems:'center', gap:8,
                            padding:'9px 11px',
                            border:`1.5px solid ${o.sel ? azul : grisB}`,
                            borderRadius:7, background:grisBg,
                            boxShadow: o.sel ? `0 0 0 2px rgba(0,61,114,.15)` : 'none',
                          }}>
                            {/* Radio dot */}
                            <div style={{
                              width:14, height:14, borderRadius:'50%',
                              border:`2px solid ${o.sel ? azul : '#bbb'}`,
                              background: o.sel ? azul : 'transparent',
                              flexShrink:0, position:'relative',
                            }}>
                              {o.sel && <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:4, height:4, background:blanco, borderRadius:'50%' }}/>}
                            </div>
                            <div>
                              <div style={{ fontSize:12, fontWeight:500, color:azulTxt }}>{o.label}</div>
                              <div style={{ fontSize:10, color:gris }}>{o.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>

                {/* Botón Continuar (.btn) */}
                <div style={{
                  width:'100%', padding:'11px 14px',
                  background: tapping ? azulMid : azul,
                  color:blanco, borderRadius:8,
                  fontSize:13, fontWeight:600,
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  transform: tapping ? 'scale(.97)' : 'scale(1)',
                  transition:'all .15s',
                  boxSizing:'border-box',
                  boxShadow: tapping ? `0 5px 18px rgba(0,61,114,.35)` : 'none',
                }}>
                  Continuar
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: tapping ? 'translateX(3px)' : 'none', transition:'transform .15s' }}>
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>

                {/* SSL note */}
                <div style={{ textAlign:'center', fontSize:9, color:'#b0bec5', letterSpacing:'.07em', textTransform:'uppercase', marginTop:8 }}>
                  ◎ Conexión segura SSL
                </div>
              </>
            ) : (
              /* ── RESULTADO: .bomba-card ── */
              <div style={{
                background:`linear-gradient(135deg, ${azul} 0%, ${azulMid} 100%)`,
                borderRadius:12, padding:16, color:blanco,
                animation:'fu .28s ease both',
              }}>
                {/* Badge */}
                <div style={{
                  display:'inline-flex', alignItems:'center', gap:5,
                  background:'rgba(168,198,27,.25)', border:`1px solid ${acento}`,
                  color:acento, fontSize:9, fontWeight:700,
                  padding:'3px 10px', borderRadius:100,
                  textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10,
                }}>
                  ✓ Equipo recomendado
                </div>

                <div style={{ fontSize:10, color:'rgba(255,255,255,.55)', fontFamily:'monospace', marginBottom:2 }}>HD-4SS-500</div>
                <div style={{ fontSize:17, fontWeight:800, color:blanco, marginBottom:2 }}>Kit Bomba Solar 4" 500W</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.65)', marginBottom:12 }}>
                  Cubre todo el año · 3 paneles · prof. máx. 80m
                </div>

                <div style={{ fontSize:24, fontWeight:800, color:acento, marginBottom:12 }}>
                  $2.216.673 <span style={{ fontSize:11, fontWeight:400, color:'rgba(255,255,255,.5)' }}>lista</span>
                </div>

                {/* Checks */}
                <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:14 }}>
                  {['Bomba solar sumergible 500W','3 paneles solares incluidos','Cable, soga y protecciones','Garantía 12 meses'].map(item => (
                    <div key={item} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'rgba(255,255,255,.9)' }}>
                      <span style={{ color:acento, fontWeight:700, flexShrink:0 }}>✓</span>
                      {item}
                    </div>
                  ))}
                </div>

                {/* CTA WA */}
                <div style={{
                  width:'100%', padding:'11px 12px',
                  background:'#25d366', color:blanco,
                  borderRadius:8, fontSize:12, fontWeight:700,
                  textAlign:'center', boxSizing:'border-box',
                }}>
                  💬 Consultá por WhatsApp
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Home bar */}
        <div style={{ display:'flex', justifyContent:'center', paddingTop:10 }}>
          <div style={{ width:72, height:4, background:'#333', borderRadius:4 }}/>
        </div>
      </div>

      <style>{`
        @keyframes fu { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}
