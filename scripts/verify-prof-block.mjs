// Verifica el bloqueo de profundidad del formulario en runtime (headless).
import { chromium } from 'playwright'

const FILE = 'file://D:/Dropbox/FEBECOS - FULL CLAUDE/febecos-selector/public/formulario.html'
const browser = await chromium.launch()
const page = await browser.newPage()

const errors = []
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message))

await page.goto(FILE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(800)

// ¿Existen las piezas y la función?
const sane = await page.evaluate(() => ({
  hasCalc: typeof window.calcAltura === 'function',
  hasInput: !!document.getElementById('profundidad'),
  hasBtn: !!document.getElementById('b5'),
  hasBloqueo: !!document.getElementById('prof-bloqueo'),
  umbral: (typeof PROF_MAX_OK !== 'undefined') ? PROF_MAX_OK : null,
}))
console.log('Sanidad:', JSON.stringify(sane))

// Helper: setea profundidad, dispara oninput (valNum+calcAltura) y devuelve estado
async function probar(valor) {
  return await page.evaluate((v) => {
    const inp = document.getElementById('profundidad')
    inp.value = String(v)
    inp.dispatchEvent(new Event('input', { bubbles: true })) // corre valNum + calcAltura
    const b5 = document.getElementById('b5')
    const bloq = document.getElementById('prof-bloqueo')
    return { valor: v, b5_disabled: b5.disabled, bloqueo_visible: bloq.style.display !== 'none' }
  }, valor)
}

const casos = [35, 250, 251, 10020, 300, 50, 0]
const esperado = {
  35:    { b5_disabled: false, bloqueo_visible: false },
  250:   { b5_disabled: false, bloqueo_visible: false },
  251:   { b5_disabled: true,  bloqueo_visible: true  },
  10020: { b5_disabled: true,  bloqueo_visible: true  },
  300:   { b5_disabled: true,  bloqueo_visible: true  },
  50:    { b5_disabled: false, bloqueo_visible: false }, // recuperación tras bloqueo
  0:     { b5_disabled: true,  bloqueo_visible: false }, // vacío/0: no avanza, sin cartel
}

let fallos = 0
for (const v of casos) {
  const r = await probar(v)
  const e = esperado[v]
  const ok = r.b5_disabled === e.b5_disabled && r.bloqueo_visible === e.bloqueo_visible
  if (!ok) fallos++
  console.log(`${ok ? '✅' : '❌'} prof=${v}: b5_disabled=${r.b5_disabled} (esp ${e.b5_disabled}), cartel=${r.bloqueo_visible} (esp ${e.bloqueo_visible})`)
}

console.log('\nErrores de consola:', errors.length ? JSON.stringify(errors) : 'ninguno')
console.log(fallos === 0 && errors.length === 0 ? '\n✅ TODO OK — sin bugs, sin cuelgues' : `\n⚠️ Revisar: ${fallos} casos fallidos, ${errors.length} errores de consola`)
await browser.close()
