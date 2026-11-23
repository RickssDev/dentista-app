// Prueba automática de nginx del frontend (spec 022, P2): construye la imagen, la levanta en un
// puerto local y comprueba códigos, cabeceras y redirecciones. Termina con error si algo falla.
// Uso: node scripts/probar-nginx.mjs   (desde frontend/; necesita Docker)
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { RUTAS_NO_INDEXABLES, RUTAS_PUBLICAS } from '../src/seo/rutas.js'

const CARPETA = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const IMAGEN = 'dentissa-frontend:prueba-nginx'
const CONTENEDOR = 'dentissa-prueba-nginx'
const PUERTO = Number(process.env.PUERTO_PRUEBA_NGINX || 8091)
const BASE = `http://localhost:${PUERTO}`

// Spec 024 · CA9: las cabeceras esperadas salen del propio nginx-seguridad.conf (valor exacto, CSP
// completa), así una protección quitada o debilitada en la imagen se nombra al fallar
const SEGURIDAD = Object.fromEntries(
  [...readFileSync(resolve(CARPETA, 'nginx-seguridad.conf'), 'utf8').matchAll(/^add_header\s+(\S+)\s+"([^"]*)"\s+always;/gm)]
    .map(([, nombre, valor]) => [nombre.toLowerCase(), valor]),
)
// Los nombres y las directivas obligatorias van fijos aquí: quitar una cabecera o una directiva del
// archivo no la quita de lo que se exige (los valores exactos los fija seguridad-cabeceras.test.js)
const CABECERAS = ['content-security-policy', 'x-frame-options', 'x-content-type-options', 'referrer-policy', 'permissions-policy', 'strict-transport-security']
const DIRECTIVAS = ['default-src', 'script-src', 'style-src', 'img-src', 'font-src', 'connect-src', 'frame-src', 'frame-ancestors', 'base-uri', 'form-action', 'object-src']
const directivas = (csp) => new Set((csp || '').split(';').map((d) => d.trim().split(/\s+/)[0]).filter(Boolean))

const docker = (...args) => execFileSync('docker', args, { stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim()

// Orden de shell dentro del contenedor en marcha (spec 025); devuelve su código y su salida
const enContenedor = (orden) => {
  try {
    return { codigo: 0, salida: execFileSync('docker', ['exec', CONTENEDOR, 'sh', '-c', orden], { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim() }
  } catch (e) {
    return { codigo: e.status ?? 1, salida: `${e.stdout ?? ''}${e.stderr ?? ''}`.trim() }
  }
}

const pedir = (ruta) => fetch(`${BASE}${ruta}`, { redirect: 'manual' })

// Petición sin descomprimir: deja ver la cabecera Content-Encoding tal como la manda nginx
const pedirComprimido = (ruta) => fetch(`${BASE}${ruta}`, { redirect: 'manual', headers: { 'accept-encoding': 'gzip' } })

// Primer archivo .js o .css de /assets/ que enlaza la portada
const assetDe = async (tipo) => {
  const html = await (await pedir('/')).text()
  return (html.match(new RegExp(`/assets/[^"]+\\.${tipo}`)) || [])[0]
}

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

// Las rutas salen de la tabla única (R8): una página nueva sin su location en nginx falla aquí
const PUBLICAS = RUTAS_PUBLICAS.map((r) => r.ruta)
const PRIVADAS = [...RUTAS_NO_INDEXABLES, '/restablecer-contrasena?token=x', '/admin/usuarios', '/paciente/perfil']

const comprobaciones = [
  ...PUBLICAS.map((ruta) => [`${ruta} → 200 sin redirección`, async () => {
    const r = await pedir(ruta)
    return r.status === 200 && /<h1/.test(await r.text())
  }]),
  ['/nosotros/ → 301 a /nosotros en un salto', async () => {
    const r = await pedir('/nosotros/')
    return r.status === 301 && r.headers.get('location') === '/nosotros'
  }],
  ['/contacto/?utm=1 → 301 conservando la query string', async () => {
    const r = await pedir('/contacto/?utm=1')
    return r.status === 301 && r.headers.get('location') === '/contacto?utm=1'
  }],
  // R2: una barra invertida en la ruta no puede acabar en una redirección a otro dominio
  ['/%5Cevil.com/ → sin redirección a otro dominio', async () => {
    const r = await pedir('/%5Cevil.com/')
    const destino = r.headers.get('location') || ''
    return !destino.startsWith('/\\') && !destino.startsWith('//') && !/^https?:/i.test(destino)
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
  ...PRIVADAS.map((ruta) => [`${ruta} → la app con X-Robots-Tag: noindex`, async () => {
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
  // Spec 023 · CA5: el login llega prerenderizado y fuera de los buscadores
  ['/login → el formulario ya en el HTML, con X-Robots-Tag: noindex', async () => {
    const r = await pedir('/login')
    return r.status === 200 && /noindex/.test(r.headers.get('x-robots-tag') || '') && /id="login-correo"/.test(await r.text())
  }],
  // Spec 023 · CA10: el texto llega comprimido y los archivos con huella se guardan en caché
  ...['/', 'un /assets/*.js', 'un /assets/*.css', '/sitemap.xml', '/robots.txt'].map((cual) => [`${cual} → Content-Encoding: gzip`, async () => {
    const ruta = cual.startsWith('/') ? cual : await assetDe(cual.endsWith('.js') ? 'js' : 'css')
    const r = await pedirComprimido(ruta)
    return r.status === 200 && r.headers.get('content-encoding') === 'gzip'
  }]),
  ['/assets/* → Cache-Control de un año e immutable', async () => {
    const cc = (await pedir(await assetDe('js'))).headers.get('cache-control') || ''
    return /max-age=31536000/.test(cc) && /immutable/.test(cc)
  }],
  // Spec 024 · CA1–CA3, CA8: las cabeceras de seguridad en cada tipo de respuesta que sirve nginx
  ...[
    ...PUBLICAS,
    '/login',
    '/admin/usuarios',
    '/restablecer-contrasena?token=x',
    '/no-existe',
    '/nosotros/',
    'un /assets/*.js',
    '/images/hero-dentissa.webp',
  ].map((cual) => [`${cual} → cabeceras de seguridad`, async () => {
    const ruta = cual.startsWith('/') ? cual : await assetDe('js')
    const h = (await pedir(ruta)).headers
    // Una cabecera repetida llega unida con ", " y tampoco coincide con el valor esperado
    const recibido = (nombre) => (h.get(nombre) === null ? '(ausente)' : `"${h.get(nombre)}"`)
    const malas = CABECERAS
      .filter((nombre) => SEGURIDAD[nombre] === undefined || h.get(nombre) !== SEGURIDAD[nombre])
      .map((nombre) => (SEGURIDAD[nombre] === undefined
        ? `${nombre}: falta en nginx-seguridad.conf, recibido ${recibido(nombre)}`
        : `${nombre}: esperado "${SEGURIDAD[nombre]}", recibido ${recibido(nombre)}`))
    const presentes = directivas(h.get('content-security-policy'))
    const faltan = DIRECTIVAS.filter((d) => !presentes.has(d))
    if (faltan.length) malas.push(`content-security-policy: faltan las directivas ${faltan.join(', ')}`)
    return { ok: malas.length === 0, detalle: malas.map((m) => `${ruta} · ${m}`).join('\n    ') }
  }]),
  // CA8: la 404 conserva su noindex en el HTML (nunca tuvo la cabecera; /analyze A3)
  ['/no-existe → <meta name="robots" content="noindex"> con las cabeceras', async () => {
    const r = await pedir('/no-existe')
    return r.status === 404 && /<meta name="robots" content="noindex"/.test(await r.text()) && Boolean(r.headers.get('content-security-policy'))
  }],
  // Spec 025 · CA1, CA7: dentro del contenedor, con la identidad por defecto de la imagen
  ['contenedor → ningún proceso como root', async () => {
    const usuarios = enContenedor('ps -o user').salida.split(/\r?\n/).slice(1).map((u) => u.trim()).filter(Boolean)
    const deRoot = usuarios.filter((u) => u === 'root' || u === '0')
    return { ok: usuarios.length > 0 && deRoot.length === 0, detalle: `procesos por usuario: ${usuarios.join(', ') || '(ninguno)'}` }
  }],
  ['contenedor → sin permiso para cambiar páginas ni configuración', async () => {
    const intentos = {
      'crear un archivo en /usr/share/nginx/html': 'touch /usr/share/nginx/html/.prueba-escritura',
      'crear un archivo en /etc/nginx/conf.d': 'touch /etc/nginx/conf.d/.prueba-escritura',
      'escribir en /etc/nginx/snippets/seguridad.conf': ': >> /etc/nginx/snippets/seguridad.conf',
    }
    const permitidos = Object.entries(intentos).filter(([, orden]) => enContenedor(orden).codigo === 0).map(([que]) => que)
    return { ok: permitidos.length === 0, detalle: `se pudo ${permitidos.join('; ')}` }
  }],
  // Spec 025 · TM3: solo la capacidad de abrir puertos bajos (cap_net_bind_service = bit 10)
  ['contenedor → capacidades efectivas solo cap_net_bind_service', async () => {
    const linea = enContenedor('grep CapEff /proc/1/status').salida
    const valor = (linea.match(/CapEff:\s*([0-9a-f]+)/i) || [])[1]
    return { ok: valor !== undefined && BigInt(`0x${valor}`) === 0x400n, detalle: `CapEff del proceso 1: ${valor ?? '(no se pudo leer)'}, se esperaba 0x400` }
  }],
  // Spec 025 · CA5, TM6: libxml2 con la corrección de CVE-2026-86144 (2.13.9-r3), comparando con apk
  ['contenedor → libxml2 2.13.9-r3 o superior (CVE-2026-86144)', async () => {
    const instalada = enContenedor('apk info -e -v libxml2').salida.replace(/^libxml2-/, '')
    const orden = instalada ? enContenedor(`apk version -t ${instalada} 2.13.9-r3`).salida : ''
    return { ok: orden === '>' || orden === '=', detalle: `libxml2 ${instalada || '(no instalada)'}, se esperaba 2.13.9-r3 o superior` }
  }],
  // Spec 025 · TM5: la herramienta que concede capacidades no queda en la imagen
  ['contenedor → sin setcap en la imagen', async () => {
    const r = enContenedor('command -v setcap')
    return { ok: r.codigo !== 0, detalle: `setcap presente en ${r.salida}` }
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
    let detalle = ''
    try {
      const r = await comprobar()
      ok = typeof r === 'object' ? r.ok : r
      detalle = typeof r === 'object' ? r.detalle : ''
    } catch (e) { ok = false; detalle = e.message }
    console.log(`${ok ? '✔' : '✘'} ${nombre}${!ok && detalle ? `\n    ${detalle}` : ''}`)
    if (!ok) fallos += 1
  }
} finally {
  try { docker('stop', CONTENEDOR) } catch { /* ya detenido */ }
}

console.log(fallos ? `\n${fallos} comprobación(es) fallaron` : '\nnginx: todas las comprobaciones pasan')
process.exit(fallos ? 1 : 0)
