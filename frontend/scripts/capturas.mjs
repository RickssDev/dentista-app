// Capturas de página completa de la spec 023 (CA9: las páginas se ven igual que antes).
// Levanta la imagen de medición (scripts/medir-rendimiento.mjs) y, con Chrome sin cabeza y el
// protocolo de DevTools (WebSocket nativo de Node), captura las siete rutas a 390 y 1440 px con
// movimiento reducido (los revelados al hacer scroll aparecen completos).
//
// Uso (desde frontend/): node scripts/capturas.mjs --etiqueta antes [--rutas /,/contacto] [--sin-imagen] [--salida 024-antes]
//   --salida: carpeta bajo .ai/inspect/ (por defecto 023-<etiqueta>).
//   En /contacto pulsa "Ver mapa" y espera el iframe antes de capturar (spec 024).
//   --sin-imagen: no levanta el contenedor; usa uno que ya responda en PUERTO_CAPTURAS (8099).
// Salida: .ai/inspect/023-<etiqueta>/<ruta>-<ancho>.png
import { execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const CARPETA = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const RAIZ = resolve(CARPETA, '..')
const IMAGEN = 'dentissa-frontend:medicion'
const CONTENEDOR = 'dentissa-capturas'
const PUERTO = Number(process.env.PUERTO_CAPTURAS || 8099)
const PUERTO_CDP = 9333
const BASE = `http://localhost:${PUERTO}`
const ANCHOS = [390, 1440]

const argumento = (nombre, porDefecto) => {
  const i = process.argv.indexOf(`--${nombre}`)
  return i >= 0 ? process.argv[i + 1] : porDefecto
}
const ETIQUETA = argumento('etiqueta', 'capturas')
const RUTAS = argumento('rutas', '/,/nosotros,/galeria,/contacto,/aviso-de-privacidad,/terminos-de-servicio,/login').split(',')
const SIN_IMAGEN = process.argv.includes('--sin-imagen')
const SALIDA = join(RAIZ, '.ai', 'inspect', argumento('salida', `023-${ETIQUETA}`))

const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((ruta) => ruta && existsSync(ruta))

const pausa = (ms) => new Promise((r) => setTimeout(r, ms))

const esperarUrl = async (url) => {
  for (let i = 0; i < 60; i += 1) {
    try {
      const r = await fetch(url)
      if (r.ok) return r
    } catch { /* aún no responde */ }
    await pausa(250)
  }
  throw new Error(`${url} no respondió`)
}

// Cliente mínimo del protocolo de DevTools sobre una pestaña
const conectar = (wsUrl) =>
  new Promise((ok, mal) => {
    const ws = new WebSocket(wsUrl)
    let id = 0
    const pendientes = new Map()
    const oyentes = new Map()
    ws.onmessage = (e) => {
      const msj = JSON.parse(e.data)
      if (msj.id && pendientes.has(msj.id)) {
        const { resolver, rechazar } = pendientes.get(msj.id)
        pendientes.delete(msj.id)
        if (msj.error) rechazar(new Error(msj.error.message))
        else resolver(msj.result)
      } else if (msj.method && oyentes.has(msj.method)) {
        oyentes.get(msj.method)(msj.params)
      }
    }
    ws.onerror = mal
    ws.onopen = () =>
      ok({
        enviar: (metodo, params = {}) =>
          new Promise((resolver, rechazar) => {
            id += 1
            pendientes.set(id, { resolver, rechazar })
            ws.send(JSON.stringify({ id, method: metodo, params }))
          }),
        una: (evento) => new Promise((r) => oyentes.set(evento, r)),
        cerrar: () => ws.close(),
      })
  })

const capturar = async (pestana, ruta, ancho) => {
  await pestana.enviar('Emulation.setDeviceMetricsOverride', {
    width: ancho, height: 900, deviceScaleFactor: 1, mobile: ancho < 768,
  })
  await pestana.enviar('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  })
  const cargada = pestana.una('Page.loadEventFired')
  await pestana.enviar('Page.navigate', { url: `${BASE}${ruta}` })
  await cargada
  await pausa(1500) // fuentes, hidratación e imágenes diferidas
  if (ruta === '/contacto') {
    // El mapa se carga al pulsar "Ver mapa": se espera por condición el iframe y su carga
    const { result } = await pestana.enviar('Runtime.evaluate', {
      awaitPromise: true, returnByValue: true,
      expression: `(async () => {
        document.querySelector('.map__ver')?.click()
        for (let i = 0; i < 60; i++) {
          const f = document.querySelector('.map iframe')
          if (f) { await new Promise((r) => { f.addEventListener('load', r, { once: true }); setTimeout(r, 5000) }); return true }
          await new Promise((r) => setTimeout(r, 250))
        }
        return false
      })()`,
    })
    if (!result.value) throw new Error('/contacto: el mapa no apareció')
    await pausa(1500) // teselas del mapa
  }
  const { cssContentSize } = await pestana.enviar('Page.getLayoutMetrics')
  const alto = Math.ceil(cssContentSize.height)
  // Con el mapa (iframe de otro origen), Chrome no lo pinta fuera del viewport: se agranda el
  // viewport al alto de la página en lugar de capturar más allá de él
  const conMapa = ruta === '/contacto'
  if (conMapa) {
    await pestana.enviar('Emulation.setDeviceMetricsOverride', {
      width: ancho, height: alto, deviceScaleFactor: 1, mobile: ancho < 768,
    })
    await pausa(2000)
  }
  const { data } = await pestana.enviar('Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: !conMapa, clip: { x: 0, y: 0, width: ancho, height: alto, scale: 1 },
  })
  const nombre = `${ruta === '/' ? 'inicio' : ruta.slice(1).replace(/\//g, '_')}-${ancho}.png`
  writeFileSync(join(SALIDA, nombre), Buffer.from(data, 'base64'))
  return nombre
}

if (!CHROME) throw new Error('No se encontró Chrome: define CHROME_PATH')
mkdirSync(SALIDA, { recursive: true })
const perfil = mkdtempSync(join(tmpdir(), 'capturas-023-'))
let chrome
try {
  if (!SIN_IMAGEN) {
    try { execFileSync('docker', ['rm', '-f', CONTENEDOR], { stdio: 'ignore' }) } catch { /* no existía */ }
    execFileSync('docker', ['run', '-d', '--rm', '--name', CONTENEDOR, '--add-host', 'backend:127.0.0.1', '-p', `${PUERTO}:80`, IMAGEN], { stdio: 'ignore' })
  }
  await esperarUrl(BASE)
  chrome = spawn(CHROME, ['--headless=new', '--no-sandbox', '--hide-scrollbars', `--remote-debugging-port=${PUERTO_CDP}`, `--user-data-dir=${perfil}`, 'about:blank'], { stdio: 'ignore' })
  await esperarUrl(`http://127.0.0.1:${PUERTO_CDP}/json/version`)
  const destino = await (await fetch(`http://127.0.0.1:${PUERTO_CDP}/json/new?about:blank`, { method: 'PUT' })).json()
  const pestana = await conectar(destino.webSocketDebuggerUrl)
  await pestana.enviar('Page.enable')
  for (const ruta of RUTAS) for (const ancho of ANCHOS) console.log(await capturar(pestana, ruta, ancho))
  pestana.cerrar()
} finally {
  chrome?.kill()
  if (!SIN_IMAGEN) try { execFileSync('docker', ['stop', CONTENEDOR], { stdio: 'ignore' }) } catch { /* ya detenido */ }
  await pausa(500)
  try { rmSync(perfil, { recursive: true, force: true }) } catch { /* Chrome aún suelta el perfil */ }
}
console.log(`\nCapturas en ${SALIDA}`)
