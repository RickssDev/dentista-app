// Recorrido del sitio con la política de contenido (spec 024, CA3–CA7). No corre en CI: necesita
// Chrome y red hacia Google. Construye la imagen del frontend con el client ID de Google de
// frontend/.env (sin mostrarlo), la levanta y, con Chrome sin cabeza y el protocolo de DevTools:
//   - recorre las páginas públicas, la 404, restablecer contraseña, contacto con "Ver mapa" (también
//     llegando desde la portada sin recargar) y el login con sus dos botones de Google;
//   - registra los bloqueos de la CSP de cada página;
//   - prueba dos abusos: una página de otro origen que incrusta el sitio en un iframe y un
//     <script src> de otro origen añadido a una página del sitio.
// Termina con error si hay bloqueos, si falta el mapa o un botón de Google, o si un abuso no se bloquea.
// Uso: node scripts/probar-csp.mjs [--sin-build]   (desde frontend/; necesita Docker y Chrome)
import { execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { RUTAS_PUBLICAS } from '../src/seo/rutas.js'

const CARPETA = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const IMAGEN = 'dentissa-frontend:probar-csp'
const CONTENEDOR = 'dentissa-probar-csp'
const PUERTO = Number(process.env.PUERTO_PROBAR_CSP || 8093)
const PUERTO_CDP = Number(process.env.PUERTO_CDP_CSP || 9343)
const BASE = `http://localhost:${PUERTO}`
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const SIN_BUILD = process.argv.includes('--sin-build')

const pausa = (ms) => new Promise((r) => setTimeout(r, ms))
const docker = (...args) => execFileSync('docker', args, { stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim()
const esperar = async (url, intentos = 80) => {
  for (let i = 0; i < intentos; i += 1) {
    try {
      if ((await fetch(url)).status < 500) return
    } catch { /* aún no responde */ }
    await pausa(250)
  }
  throw new Error(`no responde ${url}`)
}

// El client ID es público, pero no se imprime: solo se pasa al build
const clientId = () => {
  const env = join(CARPETA, '.env')
  const linea = existsSync(env) && readFileSync(env, 'utf8').split(/\r?\n/).find((l) => l.startsWith('VITE_GOOGLE_CLIENT_ID='))
  const valor = (process.env.VITE_GOOGLE_CLIENT_ID || (linea ? linea.slice(22) : '')).trim().replace(/^"|"$/g, '')
  if (!valor) throw new Error('falta VITE_GOOGLE_CLIENT_ID (frontend/.env o entorno): sin él no hay botón de Google que probar')
  return valor
}

const fallos = []
const fallar = (motivo) => fallos.push(motivo)

let chrome
try {
  if (!SIN_BUILD) {
    console.log(`Construyendo ${IMAGEN}…`)
    const id = clientId()
    try {
      docker('build', '-q', '-t', IMAGEN, '--build-arg', `VITE_GOOGLE_CLIENT_ID=${id}`, CARPETA)
    } catch {
      throw new Error('falló docker build (los argumentos no se muestran: llevan el client ID)')
    }
  }
  try { execFileSync('docker', ['rm', '-f', CONTENEDOR], { stdio: 'ignore' }) } catch { /* no existía */ }
  docker('run', '-d', '--rm', '--name', CONTENEDOR, '--add-host', 'backend:127.0.0.1', '-p', `${PUERTO}:80`, IMAGEN)
  await esperar(`${BASE}/`)

  // localhost se resolvería primero por IPv6 y el contenedor solo escucha por IPv4: cada carga tardaría
  // ~30 s. Se fuerza IPv4 sin cambiar el origen (el botón de Google valida http://localhost)
  chrome = spawn(CHROME, ['--headless=new', '--no-sandbox', '--host-resolver-rules=MAP localhost 127.0.0.1', `--remote-debugging-port=${PUERTO_CDP}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'probar-csp-'))}`, 'about:blank'], { stdio: 'ignore' })
  await esperar(`http://127.0.0.1:${PUERTO_CDP}/json/version`, 240)
  const pestaña = await (await fetch(`http://127.0.0.1:${PUERTO_CDP}/json/new?about:blank`, { method: 'PUT' })).json()
  const ws = new WebSocket(pestaña.webSocketDebuggerUrl)
  await new Promise((r) => { ws.onopen = r })

  let id = 0
  const pendientes = new Map()
  let bloqueos = []
  let registro = []
  let alCargar = null
  // Marcos de otro origen: Chrome los mueve a otro proceso y salen del árbol de la pestaña; se
  // siguen como objetivos "iframe" (Target.setAutoAttach) con su URL final
  const marcos = new Map()
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (m.id && pendientes.has(m.id)) { pendientes.get(m.id)(m.result); pendientes.delete(m.id) }
    if (m.method === 'Page.loadEventFired' && alCargar) { alCargar(); alCargar = null }
    if (/^Target\.(attachedToTarget|targetInfoChanged)$/.test(m.method) && m.params.targetInfo.type === 'iframe') {
      marcos.set(m.params.targetInfo.targetId, m.params.targetInfo.url)
    }
    if (m.method === 'Runtime.consoleAPICalled') {
      const texto = String(m.params.args[0]?.value ?? '')
      if (texto.startsWith('CSP|')) bloqueos.push(texto.slice(4))
    }
    if (m.method === 'Log.entryAdded') registro.push(m.params.entry.text)
  }
  // Cada llamada tiene un límite: un paso que no responde falla con su nombre en lugar de colgarse
  const cdp = (method, params = {}, limite = 45000) => new Promise((resolver, rechazar) => {
    id += 1
    const propio = id
    const reloj = setTimeout(() => { pendientes.delete(propio); rechazar(new Error(`${method} no respondió en ${limite / 1000} s`)) }, limite)
    pendientes.set(propio, (resultado) => { clearTimeout(reloj); resolver(resultado) })
    ws.send(JSON.stringify({ id: propio, method, params }))
  })
  const evaluar = async (expr) => (await cdp('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }))?.result?.value
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Log.enable')
  await cdp('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true })
  await cdp('Page.addScriptToEvaluateOnNewDocument', {
    source: "document.addEventListener('securitypolicyviolation', (e) => console.log('CSP|' + e.effectiveDirective + ' ← ' + (e.blockedURI || '(en línea)')))",
  })
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })

  const abrir = async (url, espera = 3500) => {
    bloqueos = []
    registro = []
    // Se espera la carga (con límite) y después un margen para la hidratación y lo diferido
    const cargada = new Promise((r) => { alCargar = r; setTimeout(r, 30000) })
    await cdp('Page.navigate', { url })
    await cargada
    await pausa(espera)
  }
  const revisar = (nombre, extra = '') => {
    const unicos = [...new Set(bloqueos)]
    console.log(`${unicos.length ? '✘' : '✔'} ${nombre}${extra ? ` · ${extra}` : ''}${unicos.length ? ` · bloqueos: ${unicos.join(' | ')}` : ''}`)
    if (unicos.length) fallar(`${nombre}: ${unicos.join(' | ')}`)
  }

  // CA7: páginas sin sesión
  for (const ruta of [...RUTAS_PUBLICAS.map((r) => r.ruta).filter((r) => r !== '/contacto'), '/no-existe', '/restablecer-contrasena?token=x']) {
    await abrir(BASE + ruta)
    revisar(ruta)
  }

  // CA6: el mapa al pulsar "Ver mapa", entrando directo y llegando desde la portada sin recargar
  const verMapa = `(async () => { document.querySelector('.map__ver')?.click(); await new Promise((r) => setTimeout(r, 4000)); return Boolean(document.querySelector('.map iframe')) })()`
  await abrir(`${BASE}/contacto`)
  const mapa = await evaluar(verMapa)
  revisar('/contacto con "Ver mapa"', `mapa=${mapa}`)
  if (!mapa) fallar('/contacto: el mapa no aparece')
  await abrir(`${BASE}/`)
  const mapaSpa = await evaluar(`(async () => { [...document.querySelectorAll('a')].find((a) => a.getAttribute('href') === '/contacto')?.click(); await new Promise((r) => setTimeout(r, 2500)); return ${verMapa} })()`)
  revisar('portada → contacto sin recargar, "Ver mapa"', `mapa=${mapaSpa}`)
  if (!mapaSpa) fallar('navegación sin recargar: el mapa no aparece')

  // CA5: los dos botones de Google, entrando directo y llegando desde la portada sin recargar
  // El botón aparece cuando la página queda libre (spec 023): se espera por condición, hasta 20 s
  const botones = `(async () => {
    const esperar = async (sel) => { for (let i = 0; i < 80; i++) { if (document.querySelector(sel)) return true; await new Promise((r) => setTimeout(r, 250)) } return false }
    const iniciar = await esperar('.sign-in .google-btn iframe')
    document.querySelector('.sign-in .cambiar-modo .enlace')?.click()
    const registrar = await esperar('.sign-up .google-btn iframe')
    return { iniciar, registrar }
  })()`
  await abrir(`${BASE}/login`, 1500)
  const directo = (await evaluar(botones)) || {}
  revisar('/login con los dos botones de Google', `iniciar=${directo.iniciar} registrar=${directo.registrar}`)
  if (!directo.iniciar || !directo.registrar) fallar('/login: falta un botón de Google')
  await abrir(`${BASE}/`)
  await evaluar(`(() => { [...document.querySelectorAll('a')].find((a) => a.getAttribute('href') === '/login')?.click() })()`)
  const spa = (await evaluar(botones)) || {}
  revisar('portada → login sin recargar', `iniciar=${spa.iniciar} registrar=${spa.registrar}`)
  if (!spa.iniciar || !spa.registrar) fallar('navegación sin recargar: falta un botón de Google')

  // CA4 (abuso): un script de otro origen añadido a una página del sitio no se ejecuta
  await abrir(`${BASE}/`)
  const script = await evaluar(`new Promise((r) => {
    let bloqueado = false
    document.addEventListener('securitypolicyviolation', (e) => { if (/example\\.com/.test(e.blockedURI)) bloqueado = true })
    const s = document.createElement('script'); s.src = 'https://example.com/ataque.js'; document.head.appendChild(s)
    setTimeout(() => r(bloqueado), 2500)
  })`)
  console.log(`${script ? '✔' : '✘'} abuso: <script src> de otro origen → ${script ? 'bloqueado' : 'NO bloqueado'}`)
  if (!script) fallar('abuso: el script de otro origen no se bloqueó')

  // CA3 (abuso): una página de otro origen que incrusta el sitio en un iframe. 127.0.0.1 y localhost
  // son orígenes distintos: la página "ajena" se sirve desde 127.0.0.1 e incrusta http://localhost
  await abrir(`http://127.0.0.1:${PUERTO}/no-existe`, 1000)
  registro = []
  marcos.clear()
  await evaluar(`new Promise((r) => {
    const f = document.createElement('iframe'); f.src = '${BASE}/login'; f.width = 800; f.height = 600
    f.addEventListener('load', () => setTimeout(r, 1000), { once: true }); setTimeout(r, 8000)
    document.body.appendChild(f)
  })`)
  const urls = [...marcos.values()]
  if (!urls.length) fallar('abuso del iframe: la página de prueba no creó el marco (la prueba no prueba nada)')
  // Bloqueado: el marco existe y no terminó mostrando el sitio (Chrome lo deja en chrome-error://)
  const marcoBloqueado = urls.length > 0 && urls.every((u) => !u.startsWith(BASE))
  console.log(`${marcoBloqueado ? '✔' : '✘'} abuso: el sitio dentro de un iframe ajeno → ${marcoBloqueado ? 'bloqueado' : 'se muestra'} (${urls.join(', ') || 'sin marco'})`)
  if (!marcoBloqueado) fallar('abuso: el sitio se muestra dentro de un iframe ajeno')

  ws.close()
} finally {
  if (chrome) chrome.kill()
  try { docker('stop', CONTENEDOR) } catch { /* ya detenido */ }
}

console.log(fallos.length ? `\n${fallos.length} fallo(s):\n- ${fallos.join('\n- ')}` : '\nCSP: sin bloqueos y con los abusos bloqueados')
process.exit(fallos.length ? 1 : 0)
