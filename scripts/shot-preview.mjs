import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __dirname = dirname(fileURLToPath(import.meta.url))
const file = 'file://' + join(__dirname, 'preview-recordatorio.html').replace(/\\/g, '/')
const out = join(__dirname, 'preview-recordatorio.png')
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 640, height: 900 }, deviceScaleFactor: 2 })
await page.goto(file, { waitUntil: 'networkidle' })
await page.screenshot({ path: out, fullPage: true })
await browser.close()
console.log('OK ->', out)
