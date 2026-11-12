// Prueba automática de nginx del frontend (spec 022, P2): construye la imagen, la levanta en un
// puerto local y comprueba códigos, cabeceras y redirecciones. Termina con error si algo falla.
// Uso: node scripts/probar-nginx.mjs   (desde frontend/; necesita Docker)
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const CARPETA = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const IMAGEN = 'dentissa-frontend:prueba-nginx'
const CONTENEDOR = 'dentissa-prueba-nginx'
const PUERTO = Number(process.env.PUERTO_PRUEBA_NGINX || 8091)
const BASE = `http://localhost:${PUERTO}`

const docker = (...args) => execFileSync('docker', args, { stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim()

const pedir = (ruta) => fetch(`${BASE}${ruta}`, { redirect: 'manual' })

const esperarNginx = async () => {
  for (let intento = 0; intento < 40; intento += 1) {
    try {
      await pedir('/')
      return
    } catch {
      await new Promise((r) => setTimeout(r, 250))
    }
  }
  throw new Error('nginx no respondió')
}

const RUTAS_PUBLICAS = ['/', '/nosotros', '/galeria', '/contacto', '/aviso-de-privacidad', '/terminos-de-servicio']

const comprobaciones = [
  ...RUTAS_PUBLICAS.map((ruta) => [`${ruta} → 200 sin redirección`, async () => {
    const r = await pedir(ruta)
    return r.status === 200 && /<h1/.test(await r.text())
  }]),
  ['/nosotros/ → 301 a /nosotros en un salto', async () => {
    const r = await pedir('/nosotros/')
    return r.status === 301 && r.headers.get('location') === '/nosotros'
  }],
  ['/no-existe → 404 con "Página no encontrada"', async () => {
    const r = await pedir('/no-existe')
    return r.status === 404 && /Página no encontrada/.test(await r.text())
  }],
  ['/robots.txt → text/plain', async () => {
    const r = await pedir('/robots.txt')
    return r.status === 200 && /^text\/plain/.test(r.headers.get('content-type')) && /Sitemap:/.test(await r.text())
  }],
  ['/sitemap.xml → XML', async () => {
    const r = await pedir('/sitemap.xml')
    return r.status === 200 && /xml/.test(r.headers.get('content-type')) && /<urlset/.test(await r.text())
  }],
  ...['/login', '/admin', '/paciente'].map((ruta) => [`${ruta} → la app con X-Robots-Tag: noindex`, async () => {
    const r = await pedir(ruta)
    return r.status === 200 && /noindex/.test(r.headers.get('x-robots-tag') || '') && /<div id="root">/.test(await r.text())
  }]),
  ['/favicon.jpeg → 200', async () => (await pedir('/favicon.jpeg')).status === 200],
  ['/images/hero-dentissa.webp → 200', async () => (await pedir('/images/hero-dentissa.webp')).status === 200],
  ['un archivo de /assets/ → 200', async () => {
    const html = await (await pedir('/')).text()
    const asset = (html.match(/\/assets\/[^"]+\.js/) || [])[0]
    return Boolean(asset) && (await pedir(asset)).status === 200
  }],
]

let fallos = 0
try {
  console.log(`Construyendo ${IMAGEN}…`)
  docker('build', '-q', '-t', IMAGEN, CARPETA)
  try {
    execFileSync('docker', ['rm', '-f', CONTENEDOR], { stdio: 'ignore' })
  } catch { /* no existía */ }
  // nginx resuelve el upstream "backend" al arrancar; sin backend real basta con que exista el nombre
  docker('run', '-d', '--rm', '--name', CONTENEDOR, '--add-host', 'backend:127.0.0.1', '-p', `${PUERTO}:80`, IMAGEN)
  await esperarNginx()

  for (const [nombre, comprobar] of comprobaciones) {
    let ok = false
    try { ok = await comprobar() } catch { ok = false }
    console.log(`${ok ? '✔' : '✘'} ${nombre}`)
    if (!ok) fallos += 1
  }
} finally {
  try { docker('stop', CONTENEDOR) } catch { /* ya detenido */ }
}

console.log(fallos ? `\n${fallos} comprobación(es) fallaron` : '\nnginx: todas las comprobaciones pasan')
process.exit(fallos ? 1 : 0)
