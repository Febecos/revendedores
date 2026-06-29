'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const fmt = (n: number | null | undefined) =>
  n != null ? '$' + Math.round(n).toLocaleString('es-AR') : '—'

const FAM_ORDEN: Record<string, number> = { bomba: 0, panel: 1, soporte: 2, caja: 3, proteccion: 3, cable: 4, accesorio: 5, otros: 6, otro: 6 }
const HSP = { verano: 5.5, promedio: 4, invierno: 3.5 }
const SENSOR_MAX_M = 100
const FEBECOS_LOGO = 'https://selector.febecos.com/images/febecos-logo.png'

const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export default function PresupuestoPublico({ params }: { params: { numero: string } }) {
  const searchParams = useSearchParams()
  const [html, setHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  // Datos crudos guardados en state para poder re-renderizar con descuento editado
  const [presupData, setPresupData] = useState<any>(null)
  const [bombaData, setBombaData] = useState<any>(null)
  const [kitData, setKitData] = useState<any[]>([])
  const [curvasData, setCurvasData] = useState<any[]>([])
  const [descuentoEdit, setDescuentoEdit] = useState<number>(0)
  const [guardando, setGuardando] = useState(false)
  const [guardadoOk, setGuardadoOk] = useState(false)
  const [showClienteEdit, setShowClienteEdit] = useState(false)
  const [cliNombre, setCliNombre] = useState('')
  const [cliApellido, setCliApellido] = useState('')
  const [cliTelefono, setCliTelefono] = useState('')
  const [cliEmail, setCliEmail] = useState('')
  const [cliZona, setCliZona] = useState('')
  const [cliRazonSocial, setCliRazonSocial] = useState('')
  const [cliCuit, setCliCuit] = useState('')
  const [cliDomicilio, setCliDomicilio] = useState('')
  const [cliLocalidad, setCliLocalidad] = useState('')
  const [cliCodPostal, setCliCodPostal] = useState('')
  const [cliCondFiscal, setCliCondFiscal] = useState('')
  const [guardandoCli, setGuardandoCli] = useState(false)
  const [guardadoCliOk, setGuardadoCliOk] = useState(false)
  const [busquedaCli, setBusquedaCli] = useState('')
  const [sugerenciasCli, setSugerenciasCli] = useState<any[]>([])
  const [buscandoCli, setBuscandoCli] = useState(false)
  const [sugerenciaIdx, setSugerenciaIdx] = useState(-1)
  const [cuitLoading, setCuitLoading] = useState(false)

  useEffect(() => {
    // rev = token del revendedor (cuando abre su propio preview/edición). Se lo pasamos a la API
    // para que NO cuente como "vista del cliente" en el bus de eventos (C2/abandono).
    const revParam = searchParams.get('rev')
    fetch(`/api/presupuesto-publico?t=${encodeURIComponent(params.numero)}${revParam ? `&rev=${encodeURIComponent(revParam)}` : ''}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(async d => {
        const p = d.presupuesto
        let bomba: any = null, kit: any[] = [], curvas: any[] = []
        if (p?.bomba_codigo) {
          try {
            const r = await fetch(`https://roi.febecos.com/api/pump-detail?codigo=${encodeURIComponent(p.bomba_codigo)}`)
            if (r.ok) { const dd = await r.json(); bomba = dd.bomba; kit = dd.kit || []; curvas = dd.curvas || [] }
          } catch { /* sin datos extra */ }
        }
        // Nombre del archivo al guardar PDF = "Cliente - NÚMERO"
        const _cli = (p?.cliente_razon_social || [p?.cliente_nombre, p?.cliente_apellido].filter(Boolean).join(' ') || '').trim()
        if (p?.numero) document.title = (_cli ? _cli + ' - ' : '') + p.numero
        setPresupData(p)
        // Campo único: fusiona nombre + apellido de presupuestos viejos.
        setCliNombre([p.cliente_nombre, p.cliente_apellido].filter(Boolean).join(' '))
        setCliApellido('')
        setCliTelefono(p.cliente_telefono || '')
        setCliEmail(p.cliente_email || '')
        setCliZona(p.cliente_zona || '')
        setCliRazonSocial(p.cliente_razon_social || '')
        setCliCuit(p.cliente_cuit || '')
        setCliDomicilio(p.cliente_domicilio || '')
        setCliLocalidad(p.cliente_localidad || '')
        setCliCodPostal(p.cliente_cod_postal || '')
        setCliCondFiscal(p.cliente_condicion_fiscal || '')
        setBombaData(bomba)
        setKitData(kit)
        setCurvasData(curvas)
        setDescuentoEdit(p.descuento_pct ? Number(p.descuento_pct) : 0)
        setHtml(construirPDF(p, bomba, kit, curvas))
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [params.numero])

  async function buscarClienteDB(q: string) {
    if (q.length < 2) { setSugerenciasCli([]); return }
    setBuscandoCli(true)
    try {
      const r = await fetch(`/api/clientes-buscar?q=${encodeURIComponent(q)}`)
      if (r.ok) { const d = await r.json(); setSugerenciasCli(d.clientes || []) }
    } catch { /* silencioso */ }
    setBuscandoCli(false)
  }

  function seleccionarCliente(c: any) {
    setCliNombre([c.nombre, c.apellido].filter(Boolean).join(' '))
    setCliApellido('')
    setCliTelefono(c.telefono || '')
    setCliEmail(c.email || '')
    setCliZona(c.zona || '')
    setCliRazonSocial(c.razon_social || '')
    setCliCuit(c.cuit || '')
    setBusquedaCli('')
    setSugerenciasCli([])
    setSugerenciaIdx(-1)
  }

  async function buscarCuitARCA(raw: string) {
    const cuit = raw.replace(/[-\s]/g, '')
    if (cuit.length !== 11) return
    setCuitLoading(true)
    try {
      const r = await fetch(`/api/cuit-lookup?cuit=${cuit}`)
      if (r.ok) {
        const d = await r.json()
        // Campo único de nombre: denominacion = nombre completo / razón social.
        if (d.denominacion && !cliNombre) setCliNombre(d.denominacion)
        if (d.razonSocial && !cliRazonSocial) setCliRazonSocial(d.razonSocial)
        if (d.provincia && !cliZona) setCliZona(d.provincia)
        if (d.domicilio && !cliDomicilio) setCliDomicilio(d.domicilio)
        if (d.localidad && !cliLocalidad) setCliLocalidad(d.localidad)
        if (d.codPostal && !cliCodPostal) setCliCodPostal(d.codPostal)
      }
    } catch { /* silencioso */ }
    setCuitLoading(false)
  }

  async function guardarCliente() {
    setGuardandoCli(true)
    try {
      const r = await fetch('/api/presupuestos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_token: params.numero,
          cliente_nombre: cliNombre || null,
          cliente_apellido: cliApellido || null,
          cliente_telefono: cliTelefono || null,
          cliente_email: cliEmail || null,
          cliente_zona: cliZona || null,
          cliente_razon_social: cliRazonSocial || null,
          cliente_cuit: cliCuit || null,
          cliente_domicilio: cliDomicilio || null,
          cliente_localidad: cliLocalidad || null,
          cliente_cod_postal: cliCodPostal || null,
          cliente_condicion_fiscal: cliCondFiscal || null,
        }),
      })
      const data = await r.json()
      if (!r.ok || !data.ok) {
        alert(`Error al guardar cliente: ${data.error || 'Error desconocido'}\n\nToken: ${params.numero}`)
        return
      }
      setPresupData((prev: any) => ({
        ...prev,
        cliente_nombre: cliNombre || null,
        cliente_apellido: cliApellido || null,
        cliente_telefono: cliTelefono || null,
        cliente_email: cliEmail || null,
        cliente_zona: cliZona || null,
        cliente_razon_social: cliRazonSocial || null,
        cliente_cuit: cliCuit || null,
        cliente_domicilio: cliDomicilio || null,
        cliente_localidad: cliLocalidad || null,
        cliente_cod_postal: cliCodPostal || null,
        cliente_condicion_fiscal: cliCondFiscal || null,
      }))
      setHtml(construirPDF(
        { ...presupData, cliente_nombre: cliNombre || null, cliente_apellido: cliApellido || null, cliente_telefono: cliTelefono || null, cliente_email: cliEmail || null, cliente_zona: cliZona || null, cliente_razon_social: cliRazonSocial || null, cliente_cuit: cliCuit || null, cliente_domicilio: cliDomicilio || null, cliente_localidad: cliLocalidad || null, cliente_cod_postal: cliCodPostal || null, cliente_condicion_fiscal: cliCondFiscal || null },
        bombaData, kitData, curvasData
      ))
      setGuardadoCliOk(true)
      setShowClienteEdit(false)
      setTimeout(() => setGuardadoCliOk(false), 3000)
    } finally {
      setGuardandoCli(false)
    }
  }

  // Recalcula extras de instalación igual que construirPDF
  function calcExtrasKit(descNuevo: number) {
    const profInput: number = presupData?.profundidad_m ? Number(presupData.profundidad_m) : 0
    const distanciaTablero: number | null = presupData?.longitud_total_m != null ? Number(presupData.longitud_total_m) : null
    const factorDesc = descNuevo === 0 ? 1 : (1 - descNuevo / 100)
    const esPozosProfundo = profInput > 30 && (bombaData?.tipo || '').toLowerCase().includes('sumergi')
    const cabItem = kitData.find((i: any) => i.familia === 'cable' && (i.nombre || '').toLowerCase().includes('sumergible'))
    const sogaItem = kitData.find((i: any) => (i.nombre || '').toLowerCase().includes('soga') || (i.nombre || '').toLowerCase().includes('anti-uv'))
    const sensorItem = kitData.find((i: any) => i.familia === 'cable' && (i.nombre || '').toLowerCase().includes('sensor'))
    const precioCableM = cabItem?.precio_ars ?? 7699.45
    const precioSogaM = sogaItem?.precio_ars ?? 1809.59
    const precioSensorM = sensorItem?.precio_ars ?? 1736.96
    const metrosBaseCable = cabItem?.cantidad ?? 30
    const metrosBaseSoga = sogaItem?.cantidad ?? 30
    const metrosBaseSensor = sensorItem?.cantidad ?? 20
    const metrosNecesarios = esPozosProfundo ? Math.ceil((profInput + 10) / 10) * 10 : 0
    const metrosExtraCable = esPozosProfundo ? Math.max(0, metrosNecesarios - metrosBaseCable) : 0
    const metrosExtraSoga = esPozosProfundo ? Math.max(0, metrosNecesarios - metrosBaseSoga) : 0
    const sensorFueraRango = distanciaTablero != null && distanciaTablero > SENSOR_MAX_M
    const metrosExtraSensor = (!sensorFueraRango && distanciaTablero != null) ? Math.max(0, distanciaTablero - metrosBaseSensor) : 0
    return Math.round(precioCableM * metrosExtraCable * factorDesc)
         + Math.round(precioSogaM  * metrosExtraSoga  * factorDesc)
         + Math.round(precioSensorM * metrosExtraSensor * factorDesc)
  }

  // Calcula el precio lista (sin descuento, con extras) y el precio con el nuevo descuento.
  function calcularPrecios(descNuevo: number) {
    const descOriginal = presupData?.descuento_pct ? Number(presupData.descuento_pct) : 0
    const precioPublicoDB = presupData?.precio_publico != null ? Number(presupData.precio_publico) : null
    const precioOfrecido  = presupData?.precio_ofrecido != null ? Number(presupData.precio_ofrecido) : null
    // Precio de lista (bomba pura, sin extras y sin descuento)
    const precioListaBase = precioPublicoDB
      ?? (precioOfrecido != null && descOriginal > 0
            ? Math.round(precioOfrecido / (1 - descOriginal / 100))
            : precioOfrecido)
    if (!precioListaBase) return null
    // Recalcular extras usando datos del kit — igual que construirPDF
    const extrasLista = calcExtrasKit(0)
    const precioLista = precioListaBase + extrasLista
    const extrasNuevo = calcExtrasKit(descNuevo)
    const nuevoPrecio = Math.round(precioListaBase * (1 - descNuevo / 100)) + extrasNuevo
    return { precioListaBase, precioLista, nuevoPrecio }
  }

  function aplicarDescuento() {
    if (!presupData) return
    const calc = calcularPrecios(descuentoEdit)
    if (!calc) return
    const pModificado = {
      ...presupData,
      descuento_pct: descuentoEdit || null,
      precio_ofrecido: calc.nuevoPrecio,
      precio_publico: calc.precioListaBase,
    }
    const _cli = (presupData.cliente_razon_social || [presupData.cliente_nombre, presupData.cliente_apellido].filter(Boolean).join(' ') || '').trim()
    document.title = (_cli ? _cli + ' - ' : '') + presupData.numero
    setHtml(construirPDF(pModificado, bombaData, kitData, curvasData))
  }

  async function guardarDescuento() {
    if (!presupData) return
    setGuardando(true)
    const calc = calcularPrecios(descuentoEdit)
    if (!calc) { setGuardando(false); return }
    // Datos actualizados — sirven tanto para el PATCH como para re-render del PDF
    const pModificado = {
      ...presupData,
      descuento_pct: descuentoEdit || null,
      precio_ofrecido: calc.nuevoPrecio,
      precio_publico: calc.precioListaBase,
    }
    try {
      const r = await fetch('/api/presupuestos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_token: params.numero,   // clave única, no el numero (puede duplicarse)
          descuento_pct: descuentoEdit || null,
          precio_ofrecido: calc.nuevoPrecio,
          precio_publico: calc.precioListaBase,
          tipo_precio: descuentoEdit > 0 ? 'mayorista' : 'publico',
        }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok || !data.ok) {
        alert(`Error al guardar descuento: ${data.error || 'Error desconocido'}`)
        return
      }
      setPresupData(pModificado)
      // Rebuild del PDF para que refleje el nuevo descuento sin tener que apretar "Aplicar"
      setHtml(construirPDF(pModificado, bombaData, kitData, curvasData))
      setGuardadoOk(true)
      setTimeout(() => setGuardadoOk(false), 3000)
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return <Center>⏳ Cargando presupuesto…</Center>
  if (error || !html) return <Center>❌ Presupuesto no encontrado o no disponible.</Center>

  const calcPreview = calcularPrecios(descuentoEdit)
  const precioPreview = calcPreview?.nuevoPrecio ?? null
  const precioLista = calcPreview?.precioLista ?? null
  // Mostrar barra de edición solo si el parámetro ?rev coincide con el token del revendedor
  const esRevendedor = !!searchParams.get('rev') && searchParams.get('rev') === presupData?.revendedor_token
  // El buscador de clientes existentes es exclusivo de vendedores internos
  const esVendedorInterno = esRevendedor && presupData?.rev_tipo === 'interno'
  // Al EDITAR un presupuesto ya creado NO se editan datos del cliente desde coti:
  // la identidad del cliente se gestiona en el CRM (gestión) y se propaga. Acá, solo descuento.
  // (El buscar/cargar cliente vive en el COTIZADOR al crear, no en esta vista de edición.)
  const editarClienteEnCoti = false

  return (
    <>
      <style>{`
        ${PDF_CSS}
        @media print {
          .no-print { display: none !important; }
          html, body { background: #fff !important; }
          /* el wrapper oscuro provocaba bordes negros en el PDF: lo blanqueamos */
          .pdf-page-wrap { background: #fff !important; padding: 0 !important; min-height: 0 !important; }
          .sheet { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
        }
        @page { size: A4; margin: 12mm; }
      `}</style>
      <div className="pdf-page-wrap" style={{ minHeight: '100vh', background: '#0d1a2a', padding: '24px 12px 60px' }}>
        <div className="no-print" style={{ maxWidth: 760, margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <a href="https://www.febecos.com" style={{ color: '#7a9ab5', textDecoration: 'none', fontSize: 13 }}>← Febecos Bombeo Solar</a>
          <button onClick={() => window.print()} style={{ padding: '10px 18px', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>📥 Descargar PDF</button>
        </div>

        {/* ── Barra de edición — visible para el revendedor (interno o externo) ── */}
        {esRevendedor && presupData && (
          <div className="no-print" style={{ maxWidth: 760, margin: '0 auto 16px', background: '#132233', border: '1px solid #1e3248', borderRadius: 10, padding: '12px 16px', display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center', gap: 12 }}>
            {/* Edición de descuento — SOLO vendedores internos. El revendedor externo
                tiene su descuento FIJO (el que Febecos le asigna), no lo puede cambiar. */}
            {esVendedorInterno && (
              <>
                <span style={{ fontSize: 12, color: '#7a9ab5', fontWeight: 600 }}>✏️ Editar descuento</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number" min="0" max="100" step="1" value={descuentoEdit}
                    onChange={e => setDescuentoEdit(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    style={{ width: 70, background: '#0d1a2a', border: '1px solid #2a4a6a', borderRadius: 6, padding: '6px 8px', color: '#e8f0f8', fontSize: 14, fontFamily: 'inherit', outline: 'none', textAlign: 'center' as const }}
                  />
                  <span style={{ fontSize: 12, color: '#3a5a7a' }}>%</span>
                </div>
                {precioLista && (
                  <span style={{ fontSize: 12, color: descuentoEdit > 0 ? '#1a6b3c' : '#7a9ab5' }}>
                    {descuentoEdit > 0
                      ? <>Lista <strong style={{ color: '#7a9ab5' }}>{fmt(precioLista)}</strong> → <strong style={{ color: '#4ade80' }}>{fmt(precioPreview)}</strong></>
                      : `Precio público: ${fmt(precioLista)}`}
                  </span>
                )}
                <button onClick={aplicarDescuento} style={{ padding: '6px 14px', background: '#e8681a', border: 'none', borderRadius: 7, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Aplicar
                </button>
                <button onClick={guardarDescuento} disabled={guardando} style={{ padding: '6px 14px', background: guardadoOk ? '#1a6b3c' : '#1e3a5a', border: '1px solid #2a5a7a', borderRadius: 7, color: '#e8f0f8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {guardando ? 'Guardando…' : guardadoOk ? '✓ Guardado' : '💾 Guardar en DB'}
                </button>
              </>
            )}
            {editarClienteEnCoti && (
            <button onClick={() => setShowClienteEdit(v => !v)} style={{ padding: '6px 14px', background: guardadoCliOk ? '#1a6b3c' : '#1e3a5a', border: '1px solid #2a5a7a', borderRadius: 7, color: guardadoCliOk ? '#4ade80' : '#e8f0f8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {guardadoCliOk ? '✓ Cliente guardado' : '👤 Editar cliente'}
            </button>
            )}
          </div>
        )}
        {editarClienteEnCoti && esRevendedor && showClienteEdit && (
          <div className="no-print" style={{ maxWidth: 760, margin: '-8px auto 16px', background: '#0d1a2a', border: '1px solid #1e3248', borderRadius: 10, padding: '16px' }}>
            {/* Buscador de cliente existente — SOLO vendedores internos */}
            {esVendedorInterno && (
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: '#25d366', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' as const }}>🔍 Buscar cliente existente</div>
              <input
                value={busquedaCli}
                onChange={e => { setBusquedaCli(e.target.value); setSugerenciaIdx(-1); buscarClienteDB(e.target.value) }}
                onKeyDown={e => {
                  if (!sugerenciasCli.length) return
                  if (e.key === 'ArrowDown') { e.preventDefault(); setSugerenciaIdx(i => Math.min(i + 1, sugerenciasCli.length - 1)) }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); setSugerenciaIdx(i => Math.max(i - 1, 0)) }
                  else if (e.key === 'Enter' && sugerenciaIdx >= 0) { e.preventDefault(); seleccionarCliente(sugerenciasCli[sugerenciaIdx]) }
                  else if (e.key === 'Escape') { setSugerenciasCli([]); setSugerenciaIdx(-1) }
                }}
                placeholder="Nombre, apellido, teléfono o razón social…"
                style={{ width: '100%', background: '#0d2a1a', border: '1px solid #25d366', borderRadius: 6, padding: '8px 10px', color: '#e8f0f8', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }}
              />
              {buscandoCli && <div style={{ fontSize: 11, color: '#7a9ab5', marginTop: 4 }}>Buscando…</div>}
              {sugerenciasCli.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0d1a2a', border: '1px solid #25d366', borderRadius: 8, zIndex: 100, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,.5)' }}>
                  {sugerenciasCli.map((c, i) => (
                    <div key={i} onClick={() => seleccionarCliente(c)}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: i < sugerenciasCli.length - 1 ? '1px solid #1e3248' : 'none', background: i === sugerenciaIdx ? '#1e3a28' : 'transparent' }}
                      onMouseEnter={() => setSugerenciaIdx(i)} onMouseLeave={() => setSugerenciaIdx(-1)}
                    >
                      <div style={{ fontSize: 13, color: '#e8f0f8', fontWeight: 600 }}>{[c.nombre, c.apellido].filter(Boolean).join(' ') || c.razon_social}</div>
                      <div style={{ fontSize: 11, color: '#7a9ab5' }}>{c.telefono}{c.zona ? ` · ${c.zona}` : ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}
            {/* Nombre: SOLO LECTURA — la identidad del cliente vive en el CRM (fuente única) */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: '#7a9ab5', fontWeight: 700, marginBottom: 3, textTransform: 'uppercase' as const }}>Nombre / Razón social · no editable</div>
              <input value={cliNombre} readOnly disabled
                style={{ width: '100%', background: '#0d1722', border: '1px solid #2a4a6a', borderRadius: 6, padding: '7px 10px', color: '#8aa', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const, cursor: 'not-allowed' }} />
              <div style={{ fontSize: 10, color: '#7a9ab5', marginTop: 3 }}>{esVendedorInterno ? 'Para cambiar de cliente, buscá uno existente arriba. El nombre se corrige en Clientes (gestión).' : 'El nombre lo gestiona Febecos.'}</div>
            </div>
            {/* Campos manuales (sin el nombre) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              {([['Teléfono / WhatsApp', cliTelefono, setCliTelefono], ['Email', cliEmail, setCliEmail], ['Zona / Provincia', cliZona, setCliZona], ['Domicilio fiscal — calle', cliDomicilio, setCliDomicilio], ['Localidad', cliLocalidad, setCliLocalidad], ['Código postal', cliCodPostal, setCliCodPostal]] as [string, string, (v: string) => void][]).map(([label, val, setter]) => (
                <div key={label}>
                  <div style={{ fontSize: 10, color: '#7a9ab5', fontWeight: 700, marginBottom: 3, textTransform: 'uppercase' as const }}>{label}</div>
                  <input value={val} onChange={e => setter(e.target.value)}
                    style={{ width: '100%', background: '#132233', border: '1px solid #2a4a6a', borderRadius: 6, padding: '7px 10px', color: '#e8f0f8', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }} />
                </div>
              ))}
              <div>
                <div style={{ fontSize: 10, color: '#7a9ab5', fontWeight: 700, marginBottom: 3, textTransform: 'uppercase' as const }}>CUIT {cuitLoading && <span style={{ color: '#7a9ab5' }}>· consultando ARCA…</span>}</div>
                <input value={cliCuit} onChange={e => setCliCuit(e.target.value)} onBlur={e => buscarCuitARCA(e.target.value)}
                  placeholder="30-12345678-9"
                  style={{ width: '100%', background: '#132233', border: '1px solid #2a4a6a', borderRadius: 6, padding: '7px 10px', color: '#e8f0f8', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
              {/* Condición fiscal — define la letra del comprobante. ARCA no la expone → la elige el vendedor. */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 10, color: '#7a9ab5', fontWeight: 700, marginBottom: 3, textTransform: 'uppercase' as const }}>Condición fiscal (IVA)</div>
                <select value={cliCondFiscal} onChange={e => setCliCondFiscal(e.target.value)}
                  style={{ width: '100%', background: '#132233', border: `1px solid ${(cliCuit.replace(/\D/g, '').length === 11 && !cliCondFiscal) ? '#b45309' : '#2a4a6a'}`, borderRadius: 6, padding: '7px 10px', color: cliCondFiscal ? '#e8f0f8' : '#7a9ab5', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }}>
                  <option value="">— Sin especificar —</option>
                  <option value="responsable_inscripto">Responsable Inscripto (Factura A)</option>
                  <option value="monotributista">Monotributo (Factura A — RG 5003)</option>
                  <option value="exento">Exento (Factura B)</option>
                  <option value="consumidor_final">Consumidor Final (Factura B)</option>
                  <option value="exterior">Exterior / Exportación (Factura E)</option>
                </select>
                {cliCuit.replace(/\D/g, '').length === 11 && !cliCondFiscal && (
                  <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 5, lineHeight: 1.4 }}>
                    ⚠️ ARCA no informa la condición fiscal. Sin ella, la factura queda <strong>trabada</strong> en Gestión hasta completarla.
                  </div>
                )}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#7a9ab5', fontWeight: 700, marginBottom: 3, textTransform: 'uppercase' as const }}>Razón social (empresa) · no editable</div>
              <input value={cliRazonSocial} readOnly disabled
                style={{ width: '100%', background: '#0d1722', border: '1px solid #2a4a6a', borderRadius: 6, padding: '7px 10px', color: '#8aa', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const, cursor: 'not-allowed' }} />
            </div>
            <button onClick={guardarCliente} disabled={guardandoCli} style={{ padding: '8px 20px', background: '#e8681a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {guardandoCli ? 'Guardando…' : '💾 Guardar cliente'}
            </button>
          </div>
        )}

        <div className="sheet" style={{ maxWidth: 760, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,.4)' }}
          dangerouslySetInnerHTML={{ __html: html }} />
        <div className="no-print" style={{ maxWidth: 760, margin: '20px auto 0', textAlign: 'center' }}>
          <a href="https://wa.me/5491127399430" target="_blank" rel="noopener" style={{ display: 'inline-block', padding: '12px 24px', background: '#25d366', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>💬 Consultanos por WhatsApp</a>
        </div>
      </div>
    </>
  )
}

// CSS idéntico al del PDF generado en el portal (generarPDF)
const PDF_CSS = `
  .pdf { font-family: Arial, sans-serif; color: #1a1a18; padding: 24px 32px; font-size: 12px; }
  .pdf .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a6b3c; padding-bottom: 12px; margin-bottom: 16px; }
  .pdf .logo img { height: 40px; object-fit: contain; }
  .pdf .presup-num { text-align: right; }
  .pdf .presup-num h2 { font-size: 16px; margin: 0; color: #1a1a18; }
  .pdf .presup-num p { margin: 3px 0; color: #666; font-size: 11px; }
  .pdf .cliente-box { background: #f0f9f4; border: 2px solid #1a6b3c; border-radius: 10px; padding: 14px 20px; margin-bottom: 16px; }
  .pdf .cliente-nombre { font-size: 22px; font-weight: 800; color: #1a1a18; margin-bottom: 5px; line-height: 1.2; }
  .pdf .cliente-detalle { font-size: 13px; color: #1a6b3c; font-weight: 600; }
  .pdf h3 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #666; border-bottom: 1px solid #e2e0d8; padding-bottom: 4px; margin: 14px 0 10px; }
  .pdf .specs-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 6px 16px; }
  .pdf .spec { display: flex; flex-direction: column; }
  .pdf .spec-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 1px; }
  .pdf .spec-val { font-size: 12px; font-weight: 600; }
  .pdf .precio-box { background: #f0f9f4; border: 2px solid #1a6b3c; border-radius: 8px; padding: 10px 16px; margin: 12px 0; display: flex; align-items: center; gap: 24px; }
  .pdf .precio-label { font-size: 10px; color: #666; margin-bottom: 2px; }
  .pdf .precio-val { font-size: 20px; font-weight: 800; color: #1a6b3c; }
  .pdf .stock-ok { color: #1a6b3c; font-weight: 700; }
  .pdf .stock-no { color: #c45c00; font-weight: 700; }
  .pdf table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .pdf th { background: #f7f6f2; padding: 5px 8px; text-align: left; font-size: 10px; color: #666; border-bottom: 1px solid #e2e0d8; }
  .pdf td { padding: 4px 8px; border-bottom: 1px solid #f0eeea; }
  .pdf .footer { margin-top: 20px; border-top: 1px solid #e2e0d8; padding-top: 10px; font-size: 10px; color: #888; text-align: center; }
`

function construirPDF(p: any, bomba: any, kit: any[], curvas: any[]): string {
  const nro = p.numero
  const fecha = p.created_at ? new Date(p.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
  const descuento = p.descuento_pct ? Number(p.descuento_pct) : 0
  const mostrarPublico = descuento === 0
  const precioPDF: number | null = p.precio_ofrecido != null ? Number(p.precio_ofrecido) : (p.precio_publico != null ? Number(p.precio_publico) : null)

  const revLogo = p.rev_logo, revEmpresa = p.rev_empresa, revCuit = p.rev_cuit, revDomicilio = p.rev_domicilio
  const revendedor = p.revendedor_nombre, revProvincia = p.rev_provincia, revEmail = p.revendedor_email, revTipo = p.rev_tipo

  const cd = {
    nombre: p.cliente_nombre, apellido: p.cliente_apellido, telefono: p.cliente_telefono,
    zona: p.cliente_zona, razonSocial: p.cliente_razon_social, cuit: p.cliente_cuit,
    domicilio: p.cliente_domicilio, localidad: p.cliente_localidad, codPostal: p.cliente_cod_postal,
  }
  const tieneCliente = !!(cd.nombre || cd.apellido || cd.telefono || cd.razonSocial)

  // Tipo de alimentación: híbrida (solar + red/generador) o solar puro.
  // Prioriza el campo energia; cae al código (incluye -AC/DC de las WEGA).
  const esHibridaPDF = /hibrid|híbrid/i.test(String(bomba?.energia || ''))
    || /A\/D|AC\/?DC|220v|hibrida|híbrida/i.test(String(bomba?.codigo || p.bomba_codigo || ''))

  const profInput: number = p.profundidad_m ? Number(p.profundidad_m) : 0
  const distanciaTablero: number | null = p.longitud_total_m != null ? Number(p.longitud_total_m) : null
  const busquedaMCA: number | null = p.altura_m != null ? Number(p.altura_m) : null
  const busquedaLitros: number | null = p.litros_dia != null ? Number(p.litros_dia) : null
  const busquedaLitrosHora: number | null = busquedaLitros != null ? Math.round(busquedaLitros / HSP.verano) : null
  const busquedaDiametro = bomba?.diam_perf ? String(bomba.diam_perf).replace(/[^\d.]/g, '') : null

  // ── Extras (idéntico a generarPDF) ───────────────────────────────────────
  const factorDesc = mostrarPublico ? 1 : (1 - descuento / 100)
  const esPozosProfundo = profInput > 30 && (bomba?.tipo || '').toLowerCase().includes('sumergi')
  const cabItem = kit.find((i: any) => i.familia === 'cable' && (i.nombre || '').toLowerCase().includes('sumergible'))
  const sogaItem = kit.find((i: any) => (i.nombre || '').toLowerCase().includes('soga') || (i.nombre || '').toLowerCase().includes('anti-uv'))
  const precioCableM = cabItem?.precio_ars ?? 7699.45
  const precioSogaM = sogaItem?.precio_ars ?? 1809.59
  const metrosBaseCable = cabItem?.cantidad ?? 30
  const metrosBaseSoga = sogaItem?.cantidad ?? 30
  const metrosNecesarios = Math.ceil((profInput + 10) / 10) * 10
  const metrosTotal = esPozosProfundo ? metrosNecesarios : 0
  const metrosExtraCable = esPozosProfundo ? Math.max(0, metrosTotal - metrosBaseCable) : 0
  const metrosExtraSoga = esPozosProfundo ? Math.max(0, metrosTotal - metrosBaseSoga) : 0
  const extraCable = Math.round(precioCableM * metrosExtraCable * factorDesc)
  const extraSoga = Math.round(precioSogaM * metrosExtraSoga * factorDesc)
  // Extras a precio público (para mostrar "Precio de lista" completo)
  const extraCablePub = Math.round(precioCableM * metrosExtraCable)
  const extraSogaPub = Math.round(precioSogaM * metrosExtraSoga)

  const sensorItem = kit.find((i: any) => i.familia === 'cable' && (i.nombre || '').toLowerCase().includes('sensor'))
  const metrosBaseSensor = sensorItem?.cantidad ?? 20
  const precioSensorM = sensorItem?.precio_ars ?? 1736.96
  const sensorFueraRango = distanciaTablero != null && distanciaTablero > SENSOR_MAX_M
  const metrosExtraSensor = (!sensorFueraRango && distanciaTablero != null) ? Math.max(0, distanciaTablero - metrosBaseSensor) : 0
  const extraSensor = Math.round(precioSensorM * metrosExtraSensor * factorDesc)
  const extraSensorPub = Math.round(precioSensorM * metrosExtraSensor)
  // Precio de lista = el precio ofrecido (CONGELADO al emitir) "des-descontado".
  // NO recalcular desde bomba.precio_full LIVE: el catálogo cambia con el tiempo y un
  // presupuesto viejo mostraría la lista de HOY contra el precio especial CONGELADO → el
  // % no cierra (ej. "15% descuento" pero los números dan 27%). El precioPDF se generó como
  // (1 - desc/100) * (precio_full + extras), así que /(1 - desc/100) recupera la lista exacta
  // del día de emisión y el ratio lista→especial coincide siempre con el descuento mostrado.
  const precioListaConExtras = (bomba?.precio_full ? Number(bomba.precio_full) : (p.precio_publico ? Number(p.precio_publico) : null))
  const precioListaTotal = (descuento > 0 && precioPDF != null)
    ? Math.round(precioPDF / (1 - descuento / 100))
    : (precioListaConExtras != null ? precioListaConExtras + extraCablePub + extraSogaPub + extraSensorPub : null)

  // ── Kit (idéntico a generarPDF) ──────────────────────────────────────────
  const kitOrdenado: { nombre: string; notas: string; cantidad: number; unidad: string; _f: number }[] = []
  kitOrdenado.push({ nombre: `Bomba ${bomba?.marca || p.bomba_marca || ''} ${bomba?.watts || p.bomba_watts || ''}W — ${bomba?.impulsor || 'centrifuga'}`, notas: '', cantidad: 1, unidad: 'unidad', _f: 0 })
  const tienePanelEnKit = kit.some((i: any) => (i.familia || '').toLowerCase() === 'panel')
  if (!tienePanelEnKit && (bomba?.cant_paneles || p.bomba_watts)) {
    const cantP = bomba?.cant_paneles || Math.ceil((p.bomba_watts || 0) / 400) || 1
    const panelItem = kit.find((i: any) => (i.familia || '').toLowerCase() === 'panel')
    const potW = panelItem?.potencia_w || null
    kitOrdenado.push({ nombre: `Panel solar${potW ? ` ${potW}W` : ''}`, notas: 'Panel Solar Monocristalino', cantidad: cantP, unidad: 'unidad', _f: 1 })
  }
  for (const item of kit) {
    if ((item.nombre || '').toLowerCase().includes('bomba')) continue
    if (/\bmc4\b|ficha mc/i.test(item.nombre || '')) continue
    const isSogaPdf = (item.nombre || '').toLowerCase().includes('soga') || (item.nombre || '').toLowerCase().includes('anti-uv')
    const familiaKey = isSogaPdf ? 'cable' : (item.familia || '').toLowerCase()
    const f = FAM_ORDEN[familiaKey] ?? 6
    const esCableLargo = item.unidad === 'metro' && (item.nombre || '').toLowerCase().includes('sumergible')
    const esSensorPdf = item.unidad === 'metro' && (item.nombre || '').toLowerCase().includes('sensor')
    if (sensorFueraRango && esSensorPdf) continue
    // Panel: usar cant_paneles del objeto bomba (la DB del kit a veces devuelve 1)
    const esPanel = (item.familia || '').toLowerCase() === 'panel'
    const cant = esPanel && bomba?.cant_paneles
      ? bomba.cant_paneles
      : esPozosProfundo && (esCableLargo || isSogaPdf)
      ? Math.max(item.cantidad, metrosTotal)
      : !sensorFueraRango && esSensorPdf && distanciaTablero != null && distanciaTablero > item.cantidad
        ? distanciaTablero
        : item.cantidad
    const esMedidoEnMetros = item.unidad === 'metro' || ((esCableLargo || isSogaPdf || esSensorPdf) && cant > 5)
    kitOrdenado.push({ nombre: item.nombre + (item.potencia_w ? ` ${item.potencia_w}W` : ''), notas: item.notas || '', cantidad: cant, unidad: esMedidoEnMetros ? 'metro' : (item.unidad || 'unidad'), _f: f })
  }
  kitOrdenado.sort((a, b) => a._f - b._f)
  const kitHtml2Col = kitOrdenado.map(it => `<tr>
    <td style="padding:4px 8px;font-size:11px">${esc(it.nombre)}${it.notas ? `<span style="color:#888;font-size:9.5px"> — ${esc(it.notas)}</span>` : ''}</td>
    <td style="text-align:center;padding:4px 8px;white-space:nowrap">${it.unidad === 'metro' ? `${it.cantidad} m` : `×${it.cantidad}`}</td></tr>`).join('')

  const panelKit = kit.find((i: any) => i.familia === 'panel')

  const curvasHtml = curvas.length > 0
    ? curvas.map((c: any, i: number) => {
      const esPozo = Math.abs(c.altura_m - profInput) <= 5
      return `<tr style="background:${esPozo ? '#e8f5ee' : (i % 2 === 0 ? '#fafafa' : '#fff')};${esPozo ? 'font-weight:700;' : ''}">
        <td style="padding:5px 10px;text-align:right;color:${esPozo ? '#1a6b3c' : '#e8681a'}">${c.altura_m}m${esPozo ? ' ◄' : ''}</td>
        <td style="padding:5px 10px;text-align:right">${(c.litros_verano || 0).toLocaleString('es-AR')}</td>
        <td style="padding:5px 10px;text-align:right">${(c.litros_promedio || 0).toLocaleString('es-AR')}</td>
        <td style="padding:5px 10px;text-align:right">${(c.litros_invierno || 0).toLocaleString('es-AR')}</td>
        <td style="padding:5px 10px;text-align:right;color:#888">${(c.litros_hora || 0).toLocaleString('es-AR')}</td>
      </tr>`
    }).join('')
    : ''

  const mostrarDesglose = descuento > 0 || !!cd.cuit
  const desgloseHtml = (() => {
    if (!mostrarDesglose || !precioPDF) return ''
    const factorPrecio = mostrarPublico ? 1 : (1 - descuento / 100)
    const panelPublico = kit.filter((i: any) => (i.familia || '').toLowerCase() === 'panel').reduce((s: number, i: any) => s + (i.precio_ars || 0) * (i.cantidad || 1), 0)
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
  })()

  const stock = bomba?.stock ?? null
  const paneles = bomba?.cant_paneles ?? 1

  return `<div class="pdf">
${revLogo ? `
<div class="header">
  <div class="logo">
    <img src="${revLogo}" style="height:42px;max-width:200px;object-fit:contain" alt="Logo"/>
    <div style="font-size:10px;color:#555;margin-top:3px">${esc(revEmpresa || '')}${revCuit ? ` &nbsp;·&nbsp; CUIT ${esc(revCuit)}` : ''}${revDomicilio ? `<br>${esc(revDomicilio)}` : ''}</div>
  </div>
  <div class="presup-num">
    <h2>Presupuesto N° ${esc(nro)}</h2>
    <p>Fecha: ${fecha}</p>
    <p>⏱ Válido por 48 horas</p>
  </div>
</div>` : `
<div class="header">
  <div class="logo">
    <img src="${FEBECOS_LOGO}" style="height:38px;object-fit:contain" alt="Febecos" />
    <div style="font-size:10px;color:#666;margin-top:2px">Bombeo Solar — febecos.com</div>
  </div>
  <div class="presup-num">
    <h2>Presupuesto N° ${esc(nro)}</h2>
    <p>Fecha: ${fecha}</p>
    <p>⏱ Válido por 48 horas</p>
  </div>
</div>`}
${tieneCliente ? `<div class="cliente-box">
  ${cd.razonSocial ? `<div class="cliente-nombre">${esc(cd.razonSocial)}</div>${(cd.nombre || cd.apellido) ? `<div class="cliente-detalle" style="margin-bottom:3px">Contacto: ${esc(cd.nombre || '')} ${esc(cd.apellido || '')}</div>` : ''}` : `<div class="cliente-nombre">Sr./Sra. ${esc(cd.nombre || '')} ${esc(cd.apellido || '')}</div>`}
  <div class="cliente-detalle">${cd.cuit ? `🏢 CUIT ${esc(cd.cuit)}&nbsp;&nbsp;·&nbsp;&nbsp;` : ''}${cd.telefono ? `📱 ${esc(cd.telefono)}` : ''}${cd.zona ? `&nbsp;&nbsp;·&nbsp;&nbsp;📍 ${esc(cd.zona)}` : ''}</div>
  ${(() => { const dom = [[cd.domicilio, cd.localidad].filter(Boolean).join(', '), cd.codPostal ? `(CP ${cd.codPostal})` : ''].filter(Boolean).join(' '); return dom ? `<div class="cliente-detalle" style="font-weight:500;font-size:11px;color:#4a5a52;margin-top:2px">📍 ${esc(dom)}</div>` : '' })()}
</div>` : ''}
<h3>Equipo de bombeo solar</h3>
<div style="margin:-4px 0 10px"><span style="display:inline-block;padding:4px 12px;border-radius:6px;font-size:11px;font-weight:800;letter-spacing:.03em;${esHibridaPDF ? 'background:#fff7ed;color:#b45309;border:1px solid #fdba74' : 'background:#f0f9f4;color:#1a6b3c;border:1px solid #b7e8c7'}">${esHibridaPDF ? '⚡🌞 BOMBA HÍBRIDA — Solar + Red/Generador *' : '☀️ BOMBA SOLAR *'}</span></div>
<div class="specs-grid">
  <div class="spec"><span class="spec-label">Marca</span><span class="spec-val">${esc(bomba?.marca || p.bomba_marca || '—')}</span></div>
  <div class="spec"><span class="spec-label">Tipo</span><span class="spec-val">${esc(bomba?.impulsor || '—')}</span></div>
  <div class="spec"><span class="spec-label">Potencia</span><span class="spec-val">${esc(bomba?.watts || p.bomba_watts || '—')} W</span></div>
  <div class="spec"><span class="spec-label">Voltaje</span><span class="spec-val">${esc(bomba?.voltaje || '—')}</span></div>
  <div class="spec"><span class="spec-label">Paneles solares</span><span class="spec-val">${esc(bomba?.cant_paneles ?? '—')}</span></div>
  <div class="spec"><span class="spec-label">Diám. bomba</span><span class="spec-val">${esc(bomba?.diam_bomba || '—')}"</span></div>
  <div class="spec"><span class="spec-label">Diám. perf. mín.</span><span class="spec-val">${esc(bomba?.diam_perf || '—')}</span></div>
  <div class="spec"><span class="spec-label">Disponibilidad</span><span class="spec-val ${stock != null && stock > 0 ? 'stock-ok' : 'stock-no'}">${stock != null && stock > 0 ? `✅ ${stock} en stock` : '⚠ Sin stock'}</span></div>
</div>
<div style="${esHibridaPDF ? 'background:#fff7ed;border:1px solid #fde0bf' : 'background:#f0f9f4;border:1px solid #cdeede'};border-radius:8px;padding:9px 14px;margin:6px 0 14px;font-size:10.5px;line-height:1.55;color:#444">
  ${esHibridaPDF
    ? `<strong>* Equipo HÍBRIDO:</strong> la bomba funciona con la energía de los paneles solares <strong>y/o</strong> con corriente alterna (red eléctrica o generador). Permite bombear con sol durante el día y, cuando haga falta —días nublados, de noche o ante mayor demanda— conectarla a un generador o a la red, asegurando el suministro de agua durante todo el año.`
    : `<strong>* Equipo SOLAR:</strong> la bomba funciona exclusivamente con la energía de los paneles solares, durante las horas de sol. No requiere conexión a la red eléctrica ni a un generador.`}
</div>
${precioPDF ? `<div class="precio-box">
  <div>
    <div class="precio-label">${mostrarPublico ? 'Precio público' : `Precio especial (${descuento}% descuento)`}</div>
    <div class="precio-val">${fmt(precioPDF)}</div>
  </div>
  ${!mostrarPublico && precioListaTotal ? `<div style="font-size:11px;color:#666">Precio de lista: ${fmt(precioListaTotal)}</div>` : ''}
</div>
${(bomba?.cuota_mensual || bomba?.precio_6cuotas) ? `<div style="font-size:11px;color:#1a6b3c;background:#f0f9f4;border:1px solid #cdeede;border-radius:8px;padding:7px 14px;margin:-4px 0 12px">💳 <strong>6 cuotas con tarjeta de crédito:</strong> ${bomba.cuota_mensual ? `${fmt(bomba.cuota_mensual)}/mes` : ''}${bomba.precio_6cuotas ? ` <span style="color:#666">(total ${fmt(bomba.precio_6cuotas)} en 6 cuotas)</span>` : ''}</div>` : ''}
${desgloseHtml}` : ''}
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
<tbody>${kitHtml2Col}</tbody></table>` : ''}
<div class="footer">
  ${revLogo
      ? `<strong>${esc(revEmpresa || revendedor)}</strong>${revProvincia ? ` &nbsp;·&nbsp; ${esc(revProvincia)}` : ''}${revCuit ? ` &nbsp;·&nbsp; CUIT ${esc(revCuit)}` : ''}<br>`
      : (revTipo && revTipo !== 'admin')
        ? `Asesor comercial: <strong>${esc(revendedor)}</strong>${revProvincia ? ` &nbsp;·&nbsp; ${esc(revProvincia)}` : ''}<br>`
        : `Asesor Febecos: <strong>${esc(revendedor)}</strong><br>`
    }
  ${revLogo
      ? `<span style="font-size:9px;color:#bbb">Generado con la plataforma online de <strong>Febecos®</strong> · Bombeo Solar Argentina</span><br>`
      : `Cotización realizada a través de la plataforma de cotizaciones de <strong>febecos.com</strong> · Bombeo Solar Argentina<br>`
    }
  Válido por 48 horas desde la fecha de emisión. Sujeto a disponibilidad de stock.
</div>

${(busquedaMCA || busquedaLitros || profInput > 0 || curvasHtml) ? `
<div style="page-break-before:always"></div>

<div class="header">
  <div class="logo">
    ${revLogo
        ? `<img src="${revLogo}" style="height:32px;max-width:160px;object-fit:contain" alt="Logo"/><div style="font-size:10px;color:#555;margin-top:2px">${esc(revEmpresa || '')}</div>`
        : `<span style="font-size:16px;font-weight:800;color:#1a6b3c">Febecos</span> <span style="font-size:11px;color:#666"> · Bombeo Solar Argentina</span>`
      }
  </div>
  <div class="presup-num"><h2 style="font-size:13px">Análisis técnico — Pres. ${esc(nro)}</h2><p>Documento complementario</p></div>
</div>

${(busquedaMCA || busquedaLitros || profInput > 0) ? `
<h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#1a6b3c;border-bottom:2px solid #1a6b3c;padding-bottom:5px;margin:18px 0 12px">Necesidad relevada del sistema</h3>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px 20px;margin-bottom:16px">
  ${busquedaMCA ? `<div style="background:#f0f9f4;border-radius:8px;padding:10px 14px"><div style="font-size:9px;text-transform:uppercase;color:#4a7a5a;letter-spacing:.06em;margin-bottom:3px">Altura manométrica total</div><div style="font-size:20px;font-weight:800;color:#1a6b3c">${busquedaMCA.toFixed(1)} <span style="font-size:13px">MCA</span></div></div>` : ''}
  ${busquedaLitros ? `<div style="background:#f0f9f4;border-radius:8px;padding:10px 14px"><div style="font-size:9px;text-transform:uppercase;color:#4a7a5a;letter-spacing:.06em;margin-bottom:3px">Caudal requerido</div><div style="font-size:20px;font-weight:800;color:#1a6b3c">${busquedaLitros.toLocaleString('es-AR')} <span style="font-size:13px">L/día</span></div>${busquedaLitrosHora ? `<div style="font-size:10px;color:#4a7a5a;margin-top:4px">${busquedaLitrosHora.toLocaleString('es-AR')} L/h × 5,5 hs sol = ${busquedaLitros.toLocaleString('es-AR')} L/día</div>` : ''}</div>` : ''}
  ${profInput > 0 ? `<div style="background:#f0f9f4;border-radius:8px;padding:10px 14px"><div style="font-size:9px;text-transform:uppercase;color:#4a7a5a;letter-spacing:.06em;margin-bottom:3px">Profundidad del pozo</div><div style="font-size:20px;font-weight:800;color:#1a6b3c">${profInput} <span style="font-size:13px">m</span></div></div>` : ''}
  ${busquedaDiametro ? `<div style="background:#f7f6f2;border-radius:8px;padding:10px 14px"><div style="font-size:9px;text-transform:uppercase;color:#666;letter-spacing:.06em;margin-bottom:3px">Diám. mínimo perforación</div><div style="font-size:16px;font-weight:700;color:#1a1a18">${esc(busquedaDiametro)}"</div></div>` : ''}
</div>

<h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#1a6b3c;border-bottom:2px solid #1a6b3c;padding-bottom:5px;margin:18px 0 12px">Por qué se seleccionó este equipo</h3>
<div style="background:#f7f6f2;border-radius:8px;padding:12px 16px;margin-bottom:14px;font-size:12px;line-height:1.7;color:#333">
  ${busquedaMCA && busquedaLitros ? `
  La búsqueda requería una bomba capaz de elevar al menos <strong>${busquedaLitros.toLocaleString('es-AR')} litros por día</strong>
  a una altura manométrica de <strong>${busquedaMCA.toFixed(1)} MCA</strong> desde un pozo de <strong>${profInput} metros</strong> de profundidad.
  ` : `La bomba fue seleccionada considerando la profundidad del pozo (${profInput} m) y las características del sistema.`}
  <br>
  El equipo <strong>${esc(bomba?.marca || p.bomba_marca || '')} ${esc(bomba?.watts || p.bomba_watts || '')}W</strong> cumple con estos requerimientos operando
  con <strong>${esc(paneles)} panel${(paneles || 1) > 1 ? 'es' : ''} solar${(paneles || 1) > 1 ? 'es' : ''} de ${esc(panelKit?.potencia_w || panelKit?.nombre?.match(/(\d+)\s*[Ww]/)?.[1] || bomba?.watts || '?')}W</strong>
  en condiciones de irradiación solar típicas de la región.
</div>
` : ''}

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
  <tbody>${curvasHtml}</tbody>
</table>
${profInput > 0 ? `<div style="margin-top:8px;font-size:10px;color:#888">◄ Fila resaltada = altura más cercana a la profundidad del pozo (${profInput}m)</div>` : ''}
` : ''}

<div class="footer" style="margin-top:24px">
  Este análisis es orientativo. Los caudales reales pueden variar según la irradiación solar local, la temperatura del agua y el estado del pozo.<br>
  ${revLogo
      ? `Para consultas: <strong>${esc(revEmail || '')}</strong>${revDomicilio ? ` · ${esc(revDomicilio)}` : ''}`
      : `Para asesoramiento técnico: <strong>ventas@febecos.com</strong> · febecos.com`
    }
</div>
` : ''}
</div>`
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1a2a', color: '#e8f0f8', fontFamily: 'system-ui, sans-serif', fontSize: 16, padding: 24, textAlign: 'center' }}>
      {children}
    </div>
  )
}
