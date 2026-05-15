'use client'
import { useState, useEffect } from 'react'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wlcmpqwmqwugjwrssatj.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const API_BOMBAS = 'https://simulador-roi-seven.vercel.app/api/suggest-pump'
const API_DETALLE = 'https://simulador-roi-seven.vercel.app/api/pump-detail'

interface Revendedor {
  id: number; nombre: string; apellido: string; empresa: string
  provincia: string; descuento_pct: number; token_acceso: string
  tipo_usuario?: string
}
interface ResultadoBomba {
  sugerencia: any; caudal_a_altura: any; es_fallback: boolean; nota: string; opciones: any[]
}
interface BombaCatalogo {
  codigo: string; marca: string; watts: number; diam_bomba: string
  diam_perf: string; cant_paneles: number; stock: number; precio_full: number
}

function precioMayorista(precio: number, descuento: number) {
  return Math.round(precio * (1 - descuento / 100))
}
function fmt(n: number) {
  return '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

// ── CURVA SVG ──
function CurvaGrafico({ curvas }: { curvas: any[] }) {
  if (!curvas || curvas.length < 2) return null
  const W = 560, H = 160, PL = 40, PR = 16, PT = 12, PB = 28
  const cw = W - PL - PR, ch = H - PT - PB
  const alturas = curvas.map(c => c.altura_m)
  const maxAlt = Math.max(...alturas), minAlt = Math.min(...alturas)
  const maxL = Math.max(...curvas.map(c => c.litros_verano))
  const x = (alt: number) => PL + ((alt - minAlt) / (maxAlt - minAlt || 1)) * cw
  const y = (l: number) => PT + ch - (l / (maxL || 1)) * ch
  const polyline = (vals: number[], color: string) => {
    const pts = curvas.map((c, i) => `${x(c.altura_m).toFixed(1)},${y(vals[i]).toFixed(1)}`).join(' ')
    return <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
  }
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(p => Math.round(maxL * p))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* Grid */}
      {yTicks.map(v => (
        <g key={v}>
          <line x1={PL} y1={y(v)} x2={W - PR} y2={y(v)} stroke="#1e3248" strokeWidth="1" />
          <text x={PL - 4} y={y(v) + 4} textAnchor="end" fontSize="9" fill="#3a5a7a">{(v / 1000).toFixed(1)}k</text>
        </g>
      ))}
      {alturas.map(a => (
        <g key={a}>
          <line x1={x(a)} y1={PT} x2={x(a)} y2={PT + ch} stroke="#1e3248" strokeWidth="1" strokeDasharray="3,3" />
          <text x={x(a)} y={H - 4} textAnchor="middle" fontSize="9" fill="#3a5a7a">{a}m</text>
        </g>
      ))}
      {/* Líneas */}
      {polyline(curvas.map(c => c.litros_verano), '#4ade80')}
      {polyline(curvas.map(c => c.litros_promedio), '#e8f0f8')}
      {polyline(curvas.map(c => c.litros_invierno), '#60a5fa')}
      {/* Puntos verano */}
      {curvas.map(c => <circle key={c.altura_m} cx={x(c.altura_m)} cy={y(c.litros_verano)} r="3" fill="#4ade80" />)}
      {/* Leyenda */}
      <g transform={`translate(${PL + 8}, ${PT + 8})`}>
        <rect width="80" height="42" fill="#0d1a2a" fillOpacity="0.8" rx="4" />
        {[['#4ade80', '☀️ Verano'], ['#e8f0f8', '📅 Promedio'], ['#60a5fa', '❄️ Invierno']].map(([color, label], i) => (
          <g key={label} transform={`translate(6, ${i * 13 + 8})`}>
            <line x1="0" y1="0" x2="12" y2="0" stroke={color as string} strokeWidth="2" />
            <text x="16" y="4" fontSize="9" fill={color as string}>{label}</text>
          </g>
        ))}
      </g>
    </svg>
  )
}



// ── TABLAS MCA ──
const TF: Record<string, number[][]> = {"3/4":[[1.14,7.7],[2.27,27.8],[3.40,58.6],[4.55,99.5]],"1":[[1.14,2.4],[2.27,8.6],[3.40,18.5],[4.55,30.8],[5.68,46.9],[6.80,65.2],[7.95,87.0],[9.10,111.5]],"1 1/4":[[1.14,0.6],[2.27,2.3],[3.40,4.8],[4.55,8.1],[5.68,12.1],[6.80,16.9],[7.95,23.9],[9.10,29.5]],"1 1/2":[[1.14,0.3],[2.27,1.1],[3.40,2.2],[4.55,3.8],[5.68,5.7],[6.80,8.1],[7.95,10.8],[9.10,13.8],[10.2,17.0],[11.4,20.8]],"2":[[1.14,0.1],[2.27,0.4],[3.40,0.8],[4.55,1.3],[5.68,2.0],[6.80,2.8],[7.95,3.8],[9.10,4.8],[10.2,6.0],[11.4,7.3],[13.6,10.2],[15.9,13.6],[17.0,15.4],[18.2,17.4],[20.4,21.7],[22.7,26.2]],"2 1/2":[[3.40,0.3],[4.55,0.5],[5.68,0.7],[6.80,1.0],[7.95,1.3],[9.10,1.6],[10.2,2.0],[11.4,2.5],[13.6,3.4],[15.9,4.5],[17.0,5.1],[18.2,5.8],[20.4,7.3],[22.7,8.8],[28.4,13.1],[34.1,18.3]],"3":[[5.68,0.3],[6.80,0.4],[7.95,0.5],[9.10,0.7],[10.2,0.8],[11.4,1.0],[13.6,1.4],[15.9,1.9],[17.0,2.1],[18.2,2.4],[20.4,3.0],[22.7,3.7],[28.4,5.4],[34.1,8.0],[39.8,10.1],[45.4,12.3]],"4":[[9.10,0.2],[10.2,0.3],[11.4,0.3],[13.6,0.4],[15.9,0.5],[17.0,0.6],[18.2,0.6],[20.4,0.8],[22.7,0.9],[28.4,1.3],[34.1,1.8],[39.8,2.5],[45.4,3.1],[56.8,4.6],[68.2,6.4]],"5":[[20.4,0.3],[22.7,0.4],[28.4,0.5],[34.1,0.7],[39.8,0.9],[45.4,1.1],[56.8,1.6],[68.2,2.3]],"6":[[34.1,0.3],[39.8,0.4],[45.4,0.5],[56.8,0.7],[68.2,0.9],[79.4,1.2],[90.8,1.6],[113.0,2.1]]};
const TA: Record<string, number[]> = {"3/4":[0.15,6.71,3.36,1.83,0.61,0.45,1.37,0.30,1.52,0.45,0.24,0.40],"1":[0.18,8.24,4.27,2.44,0.82,0.52,1.74,0.40,1.83,0.52,0.30,0.46],"1 1/4":[0.24,11.00,5.49,3.66,1.07,0.70,2.32,0.51,2.53,0.70,0.40,0.61],"1 1/2":[0.30,13.12,6.71,4.27,1.31,0.82,2.74,0.61,3.05,0.82,0.45,0.73],"2":[0.36,16.78,8.24,5.80,1.68,1.07,3.66,0.76,3.96,1.07,0.58,0.91],"2 1/2":[0.43,20.43,10.06,7.01,1.98,1.28,4.27,0.92,4.58,1.28,0.67,1.10],"3":[0.52,25.01,12.50,9.76,2.44,1.59,5.18,1.16,5.49,1.59,0.85,1.37],"4":[0.70,33.55,16.16,13.12,3.36,2.14,6.71,1.52,7.32,2.14,1.16,1.83],"5":[0.88,42.70,21.35,17.69,4.27,2.74,8.24,1.92,9.46,2.74,1.43,2.29],"6":[1.07,51.85,24.40,20.74,4.88,3.36,10.00,2.29,11.28,3.36,1.77,2.74]};
const FM: Record<string, number> = {"Hierro nuevo":1.00,"Hierro viejo":1.33,"Acero nuevo":0.80,"Acero arrugado":1.25,"Fibrocemento":1.25,"Aluminio":0.70,"PVC":0.65,"Hidrobronz":0.67};
const AI: Record<string, number> = {valv_esclusa:0,valv_globo:1,valv_retencion:3,curva_normal:4,te_normal:6,codo_45:7,codo_180:8,entrada_ord:10};
const DIAMS_C = ['3/4','1','1 1/4','1 1/2','2','2 1/2','3','4','5','6'];
const MATS_C = ['Hierro nuevo','Hierro viejo','Acero nuevo','Acero arrugado','Fibrocemento','Aluminio','PVC','Hidrobronz'];
const ACC_NAMES: Record<string,string> = {curva_normal:'Curvas 90°',codo_45:'Codos 45°',codo_180:'Codo 180°',valv_retencion:'Válv. retención',valv_esclusa:'Válv. esclusa',valv_globo:'Válv. globo',te_normal:'Te normal',entrada_ord:'Entrada ord.'};

function interpolar(diam: string, q: number): number {
  const t = TF[diam]; if (!t) return 0; const n = t.length;
  if (q <= t[0][0]) return t[0][1] * Math.pow(q/t[0][0], 2);
  if (q >= t[n-1][0]) return t[n-1][1] * Math.pow(q/t[n-1][0], 1.85);
  for (let i=0;i<n-1;i++) { if (q>=t[i][0]&&q<=t[i+1][0]) { const r=(q-t[i][0])/(t[i+1][0]-t[i][0]); return t[i][1]+r*(t[i+1][1]-t[i][1]); } }
  return 0;
}
function calcLongAcc(diam: string, accs: Record<string,number>): number {
  const a = TA[diam]; if (!a) return 0;
  return Object.entries(AI).reduce((sum,[k,idx]) => sum + (accs[k]||0)*(a[idx]||0), 0);
}
function calcTramo(long: number, diam: string, q: number, mat: string, accs: Record<string,number>) {
  const fmat = FM[mat]||1;
  const longAcc = calcLongAcc(diam, accs);
  const longT = long + longAcc;
  const p100 = interpolar(diam, q);
  return { perdida: parseFloat(((p100/100)*longT*fmat).toFixed(2)), longAcc: parseFloat(longAcc.toFixed(2)), longT: parseFloat(longT.toFixed(2)), p100: parseFloat(p100.toFixed(4)), fmat };
}

function AccCounter({ label, val, onChange }: { label: string; val: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#0d1a2a', border:'1px solid #1e3248', borderRadius:8, padding:'6px 10px', gap:8 }}>
      <span style={{ fontSize:12, color:'#e8f0f8', flex:1, lineHeight:1.3 }}>{label}</span>
      <div style={{ display:'flex', alignItems:'center', gap:0 }}>
        <button onClick={() => onChange(Math.max(0,val-1))} style={{ width:24,height:24,border:'1px solid #1e3248',borderRadius:4,background:'#132233',color:'#7a9ab5',cursor:'pointer',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:500 }}>−</button>
        <span style={{ fontFamily:'monospace',fontSize:13,fontWeight:700,width:24,textAlign:'center',color:'#e8f0f8' }}>{val}</span>
        <button onClick={() => onChange(val+1)} style={{ width:24,height:24,border:'1px solid #1e3248',borderRadius:4,background:'#132233',color:'#7a9ab5',cursor:'pointer',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:500 }}>+</button>
      </div>
    </div>
  )
}

function ResultadoMCA({ altGeo, friccion, mca, tramos, litrosDia, diamPerf, onUsar, onReset }: any) {
  return (
    <div style={{ background:'#0a2e18', borderRadius:10, padding:16, marginTop:12 }}>
      <div style={{ display:'flex', gap:10, marginBottom:12, flexWrap:'wrap' as const }}>
        {[['Altura geométrica', altGeo.toFixed(1)+' m','#e8f0f8'],['Pérdidas fricción', friccion.toFixed(2)+' m','#e8f0f8'],['MCA Total', mca.toFixed(2)+' m','#4ade80']].map(([l,v,c])=>(
          <div key={l} style={{ flex:1, minWidth:100, textAlign:'center' as const, background: c==='#4ade80'?'rgba(74,222,128,0.1)':'rgba(255,255,255,0.04)', borderRadius:8, padding:'10px 6px' }}>
            <div style={{ fontSize:10, color:'#3a5a7a', textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:20, fontWeight:800, color:c, fontFamily:'monospace' }}>{v}</div>
          </div>
        ))}
      </div>
      {tramos.length > 0 && (
        <div style={{ marginBottom:12 }}>
          {tramos.map((t: any, i: number) => (
            <div key={i} style={{ fontSize:11, color:'#7a9ab5', padding:'4px 0', borderBottom:'1px solid #132233' }}>
              <span style={{ color:'#e8681a', fontWeight:600 }}>{t.nombre}</span>: {t.diam}" · {t.longT}m equiv. · ×{t.fmat} → <span style={{ color:'#4ade80' }}>−{t.perdida}m</span>
            </div>
          ))}
        </div>
      )}
      <button onClick={() => onUsar(mca, litrosDia, diamPerf)} style={{ width:'100%', padding:'12px', background:'#e8681a', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', marginBottom:8 }}>
        Usar esta MCA para buscar bomba →
      </button>
      <button onClick={onReset} style={{ width:'100%', padding:'10px', background:'transparent', border:'1px solid #1e3248', borderRadius:8, fontSize:13, fontWeight:600, color:'#7a9ab5', cursor:'pointer' }}>
        🔄 Calcular otro equipo
      </button>
    </div>
  )
}

function CalculadoraMCA({ onUsarMCA, token, revendedor }: { onUsarMCA: (mca: number, litros: number, diam: string) => void; token: string | null; revendedor: string }) {
  const [tab, setTab] = useState<'simple'|'avanzado'>('simple')
  const [tipo, setTipo] = useState<'sumergible'|'superficial'|'riego'>('sumergible')
  const [nivDin, setNivDin] = useState(10)
  const [altDesc, setAltDesc] = useState(2)
  const [altAsp, setAltAsp] = useState(3)
  const [altRiego, setAltRiego] = useState(5)
  const [presionKg, setPresionKg] = useState(0)
  const [longImp, setLongImp] = useState(15)
  const [longAsp, setLongAsp] = useState(6)
  const [diam, setDiam] = useState('2')
  const [mat, setMat] = useState('PVC')
  // Caudal: input en L/h o L/día
  const [caudalUnidad, setCaudalUnidad] = useState<'lh'|'ldia'>('ldia')
  const [caudalVal, setCaudalVal] = useState(3000)
  const [caudalModo, setCaudalModo] = useState<'litros'|'animales'>('litros')
  const [animales, setAnimales] = useState(50)
  const [accsImp, setAccsImp] = useState<Record<string,number>>({})
  const [accsAsp, setAccsAsp] = useState<Record<string,number>>({})
  const [mostrarAccs, setMostrarAccs] = useState(false)
  const [mostrarAccsAsp, setMostrarAccsAsp] = useState(false)
  // Avanzado
  const [altGeoAv, setAltGeoAv] = useState(15)
  const [presionKgAv, setPresionKgAv] = useState(0)
  const [tramos, setTramos] = useState<any[]>([{ id:1, nombre:'Tramo 1', longitud:15, diam:'2', caudalLdia:3000, mat:'PVC', accs:{}, mostrarAccs:false }])
  const [diamPerf, setDiamPerf] = useState('3')
  const [resSimple, setResSimple] = useState<any>(null)
  const [resAv, setResAv] = useState<any>(null)

  const altGeoSimple = tipo==='sumergible' ? nivDin+altDesc : tipo==='superficial' ? altAsp+altDesc : altRiego
  // Conversión caudal a m³/h
  const litrosDia = caudalModo==='animales' ? animales*60 : (caudalUnidad==='ldia' ? caudalVal : caudalVal*8)
  const caudalM3h = litrosDia/1000/8
  const presionM = presionKg * 10

  function guardar(mca: number, friccion: number, tipo: string, tramosCalc: any[]) {
    try {
      const tramo = tramosCalc[0] || {}
      fetch(`${SUPABASE_URL}/rest/v1/calculos_mca`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          tipo_instalacion: tipo,
          diametro: tramo.diam || null,
          material: tramo.mat || null,
          longitud_total_m: tramo.longT || null,
          caudal_m3h: caudalM3h,
          mca_total: mca,
          perdida_friccion_m: friccion,
          origen: 'portal_revendedor',
          revendedor_token: token || null,
          revendedor_nombre: revendedor || null,
        })
      })
    } catch(e) {}
  }

  function calcSimple() {
    const tramosCalc: any[] = []
    if (tipo==='superficial' && (longAsp>0||Object.values(accsAsp).some(v=>v>0))) {
      const r = calcTramo(longAsp, diam, caudalM3h, mat, accsAsp)
      tramosCalc.push({ nombre:'Aspiración', diam, ...r })
    }
    const r2 = calcTramo(longImp, diam, caudalM3h, mat, accsImp)
    tramosCalc.push({ nombre: tipo==='superficial'?'Impulsión':'Cañería', diam, ...r2 })
    const fricTotal = parseFloat(tramosCalc.reduce((s,t)=>s+t.perdida,0).toFixed(2))
    const mca = parseFloat((altGeoSimple + fricTotal + presionM).toFixed(2))
    setResSimple({ altGeo: altGeoSimple, friccion: fricTotal, mca, tramos: tramosCalc })
    guardar(mca, fricTotal, tipo, tramosCalc)
  }

  function calcAvanzado() {
    const tramosCalc = tramos.map(t => {
      const ldia = (t.caudalModo||'litros')==='animales' ? (t.animales||50)*60 : (t.caudalUnidad==='lh' ? (t.caudalLdia||3000)*8 : (t.caudalLdia||3000))
      const q = ldia/1000/8
      const r = calcTramo(t.longitud, t.diam, q, t.mat, t.accs||{})
      return { nombre: t.nombre, diam: t.diam, mat: t.mat, ...r }
    })
    const fricTotal = parseFloat(tramosCalc.reduce((s,t)=>s+t.perdida,0).toFixed(2))
    // Altura geométrica = profundidad + alturaTanque del primer tramo
    const primerTramo = tramos[0] || {}
    const altGeoTotal = parseFloat(((primerTramo.profundidad||10) + (primerTramo.alturaTanque||2) + fricTotal + presionKgAv*10).toFixed(2))
    const mca = parseFloat((altGeoAv + fricTotal + presionKgAv*10).toFixed(2))
    const litTot = tramos[0]?.caudalLdia || 3000
    setResAv({ altGeo: altGeoAv, friccion: fricTotal, mca, tramos: tramosCalc, litrosDia: litTot })
    guardar(mca, fricTotal, 'multiples_tramos', tramosCalc)
  }

  const ci = { background:'#0d1a2a', border:'1px solid #1e3248', borderRadius:8, padding:'8px 10px', color:'#e8f0f8', fontSize:13, fontFamily:'inherit', width:'100%' } as React.CSSProperties
  const lbl = { fontSize:11, fontWeight:600, color:'#7a9ab5', marginBottom:4, display:'block' } as React.CSSProperties
  const fld = { display:'flex', flexDirection:'column' as const, gap:2 }

  function AccsSection({ accs, setAccs, label, mostrar, setMostrar }: any) {
    return (
      <div style={{ marginBottom:10 }}>
        <button onClick={() => setMostrar(!mostrar)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', background:'#132233', border:'1px solid #1e3248', borderRadius:8, color:'#7a9ab5', fontSize:12, fontWeight:600, cursor:'pointer', width:'100%' }}>
          <span>{mostrar ? '▲' : '▼'}</span>
          <span>{label}</span>
          {Object.values(accs).some((v:any)=>v>0) && <span style={{ marginLeft:'auto', background:'#e8681a', color:'#fff', borderRadius:4, padding:'1px 7px', fontSize:11 }}>{Object.values(accs).filter((v:any)=>v>0).length} tipos</span>}
        </button>
        {mostrar && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:8 }}>
            {Object.keys(ACC_NAMES).map(k => (
              <AccCounter key={k} label={ACC_NAMES[k]} val={accs[k]||0} onChange={v=>setAccs({...accs,[k]:v})} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ background:'#0d1a2a', border:'1px solid #1e3248', borderRadius:10, padding:16 }}>
      {/* Tabs */}
      <div style={{ display:'flex', gap:4, background:'#132233', borderRadius:8, padding:4, marginBottom:14 }}>
        {(['simple','avanzado'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:'7px 10px', border:'none', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:700, background: tab===t?'#1e3248':'transparent', color: tab===t?'#e8f0f8':'#7a9ab5' }}>
            {t==='simple' ? 'Instalación simple' : 'Múltiples tramos'}
          </button>
        ))}
      </div>

      {tab==='simple' && (
        <>
          {/* Tipo */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
            {(['sumergible','superficial','riego'] as const).map(t => (
              <button key={t} onClick={() => setTipo(t)} style={{ border:`1.5px solid ${tipo===t?'#4ade80':'#1e3248'}`, borderRadius:8, padding:'8px 6px', textAlign:'center' as const, cursor:'pointer', background: tipo===t?'rgba(74,222,128,0.1)':'#132233', color: tipo===t?'#4ade80':'#7a9ab5', fontSize:11, fontWeight:600, lineHeight:1.3 }}>
                <div style={{ fontSize:18, marginBottom:3 }}>{t==='sumergible'?'⬇️':t==='superficial'?'🔧':'💧'}</div>
                {t==='sumergible'?'Sumergible':t==='superficial'?'Superficial':'Riego'}
              </button>
            ))}
          </div>

          {/* FILA 1: Diám. perforación + Profundidad + Altura tanque */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
            {tipo==='sumergible' && <>
              <div style={fld}><label style={lbl}>Diám. perforación</label><select style={ci} value={diamPerf} onChange={e=>setDiamPerf(e.target.value)}>
                <option value="2">2" (63mm)</option><option value="3">3" (80-90mm)</option><option value="4">4" (110mm)</option><option value="6">6" (152mm+)</option>
              </select></div>
              <div style={fld}><label style={lbl}>Profundidad bomba (m)</label><input style={ci} type="number" value={nivDin} min={0} step={0.5} onChange={e=>setNivDin(Number(e.target.value))} /></div>
              <div style={fld}><label style={lbl}>Altura tanque (m)</label><input style={ci} type="number" value={altDesc} min={0} step={0.5} onChange={e=>setAltDesc(Number(e.target.value))} /></div>
            </>}
            {tipo==='superficial' && <>
              <div style={fld}><label style={lbl}>Diám. perforación</label><select style={ci} value={diamPerf} onChange={e=>setDiamPerf(e.target.value)}>
                <option value="2">2" (63mm)</option><option value="3">3" (80-90mm)</option><option value="4">4" (110mm)</option><option value="6">6" (152mm+)</option>
              </select></div>
              <div style={fld}><label style={lbl}>Altura aspiración (m)</label><input style={ci} type="number" value={altAsp} min={0} max={7.5} step={0.5} onChange={e=>setAltAsp(Number(e.target.value))} /></div>
              <div style={fld}><label style={lbl}>Altura tanque (m)</label><input style={ci} type="number" value={altDesc} min={0} step={0.5} onChange={e=>setAltDesc(Number(e.target.value))} /></div>
            </>}
            {tipo==='riego' && <>
              <div style={fld}><label style={lbl}>Diferencia de nivel (m)</label><input style={ci} type="number" value={altRiego} step={0.5} onChange={e=>setAltRiego(Number(e.target.value))} /></div>
              <div style={{ visibility:'hidden' }} /><div style={{ visibility:'hidden' }} />
            </>}
          </div>

          {/* FILA 2: Dist. horizontal + Diám. caño a colocar + Material */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
            {tipo==='superficial'
              ? <>
                  <div style={fld}><label style={lbl}>Dist. horizontal imp. (m)</label><input style={ci} type="number" value={longImp} min={0} step={1} onChange={e=>setLongImp(Number(e.target.value))} /></div>
                  <div style={fld}><label style={lbl}>Dist. horizontal asp. (m)</label><input style={ci} type="number" value={longAsp} min={0} step={1} onChange={e=>setLongAsp(Number(e.target.value))} /></div>
                </>
              : <div style={fld}><label style={lbl}>Distancia horizontal (m)</label><input style={ci} type="number" value={longImp} min={0} step={1} onChange={e=>setLongImp(Number(e.target.value))} /></div>
            }
            <div style={fld}><label style={lbl}>Diám. caño a colocar</label><select style={ci} value={diam} onChange={e=>setDiam(e.target.value)}>{DIAMS_C.map(d=><option key={d}>{d}</option>)}</select></div>
            <div style={fld}><label style={lbl}>Material del caño</label><select style={ci} value={mat} onChange={e=>setMat(e.target.value)}>{MATS_C.map(m=><option key={m}>{m}</option>)}</select></div>
          </div>

          {/* FILA 3: Caudal (animales o litros) + Presión (solo riego) */}
          <div style={{ display:'grid', gridTemplateColumns: tipo==='riego' ? '1fr 1fr' : '1fr', gap:10, marginBottom:14 }}>
            <div style={fld}>
              <label style={lbl}>Caudal requerido</label>
              {/* Selector modo */}
              <div style={{ display:'flex', gap:4, marginBottom:6 }}>
                {(['litros','animales'] as const).map(m => (
                  <button key={m} onClick={() => setCaudalModo(m)} style={{ flex:1, padding:'5px 8px', border:`1px solid ${caudalModo===m?'#4ade80':'#1e3248'}`, borderRadius:6, background: caudalModo===m?'rgba(74,222,128,0.1)':'#132233', color: caudalModo===m?'#4ade80':'#7a9ab5', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                    {m==='litros' ? '💧 Litros' : '🐄 Animales'}
                  </button>
                ))}
              </div>
              {caudalModo==='animales' ? (
                <div>
                  <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                    <input style={{ ...ci, flex:1 }} type="number" value={animales} min={1} step={1} placeholder="Ej: 50" onChange={e=>setAnimales(Number(e.target.value))} />
                    <span style={{ color:'#7a9ab5', fontSize:12, whiteSpace:'nowrap' as const }}>cabezas</span>
                  </div>
                  <span style={{ fontSize:11, color:'#4ade80', marginTop:4, display:'block' }}>= {(animales*60).toLocaleString('es-AR')} L/día ({animales} × 60 L/animal)</span>
                </div>
              ) : (
                <div>
                  <div style={{ display:'flex', gap:4 }}>
                    <input style={{ ...ci, flex:1 }} type="number" value={caudalVal} min={1} step={100} onChange={e=>setCaudalVal(Number(e.target.value))} />
                    <select style={{ ...ci, width:'auto', paddingRight:24, paddingLeft:8 }} value={caudalUnidad} onChange={e=>setCaudalUnidad(e.target.value as any)}>
                      <option value="ldia">L/día</option>
                      <option value="lh">L/hora</option>
                    </select>
                  </div>
                  <span style={{ fontSize:10, color:'#3a5a7a' }}>= {caudalM3h.toFixed(3)} m³/h</span>
                </div>
              )}
            </div>
            {tipo==='riego' && (
              <div style={fld}>
                <label style={lbl}>Presión requerida (kg/cm²)</label>
                <input style={ci} type="number" value={presionKg} min={0} step={0.5} onChange={e=>setPresionKg(Number(e.target.value))} />
                {presionKg > 0 && <span style={{ fontSize:10, color:'#3a5a7a' }}>= {presionM.toFixed(1)} m</span>}
              </div>
            )}
          </div>

          {/* Accesorios colapsables */}
          <AccsSection accs={accsImp} setAccs={setAccsImp} label={tipo==='superficial'?'▼ Accesorios impulsión':'▼ Agregar accesorios'} mostrar={mostrarAccs} setMostrar={setMostrarAccs} />
          {tipo==='superficial' && <AccsSection accs={accsAsp} setAccs={setAccsAsp} label="▼ Accesorios aspiración" mostrar={mostrarAccsAsp} setMostrar={setMostrarAccsAsp} />}

          <button onClick={calcSimple} style={{ width:'100%', padding:'11px', background:'#1a6b3c', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', marginTop:14 }}>
            Calcular MCA
          </button>
          {resSimple && <ResultadoMCA {...resSimple} litrosDia={litrosDia} diamPerf={diamPerf} onUsar={onUsarMCA} onReset={() => setResSimple(null)} />}
        </>
      )}

      {tab==='avanzado' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
            <div style={fld}><label style={lbl}>Altura geométrica total (m)</label><input style={ci} type="number" value={altGeoAv} step={0.5} onChange={e=>setAltGeoAv(Number(e.target.value))} /></div>
            <div style={fld}>
              <label style={lbl}>Presión requerida (kg/cm²)</label>
              <input style={ci} type="number" value={presionKgAv} min={0} step={0.5} onChange={e=>setPresionKgAv(Number(e.target.value))} />
              {presionKgAv > 0 && <span style={{ fontSize:10, color:'#3a5a7a' }}>= {(presionKgAv*10).toFixed(1)} m</span>}
            </div>
          </div>

          {tramos.map((t, idx) => (
            <div key={t.id} style={{ border:'1.5px solid #1e3248', borderRadius:10, padding:14, marginBottom:10, background:'#132233' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <input style={{ ...ci, flex:1, fontSize:13, fontWeight:700, maxWidth:180 }} type="text" value={t.nombre} onChange={e=>setTramos(tramos.map((x,i)=>i===idx?{...x,nombre:e.target.value}:x))} />
                {tramos.length > 1 && <button onClick={() => setTramos(tramos.filter((_,i)=>i!==idx))} style={{ width:24,height:24,border:'1px solid #1e3248',borderRadius:4,background:'transparent',color:'#7a9ab5',cursor:'pointer',fontSize:14,marginLeft:8 }}>×</button>}
              </div>

              {/* Fila 1: Diám. perforación + Profundidad + Altura tanque */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:10 }}>
                <div style={fld}><label style={lbl}>Diám. perforación</label>
                  <select style={ci} value={t.diamPerf||'3'} onChange={e=>setTramos(tramos.map((x,i)=>i===idx?{...x,diamPerf:e.target.value}:x))}>
                    <option value="2">2" (63mm)</option><option value="3">3" (80-90mm)</option><option value="4">4" (110mm)</option><option value="6">6" (152mm+)</option>
                  </select>
                </div>
                <div style={fld}><label style={lbl}>Profundidad bomba (m)</label><input style={ci} type="number" value={t.profundidad||10} min={0} step={0.5} onChange={e=>setTramos(tramos.map((x,i)=>i===idx?{...x,profundidad:Number(e.target.value)}:x))} /></div>
                <div style={fld}><label style={lbl}>Altura tanque (m)</label><input style={ci} type="number" value={t.alturaTanque||2} min={0} step={0.5} onChange={e=>setTramos(tramos.map((x,i)=>i===idx?{...x,alturaTanque:Number(e.target.value)}:x))} /></div>
              </div>

              {/* Fila 2: Dist. horizontal + Diám. caño + Material */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:10 }}>
                <div style={fld}><label style={lbl}>Distancia horizontal (m)</label><input style={ci} type="number" value={t.longitud} min={0} step={1} onChange={e=>setTramos(tramos.map((x,i)=>i===idx?{...x,longitud:Number(e.target.value)}:x))} /></div>
                <div style={fld}><label style={lbl}>Diám. caño a colocar</label><select style={ci} value={t.diam} onChange={e=>setTramos(tramos.map((x,i)=>i===idx?{...x,diam:e.target.value}:x))}>{DIAMS_C.map(d=><option key={d}>{d}</option>)}</select></div>
                <div style={fld}><label style={lbl}>Material del caño</label><select style={ci} value={t.mat} onChange={e=>setTramos(tramos.map((x,i)=>i===idx?{...x,mat:e.target.value}:x))}>{MATS_C.map(m=><option key={m}>{m}</option>)}</select></div>
              </div>

              {/* Fila 3: Caudal animales o litros */}
              <div style={{ marginBottom:10 }}>
                <label style={lbl}>Caudal requerido</label>
                <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                  {(['litros','animales'] as const).map(m => (
                    <button key={m} onClick={() => setTramos(tramos.map((x,i)=>i===idx?{...x,caudalModo:m}:x))} style={{ flex:1, padding:'4px 8px', border:`1px solid ${(t.caudalModo||'litros')===m?'#4ade80':'#1e3248'}`, borderRadius:6, background:(t.caudalModo||'litros')===m?'rgba(74,222,128,0.1)':'#0d1a2a', color:(t.caudalModo||'litros')===m?'#4ade80':'#7a9ab5', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                      {m==='litros'?'💧 Litros':'🐄 Animales'}
                    </button>
                  ))}
                </div>
                {(t.caudalModo||'litros')==='animales' ? (
                  <div>
                    <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                      <input style={{ ...ci, flex:1 }} type="number" value={t.animales||50} min={1} onChange={e=>setTramos(tramos.map((x,i)=>i===idx?{...x,animales:Number(e.target.value)}:x))} />
                      <span style={{ color:'#7a9ab5', fontSize:12, whiteSpace:'nowrap' as const }}>cabezas</span>
                    </div>
                    <span style={{ fontSize:11, color:'#4ade80', marginTop:2, display:'block' }}>= {((t.animales||50)*60).toLocaleString('es-AR')} L/día</span>
                  </div>
                ) : (
                  <div style={{ display:'flex', gap:4 }}>
                    <input style={{ ...ci, flex:1 }} type="number" value={t.caudalLdia||3000} min={100} step={100} onChange={e=>setTramos(tramos.map((x,i)=>i===idx?{...x,caudalLdia:Number(e.target.value)}:x))} />
                    <select style={{ ...ci, width:'auto', paddingRight:24, paddingLeft:8 }} value={t.caudalUnidad||'ldia'} onChange={e=>setTramos(tramos.map((x,i)=>i===idx?{...x,caudalUnidad:e.target.value}:x))}>
                      <option value="ldia">L/día</option>
                      <option value="lh">L/hora</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Accesorios colapsables */}
              <button onClick={() => setTramos(tramos.map((x,i)=>i===idx?{...x,mostrarAccs:!x.mostrarAccs}:x))} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px', background:'#0d1a2a', border:'1px solid #1e3248', borderRadius:7, color:'#7a9ab5', fontSize:12, fontWeight:600, cursor:'pointer', width:'100%', marginBottom: t.mostrarAccs?8:0 }}>
                <span>{t.mostrarAccs?'▲':'▼'}</span> Agregar accesorios
                {Object.values(t.accs||{}).some((v:any)=>v>0) && <span style={{ background:'#e8681a', color:'#fff', borderRadius:4, padding:'1px 7px', fontSize:11, marginLeft:'auto' }}>{Object.values(t.accs||{}).filter((v:any)=>v>0).length} tipos</span>}
              </button>
              {t.mostrarAccs && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
                  {Object.keys(ACC_NAMES).map(k => (
                    <AccCounter key={k} label={ACC_NAMES[k]} val={(t.accs||{})[k]||0} onChange={v=>setTramos(tramos.map((x,i)=>i===idx?{...x,accs:{...(x.accs||{}),[k]:v}}:x))} />
                  ))}
                </div>
              )}
            </div>
          ))}

          <button onClick={() => setTramos([...tramos,{id:Date.now(),nombre:`Tramo ${tramos.length+1}`,longitud:10,diam:'2',caudalLdia:3000,mat:'PVC',accs:{},mostrarAccs:false}])} style={{ width:'100%', padding:'8px', border:'1.5px dashed #1e3248', borderRadius:8, background:'transparent', color:'#7a9ab5', fontSize:13, cursor:'pointer', marginBottom:14 }}>
            + Agregar tramo
          </button>

          <div style={fld}><label style={lbl}>Diám. perforación</label><select style={ci} value={diamPerf} onChange={e=>setDiamPerf(e.target.value)}>
            <option value="2">2" (63mm)</option><option value="3">3" (80-90mm)</option><option value="4">4" (110mm)</option><option value="6">6" (152mm+)</option>
          </select></div>

          <button onClick={calcAvanzado} style={{ width:'100%', padding:'11px', background:'#1a6b3c', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', marginTop:14 }}>
            Calcular instalación completa
          </button>
          {resAv && <ResultadoMCA {...resAv} diamPerf={diamPerf} onUsar={onUsarMCA} onReset={() => setResAv(null)} />}
        </>
      )}
    </div>
  )
}


function ModalDetalle({ codigo, descuento, mostrarPublico, onClose }: any) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_DETALLE}?codigo=${encodeURIComponent(codigo)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [codigo])

  const precio = data?.bomba?.precio_full
    ? (mostrarPublico ? data.bomba.precio_full : precioMayorista(data.bomba.precio_full, descuento))
    : null

  // Agrupar kit por familia
  const familias: Record<string, any[]> = {}
  if (data?.kit) {
    for (const item of data.kit) {
      const f = item.familia || 'otro'
      if (!familias[f]) familias[f] = []
      familias[f].push(item)
    }
  }

  // Panel solar del kit
  const panelKit = data?.kit?.find((i: any) => i.familia === 'panel')
  const panelDesc = panelKit
    ? `${panelKit.nombre}${panelKit.potencia_w ? ` — ${panelKit.potencia_w}W` : ''} × ${data?.bomba?.cant_paneles || panelKit.cantidad}`
    : data?.bomba?.cant_paneles ? `${data.bomba.cant_paneles} panel${data.bomba.cant_paneles > 1 ? 'es' : ''} solar${data.bomba.cant_paneles > 1 ? 'es' : ''}` : null

  // HSP (horas solares pico) usadas para el cálculo
  const HSP = { verano: 5.5, promedio: 4, invierno: 3.5 }

  const nombreFamilia: Record<string, string> = {
    panel: '☀️ Paneles solares', soporte: '🔩 Soportes', cable: '🔌 Cables',
    bomba: '⬇️ Bomba', caja: '📦 Controlador', accesorio: '🔧 Accesorios', otro: '📋 Otros'
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#0d1a2a', border: '1px solid #1e3248', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #1e3248', position: 'sticky', top: 0, background: '#0d1a2a', zIndex: 1 }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#e8681a' }}>{codigo}</div>
            <div style={{ fontSize: 11, color: '#7a9ab5', marginTop: 2 }}>Detalle del equipo — datos en tiempo real desde Febecos</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, background: 'transparent', border: '1px solid #1e3248', borderRadius: 8, color: '#7a9ab5', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <div style={{ padding: '20px 22px' }}>
          {loading && <div style={{ textAlign: 'center', padding: 40, color: '#7a9ab5' }}>⏳ Cargando datos...</div>}
          {!loading && !data?.ok && <div style={{ color: '#f87171', textAlign: 'center', padding: 24 }}>No se pudo cargar el detalle.</div>}
          {!loading && data?.ok && (
            <>
              {/* Specs técnicas */}
              <div style={{ background: '#132233', borderRadius: 10, padding: '16px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7a9ab5', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 12 }}>Especificaciones técnicas</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
                  {[
                    ['Marca', data.bomba.marca],
                    ['Tipo', data.bomba.tipo],
                    ['Energía', data.bomba.energia],
                    ['Impulsor', data.bomba.impulsor],
                    ['Potencia bomba', `${data.bomba.watts}W`],
                    ['Voltaje', data.bomba.voltaje],
                    ['Diámetro bomba', `${data.bomba.diam_bomba}"`],
                    ['Diám. perforación mín.', data.bomba.diam_perf],
                    ['Panel solar', panelDesc || `${data.bomba.cant_paneles} panel${data.bomba.cant_paneles > 1 ? 'es' : ''}`],
                    ['Stock disponible', data.bomba.stock > 0 ? `✅ ${data.bomba.stock} unidades` : '❌ Sin stock'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 10, color: '#3a5a7a', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 2 }}>{k}</div>
                      <div style={{ fontSize: 13, color: '#e8f0f8', fontWeight: 600 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Precio */}
              {precio && (
                <div style={{ background: '#132233', borderRadius: 10, padding: '16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7a9ab5', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 8 }}>
                    {mostrarPublico ? 'Precio público' : `Precio mayorista (${descuento}% OFF)`}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#4ade80' }}>{fmt(precio)}</div>
                </div>
              )}

              {/* Curvas de rendimiento */}
              {data.curvas?.length > 0 && (
                <div style={{ background: '#132233', borderRadius: 10, padding: '16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7a9ab5', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 4 }}>
                    Rendimiento (L/día por altura)
                  </div>
                  {/* Subtítulo HSP */}
                  <div style={{ fontSize: 11, color: '#3a5a7a', marginBottom: 12 }}>
                    Calculado con horas solares pico: ☀️ Verano {HSP.verano}h · 📅 Promedio {HSP.promedio}h · ❄️ Invierno {HSP.invierno}h
                  </div>

                  {/* Gráfico SVG */}
                  <div style={{ marginBottom: 16, background: '#0d1a2a', borderRadius: 8, padding: '8px 4px' }}>
                    <CurvaGrafico curvas={data.curvas} />
                  </div>

                  {/* Tabla */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #1e3248' }}>
                          <th style={{ padding: '6px 10px', textAlign: 'right', color: '#3a5a7a', fontWeight: 600 }}>Altura (m)</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right', color: '#4ade80', fontWeight: 600 }}>☀️ Verano ({HSP.verano}h)</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right', color: '#e8f0f8', fontWeight: 600 }}>📅 Promedio ({HSP.promedio}h)</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right', color: '#60a5fa', fontWeight: 600 }}>❄️ Invierno ({HSP.invierno}h)</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right', color: '#7a9ab5', fontWeight: 600 }}>L/hora</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.curvas.map((c: any) => (
                          <tr key={c.altura_m} style={{ borderBottom: '1px solid #162030' }}>
                            <td style={{ padding: '6px 10px', textAlign: 'right', color: '#e8681a', fontWeight: 700, fontFamily: 'monospace' }}>{c.altura_m}m</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', color: '#4ade80', fontFamily: 'monospace' }}>{c.litros_verano.toLocaleString('es-AR')}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', color: '#e8f0f8', fontFamily: 'monospace' }}>{c.litros_promedio.toLocaleString('es-AR')}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', color: '#60a5fa', fontFamily: 'monospace' }}>{c.litros_invierno.toLocaleString('es-AR')}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', color: '#7a9ab5', fontFamily: 'monospace' }}>{c.litros_hora.toLocaleString('es-AR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Kit completo */}
              {data.kit?.length > 0 && (
                <div style={{ background: '#132233', borderRadius: 10, padding: '16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7a9ab5', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 12 }}>Kit completo incluido</div>
                  {Object.entries(familias).map(([familia, items]) => (
                    <div key={familia} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: '#3a5a7a', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                        {nombreFamilia[familia] || familia}
                      </div>
                      {items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #162030' }}>
                          <div>
                            <span style={{ fontSize: 13, color: '#e8f0f8' }}>{item.nombre}</span>
                            {item.potencia_w && <span style={{ fontSize: 11, color: '#4ade80', marginLeft: 8 }}>{item.potencia_w}W</span>}
                            {item.notas && <span style={{ fontSize: 11, color: '#3a5a7a', marginLeft: 8 }}>({item.notas})</span>}
                          </div>
                          <span style={{ fontSize: 12, color: '#7a9ab5', fontFamily: 'monospace', fontWeight: 600 }}>×{item.cantidad}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Portal() {
  const [token, setToken] = useState<string | null>(null)
  const [rev, setRev] = useState<Revendedor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [altura, setAltura] = useState('')
  const [litros, setLitros] = useState('')
  const [diametro, setDiametro] = useState('3')
  const [buscando, setBuscando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoBomba | null>(null)
  const [errCalc, setErrCalc] = useState<string | null>(null)
  const [mostrarPublico, setMostrarPublico] = useState(false)
  const [vieneDeMCA, setVieneDeMCA] = useState(false)
  const [catalogo, setCatalogo] = useState<BombaCatalogo[]>([])
  const [verCatalogo, setVerCatalogo] = useState(false)
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false)
  const [filtroStock, setFiltroStock] = useState<'todos'|'local'|'deposito'>('todos')
  const [mostrarCalculadora, setMostrarCalculadora] = useState(false)
  const [modalCodigo, setModalCodigo] = useState<string | null>(null)

  async function buscarBombaConParams(h: string, l: string, d: string) {
    setBuscando(true); setResultado(null); setErrCalc(null)
    try {
      const res = await fetch(`${API_BOMBAS}?height=${h}&liters=${l}&diameter=${d}&season=verano`)
      const data = await res.json()
      if (data.ok) setResultado(data)
      else setErrCalc(data.error || 'No se encontró bomba')
    } catch { setErrCalc('Error de red al buscar bomba.') }
    finally { setBuscando(false) }
  }

  async function cargarCatalogo() {
    if (catalogo.length > 0) { setVerCatalogo(true); return }
    setCargandoCatalogo(true)
    try {
      const res = await fetch(`${API_BOMBAS}?catalog=1`)
      const data = await res.json()
      if (data.ok) setCatalogo(data.catalog || [])
    } catch {}
    finally { setCargandoCatalogo(false) }
    setVerCatalogo(true)
  }

  async function verificarToken(t: string) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/solicitudes_revendedor?token_acceso=eq.${t}&token_acceso_activo=eq.true&select=id,nombre,apellido,empresa,provincia,descuento_pct,token_acceso,tipo_usuario`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      )
      const data = await res.json()
      if (!data || data.length === 0) { setError('token_invalido'); return }
      setRev(data[0])
    } catch { setError('error_red') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token') || localStorage.getItem('febecos-token')
    if (!t) { setError('no_token'); setLoading(false); return }
    // Si vino por URL, guardarlo para próximas veces
    if (params.get('token')) localStorage.setItem('febecos-token', params.get('token')!)
    setToken(t)
    const h = params.get('height'), l = params.get('liters'), d = params.get('diameter'), auto = params.get('auto')
    if (h) setAltura(h); if (l) setLitros(l); if (d) setDiametro(d)
    if (auto === '1') setVieneDeMCA(true)
    verificarToken(t).then(() => {
      if (auto === '1' && h && l && d) setTimeout(() => buscarBombaConParams(h, l, d), 600)
    }).catch(() => {})
  }, [])

  function usarMCA(mca: number, litros: number, diam: string) {
    setAltura(String(mca))
    setLitros(String(litros))
    setDiametro(diam)
    setMostrarCalculadora(false)
    // Scroll a la calculadora de búsqueda
    setTimeout(() => {
      document.getElementById('buscar-bomba-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  async function buscarBomba() {
    if (!altura || !litros) { setErrCalc('Completá altura y litros.'); return }
    await buscarBombaConParams(altura, litros, diametro)
  }

  function precioMostrar(precio: number) {
    if (!rev) return precio
    return mostrarPublico ? precio : precioMayorista(precio, rev.descuento_pct)
  }

  if (loading) return <Pantalla emoji="⏳" titulo="Verificando acceso..." sub="" />
  if (error === 'no_token') return <Pantalla emoji="🔒" titulo="Acceso restringido" sub="Este portal requiere un link de acceso personalizado." cta={{ label: 'Registrarme', href: 'https://revendedores-six.vercel.app' }} cta2={{ label: 'WhatsApp', href: 'https://wa.me/5491125750323' }} />
  if (error === 'token_invalido') return <Pantalla emoji="❌" titulo="Link inválido o desactivado" sub="Este link no es válido o fue desactivado." cta={{ label: 'Escribinos por WhatsApp', href: 'https://wa.me/5491125750323' }} />
  if (error || !rev) return <Pantalla emoji="⚠️" titulo="Error de conexión" sub="No pudimos verificar tu acceso. Intentá recargar." />

  const catalogoFiltrado = filtroStock === 'local'
    ? catalogo.filter(b => (b.stock || 0) > 0)
    : filtroStock === 'deposito'
    ? catalogo.filter(b => (b.stock || 0) === 0)
    : catalogo

  return (
    <div style={s.wrap}>
      {modalCodigo && (
        <ModalDetalle
          codigo={modalCodigo}
          descuento={rev.descuento_pct}
          mostrarPublico={mostrarPublico}
          onClose={() => setModalCodigo(null)}
        />
      )}

      <div style={s.header}>
        <div style={s.headerInner}>
          <div>
            <img src="https://dcdn-us.mitiendanube.com/stores/007/467/093/themes/common/logo-6209403414584676726-1775575296-91ab6514e309ebf33862eadc64bcbe161775575296-480-0.webp" alt="Febecos" style={{ height: 32, objectFit: 'contain' as const }} />
            <div style={s.headerSub}>Portal de Revendedores</div>
          </div>
          <div style={s.headerRight}>
            <div style={s.revendedorBadge}>
              <span style={{ fontSize: 18 }}>👤</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{rev.nombre} {rev.apellido}</div>
                <div style={{ fontSize: 11, color: '#7a9ab5' }}>{rev.empresa || rev.provincia}</div>
              </div>
            </div>
            <div style={s.descuentoBadge}>{rev.descuento_pct}% OFF</div>
            <button onClick={() => { localStorage.removeItem('febecos-token'); window.location.href = 'https://revendedores-six.vercel.app' }} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #1e3248', borderRadius: 8, color: '#7a9ab5', fontSize: 12, cursor: 'pointer' }}>
              Salir
            </button>
          </div>
        </div>
      </div>

      <div style={s.content}>

        {/* CALCULADORA MCA INTEGRADA */}
        <div style={{ ...s.card, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#e8f0f8' }}>🔢 Calculadora MCA</div>
              <div style={{ fontSize: 12, color: '#7a9ab5', marginTop: 2 }}>Calculá la altura manométrica total de la instalación</div>
            </div>
            <button
              onClick={() => setMostrarCalculadora(!mostrarCalculadora)}
              style={{ padding: '7px 14px', background: mostrarCalculadora ? '#1e3248' : 'rgba(96,165,250,0.12)', border: `1px solid ${mostrarCalculadora ? '#2a4a6a' : '#60a5fa'}`, borderRadius: 8, color: mostrarCalculadora ? '#7a9ab5' : '#60a5fa', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              {mostrarCalculadora ? '▲ Cerrar' : '▼ Abrir calculadora'}
            </button>
          </div>
          {mostrarCalculadora && (
            <div style={{ marginTop: 14 }}>
              <CalculadoraMCA onUsarMCA={usarMCA} token={token} revendedor={`${rev.nombre} ${rev.apellido}`} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap' as const, gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#7a9ab5' }}>Ver precios:</span>
            <div style={s.toggleBtns}>
              <button onClick={() => setMostrarPublico(false)} style={{ ...s.toggleBtn, ...(mostrarPublico ? {} : s.toggleBtnActive) }}>Mayorista ({rev.descuento_pct}% OFF)</button>
              <button onClick={() => setMostrarPublico(true)} style={{ ...s.toggleBtn, ...(mostrarPublico ? s.toggleBtnActive : {}) }}>Precio público</button>
            </div>
          </div>
          <button
            onClick={() => verCatalogo ? setVerCatalogo(false) : cargarCatalogo()}
            style={{
              padding: '7px 16px', background: verCatalogo ? '#1e3248' : 'rgba(232,104,26,0.12)',
              border: `1px solid ${verCatalogo ? '#2a4a6a' : '#e8681a'}`,
              borderRadius: 8, color: verCatalogo ? '#7a9ab5' : '#e8681a',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const,
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            {cargandoCatalogo ? '⏳ Cargando...' : verCatalogo ? '✕ Ocultar catálogo' : '📋 Ver catálogo de bombas'}
          </button>
        </div>

        {/* CALCULADORA */}
        <div style={s.card} id="buscar-bomba-section">
          <div style={s.cardTitle}>🔍 Buscar bomba para tu cliente</div>
          <div style={s.calcGrid}>
            <div style={s.campo}>
              <label style={s.label}>Altura total (MCA)</label>
              <input style={s.input} type="number" placeholder="Ej: 45" value={altura} onChange={e => setAltura(e.target.value)} />
              <span style={s.hint}>Profundidad + almacenamiento + fricción</span>
            </div>
            <div style={s.campo}>
              <label style={s.label}>Litros/día necesarios</label>
              <input style={s.input} type="number" placeholder="Ej: 5000" value={litros} onChange={e => setLitros(e.target.value)} />
            </div>
            <div style={s.campo}>
              <label style={s.label}>Bomba que entra (diámetro)</label>
              <select style={s.input} value={diametro} onChange={e => setDiametro(e.target.value)}>
                <option value="2">2" — perforación 63mm o más</option>
                <option value="3">3" — perforación 80mm o más</option>
                <option value="4">4" — perforación 110mm o más</option>
                <option value="6">6" — perforación 160mm o más</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button style={{ ...s.btnBuscar, opacity: buscando ? 0.7 : 1 }} onClick={buscarBomba} disabled={buscando}>
                {buscando ? 'Buscando...' : '🔍 Buscar bomba'}
              </button>
            </div>
          </div>
          {errCalc && <p style={s.errorTxt}>{errCalc}</p>}
        </div>

        {/* RESULTADO BÚSQUEDA */}
        {resultado && (
          <div style={{ textAlign: 'right' as const, marginTop: -8, marginBottom: 8 }}>
            <button onClick={() => { setResultado(null); setAltura(''); setLitros(''); setErrCalc(null); document.getElementById('buscar-bomba-section')?.scrollIntoView({ behavior:'smooth', block:'start' }) }} style={{ padding:'7px 14px', background:'transparent', border:'1px solid #1e3248', borderRadius:8, color:'#7a9ab5', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              🔄 Volver a calcular
            </button>
          </div>
        )}
        {/* RESULTADO BÚSQUEDA */}
        {resultado && (
          <div style={s.card}>
            <div style={s.cardTitle}>{resultado.es_fallback ? '⚠️ Opción más cercana' : '✅ Bomba recomendada'}</div>
            <BombaCard bomba={resultado.sugerencia} caudal={resultado.caudal_a_altura} nota={resultado.nota} descuento={rev.descuento_pct} mostrarPublico={mostrarPublico} precioMostrar={precioMostrar} wa={rev} litros={Number(litros)} altura={Number(altura)} onVerDetalle={setModalCodigo} />
            {resultado.opciones && resultado.opciones.length > 1 && (
              <>
                <div style={{ ...s.cardTitle, marginTop: 20, fontSize: 12 }}>Otras opciones válidas</div>
                {resultado.opciones.slice(1).map((b: any, i: number) => (
                  <BombaCard key={i} bomba={b} caudal={{ verano: b.caudal_verano, invierno: b.caudal_invierno, promedio: b.caudal_promedio || Math.round((b.caudal_verano + b.caudal_invierno) / 2) }} descuento={rev.descuento_pct} mostrarPublico={mostrarPublico} precioMostrar={precioMostrar} wa={rev} litros={Number(litros)} altura={Number(altura)} compact onVerDetalle={setModalCodigo} />
                ))}
              </>
            )}
          </div>
        )}

        {/* CATÁLOGO */}
        {verCatalogo && catalogo.length > 0 && (
          <div style={s.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ ...s.cardTitle, marginBottom: 0 }}>🔋 Catálogo de bombas</div>
              <div style={s.toggleBtns}>
                <button onClick={() => setFiltroStock('todos')} style={{ ...s.toggleBtn, ...(filtroStock==='todos' ? s.toggleBtnActive : {}) }}>Todos ({catalogo.length})</button>
                <button onClick={() => setFiltroStock('local')} style={{ ...s.toggleBtn, ...(filtroStock==='local' ? s.toggleBtnActive : {}), color: filtroStock==='local' ? '#e8f0f8' : '#22c55e' }}>✅ En local — 72hs ({catalogo.filter(b=>(b.stock||0)>0).length})</button>
                <button onClick={() => setFiltroStock('deposito')} style={{ ...s.toggleBtn, ...(filtroStock==='deposito' ? s.toggleBtnActive : {}), color: filtroStock==='deposito' ? '#e8f0f8' : '#fb923c' }}>📦 A verificar ({catalogo.filter(b=>(b.stock||0)===0).length})</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
              {catalogoFiltrado.map((b) => {
                const conStock = (b.stock || 0) > 0
                const precio = b.precio_full ? (mostrarPublico ? b.precio_full : precioMayorista(b.precio_full, rev.descuento_pct)) : null
                const msg = encodeURIComponent(`Hola Febecos! Soy revendedor (${rev.nombre} ${rev.apellido || ''}).\nConsulto disponibilidad de *${b.codigo}*${precio ? ` — precio mayorista: ${fmt(precio)}` : ''}.`)
                return (
                  <div key={b.codigo} style={{ ...s.bombaCard, padding: '14px 16px', opacity: conStock ? 1 : 0.65, borderColor: conStock ? '#1e3248' : '#162030' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: conStock ? '#e8681a' : '#7a9ab5', marginBottom: 6 }}>{b.codigo}</div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#7a9ab5', flexWrap: 'wrap' as const, marginBottom: 10 }}>
                      <span>{b.watts}W</span><span>·</span>
                      <span>{b.cant_paneles} panel{b.cant_paneles > 1 ? 'es' : ''}</span><span>·</span>
                      <span>Bomba {b.diam_bomba}"</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        {precio ? (
                          <>
                            <div style={{ fontSize: 15, fontWeight: 800, color: conStock ? '#4ade80' : '#7a9ab5' }}>{fmt(precio)}</div>
                            {!mostrarPublico && b.precio_full && <div style={{ fontSize: 10, color: '#3a5a7a' }}>Público: {fmt(b.precio_full)}</div>}
                          </>
                        ) : <div style={{ fontSize: 12, color: '#3a5a7a' }}>Precio a confirmar</div>}
                        <div style={{ fontSize: 11, fontWeight: 600, color: conStock ? '#22c55e' : '#fb923c', marginTop: 4 }}>
                          {conStock ? `✅ En local · Stock: ${b.stock} · Entrega 72hs` : '📦 A verificar en depósito'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                        <button onClick={() => setModalCodigo(b.codigo)} style={{ padding: '6px 10px', background: '#1e3248', border: '1px solid #2a4a6a', borderRadius: 7, color: '#e8f0f8', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                          Ver detalle →
                        </button>
                        <a href={`https://wa.me/5491125750323?text=${msg}`} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 10px', background: '#25d366', color: '#fff', borderRadius: 7, textDecoration: 'none', fontWeight: 700, fontSize: 11, textAlign: 'center' as const, whiteSpace: 'nowrap' as const }}>
                          Consultar →
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* INFO CARDS */}
        <div style={s.infoGrid}>
          <div style={s.infoCard}><div style={s.infoEmoji}>💰</div><div style={s.infoTitulo}>Tu descuento</div><div style={s.infoVal}>{rev.descuento_pct}%</div><div style={s.infoSub}>sobre precio de lista en todos los equipos</div></div>
          <div style={s.infoCard}><div style={s.infoEmoji}>🔢</div><div style={s.infoTitulo}>Calculadora MCA</div><div style={s.infoSub}><a href={`https://revendedores-six.vercel.app/calculadora.html?token=${token}`} style={{ color: '#e8681a', fontWeight: 700 }} target="_blank" rel="noopener noreferrer">Abrir calculadora →</a></div></div>
          <div style={s.infoCard}><div style={s.infoEmoji}>🤝</div><div style={s.infoTitulo}>Soporte técnico</div><div style={s.infoSub}><a href="https://wa.me/5491125750323" style={{ color: '#e8681a', fontWeight: 700 }}>WhatsApp directo →</a></div></div>
          <div style={s.infoCard}><div style={s.infoEmoji}>📦</div><div style={s.infoTitulo}>Stock en tiempo real</div><div style={s.infoSub}>Precios y disponibilidad actualizados automáticamente</div></div>
        </div>

      </div>
    </div>
  )
}

function BombaCard({ bomba, caudal, nota, descuento, mostrarPublico, precioMostrar, wa, litros, altura, compact = false, onVerDetalle }: any) {
  const [mostrarROI, setMostrarROI] = useState(false)
  const [provincia, setProvincia] = useState('')
  const [sistemaActual, setSistemaActual] = useState('')
  const precio = precioMostrar(bomba.precio_full)
  const precioPublico = bomba.precio_full
  const msg = encodeURIComponent(
    `Hola Febecos! Soy revendedor (${wa.nombre} ${wa.apellido || ''}, ${wa.empresa || wa.provincia}).\n` +
    `Consulto por bomba *${bomba.codigo}* para cliente con ${litros} L/día a ${altura}m.\n` +
    `Precio mayorista: ${fmt(precioMayorista(precioPublico, descuento))}`
  )

  const PROVINCIAS = ['Buenos Aires','CABA','Catamarca','Chaco','Chubut','Córdoba','Corrientes','Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones','Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán']
  const SISTEMAS = [
    { val: 'generator', label: '⚡ Generador solo' },
    { val: 'mill-generator', label: '⚡🌀 Generador + Molino' },
    { val: 'molino_existente', label: '🌀 Molino solo' },
    { val: 'sin_sistema', label: '🚰 Sin sistema actual' },
  ]

  function roiUrl() {
    const params = new URLSearchParams({
      pump_codigo: bomba.codigo,
      height: String(altura),
      liters: String(litros),
      from: 'revendedor',
    })
    if (provincia) params.set('zone', provincia)
    if (sistemaActual) params.set('agua_hoy', sistemaActual)
    return `https://simulador-roi-seven.vercel.app?${params.toString()}`
  }

  return (
    <div style={{ ...s.bombaCard, padding: compact ? '12px 16px' : '20px' }}>
      <div style={s.bombaCodigo}>{bomba.codigo}</div>
      <div style={s.bombaDetails}>
        <span>{bomba.watts}W</span><span>·</span>
        <span>{bomba.cant_paneles} panel{bomba.cant_paneles > 1 ? 'es' : ''}</span><span>·</span>
        <span>Bomba {bomba.diam_bomba || bomba.diam_perf || '—'}"</span><span>·</span>
        <span style={{ color: bomba.stock > 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
          {bomba.stock > 0 ? `Stock: ${bomba.stock}` : 'Sin stock'}
        </span>
      </div>
      {caudal && (
        <div style={s.caudalRow}>
          <div style={s.caudalItem}><span style={s.caudalLbl}>Verano</span><span style={s.caudalVal}>{(caudal.verano || 0).toLocaleString('es-AR')} L/día</span></div>
          <div style={s.caudalItem}><span style={s.caudalLbl}>Promedio</span><span style={s.caudalVal}>{(caudal.promedio || 0).toLocaleString('es-AR')} L/día</span></div>
          <div style={s.caudalItem}><span style={s.caudalLbl}>Invierno</span><span style={s.caudalVal}>{(caudal.invierno || 0).toLocaleString('es-AR')} L/día</span></div>
        </div>
      )}
      <div style={s.precioRow}>
        <div>
          <div style={s.precioLabel}>{mostrarPublico ? 'Precio público' : `Precio mayorista (${descuento}% OFF)`}</div>
          <div style={s.precioVal}>{fmt(precio)}</div>
          {!mostrarPublico && (
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 11, color: '#7a9ab5' }}>Precio público: {fmt(precioPublico)}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#4ade80', marginTop: 3 }}>
                {wa?.tipo_usuario === 'interno' ? '💼 Tu comisión:' : '💰 Tu ganancia:'} {fmt(precioPublico - precio)}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, alignItems: 'flex-end' }}>
          <button onClick={() => onVerDetalle(bomba.codigo)} style={{ padding: '8px 14px', background: '#1e3248', border: '1px solid #2a4a6a', borderRadius: 8, color: '#e8f0f8', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
            Ver detalle del equipo →
          </button>
          <a href={`https://wa.me/5491125750323?text=${msg}`} target="_blank" rel="noopener noreferrer" style={{ ...s.btnWA, display:'flex', alignItems:'center', gap:6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Consultar por WhatsApp
          </a>
        </div>
      </div>
      {nota && !compact && <div style={s.notaTxt}>{nota}</div>}

      {/* PANEL ROI */}
      {!compact && (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => setMostrarROI(!mostrarROI)}
            style={{ width:'100%', padding:'10px 16px', background: mostrarROI ? '#1e3248' : 'rgba(232,104,26,0.1)', border:`1px solid ${mostrarROI?'#2a4a6a':'#e8681a'}`, borderRadius:8, color: mostrarROI?'#7a9ab5':'#e8681a', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
          >
            {mostrarROI ? '▲ Cerrar' : '⏱ ¿En cuánto recupera la inversión?'}
          </button>

          {mostrarROI && (
            <div style={{ background:'#0d1a2a', border:'1px solid #1e3248', borderRadius:8, padding:16, marginTop:8 }}>
              <div style={{ fontSize:12, color:'#7a9ab5', marginBottom:12 }}>
                Completá estos datos para calcular en cuánto tiempo recupera la inversión tu cliente.
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                <div style={{ display:'flex', flexDirection:'column' as const, gap:4 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:'#7a9ab5' }}>Provincia del cliente</label>
                  <select
                    style={{ padding:'8px 10px', background:'#132233', border:'1px solid #1e3248', borderRadius:8, color:'#e8f0f8', fontSize:13, fontFamily:'inherit', width:'100%' }}
                    value={provincia} onChange={e=>setProvincia(e.target.value)}
                  >
                    <option value="">Seleccioná provincia...</option>
                    {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div style={{ display:'flex', flexDirection:'column' as const, gap:4 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:'#7a9ab5' }}>¿Qué usa hoy el cliente?</label>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:4 }}>
                    {SISTEMAS.map(s => (
                      <button key={s.val} onClick={() => setSistemaActual(s.val)} style={{ padding:'7px 10px', border:`1px solid ${sistemaActual===s.val?'#e8681a':'#1e3248'}`, borderRadius:7, background: sistemaActual===s.val?'rgba(232,104,26,0.12)':'#132233', color: sistemaActual===s.val?'#e8681a':'#7a9ab5', fontSize:12, fontWeight:600, cursor:'pointer', textAlign:'left' as const }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <a
                href={roiUrl()}
                target="_blank" rel="noopener noreferrer"
                style={{ display:'block', width:'100%', padding:'12px', background: provincia && sistemaActual ? '#e8681a' : '#1e3248', color: provincia && sistemaActual ? '#fff' : '#3a5a7a', borderRadius:8, textAlign:'center' as const, fontWeight:700, fontSize:14, textDecoration:'none', pointerEvents: provincia && sistemaActual ? 'auto' : 'none' as any }}
              >
                {provincia && sistemaActual ? '⏱ Ver en cuánto recupera la inversión →' : 'Completá provincia y sistema para continuar'}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Pantalla({ emoji, titulo, sub, cta, cta2 }: any) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1a2a', padding: 24 }}>
      <div style={{ background: '#132233', border: '1px solid #1e3248', borderRadius: 16, padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>{emoji}</div>
        <h2 style={{ color: '#e8f0f8', marginBottom: 12, fontSize: 20 }}>{titulo}</h2>
        <p style={{ color: '#7a9ab5', lineHeight: 1.7, marginBottom: 24 }}>{sub}</p>
        {cta && <a href={cta.href} style={{ display: 'inline-block', padding: '12px 24px', background: '#e8681a', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700, marginRight: 8 }}>{cta.label}</a>}
        {cta2 && <a href={cta2.href} style={{ display: 'inline-block', padding: '12px 24px', background: '#25d366', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>{cta2.label}</a>}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { minHeight: '100vh', background: '#0d1a2a', color: '#e8f0f8', fontFamily: "'DM Sans', sans-serif" },
  header: { background: '#0a1520', borderBottom: '1px solid #1e3248', padding: '0 24px' },
  headerInner: { maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' },
  headerSub: { fontSize: 11, color: '#7a9ab5', marginTop: 2 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  revendedorBadge: { display: 'flex', alignItems: 'center', gap: 8, background: '#132233', border: '1px solid #1e3248', borderRadius: 8, padding: '8px 12px' },
  descuentoBadge: { background: '#e8681a', color: '#fff', borderRadius: 8, padding: '6px 12px', fontWeight: 800, fontSize: 13 },
  content: { maxWidth: 900, margin: '0 auto', padding: '24px' },
  bannerMCA: { background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const },
  btnMCA: { padding: '8px 16px', background: '#60a5fa', color: '#0d1a2a', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' as const },
  toggleWrap: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  toggleBtns: { display: 'flex', gap: 4, background: '#132233', borderRadius: 8, padding: 4, border: '1px solid #1e3248' },
  toggleBtn: { padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: 'transparent', color: '#7a9ab5', transition: 'all 0.15s' },
  toggleBtnActive: { background: '#1e3248', color: '#e8f0f8' },
  card: { background: '#132233', border: '1px solid #1e3248', borderRadius: 12, padding: '20px 24px', marginBottom: 16 },
  cardTitle: { fontSize: 13, fontWeight: 700, color: '#7a9ab5', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 16 },
  calcGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 },
  campo: { display: 'flex', flexDirection: 'column' as const, gap: 4 },
  label: { fontSize: 12, fontWeight: 600, color: '#7a9ab5' },
  input: { padding: '10px 12px', background: '#0d1a2a', border: '1px solid #1e3248', borderRadius: 8, color: '#e8f0f8', fontSize: 14, fontFamily: 'inherit' },
  hint: { fontSize: 11, color: '#3a5a7a' },
  btnBuscar: { width: '100%', padding: '11px 16px', background: '#e8681a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  errorTxt: { color: '#f87171', fontSize: 13, marginTop: 12 },
  bombaCard: { background: '#0d1a2a', border: '1px solid #1e3248', borderRadius: 10, marginBottom: 10 },
  bombaCodigo: { fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#e8681a', marginBottom: 6 },
  bombaDetails: { display: 'flex', gap: 8, fontSize: 12, color: '#7a9ab5', flexWrap: 'wrap' as const, marginBottom: 12 },
  caudalRow: { display: 'flex', gap: 16, marginBottom: 16 },
  caudalItem: { display: 'flex', flexDirection: 'column' as const, gap: 2 },
  caudalLbl: { fontSize: 10, color: '#3a5a7a', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  caudalVal: { fontSize: 14, fontWeight: 600, color: '#e8f0f8' },
  precioRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' as const },
  precioLabel: { fontSize: 11, color: '#7a9ab5', marginBottom: 4 },
  precioVal: { fontSize: 24, fontWeight: 800, color: '#4ade80' },
  btnWA: { display: 'inline-block', padding: '8px 14px', background: '#25d366', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' as const },
  notaTxt: { fontSize: 12, color: '#7a9ab5', marginTop: 12, padding: '8px 12px', background: '#132233', borderRadius: 6 },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 8 },
  infoCard: { background: '#132233', border: '1px solid #1e3248', borderRadius: 10, padding: '16px 18px' },
  infoEmoji: { fontSize: 22, marginBottom: 8 },
  infoTitulo: { fontSize: 11, fontWeight: 700, color: '#7a9ab5', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 6 },
  infoVal: { fontSize: 28, fontWeight: 800, color: '#4ade80', marginBottom: 4 },
  infoSub: { fontSize: 12, color: '#3a5a7a', lineHeight: 1.5 },
}
