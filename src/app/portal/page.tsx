'use client'
import { useState, useEffect } from 'react'

// Supabase removido — todo va a Neon via API routes internas
const API_BOMBAS = 'https://roi.febecos.com/api/suggest-pump'
const API_DETALLE = 'https://roi.febecos.com/api/pump-detail'
declare global { interface Window { _ultimoCalcMcaId?: string } }
const FEBECOS_LOGO_B64 = 'data:image/webp;base64,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'

interface Revendedor {
  id: number; nombre: string; apellido: string; empresa: string
  provincia: string; descuento_pct: number; token_acceso: string
  tipo_usuario?: string; puede_pedir_online?: boolean; email?: string
  puede_cotizar_con_marca?: boolean; logo_base64?: string | null
  domicilio?: string | null; cuit?: string | null
  puede_ver_fv?: boolean
}
interface ResultadoBomba {
  sugerencia: any; caudal_a_altura: any; es_fallback: boolean; nota: string; opciones: any[]
}
interface BombaCatalogo {
  codigo: string; marca: string; watts: number; diam_bomba: string
  diam_perf: string; cant_paneles: number; stock: number; precio_full: number
  cuota_mensual: number | null; energia?: string | null
}

// Detecta bomba híbrida. Prioriza el campo `energia` (Solar/Hibrida, dato real
// del sheet); si no viene, cae al código — incluye -AC/DC (WEGA) que el regex
// viejo no agarraba y dejaba esas híbridas como "solar".
function esBombaHibrida(b: any): boolean {
  const e = String(b?.energia || '').toLowerCase()
  if (e.includes('hibrid') || e.includes('híbrid')) return true
  if (e === 'solar') return false
  return /A\/D|AC\/?DC|220v|hibrida|híbrida/i.test(String(b?.codigo || ''))
}

// Dominio NEUTRO para los links que ve el cliente final (oculta "revendedores").
// Configurable por env; default coti.febecos.com (apunta al mismo proyecto Vercel).
const PUBLIC_BASE = process.env.NEXT_PUBLIC_PUBLIC_URL || 'https://coti.febecos.com'

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

function ResultadoMCA({ altGeo, friccion, mca, tramos, litrosDia, diamPerf, onUsar, onReset, profundidad = 0, distSensor = 0, litrosHora = null }: any) {
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
      <button onClick={() => onUsar(mca, litrosDia, diamPerf, profundidad, distSensor, litrosHora)} style={{ width:'100%', padding:'12px', background:'#e8681a', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', marginBottom:8 }}>
        Usar esta MCA para buscar bomba →
      </button>
      <button onClick={onReset} style={{ width:'100%', padding:'10px', background:'transparent', border:'1px solid #1e3248', borderRadius:8, fontSize:13, fontWeight:600, color:'#7a9ab5', cursor:'pointer' }}>
        🔄 Calcular otro equipo
      </button>
    </div>
  )
}

function CalculadoraMCA({ onUsarMCA, token, revendedor }: { onUsarMCA: (mca: number, litros: number, diam: string, prof: number, distSensor: number, litrosHora?: number | null) => void; token: string | null; revendedor: string }) {
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
  // Conversión caudal a m³/h. SIEMPRE sobre las horas de sol de VERANO (5.5h),
  // que es el escenario de bombeo que usamos (no 8h genéricas).
  const HSP_VERANO = 5.5  // horas solares pico de verano (mismo valor que usan las curvas de rendimiento)
  const litrosDia = caudalModo==='animales' ? animales*60 : (caudalUnidad==='ldia' ? caudalVal : Math.round(caudalVal * HSP_VERANO))
  const caudalM3h = litrosDia/1000/HSP_VERANO
  const presionM = presionKg * 10

  function guardar(mca: number, friccion: number, tipo: string, tramosCalc: any[]) {
    try {
      const tramo = tramosCalc[0] || {}
      fetch('/api/calculos-mca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_instalacion: tipo,
          diametro: tramo.diam || null,
          material: tramo.mat || null,
          longitud_total_m: tramo.longT || null,
          caudal_m3h: caudalM3h,
          litros_dia: litrosDia || null,
          mca_total: mca,
          perdida_friccion_m: friccion,
          origen: 'portal_revendedor',
          revendedor_token: token || null,
          revendedor_nombre: revendedor || null,
        })
      }).then(r => r.json()).then(data => {
        if (data?.id) window._ultimoCalcMcaId = data.id
      }).catch(() => {})
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
    // distSensor = longitud de cañería de impulsión + altura de descarga (recorrido del cable de sensor)
    const distSensorSimple = Math.round(longImp + altDesc)
    setResSimple({ altGeo: altGeoSimple, friccion: fricTotal, mca, tramos: tramosCalc, profundidad: tipo === 'sumergible' ? nivDin : 0, distSensor: distSensorSimple })
    guardar(mca, fricTotal, tipo, tramosCalc)
  }

  function calcAvanzado() {
    const tramosCalc = tramos.map(t => {
      const ldia = (t.caudalModo||'litros')==='animales' ? (t.animales||50)*60 : (t.caudalUnidad==='lh' ? Math.round((t.caudalLdia||3000)*5.5) : (t.caudalLdia||3000))
      const q = ldia/1000/HSP_VERANO  // m³/h sobre 5.5h de sol verano (no 8h)
      const r = calcTramo(t.longitud, t.diam, q, t.mat, t.accs||{})
      return { nombre: t.nombre, diam: t.diam, mat: t.mat, ...r }
    })
    const fricTotal = parseFloat(tramosCalc.reduce((s,t)=>s+t.perdida,0).toFixed(2))
    // Altura geométrica = profundidad + alturaTanque del primer tramo
    const primerTramo = tramos[0] || {}
    const altGeoTotal = parseFloat(((primerTramo.profundidad||10) + (primerTramo.alturaTanque||2) + fricTotal + presionKgAv*10).toFixed(2))
    const mca = parseFloat((altGeoAv + fricTotal + presionKgAv*10).toFixed(2))
    const litTot = tramos[0]?.caudalLdia || 3000
    // distSensor = suma de longitudes de todos los tramos + altura del tanque del primer tramo
    const distSensorAv = Math.round(tramos.reduce((s, t) => s + (t.longitud || 0), 0) + (primerTramo.alturaTanque || 2))
    setResAv({ altGeo: altGeoAv, friccion: fricTotal, mca, tramos: tramosCalc, litrosDia: litTot, profundidad: tramos[0]?.profundidad || 0, distSensor: distSensorAv })
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
                <option value="2">63mm (≈2½")</option><option value="3">80-100mm (≈3")</option><option value="4">110mm (≈4¼")</option><option value="4">115mm (≈4½")</option><option value="4">120mm (≈4¾")</option><option value="6">160mm (6")</option>
              </select></div>
              <div style={fld}><label style={lbl}>Profundidad bomba (m)</label><input style={ci} type="number" value={nivDin} min={0} step={0.5} onChange={e=>setNivDin(Number(e.target.value))} /></div>
              <div style={fld}><label style={lbl}>Altura tanque (m)</label><input style={ci} type="number" value={altDesc} min={0} step={0.5} onChange={e=>setAltDesc(Number(e.target.value))} /></div>
            </>}
            {tipo==='superficial' && <>
              <div style={fld}><label style={lbl}>Diám. perforación</label><select style={ci} value={diamPerf} onChange={e=>setDiamPerf(e.target.value)}>
                <option value="2">63mm (≈2½")</option><option value="3">80-100mm (≈3")</option><option value="4">110mm (≈4¼")</option><option value="4">115mm (≈4½")</option><option value="4">120mm (≈4¾")</option><option value="6">160mm (6")</option>
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
                  <span style={{ fontSize:10, color:'#3a5a7a' }}>
                    {caudalUnidad === 'lh'
                      ? `= ${litrosDia.toLocaleString('es-AR')} L/día (${caudalVal.toLocaleString('es-AR')} L/h × ${HSP_VERANO}h sol verano)`
                      : `= ${caudalM3h.toFixed(3)} m³/h`}
                  </span>
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
          {resSimple && <ResultadoMCA {...resSimple} litrosDia={litrosDia} diamPerf={diamPerf} onUsar={onUsarMCA} onReset={() => setResSimple(null)} distSensor={resSimple.distSensor || 0} litrosHora={caudalUnidad === 'lh' ? caudalVal : null} />}
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
                    <option value="2">63mm (≈2½")</option><option value="3">80-100mm (≈3")</option><option value="4">110mm (≈4¼")</option><option value="4">115mm (≈4½")</option><option value="4">120mm (≈4¾")</option><option value="6">160mm (6")</option>
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
            <option value="2">63mm (≈2½")</option><option value="3">80-100mm (≈3")</option><option value="4">110mm (≈4¼")</option><option value="4">115mm (≈4½")</option><option value="4">120mm (≈4¾")</option><option value="6">160mm (6")</option>
          </select></div>

          <button onClick={calcAvanzado} style={{ width:'100%', padding:'11px', background:'#1a6b3c', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', marginTop:14 }}>
            Calcular instalación completa
          </button>
          {resAv && <ResultadoMCA {...resAv} diamPerf={diamPerf} onUsar={onUsarMCA} onReset={() => setResAv(null)} distSensor={resAv.distSensor || 0} />}
        </>
      )}
    </div>
  )
}


function ModalDetalle({ codigo, descuento, mostrarPublico, onClose, onPresupCreado, revendedor, revProvincia, revTipo, revToken, revEmail, revEmpresa, revDomicilio, revCuit, revLogo, profundidadInicial = 0, busquedaMCA = null, busquedaLitros = null, busquedaLitrosHora = null, busquedaDiametro = null, distSensorInicial = 0, clienteInicial = null }: any) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [nroPresup, setNroPresup] = useState<string | null>(null)
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [pdfHtml, setPdfHtml] = useState('')
  const [pdfNro, setPdfNro] = useState<string|null>(null)
  const [presupToken, setPresupToken] = useState<string|null>(null) // token aleatorio para el link público
  const [pdfToken, setPdfToken] = useState<string|null>(null)
  const [pdfPrecio, setPdfPrecio] = useState<number|null>(null)
  const [pdfCliente, setPdfCliente] = useState<{nombre:string;apellido:string;telefono:string;zona:string;razonSocial?:string;cuit?:string}|null>(null)
  const [profInput, setProfInput] = useState<number>(profundidadInicial)
  const [cableMetros, setCableMetros] = useState<number | null>(null) // override manual de metros de cable sumergible/soga
  // Distancia al sensor de nivel (desde el controlador hasta el tanque donde va el sensor)
  // Pre-llenado con el valor calculado por la MCA (longitud cañería + altura tanque)
  const [distanciaTablero, setDistanciaTablero] = useState<number | null>(distSensorInicial > 0 ? distSensorInicial : null)

  // ── Datos del cliente (solo cuando mostrarPublico=true) ───────────────────
  const [showClienteForm, setShowClienteForm] = useState(false)
  const [clienteNombre, setClienteNombre] = useState(clienteInicial?.nombre || '')
  const [clienteApellido, setClienteApellido] = useState(clienteInicial?.apellido || '')
  const [clienteTelefono, setClienteTelefono] = useState(clienteInicial?.telefono || '')
  const [clienteEmail, setClienteEmail] = useState(clienteInicial?.email || '')
  const [clienteZona, setClienteZona] = useState(clienteInicial?.zona || '')
  const [clienteRazonSocial, setClienteRazonSocial] = useState(clienteInicial?.razonSocial || '')
  const [clienteCuit, setClienteCuit] = useState(clienteInicial?.cuit || '')
  // ID del cliente del CRM cuando se eligió del buscador → relación EXACTA (sirve incluso
  // para "Consumidor Final" sin cuit/teléfono). Si se tipea a mano, queda null.
  const [clienteId, setClienteId] = useState<number | null>(clienteInicial?.id || null)
  const [clienteCuitLoading, setClienteCuitLoading] = useState(false)
  const [clienteReady, setClienteReady] = useState(!!(clienteInicial?.nombre || clienteInicial?.razonSocial))
  const [descuentoEfectivo, setDescuentoEfectivo] = useState<number>(descuento)
  // Aviso del guardado de cliente al CRM (demo sin token / token inactivo / rate-limit).
  // El presupuesto se genera igual; esto solo informa por qué no se guardó el cliente.
  const [avisoCliente, setAvisoCliente] = useState<{ tipo: 'demo' | 'inactivo' | 'rate'; txt: string } | null>(null)
  // Solo el vendedor interno de Febecos puede poner un descuento a mano. El
  // revendedor externo tiene su descuento FIJO: lo define la solapa
  // (Mayorista = su % asignado, Precio público = 0). No lo puede editar.
  const esVendInterno = revTipo === 'interno'
  useEffect(() => {
    // "Precio público" = SIN descuento, para TODOS (interno y externo).
    if (mostrarPublico) { setDescuentoEfectivo(0); return }
    // "Mayorista": arranca en el % del revendedor. El interno lo puede editar a
    // mano (el efecto no se re-dispara al tipear); el externo lo tiene fijo.
    setDescuentoEfectivo(descuento)
  }, [mostrarPublico, descuento, esVendInterno])
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [sugerenciasCliente, setSugerenciasCliente] = useState<any[]>([])
  const [buscandoCliente, setBuscandoCliente] = useState(false)
  const [sugerenciaIdx, setSugerenciaIdx] = useState(-1)

  async function buscarCuit(raw: string) {
    const cuit = raw.replace(/\D/g, '')
    if (cuit.length !== 11) return
    setClienteCuitLoading(true)
    try {
      // 1) CRM primero — SOLO vendedores internos (no exponer clientes de otros revendedores).
      if (esVendInterno) {
        try {
          const rc = await fetch(`/api/clientes-buscar?q=${cuit}`)
          if (rc.ok) {
            const dc = await rc.json()
            const m = (dc.clientes || []).find((c: any) => String(c.cuit || '').replace(/\D/g, '') === cuit)
            if (m) {
              const full = [m.nombre, m.apellido].filter(Boolean).join(' ')
              if (full && !clienteNombre) setClienteNombre(full)
              if (m.razon_social && !clienteRazonSocial) setClienteRazonSocial(m.razon_social)
              if (m.telefono && !clienteTelefono) setClienteTelefono(m.telefono)
              if (m.email && !clienteEmail) setClienteEmail(m.email)
              if (m.zona && !clienteZona) setClienteZona(m.zona)
              setClienteCuitLoading(false)
              return // encontrado en CRM, no consultar ARCA
            }
          }
        } catch { /* si falla el CRM, seguimos a ARCA */ }
      }
      // 2) ARCA (padrón) — vía /api/cuit-lookup (proxy al endpoint del selector que funciona).
      const r = await fetch(`/api/cuit-lookup?cuit=${cuit}`)
      if (r.ok) {
        const d = await r.json()
        if (d.denominacion && !clienteNombre) setClienteNombre(d.denominacion)
        if (d.razonSocial && !clienteRazonSocial) setClienteRazonSocial(d.razonSocial)
        if (d.provincia && !clienteZona) setClienteZona(d.provincia)
      }
    } catch { /* silencioso */ }
    setClienteCuitLoading(false)
  }

  async function buscarClienteDB(q: string) {
    if (q.length < 2) { setSugerenciasCliente([]); return }
    setBuscandoCliente(true)
    try {
      const r = await fetch(`/api/clientes-buscar?q=${encodeURIComponent(q)}`)
      if (r.ok) { const d = await r.json(); setSugerenciasCliente(d.clientes || []) }
    } catch { /* silencioso */ }
    setBuscandoCliente(false)
  }

  function seleccionarCliente(c: any) {
    // Campo único: fusiona nombre + apellido (si la fuente los trajera separados).
    setClienteNombre([c.nombre, c.apellido].filter(Boolean).join(' '))
    setClienteApellido('')
    setClienteTelefono(c.telefono || '')
    setClienteEmail(c.email || '')
    setClienteZona(c.zona || '')
    setClienteRazonSocial(c.razon_social || '')
    setClienteCuit(c.cuit || '')
    setClienteId(c.id || null)
    if (c.descuento != null && Number(c.descuento) > 0) setDescuentoEfectivo(Number(c.descuento))
    setBusquedaCliente('')
    setSugerenciasCliente([])
    setSugerenciaIdx(-1)
  }

  async function obtenerNroPresupuesto(): Promise<string> {
    try {
      // Incremento atómico — un solo POST, sin race conditions
      const res = await fetch('/api/presupuestos-counter', { method: 'POST' })
      const data = await res.json()
      if (data?.numero) return data.numero
      // fallback
      const anio = new Date().getFullYear()
      return `PREV-${anio}-XXXX`
    } catch {
      return `PREV-${new Date().getFullYear()}-XXXX`
    }
  }

  // Guarda el presupuesto en la base de datos en background (best-effort)
  function guardarPresupuestoDB(
    nro: string,
    precio: number | null,
    cdData: { nombre: string; apellido: string; telefono: string; zona: string; email?: string; razonSocial?: string; cuit?: string } | null,
    publicToken?: string | null
  ) {
    const precioPublico = data?.bomba?.precio_full || null
    const tieneCliente = !!(cdData?.nombre || cdData?.apellido || cdData?.telefono || cdData?.razonSocial)
    fetch('/api/presupuestos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero: nro,
        revendedor_token: revToken || null,
        revendedor_nombre: revendedor || null,
        revendedor_email: revEmail || null,
        bomba_codigo: codigo,
        bomba_descripcion: data?.bomba ? `${data.bomba.marca} ${data.bomba.watts}W` : null,
        bomba_watts: data?.bomba?.watts || null,
        bomba_marca: data?.bomba?.marca || null,
        litros_dia:       busquedaLitros || null,
        altura_m:         busquedaMCA    || null,
        longitud_total_m: (distanciaTablero != null && distanciaTablero > 0) ? distanciaTablero : null,
        profundidad_m:    profInput > 0 ? profInput : null,
        tipo_precio: descuentoEfectivo === 0 ? 'publico' : 'mayorista',
        precio_publico: precioPublico,
        precio_ofrecido: precio,
        descuento_pct: descuentoEfectivo > 0 ? descuentoEfectivo : null,
        cliente_nombre: tieneCliente ? cdData?.nombre : null,
        cliente_apellido: tieneCliente ? cdData?.apellido : null,
        cliente_telefono: tieneCliente ? cdData?.telefono : null,
        cliente_email: cdData?.email || null,
        cliente_zona: tieneCliente ? cdData?.zona : null,
        cliente_razon_social: cdData?.razonSocial || null,
        cliente_cuit: cdData?.cuit || null,
        cliente_id: (cdData as any)?.id ?? clienteId ?? null,
        public_token: publicToken || null,
      }),
    }).catch(() => { /* silencioso */ })

    // CRM: registrar cliente (fire & forget) — vía ruta SERVER-SIDE que tiene el
    // INTERNAL_SERVICE_SECRET (el navegador no puede mandarlo → daba 401).
    // Pasa la atribución del revendedor para marcar "cliente del revendedor".
    if (tieneCliente) {
      fetch('/api/registrar-cliente', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: cdData?.nombre || null,
          apellido: cdData?.apellido || null,
          email: cdData?.email || null,
          telefono: cdData?.telefono || null,
          cuit: cdData?.cuit || null,
          razonSocial: cdData?.razonSocial || null,
          zona: cdData?.zona || null,
          origen: 'presupuesto_bombas',
          bump: 'presupuesto',
          monto: precio || 0,
          // Atribución: quién generó el presupuesto
          rev_tipo: revTipo || 'revendedor',
          revendedor_token: revToken || null,
          revendedor_nombre: revendedor || null,
        }),
      })
        .then(async (res) => {
          if (res.ok) { setAvisoCliente(null); return } // 200: cliente guardado
          const d = await res.json().catch(() => ({} as any))
          if (res.status === 403 && d?.error === 'token requerido') {
            // Demo (no tiene token activo) → invitarlo a registrarse, no es un error.
            setAvisoCliente({ tipo: 'demo', txt: 'Para guardar tus clientes y llevar tu cartera, registrate como revendedor.' })
          } else if (res.status === 403) {
            // token inválido → cuenta desactivada/suspendida.
            setAvisoCliente({ tipo: 'inactivo', txt: 'Tu acceso está inactivo. Escribinos para reactivar tu cuenta y guardar clientes.' })
          } else if (res.status === 429) {
            setAvisoCliente({ tipo: 'rate', txt: 'Esperá un momento e intentá de nuevo.' })
          }
          // Otros errores: silencioso (el presupuesto ya se generó igual).
        })
        .catch(() => { /* el fallo del guardado NO frena la generación del presupuesto */ })
    }
  }

  // Actualiza cliente/precio en un presupuesto ya existente (no crea uno nuevo)
  function actualizarPresupuestoDB(
    publicToken: string,
    precio: number | null,
    desc: number,
    cdData: { nombre: string; apellido: string; telefono: string; zona: string; email?: string; razonSocial?: string; cuit?: string } | null
  ) {
    const precioPublico = data?.bomba?.precio_full || null
    fetch('/api/presupuestos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        public_token: publicToken,
        descuento_pct: desc > 0 ? desc : null,
        precio_ofrecido: precio,
        precio_publico: precioPublico,
        tipo_precio: desc === 0 ? 'publico' : 'mayorista',
        cliente_nombre: cdData?.nombre || null,
        cliente_apellido: cdData?.apellido || null,
        cliente_telefono: cdData?.telefono || null,
        cliente_email: cdData?.email || null,
        cliente_zona: cdData?.zona || null,
        cliente_razon_social: cdData?.razonSocial || null,
        cliente_cuit: cdData?.cuit || null,
        cliente_id: (cdData as any)?.id ?? clienteId ?? null,
      }),
    }).catch(() => {})
  }

  async function generarPDF(forceClienteData?: { nombre: string; apellido: string; telefono: string; zona: string; razonSocial?: string; cuit?: string }) {
    // Usar descuento del estado (puede haber sido modificado en el form)
    const descuento = descuentoEfectivo
    const mostrarPublico = descuento === 0

    // Si no tenemos datos del cliente, mostrar formulario (siempre, no solo precio público)
    if (!clienteReady && !forceClienteData && !presupToken) {
      setShowClienteForm(true)
      return
    }

    setShowClienteForm(false)
    setGenerandoPDF(true)
    let nro = nroPresup
    let tok = presupToken
    const esNuevo = !tok  // solo guardamos en DB la primera vez
    if (!nro) {
      nro = await obtenerNroPresupuesto()
      setNroPresup(nro)
    }
    if (!tok) {
      // token aleatorio no adivinable para el link público (seguridad)
      tok = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2, 12))
      setPresupToken(tok)
      onPresupCreado?.(codigo)
    }
    const precio = data?.bomba?.precio_full
      ? (mostrarPublico ? data.bomba.precio_full : precioMayorista(data.bomba.precio_full, descuento))
      : null
    const precioPDF = precio != null ? precio + extrasTotal : null

    // Datos del cliente a usar (pueden venir del form en esta llamada o del state)
    const cd = forceClienteData || (clienteReady ? { nombre: clienteNombre, apellido: clienteApellido, telefono: clienteTelefono, zona: clienteZona, razonSocial: clienteRazonSocial, cuit: clienteCuit } : null)
    const tieneCliente = !!(cd?.nombre || cd?.apellido || cd?.telefono)

    // Guardar en DB solo la primera vez (evita duplicados al re-generar el PDF)
    if (esNuevo) guardarPresupuestoDB(nro, precioPDF, cd, tok)
    else actualizarPresupuestoDB(tok, precioPDF, descuento, cd)
    const fecha = new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' })
    const HSP = { verano: 5.5, promedio: 4, invierno: 3.5 }

    // Orden y nombres del kit según especificación Febecos
    // Kit — usa nombres reales + notas del kit, ordenado por familia
    const FAM_ORDEN: Record<string, number> = { bomba:0, panel:1, soporte:2, caja:3, proteccion:3, cable:4, accesorio:5, otros:6, otro:6 }
    const esBombaItem = (n: string) => (n||'').toLowerCase().includes('bomba')
    const kitOrdenado: {nombre: string, notas: string, cantidad: number, unidad: string, _f: number}[] = []
    kitOrdenado.push({ nombre: `Bomba ${data?.bomba?.marca || ''} ${data?.bomba?.watts || ''}W — ${data?.bomba?.impulsor || 'centrifuga'}`, notas: '', cantidad: 1, unidad: 'unidad', _f: 0 })
    const tienePanelEnKit = (data?.kit || []).some((i: any) => (i.familia || '').toLowerCase() === 'panel')
    if (!tienePanelEnKit && data?.bomba?.cant_paneles) {
      const panelRef = (data?.kit || []).find((i: any) => (i.familia || '').toLowerCase() === 'panel')
      const potW = panelRef?.potencia_w || null
      kitOrdenado.push({ nombre: `Panel solar${potW ? ` ${potW}W` : ''}`, notas: 'Panel Solar Monocristalino', cantidad: data.bomba.cant_paneles, unidad: 'unidad', _f: 1 })
    }
    if (data?.kit) {
      for (const item of data.kit) {
        if (esBombaItem(item.nombre)) continue
        if (/\bmc4\b|ficha mc/i.test(item.nombre || '')) continue  // MC4 excluido: está dentro de la Caja IP65
        // Soga → familia cable para el PDF (FAM_ORDEN)
        const isSogaPdf = (item.nombre||'').toLowerCase().includes('soga') || (item.nombre||'').toLowerCase().includes('anti-uv')
        const familiaKey = isSogaPdf ? 'cable' : (item.familia || '').toLowerCase()
        const f = FAM_ORDEN[familiaKey] ?? 6
        // Cable sumergible y soga: mostrar metros totales del pozo (no solo la base del kit)
        const esCableLargo = item.unidad === 'metro' && (item.nombre||'').toLowerCase().includes('sumergible')
        const esSensorPdf  = item.unidad === 'metro' && (item.nombre||'').toLowerCase().includes('sensor')
        // Si fuera de rango → no incluir cable sensor (se cotiza aparte)
        if (sensorFueraRango && esSensorPdf) continue
        // Panel: usar cant_paneles del objeto bomba (la DB del kit a veces devuelve 1)
        const esPanel = (item.familia || '').toLowerCase() === 'panel'
        const cant = esPanel && data?.bomba?.cant_paneles
          ? data.bomba.cant_paneles
          : esPozosProfundo && (esCableLargo || isSogaPdf)
          ? Math.max(item.cantidad, metrosTotal)
          : !sensorFueraRango && esSensorPdf && distanciaTablero != null && distanciaTablero > item.cantidad
            ? distanciaTablero
            : item.cantidad
        // Detectar metros por unidad o por familia/nombre (fallback si unidad no está seteada en DB)
        const esMedidoEnMetros = item.unidad === 'metro' || ((esCableLargo || isSogaPdf || esSensorPdf) && cant > 5)
        kitOrdenado.push({ nombre: item.nombre + (item.potencia_w ? ` ${item.potencia_w}W` : ''), notas: item.notas || '', cantidad: cant, unidad: esMedidoEnMetros ? 'metro' : (item.unidad || 'unidad'), _f: f })
      }
    }
    kitOrdenado.sort((a, b) => a._f - b._f)
    const kitHtml2Col = kitOrdenado.map(it => `<tr>
      <td style="padding:4px 8px;font-size:11px">${it.nombre}${it.notas ? `<span style="color:#888;font-size:9.5px"> — ${it.notas}</span>` : ''}</td>
      <td style="text-align:center;padding:4px 8px;white-space:nowrap">${it.unidad === 'metro' ? `${it.cantidad} m` : `×${it.cantidad}`}</td></tr>`).join('')

    const curvasHtml = data?.curvas?.length > 0
      ? data.curvas.map((c: any) => `<tr><td>${c.altura_m}m</td><td>${c.litros_verano.toLocaleString('es-AR')}</td><td>${c.litros_promedio.toLocaleString('es-AR')}</td><td>${c.litros_invierno.toLocaleString('es-AR')}</td><td>${c.litros_hora.toLocaleString('es-AR')}</td></tr>`).join('')
      : ''

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Presupuesto ${nro}</title>
<style>
  body { font-family: Arial, sans-serif; color: #1a1a18; margin: 0; padding: 24px 32px; font-size: 12px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a6b3c; padding-bottom: 12px; margin-bottom: 16px; }
  .logo img { height: 40px; object-fit: contain; }
  .presup-num { text-align: right; }
  .presup-num h2 { font-size: 16px; margin: 0; color: #1a1a18; }
  .presup-num p { margin: 3px 0; color: #666; font-size: 11px; }
  .atendido { background: #f0f9f4; border: 1px solid #b8ddc8; border-radius: 6px; padding: 8px 14px; margin-bottom: 14px; font-size: 12px; color: #1a6b3c; }
  .cliente-box { background: #f0f9f4; border: 2px solid #1a6b3c; border-radius: 10px; padding: 14px 20px; margin-bottom: 16px; }
  .cliente-etiqueta { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #4a7a5a; font-weight: 700; margin-bottom: 6px; }
  .cliente-nombre { font-size: 22px; font-weight: 800; color: #1a1a18; margin-bottom: 5px; line-height: 1.2; }
  .cliente-detalle { font-size: 13px; color: #1a6b3c; font-weight: 600; }
  h3 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #666; border-bottom: 1px solid #e2e0d8; padding-bottom: 4px; margin: 14px 0 10px; }
  .specs-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 6px 16px; }
  .spec { display: flex; flex-direction: column; }
  .spec-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 1px; }
  .spec-val { font-size: 12px; font-weight: 600; }
  .precio-box { background: #f0f9f4; border: 2px solid #1a6b3c; border-radius: 8px; padding: 10px 16px; margin: 12px 0; display: flex; align-items: center; gap: 24px; }
  .precio-label { font-size: 10px; color: #666; margin-bottom: 2px; }
  .precio-val { font-size: 20px; font-weight: 800; color: #1a6b3c; }
  .stock-ok { color: #1a6b3c; font-weight: 700; }
  .stock-no { color: #c45c00; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #f7f6f2; padding: 5px 8px; text-align: left; font-size: 10px; color: #666; border-bottom: 1px solid #e2e0d8; }
  td { padding: 4px 8px; border-bottom: 1px solid #f0eeea; }
  .footer { margin-top: 20px; border-top: 1px solid #e2e0d8; padding-top: 10px; font-size: 10px; color: #888; text-align: center; }
  @media print { body { padding: 16px 24px; } @page { size: A4; margin: 12mm; } }
</style></head><body>
${revLogo ? `
<div class="header">
  <div class="logo">
    <img src="${revLogo}" style="height:42px;max-width:200px;object-fit:contain" alt="Logo"/>
    <div style="font-size:10px;color:#555;margin-top:3px">${revEmpresa || ''}${revCuit ? ` &nbsp;·&nbsp; CUIT ${revCuit}` : ''}${revDomicilio ? `<br>${revDomicilio}` : ''}</div>
  </div>
  <div class="presup-num">
    <h2>Presupuesto N° ${nro}</h2>
    <p>Fecha: ${fecha}</p>
    <p>⏱ Válido por 48 horas</p>
  </div>
</div>` : ''}
<div class="header" style="${revLogo ? 'display:none' : ''}">
  <div class="logo">
    <img src="data:image/webp;base64,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" alt="Febecos" style="height:38px;object-fit:contain" />
    <div style="font-size:10px;color:#666;margin-top:2px">Bombeo Solar — febecos.com</div>
  </div>
  <div class="presup-num">
    <h2>Presupuesto N° ${nro}</h2>
    <p>Fecha: ${fecha}</p>
    <p>⏱ Válido por 48 horas</p>
  </div>
</div>
${tieneCliente
      ? `<div class="cliente-box">
          ${cd?.razonSocial ? `<div class="cliente-nombre">${cd.razonSocial}</div>${(cd?.nombre||cd?.apellido) ? `<div class="cliente-detalle" style="margin-bottom:3px">Contacto: ${cd?.nombre||''} ${cd?.apellido||''}</div>` : ''}` : `<div class="cliente-nombre">Sr./Sra. ${cd?.nombre || ''} ${cd?.apellido || ''}</div>`}
          <div class="cliente-detalle">${cd?.cuit ? `🏢 CUIT ${cd.cuit}&nbsp;&nbsp;·&nbsp;&nbsp;` : ''}${cd?.telefono ? `📱 ${cd.telefono}` : ''}${cd?.zona ? `&nbsp;&nbsp;·&nbsp;&nbsp;📍 ${cd.zona}` : ''}</div>
        </div>`
      : ''
    }
<h3>Equipo de bombeo solar</h3>
<div class="specs-grid">
  <div class="spec"><span class="spec-label">Marca</span><span class="spec-val">${data?.bomba?.marca || '—'}</span></div>
  <div class="spec"><span class="spec-label">Tipo</span><span class="spec-val">${data?.bomba?.impulsor || '—'}</span></div>
  <div class="spec"><span class="spec-label">Potencia</span><span class="spec-val">${data?.bomba?.watts || '—'} W</span></div>
  <div class="spec"><span class="spec-label">Voltaje</span><span class="spec-val">${data?.bomba?.voltaje || '—'}</span></div>
  <div class="spec"><span class="spec-label">Paneles solares</span><span class="spec-val">${data?.bomba?.cant_paneles || '—'}</span></div>
  <div class="spec"><span class="spec-label">Diám. bomba</span><span class="spec-val">${data?.bomba?.diam_bomba || '—'}"</span></div>
  <div class="spec"><span class="spec-label">Diám. perf. mín.</span><span class="spec-val">${data?.bomba?.diam_perf || '—'}</span></div>
  <div class="spec"><span class="spec-label">Disponibilidad</span><span class="spec-val ${data?.bomba?.stock > 0 ? 'stock-ok' : 'stock-no'}">${data?.bomba?.stock > 0 ? `✅ ${data.bomba.stock} en stock` : '⚠ Sin stock'}</span></div>
</div>
${precioPDF ? `<div class="precio-box">
  <div>
    <div class="precio-label">${mostrarPublico ? 'Precio público' : `Precio especial (${descuento}% descuento)`}</div>
    <div class="precio-val">${fmt(precioPDF)}</div>
  </div>
  ${!mostrarPublico && precioListaTotal ? `<div style="font-size:11px;color:#666">Precio de lista: ${fmt(precioListaTotal)}</div>` : ''}
</div>
${(() => {
  // Mostrar desglose IVA cuando hay descuento aplicado O cliente con CUIT
  const mostrarDesglose = descuento > 0 || !!cd?.cuit
  if (!mostrarDesglose) return ''
  const factorPrecio = mostrarPublico ? 1 : (1 - descuento / 100)
  const panelPublico = (data?.kit || [])
    .filter((i: any) => (i.familia || '').toLowerCase() === 'panel')
    .reduce((s: number, i: any) => s + (i.precio_ars || 0) * (i.cantidad || 1), 0)
  const panelEnPrecio = panelPublico * factorPrecio
  const netoPanel = Math.round(panelEnPrecio / 1.105)
  const ivaPanel  = Math.round(netoPanel * 0.105)
  const netoResto = Math.round((precioPDF - panelEnPrecio) / 1.21)
  const ivaResto  = Math.round(netoResto * 0.21)
  const netoTotal = netoPanel + netoResto
  const ivaTotal  = ivaPanel + ivaResto
  return `<table style="width:100%;border-collapse:collapse;font-size:10px;color:#555;margin:-6px 0 10px;border:1px solid #dde8dd;border-radius:6px;overflow:hidden">
  <thead><tr style="background:#f0f9f4">
    <th style="padding:5px 10px;text-align:left;font-weight:600;color:#1a6b3c;font-size:9px;text-transform:uppercase;letter-spacing:.05em">Concepto</th>
    <th style="padding:5px 10px;text-align:right;font-weight:600;color:#1a6b3c;font-size:9px;text-transform:uppercase;letter-spacing:.05em">Neto</th>
    <th style="padding:5px 10px;text-align:right;font-weight:600;color:#1a6b3c;font-size:9px;text-transform:uppercase;letter-spacing:.05em">Alíc.</th>
    <th style="padding:5px 10px;text-align:right;font-weight:600;color:#1a6b3c;font-size:9px;text-transform:uppercase;letter-spacing:.05em">IVA</th>
    <th style="padding:5px 10px;text-align:right;font-weight:600;color:#1a6b3c;font-size:9px;text-transform:uppercase;letter-spacing:.05em">Total c/IVA</th>
  </tr></thead>
  <tbody>
    <tr style="border-top:1px solid #eef4ee">
      <td style="padding:4px 10px">Paneles solares</td>
      <td style="padding:4px 10px;text-align:right">${fmt(netoPanel)}</td>
      <td style="padding:4px 10px;text-align:right;color:#888">10,5%</td>
      <td style="padding:4px 10px;text-align:right">${fmt(ivaPanel)}</td>
      <td style="padding:4px 10px;text-align:right;font-weight:600">${fmt(netoPanel + ivaPanel)}</td>
    </tr>
    <tr style="border-top:1px solid #eef4ee">
      <td style="padding:4px 10px">Bomba, controlador y accesorios</td>
      <td style="padding:4px 10px;text-align:right">${fmt(netoResto)}</td>
      <td style="padding:4px 10px;text-align:right;color:#888">21%</td>
      <td style="padding:4px 10px;text-align:right">${fmt(ivaResto)}</td>
      <td style="padding:4px 10px;text-align:right;font-weight:600">${fmt(netoResto + ivaResto)}</td>
    </tr>
    <tr style="border-top:2px solid #1a6b3c;background:#f7fdf9;font-weight:700">
      <td style="padding:5px 10px;color:#1a1a18">TOTAL</td>
      <td style="padding:5px 10px;text-align:right;color:#1a1a18">${fmt(netoTotal)}</td>
      <td style="padding:5px 10px"></td>
      <td style="padding:5px 10px;text-align:right;color:#1a1a18">${fmt(ivaTotal)}</td>
      <td style="padding:5px 10px;text-align:right;color:#1a6b3c;font-size:12px">${fmt(precioPDF)}</td>
    </tr>
  </tbody>
</table>`
})()}` : ''}
${(esPozosProfundo || extraSensor > 0) ? `<div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:10px 14px;margin:8px 0;font-size:11px">
  <strong>⚠️ Extras de instalación incluidos en el precio:</strong><br>
  ${esPozosProfundo ? `<span style="color:#888">Pozo profundo (${profInput}m) — Cable y soga: ${metrosTotal}m totales. El kit incluye ${metrosBaseCable}m de cable y ${metrosBaseSoga}m de soga:</span><br>
  🔌 Cable sumergible +${metrosExtraCable}m: <strong>${fmt(extraCable)}</strong><br>
  🪢 Soga anti-UV +${metrosExtraSoga}m: <strong>${fmt(extraSoga)}</strong><br>` : ''}
  ${extraSensor > 0 ? `📡 Cable sensor +${metrosExtraSensor}m (distancia al tablero: ${distanciaTablero}m): <strong>${fmt(extraSensor)}</strong><br>` : ''}
</div>` : ''}
${sensorFueraRango ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;margin:8px 0;font-size:11px;color:#b91c1c">
  <strong>⚠️ NOTA TÉCNICA:</strong> La distancia al tablero (${distanciaTablero}m) supera el rango máximo del cable de sensor estándar (${SENSOR_MAX_M}m).<br>
  Se requiere un <strong>sistema de control de sensor a distancia</strong> — cotizar por separado. El cable de sensor no está incluido en este presupuesto.
</div>` : ''}
${kitOrdenado.length > 0 ? `<h3>Kit completo incluido</h3>
<table style="table-layout:fixed;width:100%"><thead><tr><th style="width:88%">Componente</th><th style="width:12%;text-align:center">Cant.</th></tr></thead>
<tbody>${kitHtml2Col}${!mostrarPublico && descuento > 0 && data?.bomba?.precio_full ? `<tr style="background:#f0faf4;border-top:2px solid #1a6b3c">
  <td style="padding:6px 8px;font-size:11px;color:#1a6b3c;font-weight:700">✂ Descuento revendedor (${descuento}%) — Ahorro sobre precio de lista ${fmt(data.bomba.precio_full)}</td>
  <td style="text-align:center;padding:6px 8px;white-space:nowrap;color:#1a6b3c;font-weight:700">-${fmt(Math.round(data.bomba.precio_full * descuento / 100))}</td></tr>` : ''}</tbody></table>` : ''}
<div class="footer">
  ${revLogo
    ? `<strong>${revEmpresa || revendedor}</strong>${revProvincia ? ` &nbsp;·&nbsp; ${revProvincia}` : ''}${revCuit ? ` &nbsp;·&nbsp; CUIT ${revCuit}` : ''}<br>`
    : revTipo === 'admin'
      ? `Asesor Febecos: <strong>${revendedor}</strong><br>`
      : `Asesor comercial: <strong>${revendedor}</strong>${revProvincia ? ` &nbsp;·&nbsp; ${revProvincia}` : ''}<br>`
  }
  ${revLogo
    ? `<span style="font-size:9px;color:#bbb">Generado con la plataforma online de <strong>Febecos®</strong> · Bombeo Solar Argentina</span><br>`
    : `Cotización realizada a través de la plataforma de cotizaciones de <strong>febecos.com</strong> · Bombeo Solar Argentina<br>`
  }
  Válido por 48 horas desde la fecha de emisión. Sujeto a disponibilidad de stock.
</div>

<div style="page-break-before:always"></div>

<div class="header">
  <div class="logo">
    ${revLogo
      ? `<img src="${revLogo}" style="height:32px;max-width:160px;object-fit:contain" alt="Logo"/><div style="font-size:10px;color:#555;margin-top:2px">${revEmpresa || ''}</div>`
      : `<span style="font-size:16px;font-weight:800;color:#1a6b3c">Febecos</span> <span style="font-size:11px;color:#666"> · Bombeo Solar Argentina</span>`
    }
  </div>
  <div class="presup-num"><h2 style="font-size:13px">Análisis técnico — Pres. ${nro}</h2><p>Documento complementario</p></div>
</div>

<!-- SECCIÓN 1: NECESIDAD DEL SISTEMA -->
<h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#1a6b3c;border-bottom:2px solid #1a6b3c;padding-bottom:5px;margin:18px 0 12px">Necesidad relevada del sistema</h3>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px 20px;margin-bottom:16px">
  ${busquedaMCA ? `<div style="background:#f0f9f4;border-radius:8px;padding:10px 14px"><div style="font-size:9px;text-transform:uppercase;color:#4a7a5a;letter-spacing:.06em;margin-bottom:3px">Altura manométrica total</div><div style="font-size:20px;font-weight:800;color:#1a6b3c">${busquedaMCA.toFixed(1)} <span style="font-size:13px">MCA</span></div></div>` : ''}
  ${busquedaLitros ? `<div style="background:#f0f9f4;border-radius:8px;padding:10px 14px"><div style="font-size:9px;text-transform:uppercase;color:#4a7a5a;letter-spacing:.06em;margin-bottom:3px">Caudal requerido</div><div style="font-size:20px;font-weight:800;color:#1a6b3c">${busquedaLitros.toLocaleString('es-AR')} <span style="font-size:13px">L/día</span></div>${busquedaLitrosHora ? `<div style="font-size:10px;color:#4a7a5a;margin-top:4px">${busquedaLitrosHora.toLocaleString('es-AR')} L/h × 5,5 hs sol = ${busquedaLitros.toLocaleString('es-AR')} L/día</div>` : ''}</div>` : ''}
  <div style="background:#f0f9f4;border-radius:8px;padding:10px 14px"><div style="font-size:9px;text-transform:uppercase;color:#4a7a5a;letter-spacing:.06em;margin-bottom:3px">Profundidad del pozo</div><div style="font-size:20px;font-weight:800;color:#1a6b3c">${profInput} <span style="font-size:13px">m</span></div></div>
  ${busquedaDiametro ? `<div style="background:#f7f6f2;border-radius:8px;padding:10px 14px"><div style="font-size:9px;text-transform:uppercase;color:#666;letter-spacing:.06em;margin-bottom:3px">Diám. mínimo perforación</div><div style="font-size:16px;font-weight:700;color:#1a1a18">${busquedaDiametro}"</div></div>` : ''}
</div>

<!-- SECCIÓN 2: POR QUÉ ESTE EQUIPO -->
<h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#1a6b3c;border-bottom:2px solid #1a6b3c;padding-bottom:5px;margin:18px 0 12px">Por qué se seleccionó este equipo</h3>
<div style="background:#f7f6f2;border-radius:8px;padding:12px 16px;margin-bottom:14px;font-size:12px;line-height:1.7;color:#333">
  ${busquedaMCA && busquedaLitros ? `
  La búsqueda requería una bomba capaz de elevar al menos <strong>${busquedaLitros.toLocaleString('es-AR')} litros por día</strong>
  a una altura manométrica de <strong>${busquedaMCA.toFixed(1)} MCA</strong> desde un pozo de <strong>${profInput} metros</strong> de profundidad.
  ` : `La bomba fue seleccionada considerando la profundidad del pozo (${profInput} m) y las características del sistema.`}
  <br>
  El equipo <strong>${data?.bomba?.marca || ''} ${data?.bomba?.watts || ''}W</strong> cumple con estos requerimientos operando
  con <strong>${data?.bomba?.cant_paneles || ''} panel${(data?.bomba?.cant_paneles||1)>1?'es':''} solar${(data?.bomba?.cant_paneles||1)>1?'es':''} de ${panelKit?.potencia_w || panelKit?.nombre?.match(/(\d+)\s*[Ww]/)?.[1] || data?.bomba?.watts || '?'}W</strong>
  en condiciones de irradiación solar típicas de la región.
</div>

<!-- SECCIÓN 3: RENDIMIENTO DETALLADO -->
${curvasHtml ? `
<h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#1a6b3c;border-bottom:2px solid #1a6b3c;padding-bottom:5px;margin:18px 0 12px">Curva de rendimiento del equipo (L/día por altura)</h3>
<div style="font-size:10px;color:#888;margin-bottom:8px">Calculado con horas solares pico regionales · ☀️ Verano ${HSP.verano}h · 📅 Promedio ${HSP.promedio}h · ❄️ Invierno ${HSP.invierno}h</div>
<table style="width:100%;border-collapse:collapse;font-size:11px">
  <thead><tr style="background:#1a6b3c;color:#fff">
    <th style="padding:6px 10px;text-align:right">Altura (m)</th>
    <th style="padding:6px 10px;text-align:right">Verano</th>
    <th style="padding:6px 10px;text-align:right">Promedio anual</th>
    <th style="padding:6px 10px;text-align:right">Invierno</th>
    <th style="padding:6px 10px;text-align:right">L/hora</th>
  </tr></thead>
  <tbody>${data?.curvas?.map((c: any, i: number) => {
    const esPozo = Math.abs(c.altura_m - profInput) <= 5
    return `<tr style="background:${esPozo ? '#e8f5ee' : (i%2===0?'#fafafa':'#fff')};${esPozo?'font-weight:700;':''}">
      <td style="padding:5px 10px;text-align:right;color:${esPozo?'#1a6b3c':'#e8681a'}">${c.altura_m}m${esPozo?' ◄':''}</td>
      <td style="padding:5px 10px;text-align:right">${c.litros_verano.toLocaleString('es-AR')}</td>
      <td style="padding:5px 10px;text-align:right">${c.litros_promedio.toLocaleString('es-AR')}</td>
      <td style="padding:5px 10px;text-align:right">${c.litros_invierno.toLocaleString('es-AR')}</td>
      <td style="padding:5px 10px;text-align:right;color:#888">${c.litros_hora.toLocaleString('es-AR')}</td>
    </tr>`
  }).join('')}</tbody>
</table>
<div style="margin-top:8px;font-size:10px;color:#888">◄ Fila resaltada = altura más cercana a la profundidad del pozo (${profInput}m)</div>
` : ''}

<!-- FOOTER PÁGINA 2 -->
<div class="footer" style="margin-top:24px">
  Este análisis es orientativo. Los caudales reales pueden variar según la irradiación solar local, la temperatura del agua y el estado del pozo.<br>
  ${revLogo
    ? `Para consultas: <strong>${revEmail || ''}</strong>${revDomicilio ? ` · ${revDomicilio}` : ''}`
    : `Para asesoramiento técnico: <strong>ventas@febecos.com</strong> · febecos.com`
  }
</div>
</body></html>`

    // Guardar HTML en estado para el modal de compartir
    setPdfHtml(html)
    setPdfNro(nro)
    setPdfToken(tok)
    setPdfPrecio(precioPDF)
    setPdfCliente(cd)
    setShowShareModal(true)
    setGenerandoPDF(false)
  }

  useEffect(() => {
    fetch(`${API_DETALLE}?codigo=${encodeURIComponent(codigo)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [codigo])

  const precio = data?.bomba?.precio_full
    ? (mostrarPublico ? data.bomba.precio_full : precioMayorista(data.bomba.precio_full, descuento))
    : null

  // ── Cable + soga para pozos > 30m ──────────────────────────────────────────
  const esPozosProfundo = profInput > 30 && data?.bomba?.tipo?.toLowerCase()?.includes('sumergi')
  // Precios y metros base desde el kit (fallback a precios de Neon conocidos)
  const cabItem = data?.kit?.find((i: any) => i.familia === 'cable' && i.nombre?.toLowerCase().includes('sumergible'))
  const sogaItem = data?.kit?.find((i: any) => i.nombre?.toLowerCase().includes('soga') || i.nombre?.toLowerCase().includes('anti-uv'))
  const precioCableM = cabItem?.precio_ars ?? 7699.45
  const precioSogaM  = sogaItem?.precio_ars ?? 1809.59
  // Metros YA incluidos en el kit base (no se vuelven a cobrar)
  const metrosBaseCable = cabItem?.cantidad ?? 30
  const metrosBaseSoga  = sogaItem?.cantidad ?? 30
  // Metros totales que necesita el equipo (profundidad + 10m seguridad), editable por el revendedor
  const metrosNecesarios = Math.ceil((profInput + 10) / 10) * 10  // redondea al múltiplo de 10 superior
  const metrosTotal = esPozosProfundo ? (cableMetros ?? metrosNecesarios) : 0
  // Solo se cobran los metros ADICIONALES por encima de los que ya trae el kit
  const metrosExtraCable = esPozosProfundo ? Math.max(0, metrosTotal - metrosBaseCable) : 0
  const metrosExtraSoga  = esPozosProfundo ? Math.max(0, metrosTotal - metrosBaseSoga)  : 0
  const factorDesc   = mostrarPublico ? 1 : (1 - descuento / 100)
  const extraCable   = Math.round(precioCableM * metrosExtraCable * factorDesc)
  const extraSoga    = Math.round(precioSogaM  * metrosExtraSoga  * factorDesc)

  // ── Cable de sensor: distancia horizontal pozo → tablero ─────────────────
  const SENSOR_MAX_M = 100  // a partir de 100m el cable estándar no alcanza → requiere sistema remoto
  const sensorItem = data?.kit?.find((i: any) => i.familia === 'cable' && (i.nombre||'').toLowerCase().includes('sensor'))
  const metrosBaseSensor = sensorItem?.cantidad ?? 20
  const precioSensorM    = sensorItem?.precio_ars ?? 1736.96
  const sensorFueraRango = distanciaTablero != null && distanciaTablero > SENSOR_MAX_M
  // Solo suma extra si la distancia es > base y dentro del rango (≤100m)
  const metrosSensorTotal = (!sensorFueraRango && distanciaTablero != null && distanciaTablero > metrosBaseSensor)
    ? distanciaTablero : metrosBaseSensor
  const metrosExtraSensor = (!sensorFueraRango && distanciaTablero != null)
    ? Math.max(0, distanciaTablero - metrosBaseSensor) : 0
  const extraSensor  = Math.round(precioSensorM * metrosExtraSensor * factorDesc)

  const extrasTotal  = extraCable + extraSoga + extraSensor
  const precioConExtras = precio != null ? precio + extrasTotal : null
  // Extras a precio público (sin descuento) para mostrar "Precio de lista" correcto
  const extrasListaPublico = Math.round(precioCableM * metrosExtraCable)
    + Math.round(precioSogaM * metrosExtraSoga)
    + Math.round(precioSensorM * metrosExtraSensor)
  const precioListaTotal = data?.bomba?.precio_full ? data.bomba.precio_full + extrasListaPublico : null

  // Helpers para identificar items especiales en el kit
  const esMC4 = (n: string) => /\bmc4\b|ficha mc/i.test(n || '')
  const esCableSum = (it: any) => it.familia === 'cable' && (it.nombre || '').toLowerCase().includes('sumergible')
  const esSogaItem = (it: any) => (it.nombre || '').toLowerCase().includes('soga') || (it.nombre || '').toLowerCase().includes('anti-uv')

  // Agrupar kit por familia:
  // - Excluir MC4 (ya está incluido dentro de la Caja IP65)
  // - Jabalina → protecciones (caja)
  // - Soga → cable (se vende por metro, va con los cables)
  // - 'otros' → normalizar a 'otro'
  const esSensorItem = (it: any) => it.familia === 'cable' && (it.nombre||'').toLowerCase().includes('sensor')
  const familias: Record<string, any[]> = {}
  if (data?.kit) {
    for (const item of data.kit) {
      if (esMC4(item.nombre)) continue                      // MC4: dentro de la Caja IP65
      if (sensorFueraRango && esSensorItem(item)) continue  // cable sensor fuera de rango: no incluido
      let f = item.familia || 'otro'
      if (item.nombre?.toLowerCase().includes('jabalina')) f = 'caja'
      else if (esSogaItem(item)) f = 'cable'    // soga va con cables
      else if (f === 'otros') f = 'otro'         // normalizar plural
      if (!familias[f]) familias[f] = []
      // Para pozos profundos, mostrar metros totales; para sensor, mostrar distancia real
      const cantDisplay = esPozosProfundo && item.unidad === 'metro' && (esCableSum(item) || esSogaItem(item))
        ? Math.max(item.cantidad, metrosTotal)
        : esSensorItem(item) && distanciaTablero != null && distanciaTablero > item.cantidad
          ? distanciaTablero
          : item.cantidad
      familias[f].push({ ...item, cantDisplay })
    }
  }

  // Orden explícito de familias: bomba → panel → soporte → protecciones → cables → otros
  const FAMILIA_ORDEN = ['bomba', 'panel', 'soporte', 'caja', 'cable', 'accesorio', 'otro']
  const familiasOrdenadas = FAMILIA_ORDEN
    .filter(f => familias[f]?.length > 0)
    .map(f => [f, familias[f]] as [string, any[]])

  // Panel solar del kit
  const panelKit = data?.kit?.find((i: any) => i.familia === 'panel')
  const panelDesc = panelKit
    ? `${panelKit.nombre}${panelKit.potencia_w ? ` — ${panelKit.potencia_w}W` : ''} × ${data?.bomba?.cant_paneles || panelKit.cantidad}`
    : data?.bomba?.cant_paneles ? `${data.bomba.cant_paneles} panel${data.bomba.cant_paneles > 1 ? 'es' : ''} solar${data.bomba.cant_paneles > 1 ? 'es' : ''}` : null

  // HSP (horas solares pico) usadas para el cálculo
  const HSP = { verano: 5.5, promedio: 4, invierno: 3.5 }

  const nombreFamilia: Record<string, string> = {
    bomba: '⬇️ Bomba', panel: '☀️ Paneles solares', soporte: '🔩 Soportes',
    caja: '🛡️ Protecciones', cable: '🔌 Cables', accesorio: '🔧 Accesorios', otro: '📋 Otros'
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      {/* Aviso del guardado de cliente (demo / token inactivo / rate-limit) — el presupuesto se generó igual */}
      {avisoCliente && (
        <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1200, maxWidth: 440, width: 'calc(100% - 32px)', background: '#13233a', border: '1px solid #2a4a6a', borderRadius: 12, padding: '12px 14px', boxShadow: '0 8px 30px rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 18, lineHeight: '20px' }}>{avisoCliente.tipo === 'rate' ? '⏳' : '📋'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: '#e8f0f8', fontWeight: 600, lineHeight: 1.35 }}>{avisoCliente.txt}</div>
            {avisoCliente.tipo === 'demo' && (
              <a href="/unirse" style={{ display: 'inline-block', marginTop: 8, padding: '7px 14px', background: '#e8681a', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Registrarme</a>
            )}
          </div>
          <button onClick={() => setAvisoCliente(null)} style={{ background: 'transparent', border: 'none', color: '#7a9ab5', cursor: 'pointer', fontSize: 16, lineHeight: '16px', padding: 0 }}>×</button>
        </div>
      )}
      <div style={{ background: '#0d1a2a', border: '1px solid #1e3248', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #1e3248', position: 'sticky', top: 0, background: '#0d1a2a', zIndex: 1 }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#e8681a' }}>{codigo}</div>
            <div style={{ fontSize: 11, color: '#7a9ab5', marginTop: 2 }}>Detalle del equipo — datos en tiempo real desde Febecos</div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {data?.ok && mostrarPublico && clienteReady && !showClienteForm && (
              <button
                onClick={() => {
                  setClienteReady(false)
                  setShowClienteForm(true)
                }}
                style={{ padding:'7px 10px', background:'transparent', border:'1px solid #3a5a7a', borderRadius:8, color:'#7a9ab5', fontSize:11, cursor:'pointer' }}
                title="Cambiar datos del cliente"
              >
                👤 Cambiar cliente
              </button>
            )}
            {data?.ok && (
              <button onClick={() => generarPDF()} disabled={generandoPDF} style={{ padding:'7px 14px', background:'#e8681a', border:'none', borderRadius:8, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                📄 {generandoPDF ? 'Generando...' : nroPresup ? `PDF ${nroPresup}` : 'Generar PDF'}
              </button>
            )}
            <button onClick={onClose} style={{ width: 32, height: 32, background: 'transparent', border: '1px solid #1e3248', borderRadius: 8, color: '#7a9ab5', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        </div>

        {/* ── Formulario datos del cliente (precio público) ─────────────────── */}
        {showClienteForm && (
          <div style={{ background: '#132233', borderBottom: '1px solid #1e3248', padding: '16px 22px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e8681a', marginBottom: 4 }}>
              👤 Datos del cliente
            </div>
            <div style={{ fontSize: 11, color: '#7a9ab5', marginBottom: 14 }}>
              El presupuesto saldrá a nombre del cliente. El teléfono nos ayuda a saber si este cliente ya nos contactó antes.
            </div>

            {/* Buscador de clientes — solo vendedores internos Febecos */}
            {revTipo === 'interno' && (
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: '#3a5a7a', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4, fontWeight: 600 }}>🔍 Buscar cliente existente</div>
                <input
                  value={busquedaCliente}
                  onChange={e => { setBusquedaCliente(e.target.value); setSugerenciaIdx(-1); buscarClienteDB(e.target.value) }}
                  onKeyDown={e => {
                    if (!sugerenciasCliente.length) return
                    if (e.key === 'ArrowDown') { e.preventDefault(); setSugerenciaIdx(i => Math.min(i + 1, sugerenciasCliente.length - 1)) }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); setSugerenciaIdx(i => Math.max(i - 1, 0)) }
                    else if (e.key === 'Enter' && sugerenciaIdx >= 0) { e.preventDefault(); seleccionarCliente(sugerenciasCliente[sugerenciaIdx]) }
                    else if (e.key === 'Escape') { setSugerenciasCliente([]); setSugerenciaIdx(-1) }
                  }}
                  placeholder="Nombre, apellido o razón social…"
                  style={{ width: '100%', background: '#0d2a1a', border: '1px solid #25d366', borderRadius: 6, padding: '8px 10px', color: '#e8f0f8', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }}
                />
                {buscandoCliente && <div style={{ fontSize: 11, color: '#7a9ab5', marginTop: 4 }}>Buscando…</div>}
                {sugerenciasCliente.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0d1a2a', border: '1px solid #25d366', borderRadius: 8, zIndex: 100, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,.5)' }}>
                    {sugerenciasCliente.map((c, i) => (
                      <div key={i} onClick={() => seleccionarCliente(c)}
                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: i < sugerenciasCliente.length - 1 ? '1px solid #1e3248' : 'none', background: i === sugerenciaIdx ? '#1e3a28' : 'transparent' }}
                        onMouseEnter={() => setSugerenciaIdx(i)}
                        onMouseLeave={() => setSugerenciaIdx(-1)}
                      >
                        <div style={{ fontWeight: 700, color: '#e8f0f8', fontSize: 13 }}>{c.nombre} {c.apellido}</div>
                        <div style={{ fontSize: 11, color: '#7a9ab5', marginTop: 2 }}>
                          {c.telefono && <span>📱 {c.telefono}</span>}
                          {c.razon_social && <span style={{ marginLeft: 8 }}>🏢 {c.razon_social}</span>}
                          {c.zona && <span style={{ marginLeft: 8 }}>📍 {c.zona}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginBottom: 12 }}>
              {/* Nombre y apellido — un solo campo (igual que el CRM / Febo Rev) */}
              <div style={{ gridColumn: '1/-1' }}>
                <div style={{ fontSize: 10, color: '#3a5a7a', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4, fontWeight: 600 }}>Nombre y apellido / Razón social *</div>
                <input autoFocus value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Juan Pérez"
                  style={{ width: '100%', background: '#0d1a2a', border: '1px solid #1e3248', borderRadius: 6, padding: '8px 10px', color: '#e8f0f8', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
              {/* Teléfono */}
              <div style={{ gridColumn: '1/-1' }}>
                <div style={{ fontSize: 10, color: '#3a5a7a', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4, fontWeight: 600 }}>Teléfono / WhatsApp *</div>
                <input value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)} placeholder="11 2345 6789" type="tel"
                  style={{ width: '100%', background: '#0d1a2a', border: '1px solid #1e3248', borderRadius: 6, padding: '8px 10px', color: '#e8f0f8', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
              {/* Email */}
              <div style={{ gridColumn: '1/-1' }}>
                <div style={{ fontSize: 10, color: '#3a5a7a', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4, fontWeight: 600 }}>Email (opcional)</div>
                <input value={clienteEmail} onChange={e => setClienteEmail(e.target.value)} placeholder="cliente@email.com" type="email"
                  style={{ width: '100%', background: '#0d1a2a', border: '1px solid #1e3248', borderRadius: 6, padding: '8px 10px', color: '#e8f0f8', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
              {/* Provincia */}
              <div style={{ gridColumn: '1/-1' }}>
                <div style={{ fontSize: 10, color: '#3a5a7a', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4, fontWeight: 600 }}>Provincia</div>
                <select value={clienteZona} onChange={e => setClienteZona(e.target.value)}
                  style={{ width: '100%', background: '#0d1a2a', border: '1px solid #1e3248', borderRadius: 6, padding: '8px 10px', color: clienteZona ? '#e8f0f8' : '#3a5a7a', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }}>
                  <option value="">— Seleccionar provincia —</option>
                  {['Buenos Aires','CABA','Catamarca','Chaco','Chubut','Córdoba','Corrientes','Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones','Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              {/* Empresa (opcional) */}
              <div style={{ gridColumn: '1/-1', borderTop: '1px solid #1e3248', paddingTop: 10, marginTop: 2 }}>
                <div style={{ fontSize: 11, color: '#7a9ab5', marginBottom: 8 }}>🏢 Si el presupuesto es para una empresa, completá estos datos (opcional):</div>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <div style={{ fontSize: 10, color: '#3a5a7a', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4, fontWeight: 600 }}>
                  Razón social{clienteCuitLoading ? <span style={{ marginLeft: 6, color: '#7a9ab5', fontWeight: 400 }}>buscando en ARCA…</span> : ''}
                </div>
                <input value={clienteRazonSocial} onChange={e => setClienteRazonSocial(e.target.value)} placeholder="La Jota Group SRL"
                  style={{ width: '100%', background: '#0d1a2a', border: '1px solid #1e3248', borderRadius: 6, padding: '8px 10px', color: '#e8f0f8', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <div style={{ fontSize: 10, color: '#3a5a7a', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4, fontWeight: 600 }}>CUIT</div>
                <input value={clienteCuit} onChange={e => setClienteCuit(e.target.value)}
                  onBlur={e => buscarCuit(e.target.value)}
                  placeholder="30-12345678-9" type="text"
                  style={{ width: '100%', background: '#0d1a2a', border: '1px solid #1e3248', borderRadius: 6, padding: '8px 10px', color: '#e8f0f8', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
              {/* Descuento — editable solo para vendedor interno. El externo lo
                  tiene fijo segun la solapa (Mayorista = su %, Publico = 0). */}
              <div style={{ gridColumn: '1/-1', borderTop: '1px solid #1e3248', paddingTop: 10, marginTop: 2 }}>
                <div style={{ fontSize: 10, color: '#3a5a7a', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4, fontWeight: 600 }}>
                  Descuento (%) <span style={{ fontWeight: 400, color: '#7a9ab5', textTransform: 'none' as const }}>{esVendInterno ? '— 0 = precio público sin desglose IVA' : '— definido por la solapa (Mayorista / Precio público)'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {esVendInterno ? (
                    <input value={descuentoEfectivo} onChange={e => setDescuentoEfectivo(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                      type="number" min="0" max="100" step="1" placeholder="0"
                      style={{ width: 90, background: '#0d1a2a', border: '1px solid #1e3248', borderRadius: 6, padding: '8px 10px', color: '#e8f0f8', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }} />
                  ) : (
                    <span style={{ width: 90, background: '#101d2c', border: '1px solid #1e3248', borderRadius: 6, padding: '8px 10px', color: '#7a9ab5', fontSize: 14, textAlign: 'center' as const }}>{descuentoEfectivo}%</span>
                  )}
                  {descuentoEfectivo > 0 && data?.bomba?.precio_full ? (
                    <span style={{ fontSize: 12, color: '#1a6b3c' }}>
                      Lista {fmt(data.bomba.precio_full)} → <strong>{fmt(Math.round(data.bomba.precio_full * (1 - descuentoEfectivo / 100)))}</strong>
                    </span>
                  ) : <span style={{ fontSize: 11, color: '#3a5a7a' }}>Precio público</span>}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  const cd = { nombre: clienteNombre, apellido: clienteApellido, telefono: clienteTelefono, email: clienteEmail, zona: clienteZona, razonSocial: clienteRazonSocial, cuit: clienteCuit }
                  setClienteReady(true)
                  setShowClienteForm(false)
                  generarPDF(cd)
                }}
                disabled={!clienteNombre.trim() || !clienteTelefono.trim()}
                style={{ flex: 1, padding: '10px', background: (!clienteNombre.trim() || !clienteTelefono.trim()) ? '#1e3248' : '#e8681a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: (!clienteNombre.trim() || !clienteTelefono.trim()) ? 'not-allowed' : 'pointer' }}
              >
                📄 Confirmar y generar PDF
              </button>
              <button
                onClick={() => { setShowClienteForm(false); generarPDF({ nombre: '', apellido: '', telefono: '', zona: '' }) }}
                style={{ padding: '10px 14px', background: 'transparent', border: '1px solid #1e3248', borderRadius: 8, color: '#7a9ab5', fontSize: 12, cursor: 'pointer' }}
              >
                Saltar
              </button>
            </div>
          </div>
        )}

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

              {/* Profundidad del pozo + distancia al tablero */}
              <div style={{ background: '#132233', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7a9ab5', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 8 }}>
                  Instalación
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
                  <input
                    type="number" min={0} step={1} value={profInput}
                    onChange={e => setProfInput(Number(e.target.value))}
                    style={{ width: 90, padding: '8px 10px', background: '#0d1a2a', border: '1px solid #1e3248', borderRadius: 8, color: '#e8f0f8', fontSize: 14, fontFamily: 'inherit' }}
                  />
                  <span style={{ fontSize: 13, color: '#7a9ab5' }}>metros</span>
                  {profInput > 30 && (
                    <span style={{ fontSize: 11, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 6, padding: '3px 8px' }}>
                      ⚠️ Pozo profundo — se agrega cable y soga
                    </span>
                  )}
                </div>

                {/* Distancia al tablero / control (cable de sensor) */}
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #1e3248' }}>
                  <div style={{ fontSize: 11, color: '#7a9ab5', marginBottom: 6 }}>
                    Distancia al sensor de nivel (tanque)
                    <span style={{ color: '#3a5a7a' }}> · longitud de cañería + altura del tanque de almacenamiento{distSensorInicial > 0 ? ` — precalculado por la MCA: ${distSensorInicial}m` : ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
                    <input
                      type="number" min={0} step={1}
                      value={distanciaTablero ?? ''}
                      placeholder={`${metrosBaseSensor} (base kit)`}
                      onChange={e => setDistanciaTablero(e.target.value === '' ? null : Math.max(0, Number(e.target.value)))}
                      style={{ width: 100, padding: '8px 10px', background: '#0d1a2a', border: `1px solid ${sensorFueraRango ? '#ef4444' : '#1e3248'}`, borderRadius: 8, color: '#e8f0f8', fontSize: 14, fontFamily: 'inherit' }}
                    />
                    <span style={{ fontSize: 13, color: '#7a9ab5' }}>metros</span>
                  </div>
                  {sensorFueraRango && (
                    <div style={{ marginTop: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#fca5a5', lineHeight: 1.5 }}>
                      ⚠️ <strong>Distancia fuera del rango del cable de sensor estándar (máx. {SENSOR_MAX_M}m).</strong><br />
                      Para esta instalación se requiere un <strong>sistema de control de sensor a distancia</strong> — cotizar por separado. El cable de sensor no se incluye en este presupuesto.
                    </div>
                  )}
                  {!sensorFueraRango && distanciaTablero != null && distanciaTablero > metrosBaseSensor && (
                    <div style={{ marginTop: 6, fontSize: 11, color: '#4ade80' }}>
                      ✓ Se agregan {metrosExtraSensor}m de cable de sensor ({metrosSensorTotal}m totales)
                    </div>
                  )}
                </div>

                {/* Metros de cable — editable (por defecto = profundidad + 10m de seguridad) */}
                {esPozosProfundo && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #1e3248' }}>
                    <div style={{ fontSize: 11, color: '#7a9ab5', marginBottom: 6 }}>
                      Metros de cable y soga
                      <span style={{ color: '#3a5a7a' }}> · podés ajustarlo si el pozo necesita otro largo</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
                      <input
                        type="number" min={0} step={1} value={metrosTotal}
                        onChange={e => setCableMetros(Math.max(0, Number(e.target.value)))}
                        style={{ width: 90, padding: '8px 10px', background: '#0d1a2a', border: '1px solid #1e3248', borderRadius: 8, color: '#e8f0f8', fontSize: 14, fontFamily: 'inherit' }}
                      />
                      <span style={{ fontSize: 13, color: '#7a9ab5' }}>metros</span>
                      {cableMetros != null && cableMetros !== metrosNecesarios && (
                        <button
                          onClick={() => setCableMetros(null)}
                          style={{ fontSize: 11, color: '#7a9ab5', background: 'transparent', border: '1px solid #3a5a7a', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}
                          title={`Volver al automático (${metrosNecesarios}m)`}
                        >
                          ↺ Auto ({metrosNecesarios}m)
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Precio */}
              {precioConExtras != null && (
                <div style={{ background: '#132233', borderRadius: 10, padding: '16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7a9ab5', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 8 }}>
                    {mostrarPublico ? 'Precio público' : `Precio mayorista (${descuento}% OFF)`}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#4ade80' }}>{fmt(precioConExtras)}</div>
                  {esPozosProfundo && (
                    <div style={{ marginTop: 10, borderTop: '1px solid #1e3248', paddingTop: 10 }}>
                      <div style={{ fontSize: 11, color: '#7a9ab5', marginBottom: 6 }}>
                        Cable y soga: <strong style={{ color: '#e8f0f8' }}>{metrosTotal}m totales</strong> · el kit ya incluye {metrosBaseCable}m de cable y {metrosBaseSoga}m de soga (solo se cobran los metros adicionales).
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#e8f0f8', padding: '3px 0' }}>
                        <span>🔌 Cable sumergible <span style={{ color: '#7a9ab5' }}>+{metrosExtraCable}m</span></span>
                        <span style={{ fontFamily: 'monospace', color: '#4ade80' }}>{fmt(extraCable)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#e8f0f8', padding: '3px 0' }}>
                        <span>🪢 Soga anti-UV <span style={{ color: '#7a9ab5' }}>+{metrosExtraSoga}m</span></span>
                        <span style={{ fontFamily: 'monospace', color: '#4ade80' }}>{fmt(extraSoga)}</span>
                      </div>
                      {extraSensor > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#e8f0f8', padding: '3px 0' }}>
                          <span>📡 Cable sensor <span style={{ color: '#7a9ab5' }}>+{metrosExtraSensor}m</span></span>
                          <span style={{ fontFamily: 'monospace', color: '#4ade80' }}>{fmt(extraSensor)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7a9ab5', padding: '3px 0', borderTop: '1px solid #162030', marginTop: 4 }}>
                        <span>Kit base</span>
                        <span style={{ fontFamily: 'monospace' }}>{fmt(precio!)}</span>
                      </div>
                    </div>
                  )}
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
                  {familiasOrdenadas.map(([familia, items]) => (
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
                          <span style={{ fontSize: 12, color: '#7a9ab5', fontFamily: 'monospace', fontWeight: 600 }}>{item.unidad === 'metro' ? `${item.cantDisplay ?? item.cantidad} m` : `×${item.cantidad}`}</span>
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

      {/* ── Modal compartir PDF ─────────────────────────────────────────── */}
      {showShareModal && (
        <div onClick={() => setShowShareModal(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.65)', zIndex:9999, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#132233', border:'1px solid #1e3248', borderRadius:16, padding:'24px 20px', width:'100%', maxWidth:420 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <div style={{ color:'#e8f0f8', fontWeight:700, fontSize:16 }}>📄 Presupuesto {pdfNro} listo</div>
                {pdfCliente?.nombre && <div style={{ color:'#7a9ab5', fontSize:12, marginTop:2 }}>Para: {pdfCliente.nombre} {pdfCliente.apellido || ''}</div>}
              </div>
              <button onClick={() => setShowShareModal(false)} style={{ background:'none', border:'none', color:'#7a9ab5', fontSize:22, cursor:'pointer', lineHeight:1 }}>✕</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <button onClick={() => { setShowShareModal(false); setClienteReady(false); setShowClienteForm(true) }}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'#1e3248', border:'1px solid #3a5a7a', borderRadius:10, color:'#7a9ab5', fontSize:14, fontWeight:600, cursor:'pointer', textAlign:'left' as const }}>
                <span style={{ fontSize:22 }}>✏️</span>
                <div><div>Editar datos del cliente / descuento</div><div style={{ fontSize:11, color:'#3a5a7a', fontWeight:400 }}>Modifica nombre, email, CUIT o descuento y regenera el PDF</div></div>
              </button>
              <button onClick={() => {
                window.open(`/p/${pdfToken || pdfNro}?rev=${revToken || ''}`, '_blank')
              }} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'#1e3248', border:'1px solid #2a4a6a', borderRadius:10, color:'#e8f0f8', fontSize:14, fontWeight:600, cursor:'pointer', textAlign:'left' as const }}>
                <span style={{ fontSize:22 }}>📥</span>
                <div><div>Guardar / Imprimir PDF</div><div style={{ fontSize:11, color:'#7a9ab5', fontWeight:400 }}>Abre el PDF para guardar o imprimir</div></div>
              </button>
              <button onClick={() => {
                const nombre = pdfCliente?.nombre ? ` para ${pdfCliente.nombre}${pdfCliente.apellido ? ' '+pdfCliente.apellido : ''}` : ''
                const precio = pdfPrecio ? ` — Precio: $${Math.round(pdfPrecio).toLocaleString('es-AR')}` : ''
                const link = `${PUBLIC_BASE}/p/${pdfToken || pdfNro}`
                const msg = `Hola! Te comparto el presupuesto de bomba solar Febecos${nombre}${precio}.\n\nMirá el detalle completo y descargá el PDF acá:\n${link}\n\nPresupuesto N° ${pdfNro} — Febecos Bombeo Solar.`
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
              }} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'#0a2a1a', border:'1px solid #25d366', borderRadius:10, color:'#25d366', fontSize:14, fontWeight:600, cursor:'pointer', textAlign:'left' as const }}>
                <span style={{ fontSize:22 }}>💬</span>
                <div><div>Compartir por WhatsApp</div><div style={{ fontSize:11, color:'#4a9a6a', fontWeight:400 }}>Envía un link al presupuesto · el cliente descarga el PDF</div></div>
              </button>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button onClick={async () => {
                  const nombre = pdfCliente?.nombre ? ` para ${pdfCliente.nombre}` : ''
                  const precio = pdfPrecio ? ` · $${Math.round(pdfPrecio).toLocaleString('es-AR')}` : ''
                  const link = `${PUBLIC_BASE}/p/${pdfToken || pdfNro}`
                  try { await navigator.share({ title: `Presupuesto Febecos ${pdfNro}`, text: `Presupuesto de bomba solar Febecos${nombre}${precio} — N° ${pdfNro}`, url: link }) } catch(_) {}
                }} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'#1e3248', border:'1px solid #2a4a6a', borderRadius:10, color:'#e8f0f8', fontSize:14, fontWeight:600, cursor:'pointer', textAlign:'left' as const }}>
                  <span style={{ fontSize:22 }}>📤</span>
                  <div><div>Compartir...</div><div style={{ fontSize:11, color:'#7a9ab5', fontWeight:400 }}>Más opciones: Telegram, Mail, etc.</div></div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Portal() {
  const [token, setToken] = useState<string | null>(null)
  const [rev, setRev] = useState<Revendedor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [diasDemo, setDiasDemo] = useState<number | null>(null)   // null = no es demo
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
  const [filtroDiam, setFiltroDiam] = useState('todos')
  const [filtroWatts, setFiltroWatts] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [mostrarCalculadora, setMostrarCalculadora] = useState(false)
  const [modalCodigo, setModalCodigo] = useState<string | null>(null)
  const [bombaSel, setBombaSel] = useState<string | null>(null)
  const [codigoCotizado, setCodigoCotizado] = useState<string | null>(null)
  const [profundidad, setProfundidad] = useState(0)
  const [distSensorMCA, setDistSensorMCA] = useState<number>(0) // distancia al sensor calculada por la MCA
  const [litrosHoraMCA, setLitrosHoraMCA] = useState<number | null>(null) // L/hora original si se ingresó en esa unidad
  const [clienteInicial, setClienteInicial] = useState<any>(null) // pre-fill cliente al re-cotizar
  // ── Mis cotizaciones ──────────────────────────────────────────────────────
  const [showCotis, setShowCotis] = useState(false)
  const [cotis, setCotis] = useState<any[] | null>(null)
  const [cargandoCotis, setCargandoCotis] = useState(false)
  const [buscadorCotis, setBuscadorCotis] = useState('')
  function recotizar(c: any) {
    setShowCotis(false)
    if (c.altura_m)         setAltura(String(c.altura_m))
    if (c.litros_dia)       setLitros(String(c.litros_dia))
    if (c.profundidad_m)    setProfundidad(Number(c.profundidad_m))
    if (c.longitud_total_m) setDistSensorMCA(Number(c.longitud_total_m))
    if (c.bomba_codigo)     setModalCodigo(c.bomba_codigo)
    // Pre-llenar datos del cliente via clienteInicial (prop a ModalDetalle)
    if (c.cliente_nombre || c.cliente_apellido || c.cliente_razon_social) {
      setClienteInicial({
        nombre: c.cliente_nombre || '', apellido: c.cliente_apellido || '',
        telefono: c.cliente_telefono || '', zona: c.cliente_zona || '',
        razonSocial: c.cliente_razon_social || '', cuit: c.cliente_cuit || '',
      })
    } else {
      setClienteInicial(null)
    }
  }

  async function abrirCotizaciones() {
    setShowCotis(true)
    // Siempre re-consultar: el cliente/descuento puede haberse editado en /p/[token]
    // (otra pestaña). El spinner solo en la 1ra carga; despues refresca en silencio.
    const primeraVez = cotis === null
    if (primeraVez) setCargandoCotis(true)
    try {
      const r = await fetch(`/api/presupuestos?token=${encodeURIComponent(token || '')}&limit=100`)
      const d = await r.json()
      setCotis(d?.presupuestos || [])
    } catch { if (primeraVez) setCotis([]) }
    if (primeraVez) setCargandoCotis(false)
  }

  // ── PIN DE SEGURIDAD ──────────────────────────────────────────────────────
  // Estados posibles: 'ok' | 'pedir_nuevo' | 'pedir_existente' | 'verificando'
  const [pinEstado, setPinEstado] = useState<'ok'|'pedir_nuevo'|'pedir_existente'|'verificando'>('verificando')
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [pinGuardado, setPinGuardado] = useState<string | null>(null)

  function llavePIN(t: string) { return `febecos-pin-${t.slice(0, 8)}` }
  function llaveSession(t: string) { return `febecos-session-${t.slice(0, 8)}` }

  function verificarPIN() {
    if (pinInput.length !== 4 || !/^\d{4}$/.test(pinInput)) {
      setPinError('El PIN debe ser 4 dígitos numéricos.'); return
    }
    const t = token || ''
    if (pinEstado === 'pedir_nuevo') {
      // Primera vez: guardar el PIN elegido
      localStorage.setItem(llavePIN(t), pinInput)
      sessionStorage.setItem(llaveSession(t), '1')
      setPinGuardado(pinInput)
      setPinEstado('ok')
    } else {
      // Validar contra el PIN guardado
      if (pinInput === localStorage.getItem(llavePIN(t))) {
        sessionStorage.setItem(llaveSession(t), '1')
        setPinEstado('ok')
      } else {
        setPinError('PIN incorrecto. Intentá de nuevo.')
        setPinInput('')
      }
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  async function seleccionar(bomba: any) {
    setBombaSel(bomba.codigo)
    const calcId = (window as any)._ultimoCalcMcaId
    if (calcId) {
      // Actualizar registro existente de la calculadora MCA
      fetch('/api/calculos-mca', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: calcId, bomba_sugerida: bomba.codigo, litros_dia: Number(litros) || null, caudal_m3h: bomba.caudal_m3h || null })
      }).catch(() => {})
    } else {
      // Crear registro nuevo desde el buscador directo
      fetch('/api/calculos-mca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_instalacion: 'busqueda_directa',
          mca_total: Number(altura) || null,
          litros_dia: Number(litros) || null,
          caudal_m3h: Number(litros) ? Number(litros) / 1000 / 5.5 : null,  // 5.5h sol verano (no 8h)
          diametro: diametro || null,
          bomba_sugerida: bomba.codigo,
          origen: 'portal_revendedor',
          revendedor_token: token || null,
          revendedor_nombre: rev ? `${rev.nombre} ${rev.apellido || ''}`.trim() : null,
        })
      }).catch(() => {})
    }
  }

  async function buscarBombaConParams(h: string, l: string, d: string) {
    setBuscando(true); setResultado(null); setErrCalc(null); setBombaSel(null)
    try {
      const res = await fetch(`${API_BOMBAS}?height=${h}&liters=${l}&diameter=${d}&season=verano&_t=${Date.now()}`)
      const data = await res.json()
      if (data.ok) {
        setResultado(data)
        // PATCH bomba sugerida al cálculo MCA si existe
        const calcId = (window as any)._ultimoCalcMcaId
        if (calcId && data.sugerencia?.codigo) {
          fetch('/api/calculos-mca', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: calcId, bomba_sugerida: data.sugerencia.codigo, litros_dia: Number(l), caudal_verano: data.caudal_a_altura?.verano || null, caudal_invierno: data.caudal_a_altura?.invierno || null })
          }).catch(() => {})
        }
      }
      else setErrCalc(data.error || 'No se encontró bomba')
    } catch { setErrCalc('Error de red al buscar bomba.') }
    finally { setBuscando(false) }
  }

  async function cargarCatalogo() {
    if (catalogo.length > 0) {
      setVerCatalogo(true)
      setTimeout(() => document.getElementById('catalogo-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
      return
    }
    setCargandoCatalogo(true)
    try {
      const res = await fetch(`${API_BOMBAS}?catalog=1&_t=${Date.now()}`)
      const data = await res.json()
      if (data.ok) setCatalogo(data.catalog || [])
    } catch {}
    finally { setCargandoCatalogo(false) }
    setVerCatalogo(true)
    setTimeout(() => document.getElementById('catalogo-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  function cerrarCatalogo() {
    setVerCatalogo(false)
    setTimeout(() => {
      const destino = resultado ? 'resultado-section' : 'buscar-bomba-section'
      document.getElementById(destino)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  function seleccionarDesdeCatalogo(b: BombaCatalogo) {
    const bomba = {
      codigo: b.codigo,
      marca: b.marca,
      watts: b.watts,
      diam_bomba: b.diam_bomba,
      diam_perf: b.diam_perf,
      cant_paneles: b.cant_paneles,
      stock: b.stock,
      precio_full: b.precio_full,
      cuota_mensual: b.cuota_mensual ?? null,        // valor NAVE sincronizado del sheet
      precio_6cuotas: (b as any).precio_6cuotas ?? null,
      tipo: 'sumergible',
      impulsor: '',
      voltaje: '',
      energia: b.energia || 'solar',   // energia real del sheet (para detectar híbrida)
    }
    setResultado({ sugerencia: bomba, caudal_a_altura: null, es_fallback: false, nota: 'Seleccionado desde catálogo', opciones: [] })
    setBombaSel(null)
    setVerCatalogo(false)
    setTimeout(() => document.getElementById('resultado-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  async function verificarToken(t: string) {
    try {
      const res = await fetch(`/api/verificar-token?token=${encodeURIComponent(t)}`)
      const data = await res.json()
      if (!data?.ok || !data.revendedor) { setError('token_invalido'); return }
      setRev(data.revendedor)
      // Reset de PIN ordenado por el admin (one-shot): borrar el PIN viejo de este
      // dispositivo y la sesión, para que el rev configure uno nuevo al entrar.
      if (data.revendedor.pin_reset) {
        localStorage.removeItem(llavePIN(t))
        sessionStorage.removeItem(llaveSession(t))
      }
      // Si tiene skip_pin o ya verificó en esta sesión → entrar directo
      if (data.revendedor.skip_pin || sessionStorage.getItem(llaveSession(t))) {
        setPinEstado('ok'); return
      }
      // Chequear si ya tiene PIN configurado en este dispositivo
      const pinExistente = localStorage.getItem(llavePIN(t))
      if (pinExistente) {
        setPinGuardado(pinExistente)
        setPinEstado('pedir_existente')
      } else {
        setPinEstado('pedir_nuevo')
      }
    } catch { setError('error_red') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token') || localStorage.getItem('febecos-token')
    if (!t) {
      // Sin token: chequeamos si hay demo activa
      fetch('/api/demo')
        .then(r => r.json())
        .then(data => {
          if (data.ok) {
            // Demo válida — acceso completo con banner
            const demoToken = data.email ? `DEMO-${data.email}` : 'DEMO'
            setToken(demoToken)
            setRev({ id: 0, nombre: 'Demo', apellido: '', empresa: 'Portal Demo', provincia: 'Buenos Aires', descuento_pct: 7, token_acceso: demoToken, tipo_usuario: 'demo' })
            setDiasDemo(data.diasRestantes)
            setPinEstado('ok')
          } else if (data.expired) {
            setError('demo_expirado')
          } else {
            setError('no_token')
          }
          setLoading(false)
        })
        .catch(() => { setError('no_token'); setLoading(false) })
      return
    }
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

  function usarMCA(mca: number, litros: number, diam: string, prof: number = 0, distSensor: number = 0, litrosHora: number | null = null) {
    setAltura(String(mca))
    setLitros(String(litros))
    setDiametro(diam)
    setProfundidad(prof)
    setDistSensorMCA(distSensor)
    setLitrosHoraMCA(litrosHora)
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
  if (error === 'no_token') return <Pantalla emoji="🔒" titulo="Acceso restringido" sub="Este portal requiere un link de acceso personalizado." cta={{ label: 'Registrarme', href: '/unirse' }} cta2={{ label: 'WhatsApp', href: 'https://wa.me/5491125750323' }} />
  if (error === 'token_invalido') return <Pantalla emoji="❌" titulo="Link inválido o desactivado" sub="Este link no es válido o fue desactivado." cta={{ label: 'Escribinos por WhatsApp', href: 'https://wa.me/5491125750323' }} />
  if (error === 'demo_expirado') return (
    <div style={{ minHeight:'100vh', background:'#0d1a2a', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'#132236', borderRadius:16, padding:'40px 32px', maxWidth:400, width:'100%', textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⏰</div>
        <h2 style={{ color:'#e8f0f8', fontSize:22, fontWeight:800, marginBottom:8 }}>Tu demo de 7 días terminó</h2>
        <p style={{ color:'#7a9ab5', fontSize:14, lineHeight:1.65, marginBottom:28 }}>
          Esperamos que hayas podido explorar el portal. Para seguir cotizando y acceder a tus precios mayoristas, completá el registro — es gratis y sin compromiso.
        </p>
        <a href="/unirse#formulario" style={{ display:'block', padding:'14px', background:'#a8c61b', color:'#003d72', borderRadius:10, fontWeight:800, fontSize:15, textDecoration:'none', marginBottom:12 }}>
          Registrarme ahora →
        </a>
        <a href="https://wa.me/5491125750323?text=Hola%2C%20us%C3%A9%20el%20portal%20demo%20y%20me%20interesa%20registrarme." target="_blank" rel="noopener noreferrer"
          style={{ display:'block', padding:'12px', background:'#25d366', color:'#fff', borderRadius:10, fontWeight:700, fontSize:14, textDecoration:'none' }}>
          💬 Hablar con un asesor
        </a>
      </div>
    </div>
  )
  if (error || !rev) return <Pantalla emoji="⚠️" titulo="Error de conexión" sub="No pudimos verificar tu acceso. Intentá recargar." />

  // ── PANTALLA DE PIN ───────────────────────────────────────────────────────
  if (pinEstado === 'pedir_nuevo' || pinEstado === 'pedir_existente') {
    const esNuevo = pinEstado === 'pedir_nuevo'
    return (
      <div style={{ minHeight:'100vh', background:'#0d1a2a', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
        <div style={{ background:'#132236', borderRadius:'16px', padding:'40px 32px', maxWidth:'360px', width:'100%', textAlign:'center', boxShadow:'0 4px 32px rgba(0,0,0,0.4)' }}>
          <div style={{ fontSize:'48px', marginBottom:'16px' }}>{esNuevo ? '🔐' : '🔑'}</div>
          <h2 style={{ color:'#e8f0f8', fontSize:'20px', marginBottom:'8px' }}>
            {esNuevo ? 'Elegí tu PIN de acceso' : `Bienvenido, ${rev.nombre}`}
          </h2>
          <p style={{ color:'#6b8fa8', fontSize:'14px', lineHeight:'1.6', marginBottom:'24px' }}>
            {esNuevo
              ? 'Creá un PIN de 4 dígitos. Lo vas a necesitar cada vez que entres al portal desde un dispositivo nuevo.'
              : 'Ingresá tu PIN de 4 dígitos para continuar.'}
          </p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pinInput}
            onChange={e => { setPinInput(e.target.value.replace(/\D/g,'')); setPinError(null) }}
            onKeyDown={e => e.key === 'Enter' && verificarPIN()}
            placeholder="● ● ● ●"
            autoFocus
            style={{
              width:'100%', padding:'16px', fontSize:'28px', textAlign:'center', letterSpacing:'16px',
              background:'#0d1a2a', border: pinError ? '2px solid #f87171' : '2px solid #1e3a5a',
              borderRadius:'10px', color:'#e8f0f8', outline:'none', marginBottom:'8px', boxSizing:'border-box'
            }}
          />
          {pinError && <p style={{ color:'#f87171', fontSize:'13px', margin:'0 0 12px' }}>{pinError}</p>}
          <button
            onClick={verificarPIN}
            disabled={pinInput.length !== 4}
            style={{
              width:'100%', padding:'14px', background: pinInput.length === 4 ? '#e8681a' : '#1e3a5a',
              color:'#fff', border:'none', borderRadius:'10px', fontSize:'16px', fontWeight:'700',
              cursor: pinInput.length === 4 ? 'pointer' : 'not-allowed', transition:'background 0.2s'
            }}
          >
            {esNuevo ? 'Crear PIN y entrar →' : 'Entrar →'}
          </button>
          {esNuevo && (
            <p style={{ color:'#4a6a84', fontSize:'12px', marginTop:'16px', lineHeight:'1.5' }}>
              💡 El PIN se guarda en este dispositivo. En otro dispositivo te va a pedir crear uno nuevo.
            </p>
          )}
          <p style={{ color:'#2a4a64', fontSize:'12px', marginTop:'12px' }}>
            Febecos · Portal de Revendedores
          </p>
        </div>
      </div>
    )
  }
  // ─────────────────────────────────────────────────────────────────────────

  const catalogoFiltrado = catalogo
    .filter(b => filtroStock === 'todos' ? true : filtroStock === 'local' ? (b.stock || 0) > 0 : (b.stock || 0) === 0)
    .filter(b => filtroDiam === 'todos' ? true : String(b.diam_bomba) === filtroDiam)
    .filter(b => {
      if (filtroTipo === 'todos') return true
      const esHibrida = esBombaHibrida(b)
      return filtroTipo === 'hibrida' ? esHibrida : !esHibrida
    })
    .filter(b => {
      if (filtroWatts === 'todos') return true
      if (filtroWatts === 'low') return (b.watts || 0) <= 300
      if (filtroWatts === 'mid') return (b.watts || 0) > 300 && (b.watts || 0) <= 600
      if (filtroWatts === 'high') return (b.watts || 0) > 600
      return true
    })

  return (
    <div style={s.wrap}>
      {modalCodigo && (
        <ModalDetalle
          codigo={modalCodigo}
          descuento={rev.descuento_pct}
          mostrarPublico={mostrarPublico}
          onClose={() => setModalCodigo(null)}
          onPresupCreado={(c: string) => setCodigoCotizado(c)}
          revendedor={`${rev.nombre} ${rev.apellido}`}
          revProvincia={rev.provincia || ''}
          revTipo={rev.tipo_usuario || 'revendedor'}
          revToken={token}
          revEmail={rev.email}
          revEmpresa={rev.empresa || ''}
          revDomicilio={rev.domicilio || ''}
          revCuit={rev.cuit || ''}
          revLogo={rev.puede_cotizar_con_marca && rev.logo_base64 ? rev.logo_base64 : null}
          profundidadInicial={profundidad}
          busquedaMCA={altura ? Number(altura) : null}
          busquedaLitros={litros ? Number(litros) : null}
          busquedaDiametro={diametro || null}
          distSensorInicial={distSensorMCA}
          busquedaLitrosHora={litrosHoraMCA}
          clienteInicial={clienteInicial}
        />
      )}

      {/* ── MODAL: MIS COTIZACIONES ──────────────────────────────────────────── */}
      {showCotis && (
        <div onClick={() => setShowCotis(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0d1a2a', border: '1px solid #1e3248', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #1e3248' }}>
              <div>
                <div style={{ color: '#e8f0f8', fontWeight: 700, fontSize: 16 }}>📄 Mis cotizaciones</div>
                <div style={{ fontSize: 11, color: '#7a9ab5', marginTop: 2 }}>Tus presupuestos generados — abrí el link para compartirlos</div>
              </div>
              <button onClick={() => setShowCotis(false)} style={{ background: 'none', border: 'none', color: '#7a9ab5', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>
            {/* Buscador */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #1e3248' }}>
              <input
                type="text"
                placeholder="🔍 Buscar por N° (ej: 0068), cliente o código de bomba…"
                value={buscadorCotis}
                onChange={e => setBuscadorCotis(e.target.value)}
                style={{ width: '100%', background: '#0d1a2a', border: '1px solid #1e3248', borderRadius: 8, padding: '9px 12px', color: '#e8f0f8', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const, outline: 'none' }}
              />
            </div>
            <div style={{ overflowY: 'auto', padding: '12px 16px' }}>
              {cargandoCotis && <div style={{ color: '#7a9ab5', textAlign: 'center', padding: 30 }}>⏳ Cargando…</div>}
              {!cargandoCotis && cotis?.length === 0 && (
                <div style={{ color: '#7a9ab5', textAlign: 'center', padding: 30, fontSize: 13 }}>Todavía no generaste ninguna cotización.</div>
              )}
              {!cargandoCotis && (cotis?.filter((c: any) => {
                if (!buscadorCotis.trim()) return true
                const q = buscadorCotis.trim().toLowerCase()
                return (
                  (c.numero || '').toLowerCase().includes(q) ||
                  (c.cliente_nombre || '').toLowerCase().includes(q) ||
                  (c.cliente_apellido || '').toLowerCase().includes(q) ||
                  (c.cliente_razon_social || '').toLowerCase().includes(q) ||
                  (c.bomba_codigo || '').toLowerCase().includes(q) ||
                  (c.bomba_descripcion || '').toLowerCase().includes(q)
                )
              }) || []).map((c: any) => {
                const fecha = c.created_at ? new Date(c.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
                const precio = c.precio_ofrecido ?? c.precio_publico
                const cli = [c.cliente_nombre, c.cliente_apellido].filter(Boolean).join(' ') || c.cliente_razon_social || 'Sin cliente'
                const link = c.public_token ? `${PUBLIC_BASE}/p/${c.public_token}` : null
                const linkRev = link ? `${link}?rev=${token || ''}` : null
                return (
                  <div key={c.id} style={{ background: '#132233', border: '1px solid #1e3248', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#e8f0f8' }}>N° {c.numero} · {cli}</div>
                        <div style={{ fontSize: 11, color: '#7a9ab5', marginTop: 2 }}>{c.bomba_codigo || ''}{c.bomba_watts ? ` · ${c.bomba_watts}W` : ''} · {fecha}</div>
                      </div>
                      {precio != null && <div style={{ fontSize: 15, fontWeight: 800, color: '#4ade80', whiteSpace: 'nowrap' as const }}>$ {Math.round(precio).toLocaleString('es-AR')}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' as const }}>
                      {link ? (
                        <>
                          <a href={linkRev || link} target="_blank" rel="noopener" style={{ flex: 1, minWidth: 120, textAlign: 'center' as const, padding: '8px 10px', background: '#1e3248', border: '1px solid #2a4a6a', borderRadius: 8, color: '#e8f0f8', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>🔗 Abrir / Ver</a>
                          <button onClick={() => { navigator.clipboard?.writeText(link); }} style={{ padding: '8px 12px', background: 'rgba(37,211,102,0.12)', border: '1px solid #25d366', borderRadius: 8, color: '#25d366', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>📋 Copiar link</button>
                          <a href={`https://wa.me/?text=${encodeURIComponent(`Presupuesto Febecos N° ${c.numero}${precio != null ? ` — $${Math.round(precio).toLocaleString('es-AR')}` : ''}\n${link}`)}`} target="_blank" rel="noopener" style={{ padding: '8px 12px', background: 'rgba(37,211,102,0.12)', border: '1px solid #25d366', borderRadius: 8, color: '#25d366', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>💬 WhatsApp</a>
                        </>
                      ) : (
                        <span style={{ fontSize: 11, color: '#7a9ab5', fontStyle: 'italic' as const }}>Cotización antigua sin link compartible</span>
                      )}
                      {c.bomba_codigo && (
                        <button
                          onClick={() => recotizar(c)}
                          style={{ padding: '8px 14px', background: '#e8681a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          title="Abre la misma bomba con precios actualizados y datos del cliente pre-cargados"
                        >🔄 Re-cotizar con precio actual</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── BANNER DEMO ─────────────────────────────────────────────────────── */}
      {diasDemo !== null && (
        <div style={{
          background: diasDemo <= 1 ? '#c0392b' : diasDemo <= 2 ? '#e67e22' : '#a8c61b',
          padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>{diasDemo <= 1 ? '🚨' : diasDemo <= 2 ? '⚠️' : '👀'}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: diasDemo <= 2 ? '#fff' : '#003d72' }}>
              {diasDemo <= 1 ? '¡Último día de prueba!' : diasDemo <= 2 ? `Te queda ${diasDemo} día — ¡registrate ahora!` : `Modo demo · ${diasDemo} días restantes`}
            </span>
            {diasDemo > 2 && <span style={{ fontSize: 12, color: '#2d4a00' }}>— Estás viendo el portal completo con descuento Nivel 1 (7%)</span>}
          </div>
          <a href="/unirse#formulario" style={{ background: diasDemo <= 2 ? '#fff' : '#003d72', color: diasDemo <= 2 ? '#c0392b' : '#fff', borderRadius: 7, padding: '6px 16px', fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' as const }}>
            Registrarme para acceso permanente →
          </a>
        </div>
      )}

      <div style={s.header}>
        <div style={s.headerInner}>
          <div>
            <img src="https://selector.febecos.com/images/febecos-logo.png" alt="Febecos" style={{ height: 32, objectFit: 'contain' as const }} />
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
            <a href={`/portal/perfil?token=${token}`} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #1e3248', borderRadius: 8, color: '#7a9ab5', fontSize: 12, cursor: 'pointer', textDecoration: 'none' }}>
              ⚙️ Mi perfil
            </a>
            <button onClick={() => { localStorage.removeItem('febecos-token'); window.location.href = 'https://revendedores-six.vercel.app' }} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #1e3248', borderRadius: 8, color: '#7a9ab5', fontSize: 12, cursor: 'pointer' }}>
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* ── Barra de acceso rápido ── */}
      <div style={{ background: '#0d1a2a', borderBottom: '1px solid #1e3248', padding: '8px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={abrirCotizaciones} style={{ padding: '7px 16px', background: 'rgba(232,104,26,0.15)', border: '1px solid #e8681a', borderRadius: 8, color: '#e8681a', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            📄 Mis cotizaciones
          </button>
          {rev.puede_ver_fv && (
            <a
              href={`https://fv.febecos.com/cotizar#rev=${encodeURIComponent(token || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: '7px 16px', background: 'rgba(234,179,8,0.15)', border: '1px solid #eab308', borderRadius: 8, color: '#eab308', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' as const }}
            >
              ☀️ Cotizador FV
            </a>
          )}
          <span style={{ fontSize: 12, color: '#3a5a7a' }}>Tus presupuestos generados — compartí el link con tu cliente</span>
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
            onClick={() => verCatalogo ? cerrarCatalogo() : cargarCatalogo()}
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
                <option value="2">2" — perforación 63mm (≈2½")</option>
                <option value="3">3" — perforación 80-100mm</option>
                <option value="4">4" — perforación 110-120mm</option>
                <option value="6">6" — perforación 160mm</option>
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
        {resultado && !buscando && (
          <div style={{ textAlign: 'right' as const, marginTop: -8, marginBottom: 8 }}>
            <button onClick={() => { setResultado(null); setAltura(''); setLitros(''); setErrCalc(null); setBombaSel(null); setCodigoCotizado(null); document.getElementById('buscar-bomba-section')?.scrollIntoView({ behavior:'smooth', block:'start' }) }} style={{ padding:'7px 14px', background:'transparent', border:'1px solid #1e3248', borderRadius:8, color:'#7a9ab5', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              🔄 Volver a calcular
            </button>
          </div>
        )}
        {/* RESULTADO BÚSQUEDA */}
        {resultado && !buscando && (
          <div id="resultado-section" style={s.card}>
            {resultado.es_fallback && (() => {
              // caudal_a_altura.verano es lo que rinde la bomba a esa altura
              const caudalBomba = resultado.caudal_a_altura?.verano || 0
              const litrosPedidos = Number(litros) || 0
              const cubre = caudalBomba >= litrosPedidos
              const conStock = (resultado.sugerencia?.stock || 0) > 0
              return (
                <div style={{
                  background: 'rgba(251,146,60,0.12)',
                  border: '2px solid #fb923c',
                  borderRadius:10, padding:'14px 18px', marginBottom:16, display:'flex', gap:12, alignItems:'flex-start'
                }}>
                  <div style={{ fontSize:28, lineHeight:1 }}>⚠️</div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:'#fb923c', marginBottom:4 }}>
                      {cubre
                        ? conStock ? 'Bomba encontrada — disponible en stock' : 'Bomba encontrada — a verificar stock en depósito'
                        : 'Ninguna bomba cubre exactamente lo solicitado'
                      }
                    </div>
                    <div style={{ fontSize:12, color:'#fdba74', lineHeight:1.5 }}>
                      {cubre
                        ? conStock
                          ? <>Esta bomba cubre tus requerimientos ({caudalBomba.toLocaleString('es-AR')} L/día en verano &gt; {litrosPedidos.toLocaleString('es-AR')} L/día solicitados) y está disponible en stock.</>
                          : <>Esta bomba cubre los {litrosPedidos.toLocaleString('es-AR')} L/día ({caudalBomba.toLocaleString('es-AR')} L/día en verano) pero <strong>no tiene stock inmediato</strong>. Consultá disponibilidad por WhatsApp.</>
                        : <>No hay equipo que cubra los {litrosPedidos.toLocaleString('es-AR')} L/día a {altura}m. La opción más cercana entrega {caudalBomba.toLocaleString('es-AR')} L/día en verano{conStock ? '' : ' y además no tiene stock inmediato'}. Consultá con el equipo Febecos.</>
                      }
                    </div>
                  </div>
                </div>
              )
            })()}
            <div style={s.cardTitle}>{resultado.es_fallback ? '📋 Opción más cercana disponible' : '✅ Bombas disponibles — seleccioná la que mejor se adapta'}</div>
            <BombaCard bomba={resultado.sugerencia} caudal={resultado.caudal_a_altura} nota={resultado.nota} descuento={rev.descuento_pct} mostrarPublico={mostrarPublico} precioMostrar={precioMostrar} wa={rev} litros={Number(litros)} altura={Number(altura)} onVerDetalle={setModalCodigo} onSeleccionar={seleccionar} seleccionada={bombaSel === resultado.sugerencia?.codigo} esCotizada={codigoCotizado === resultado.sugerencia?.codigo} token={token} puedeOnline={!!rev.puede_pedir_online} esDemo={diasDemo !== null} />
            {resultado.opciones && resultado.opciones.length > 1 && (
              <>
                {resultado.opciones.slice(1).map((b: any, i: number) => (
                  <BombaCard key={i} bomba={b} caudal={{ verano: b.caudal_verano, invierno: b.caudal_invierno, promedio: b.caudal_promedio || Math.round((b.caudal_verano + b.caudal_invierno) / 2) }} descuento={rev.descuento_pct} mostrarPublico={mostrarPublico} precioMostrar={precioMostrar} wa={rev} litros={Number(litros)} altura={Number(altura)} onVerDetalle={setModalCodigo} onSeleccionar={seleccionar} seleccionada={bombaSel === b.codigo} esCotizada={codigoCotizado === b.codigo} token={token} puedeOnline={!!rev.puede_pedir_online} esDemo={diasDemo !== null} />
                ))}
              </>
            )}
          </div>
        )}

        {/* CATÁLOGO */}
        {verCatalogo && catalogo.length > 0 && (
          <div id="catalogo-section" style={s.card}>
            {/* Título + filtros en una sola fila compacta */}
            {(() => {
              const chip = (active: boolean, extraColor?: string): React.CSSProperties => ({
                padding: '3px 9px', borderRadius: 5, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: active ? 700 : 500,
                background: active ? '#1e3248' : 'transparent',
                color: active ? '#e8f0f8' : (extraColor || '#7a9ab5'),
                transition: 'all 0.12s', whiteSpace: 'nowrap' as const,
              })
              const group: React.CSSProperties = { display:'flex', gap:2, background:'#0d1c2b', borderRadius:6, padding:2, border:'1px solid #1e3248' }
              const div: React.CSSProperties = { width:1, height:14, background:'#1e3248', alignSelf:'center' }
              return (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap' as const, gap:8, marginBottom:14 }}>
                  <div style={{ ...s.cardTitle, marginBottom:0 }}>🔋 Catálogo de bombas</div>
                  <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' as const }}>
                    <div style={group}>
                      {[{v:'todos',l:'Tipo'},{v:'solar',l:'☀️'},{v:'hibrida',l:'⚡🌞'}].map(t => (
                        <button key={t.v} onClick={() => setFiltroTipo(t.v)} style={chip(filtroTipo===t.v)} title={t.v==='todos'?'Todos los tipos':t.v==='solar'?'Solar':'Híbrida'}>{t.l}</button>
                      ))}
                    </div>
                    <div style={div}/>
                    <div style={group}>
                      {[{v:'todos',l:'⌀'},{v:'2',l:'2"'},{v:'3',l:'3"'},{v:'4',l:'4"'}].map(d => (
                        <button key={d.v} onClick={() => setFiltroDiam(d.v)} style={chip(filtroDiam===d.v)} title={d.v==='todos'?'Todos los diámetros':d.l}>{d.l}</button>
                      ))}
                    </div>
                    <div style={div}/>
                    <div style={group}>
                      {[{v:'todos',l:'W'},{v:'low',l:'≤300'},{v:'mid',l:'300-600'},{v:'high',l:'+600'}].map(w => (
                        <button key={w.v} onClick={() => setFiltroWatts(w.v)} style={chip(filtroWatts===w.v)} title={w.v==='todos'?'Todos los watts':w.l+'W'}>{w.l}</button>
                      ))}
                    </div>
                    <div style={div}/>
                    <div style={group}>
                      <button onClick={() => setFiltroStock('todos')} style={chip(filtroStock==='todos')} title="Todos">Todo</button>
                      <button onClick={() => setFiltroStock('local')} style={chip(filtroStock==='local', '#22c55e')} title={`En local (${catalogo.filter(b=>(b.stock||0)>0).length})`}>✅ {catalogo.filter(b=>(b.stock||0)>0).length}</button>
                      <button onClick={() => setFiltroStock('deposito')} style={chip(filtroStock==='deposito', '#fb923c')} title={`A verificar (${catalogo.filter(b=>(b.stock||0)===0).length})`}>📦 {catalogo.filter(b=>(b.stock||0)===0).length}</button>
                    </div>
                    {catalogoFiltrado.length < catalogo.length && (
                      <span style={{ fontSize:10, color:'#7a9ab5', marginLeft:2 }}>{catalogoFiltrado.length}/{catalogo.length}</span>
                    )}
                  </div>
                </div>
              )
            })()}
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
                        <button onClick={() => seleccionarDesdeCatalogo(b)} style={{ padding: '6px 10px', background: 'rgba(74,222,128,0.12)', border: '1.5px solid #4ade80', borderRadius: 7, color: '#4ade80', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                          📋 Seleccionar
                        </button>
                        <a href={`https://wa.me/5491125750323?text=${msg}`} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 10px', background: '#25d366', color: '#fff', borderRadius: 7, textDecoration: 'none', fontWeight: 700, fontSize: 11, textAlign: 'center' as const, whiteSpace: 'nowrap' as const, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          Consultar
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

          <div style={s.infoCard}><div style={s.infoEmoji}>🤝</div><div style={s.infoTitulo}>Soporte técnico</div><div style={s.infoSub}><a href="https://wa.me/5491125750323" style={{ color: '#e8681a', fontWeight: 700 }}>WhatsApp directo →</a></div></div>
          <div style={s.infoCard}><div style={s.infoEmoji}>📦</div><div style={s.infoTitulo}>Stock en tiempo real</div><div style={s.infoSub}>Precios y disponibilidad actualizados automáticamente</div></div>
        </div>

      </div>
    </div>
  )
}

function BombaCard({ bomba, caudal, nota, descuento, mostrarPublico, precioMostrar, wa, litros, altura, onVerDetalle, onSeleccionar, seleccionada = false, esCotizada = false, token, puedeOnline = false, esDemo = false }: any) {
  const [mostrarROI, setMostrarROI] = useState(false)
  const [provincia, setProvincia] = useState('')
  const [sistemaActual, setSistemaActual] = useState('')
  const [mostrarPago, setMostrarPago] = useState(false)
  const [pagoTab, setPagoTab] = useState<'transferencia'|'nave'|'mp'>('transferencia')
  const [pedidoLoading, setPedidoLoading] = useState(false)
  const [pedidoEnviado, setPedidoEnviado] = useState(false)
  const [pedidoError, setPedidoError] = useState('')
  const [aceptaTCPago, setAceptaTCPago] = useState(false)
  const precio = precioMostrar(bomba.precio_full)
  const precioPublico = bomba.precio_full
  const msg = encodeURIComponent(
    `Hola Febecos! Soy revendedor (${wa.nombre} ${wa.apellido || ''}, ${wa.empresa || wa.provincia}).\n` +
    `Consulto por bomba *${bomba.codigo}* para cliente con ${litros} L/día a ${altura}m.\n` +
    `Precio mayorista: ${fmt(precioMayorista(precioPublico, descuento))}`
  )
  const PROVINCIAS = ['Buenos Aires','CABA','Catamarca','Chaco','Chubut','Córdoba','Corrientes','Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones','Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán']
  const SISTEMAS = [
    { id: 'generator', val: 'generator', label: '⚡ Generador solo' },
    { id: 'mill-generator', val: 'mill-generator', label: '⚡🌀 Generador + Molino' },
    { id: 'windmill', val: 'windmill', label: '🌀 Molino solo' },
    { id: 'sin-agua', val: 'sin-agua', label: '🚰 Sin sistema actual' },
  ]
  function roiUrl() {
    const sistemaVal = SISTEMAS.find(s => s.id === sistemaActual)?.val || sistemaActual
    const params = new URLSearchParams({ pump: bomba.codigo, height: String(altura), liters: String(litros) })
    if (provincia) params.set('zone', provincia)
    if (sistemaVal) params.set('compare', sistemaVal)
    return `https://roi.febecos.com?${params.toString()}`
  }

  async function enviarPedido(metodo: 'transferencia' | 'nave' | 'mercadopago') {
    if (!aceptaTCPago) {
      setPedidoError('Debés aceptar los Términos y Condiciones para continuar.')
      return
    }
    setPedidoLoading(true)
    setPedidoError('')
    try {
      const esMayorista = metodo === 'transferencia' && descuento > 0
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revendedor_id:     wa?.id || null,
          revendedor_nombre: wa ? `${wa.nombre} ${wa.apellido || ''}`.trim() : null,
          revendedor_email:  wa?.email || null,
          revendedor_token:  token || null,
          bomba_codigo:      bomba.codigo,
          bomba_descripcion: `${bomba.marca || ''} ${bomba.watts}W — ${bomba.impulsor || ''}`.trim(),
          litros_dia:        litros || null,
          altura_m:          altura || null,
          precio_publico:    precioPublico,
          precio_final:      esMayorista ? precioMayoristaCalc : precioPublico,
          descuento_pct:     esMayorista ? descuento : 0,
          tipo_comprador:    esMayorista ? 'revendedor' : 'cliente_final',
          metodo_pago:       metodo,
        }),
      })
      const data = await res.json()
      if (!data.ok) { setPedidoError(`Error: ${data.error || 'No se pudo registrar el pedido'}. Reintentá.`); return }
      setPedidoEnviado(true)
    } catch {
      setPedidoError('Error de conexión. Reintentá.')
    } finally {
      setPedidoLoading(false)
    }
  }

  const precioMayoristaCalc = precioMayorista(precioPublico, descuento)
  // Cuota y total NAVE: se toman TAL CUAL los sincroniza el sheet (cuota_mensual y
  // precio_6cuotas). NO se calculan acá. Si el sheet no los trae, es un dato a
  // completar en la planilla — no se inventa con precio/6.
  const cuotaNave = bomba.cuota_mensual || null
  const totalNave = bomba.precio_6cuotas || null
  // En modo mayorista, solo transferencia está disponible
  const effectivePagoTab = mostrarPublico ? pagoTab : 'transferencia'

  const msgTransferencia = encodeURIComponent(
    `Hola Febecos! Soy ${wa.nombre} ${wa.apellido || ''} (${wa.empresa || wa.provincia}).\n` +
    `Quiero comprar la bomba *${bomba.codigo}* (${bomba.watts}W).\n` +
    `Precio mayorista: ${fmt(precioMayoristaCalc)}\n` +
    `Por favor enviame la factura para hacer la transferencia.`
  )
  const msgNave = encodeURIComponent(
    `Hola Febecos! Soy ${wa.nombre} ${wa.apellido || ''} (${wa.empresa || wa.provincia}).\n` +
    `Mi cliente quiere comprar la bomba *${bomba.codigo}* (${bomba.watts}W) en 6 cuotas con NAVE.\n` +
    `Precio público: ${fmt(precioPublico)}\n` +
    `Por favor enviarme el link de pago de NAVE.`
  )

  return (
    <div style={{ ...s.bombaCard, padding: '20px', border: seleccionada ? '2px solid #e8681a' : esCotizada ? '2px solid #3b82f6' : '1px solid #1e3248', position: 'relative' as const }}>
      {seleccionada && (
        <div style={{ position:'absolute' as const, top:12, right:12, background:'#e8681a', color:'#fff', borderRadius:6, padding:'3px 10px', fontSize:11, fontWeight:700 }}>
          ✓ Seleccionado
        </div>
      )}
      {!seleccionada && esCotizada && (
        <div style={{ position:'absolute' as const, top:12, right:12, background:'#1d4ed8', color:'#bfdbfe', borderRadius:6, padding:'3px 10px', fontSize:11, fontWeight:700 }}>
          📄 Ya cotizado
        </div>
      )}
      {/* Info básica siempre visible */}
      <div style={s.bombaCodigo}>{bomba.codigo}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: esBombaHibrida(bomba) ? '#fbbf24' : '#4ade80', marginBottom: 4 }}>
        {esBombaHibrida(bomba)
          ? '⚡🌞 Bomba híbrida — funciona con sol y/o con generador'
          : '☀️ Bomba solar'}
      </div>
      <div style={s.bombaDetails}>
        <span>{bomba.watts}W</span><span>·</span>
        <span>{bomba.cant_paneles} panel{bomba.cant_paneles > 1 ? 'es' : ''}</span><span>·</span>
        <span>Bomba {bomba.diam_bomba || bomba.diam_perf || '—'}"</span><span>·</span>
        <span style={{ color: bomba.stock > 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
          {bomba.stock > 0 ? `Stock: ${bomba.stock}` : '📦 A verificar'}
        </span>
      </div>
      {caudal && (
        <div style={s.caudalRow}>
          <div style={s.caudalItem}><span style={s.caudalLbl}>Verano</span><span style={s.caudalVal}>{(caudal.verano || 0).toLocaleString('es-AR')} L/día</span></div>
          <div style={s.caudalItem}><span style={s.caudalLbl}>Promedio</span><span style={s.caudalVal}>{(caudal.promedio || 0).toLocaleString('es-AR')} L/día</span></div>
          <div style={s.caudalItem}><span style={s.caudalLbl}>Invierno</span><span style={s.caudalVal}>{(caudal.invierno || 0).toLocaleString('es-AR')} L/día</span></div>
        </div>
      )}
      {/* Precio */}
      <div style={{ marginBottom: 16 }}>
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
{/* nota ocultada cuando bomba cubre requerimientos */}

      {/* BOTÓN SELECCIONAR — siempre visible */}
      {!seleccionada ? (
        <button
          onClick={() => onSeleccionar(bomba)}
          style={{ width:'100%', padding:'12px', background:'rgba(74,222,128,0.12)', border:'1.5px solid #4ade80', borderRadius:8, color:'#4ade80', fontSize:14, fontWeight:700, cursor:'pointer', marginTop:12 }}
        >
          📋 Seleccionar este equipo
        </button>
      ) : (
        /* ACCIONES — solo cuando está seleccionado */
        <div style={{ marginTop: 12, display:'flex', flexDirection:'column' as const, gap:8 }}>
          <div style={{ display:'flex', flexDirection:'column' as const, gap:8 }}>
            <button onClick={() => onVerDetalle(bomba.codigo)} style={{ width:'100%', padding:'12px 14px', background:'#e8681a', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', letterSpacing:0.2 }}>
              📋 Ver detalle y compartir presupuesto
            </button>
            <a href={`https://wa.me/5491125750323?text=${msg}`} target="_blank" rel="noopener noreferrer" style={{ width:'100%', ...s.btnWA, display:'flex', alignItems:'center', justifyContent:'center', gap:6, textDecoration:'none', boxSizing:'border-box' as const }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Consultar por WhatsApp
            </a>
          </div>

          {/* PAGO — online si está habilitado, telefónico si no */}
          {puedeOnline || mostrarPublico ? (
            <button
              onClick={() => setMostrarPago(!mostrarPago)}
              style={{ width:'100%', padding:'10px', background: mostrarPago ? '#1e3248' : 'rgba(74,222,128,0.08)', border:`1.5px solid ${mostrarPago?'#2a4a6a':'#4ade80'}`, borderRadius:8, color: mostrarPago?'#7a9ab5':'#4ade80', fontSize:13, fontWeight:700, cursor:'pointer' }}
            >
              {mostrarPago ? '▲ Cerrar opciones de pago' : '💳 Opciones de pago'}
            </button>
          ) : esDemo ? (
            /* Demo: no puede hacer pedidos — invitar a registrarse */
            <a
              href="/unirse#formulario"
              style={{ width:'100%', padding:'10px', background:'rgba(168,198,27,0.10)', border:'1.5px solid #a8c61b', borderRadius:8, color:'#a8c61b', fontSize:13, fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:6, boxSizing:'border-box' as const }}
            >
              🔒 Registrate para hacer pedidos →
            </a>
          ) : (
            <a
              href={`https://wa.me/5491125750323?text=${encodeURIComponent(`Hola Febecos! Soy revendedor (${wa.nombre} ${wa.apellido||''}, ${wa.empresa||wa.provincia}).\nQuiero hacer un pedido de ${bomba.codigo}.\nPrecio mayorista acordado: ${fmt(precioMayorista(bomba.precio_full, descuento))}`)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ width:'100%', padding:'10px', background:'rgba(74,222,128,0.08)', border:'1.5px solid #4ade80', borderRadius:8, color:'#4ade80', fontSize:13, fontWeight:700, cursor:'pointer', textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:6, boxSizing:'border-box' as const }}
            >
              📞 Hacer pedido por WhatsApp
            </a>
          )}
          {mostrarPago && (
            <div style={{ background:'#0a1520', border:'1px solid #1e3248', borderRadius:10, padding:16 }}>
              {/* Tabs */}
              {(() => {
                const pagoTabs = mostrarPublico
                  ? [
                      { key:'transferencia' as const, label:'🏦 Transferencia', sub:'Precio público' },
                      { key:'nave' as const, label:'📅 6 cuotas NAVE', sub:'Precio público' },
                      { key:'mp' as const, label:'💳 Mercado Pago', sub:'Precio público + tasas' },
                    ]
                  : [
                      { key:'transferencia' as const, label:'🏦 Transferencia', sub:'Precio mayorista' },
                    ]
                const tabActivo = pagoTabs.find(t => t.key === pagoTab) ? pagoTab : 'transferencia'
                return (
                  <div style={{ display:'flex', gap:6, marginBottom:14 }}>
                    {pagoTabs.map(t => (
                      <button key={t.key} onClick={() => setPagoTab(t.key)}
                        style={{ flex:1, padding:'8px 6px', borderRadius:8, border: tabActivo===t.key ? '1.5px solid #4ade80' : '1px solid #1e3248', background: tabActivo===t.key ? 'rgba(74,222,128,0.10)' : '#132233', color: tabActivo===t.key ? '#4ade80' : '#7a9ab5', fontSize:11, fontWeight:700, cursor:'pointer', lineHeight:1.3, textAlign:'center' as const }}>
                        <div>{t.label}</div>
                        <div style={{ fontSize:9, fontWeight:400, opacity:0.8, marginTop:2 }}>{t.sub}</div>
                      </button>
                    ))}
                  </div>
                )
              })()}

              {/* ── PEDIDO ENVIADO ── */}
              {/* ── T&C ── */}
              {!pedidoEnviado && (
                <div style={{
                  display:'flex', alignItems:'flex-start', gap:9, marginBottom:12,
                  padding:'10px 12px', borderRadius:8,
                  background: pedidoError && !aceptaTCPago ? 'rgba(255,107,107,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${pedidoError && !aceptaTCPago ? '#ff6b6b' : '#1e3248'}`,
                }}>
                  <input
                    type="checkbox"
                    id={`tc-${bomba.codigo}`}
                    checked={aceptaTCPago}
                    onChange={e => { setAceptaTCPago(e.target.checked); if (e.target.checked) setPedidoError('') }}
                    style={{ marginTop:2, width:15, height:15, cursor:'pointer', accentColor:'#4ade80', flexShrink:0 }}
                  />
                  <label htmlFor={`tc-${bomba.codigo}`} style={{ fontSize:11, color:'#7a9ab5', lineHeight:1.5, cursor:'pointer' }}>
                    Leí y acepto los{' '}
                    <a href="https://febecos.com/terminos#revendedores" target="_blank" rel="noopener noreferrer" style={{ color:'#4ade80', fontWeight:600 }}>
                      Términos del Programa de Revendedores
                    </a>{' '}
                    y la{' '}
                    <a href="https://febecos.com/terminos#privacidad" target="_blank" rel="noopener noreferrer" style={{ color:'#4ade80', fontWeight:600 }}>
                      Política de Privacidad
                    </a>.
                  </label>
                </div>
              )}

              {pedidoEnviado ? (
                <div style={{ textAlign:'center' as const, padding:'20px 12px' }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
                  <div style={{ fontSize:16, fontWeight:700, color:'#4ade80', marginBottom:8 }}>¡Pedido recibido!</div>
                  <div style={{ fontSize:13, color:'#7a9ab5', lineHeight:1.7 }}>
                    Estamos verificando disponibilidad de stock.<br/>
                    Te contactamos en breve para confirmar y enviarte los datos de pago.
                  </div>
                  <div style={{ marginTop:16, fontSize:11, color:'#3a5a7a' }}>
                    ¿Consultas? WhatsApp: <a href="https://wa.me/5491125750323" style={{ color:'#25d366' }}>+54 9 11 2575-0323</a>
                  </div>
                </div>
              ) : (
                <>
                {/* Tab: Transferencia */}
                {effectivePagoTab === 'transferencia' && (
                  <div>
                    <div style={{ background:'rgba(74,222,128,0.07)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:12 }}>
                      {mostrarPublico ? (
                        <>
                          <div style={{ fontSize:10, color:'#7a9ab5', textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:4 }}>Precio público</div>
                          <div style={{ fontSize:26, fontWeight:800, color:'#4ade80', fontFamily:'monospace' }}>{fmt(precioPublico)}</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize:10, color:'#7a9ab5', textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:4 }}>Tu precio mayorista ({descuento}% OFF)</div>
                          <div style={{ fontSize:26, fontWeight:800, color:'#4ade80', fontFamily:'monospace' }}>{fmt(precioMayoristaCalc)}</div>
                          <div style={{ fontSize:11, color:'#7a9ab5', marginTop:2 }}>Precio público: {fmt(precioPublico)}</div>
                        </>
                      )}
                    </div>
                    <div style={{ fontSize:11, color:'#7a9ab5', background:'rgba(255,255,255,0.03)', borderRadius:8, padding:'8px 12px', marginBottom:12, lineHeight:1.7 }}>
                      Al confirmar, te enviamos la factura y los datos bancarios para hacer la transferencia.
                    </div>
                    {pedidoError && <div style={{ fontSize:12, color:'#ff6b6b', marginBottom:8 }}>{pedidoError}</div>}
                    <button onClick={() => enviarPedido('transferencia')} disabled={pedidoLoading}
                      style={{ width:'100%', padding:'12px', background: pedidoLoading ? '#1e3248' : '#4ade80', color:'#0a1520', borderRadius:8, border:'none', fontSize:14, fontWeight:800, cursor: pedidoLoading ? 'not-allowed' : 'pointer' }}>
                      {pedidoLoading ? '⏳ Enviando...' : '✅ Confirmar pedido por transferencia'}
                    </button>
                  </div>
                )}

                {/* Tab: NAVE */}
                {effectivePagoTab === 'nave' && (
                  <div>
                    <div style={{ background:'rgba(74,222,128,0.07)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:12 }}>
                      <div style={{ fontSize:10, color:'#7a9ab5', textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:4 }}>Precio público — 6 cuotas con NAVE</div>
                      {cuotaNave ? (
                        <>
                          <div style={{ fontSize:22, fontWeight:800, color:'#4ade80', fontFamily:'monospace' }}>{fmt(cuotaNave)}<span style={{ fontSize:13, fontWeight:400, color:'#7a9ab5' }}>/mes</span></div>
                          {totalNave && <div style={{ fontSize:11, color:'#7a9ab5', marginTop:2 }}>Total: {fmt(totalNave)} en 6 cuotas</div>}
                        </>
                      ) : (
                        <div style={{ fontSize:14, fontWeight:700, color:'#7a9ab5' }}>Consultá la cuota</div>
                      )}
                    </div>
                    <div style={{ fontSize:11, color:'#e8681a', background:'rgba(232,104,26,0.08)', borderRadius:8, padding:'8px 12px', marginBottom:12, display:'flex', gap:8 }}>
                      <span>ℹ️</span>
                      <span>Al confirmar, un vendedor te enviará el link de pago de <strong>NAVE</strong>. Precio público sin descuento mayorista.</span>
                    </div>
                    {pedidoError && <div style={{ fontSize:12, color:'#ff6b6b', marginBottom:8 }}>{pedidoError}</div>}
                    <button onClick={() => enviarPedido('nave')} disabled={pedidoLoading}
                      style={{ width:'100%', padding:'12px', background: pedidoLoading ? '#1e3248' : '#4ade80', color:'#0a1520', borderRadius:8, border:'none', fontSize:14, fontWeight:800, cursor: pedidoLoading ? 'not-allowed' : 'pointer' }}>
                      {pedidoLoading ? '⏳ Enviando...' : '📅 Solicitar pago en 6 cuotas NAVE'}
                    </button>
                  </div>
                )}

                {/* Tab: Mercado Pago */}
                {effectivePagoTab === 'mp' && (
                  <div>
                    <div style={{ background:'rgba(0,158,227,0.07)', border:'1px solid rgba(0,158,227,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:12 }}>
                      <div style={{ fontSize:10, color:'#7a9ab5', textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:4 }}>Precio público + tasas Mercado Pago</div>
                      <div style={{ fontSize:22, fontWeight:800, color:'#009ee3', fontFamily:'monospace' }}>{fmt(precioPublico)}</div>
                      <div style={{ fontSize:11, color:'#7a9ab5', marginTop:2 }}>El monto por cuota varía según las cuotas que elegís en MP</div>
                    </div>
                    <div style={{ fontSize:11, color:'#e8681a', background:'rgba(232,104,26,0.08)', borderRadius:8, padding:'8px 12px', marginBottom:12, display:'flex', gap:8 }}>
                      <span>⚠️</span>
                      <span><strong>Importante:</strong> Las tasas de Mercado Pago son mayores a las de NAVE. Al confirmar te enviamos el link de pago de MP.</span>
                    </div>
                    {pedidoError && <div style={{ fontSize:12, color:'#ff6b6b', marginBottom:8 }}>{pedidoError}</div>}
                    <button onClick={() => enviarPedido('mercadopago')} disabled={pedidoLoading}
                      style={{ width:'100%', padding:'12px', background: pedidoLoading ? '#1e3248' : '#009ee3', color:'#fff', borderRadius:8, border:'none', fontSize:14, fontWeight:800, cursor: pedidoLoading ? 'not-allowed' : 'pointer' }}>
                      {pedidoLoading ? '⏳ Enviando...' : '💳 Solicitar link Mercado Pago'}
                    </button>
                  </div>
                )}
                </>
              )}
            </div>
          )}

          {/* ROI */}
          <button
            onClick={() => setMostrarROI(!mostrarROI)}
            style={{ width:'100%', padding:'10px', background: mostrarROI ? '#1e3248' : 'rgba(232,104,26,0.1)', border:`1px solid ${mostrarROI?'#2a4a6a':'#e8681a'}`, borderRadius:8, color: mostrarROI?'#7a9ab5':'#e8681a', fontSize:13, fontWeight:700, cursor:'pointer' }}
          >
            {mostrarROI ? '▲ Cerrar' : '⏱ ¿En cuánto recupera la inversión?'}
          </button>
          {mostrarROI && (
            <div style={{ background:'#0d1a2a', border:'1px solid #1e3248', borderRadius:8, padding:16 }}>
              <div style={{ fontSize:12, color:'#7a9ab5', marginBottom:12 }}>Completá estos datos para ver el retorno del cliente.</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                <div style={{ display:'flex', flexDirection:'column' as const, gap:4 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:'#7a9ab5' }}>Provincia del cliente</label>
                  <select style={{ padding:'8px 10px', background:'#132233', border:'1px solid #1e3248', borderRadius:8, color:'#e8f0f8', fontSize:13, fontFamily:'inherit', width:'100%' }} value={provincia} onChange={e=>setProvincia(e.target.value)}>
                    <option value="">Seleccioná...</option>
                    {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div style={{ display:'flex', flexDirection:'column' as const, gap:4 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:'#7a9ab5' }}>¿Qué usa hoy el cliente?</label>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:4 }}>
                    {SISTEMAS.map(s => (
                      <button key={s.id} onClick={() => setSistemaActual(s.id)} style={{ padding:'6px 10px', border:`1px solid ${sistemaActual===s.id?'#e8681a':'#1e3248'}`, borderRadius:7, background: sistemaActual===s.id?'rgba(232,104,26,0.12)':'#132233', color: sistemaActual===s.id?'#e8681a':'#7a9ab5', fontSize:11, fontWeight:600, cursor:'pointer', textAlign:'left' as const }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <a href={roiUrl()} target="_blank" rel="noopener noreferrer" style={{ display:'block', width:'100%', padding:'12px', background: provincia && sistemaActual ? '#e8681a' : '#1e3248', color: provincia && sistemaActual ? '#fff' : '#3a5a7a', borderRadius:8, textAlign:'center' as const, fontWeight:700, fontSize:14, textDecoration:'none', pointerEvents: provincia && sistemaActual ? 'auto' : 'none' as any }}>
                {provincia && sistemaActual ? '⏱ Ver recupero de inversión (informe completo) →' : 'Completá provincia y sistema para continuar'}
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
