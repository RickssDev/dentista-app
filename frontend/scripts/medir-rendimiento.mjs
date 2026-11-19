// Medición de rendimiento de la spec 023 (no corre en CI: Lighthouse varía entre corridas).
// Construye la imagen del frontend con el client ID de Google, la levanta con un backend ficticio
// y pasa Lighthouse 13.6.0 (perfil móvil) 3 veces por cada una de las siete rutas. Escribe la
// mediana de Rendimiento, Prácticas recomendadas, LCP, CLS, SEO y Accesibilidad.
// Descarta y repite las corridas con benchmarkIndex < 2000 (equipo ocupado: el resultado no compara).
//
// Uso (desde frontend/; necesita Docker y Chrome):
//   node scripts/medir-rendimiento.mjs [--etiqueta antes] [--corridas 3] [--sin-build] [--rutas /,/login] [--salida 024-antes]
//   --salida: carpeta bajo .ai/inspect/ (por defecto 023-medicion-<etiqueta>).
// El client ID sale de VITE_GOOGLE_CLIENT_ID del entorno o de frontend/.env; nunca se imprime.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const CARPETA = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const RAIZ = resolve(CARPETA, '..')
const IMAGEN = 'dentissa-frontend:medicion'
const CONTENEDOR = 'dentissa-medicion'
const PUERTO = Number(process.env.PUERTO_MEDICION || 8098)
const BASE = `http://localhost:${PUERTO}`
const RUTAS_POR_DEFECTO = ['/', '/nosotros', '/galeria', '/contacto', '/aviso-de-privacidad', '/terminos-de-servicio', '/login']

const argumento = (nombre, porDefecto) => {
  const i = process.argv.indexOf(`--${nombre}`)
  return i >= 0 ? process.argv[i + 1] : porDefecto
}
const ETIQUETA = argumento('etiqueta', 'medicion')
const CORRIDAS = Number(argumento('corridas', 3))
const RUTAS = argumento('rutas', RUTAS_POR_DEFECTO.join(',')).split(',')
const SIN_BUILD = process.argv.includes('--sin-build')
const SALIDA = join(RAIZ, '.ai', 'inspect', argumento('salida', `023-medicion-${ETIQUETA}`))
const INDICE_MINIMO = 2000

const docker = (...args) => execFileSync('docker', args, { stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim()

// Client ID público de Google para el build (sin mostrarlo nunca)
const clientId = () => {
  if (process.env.VITE_GOOGLE_CLIENT_ID) return process.env.VITE_GOOGLE_CLIENT_ID
  const env = join(CARPETA, '.env')
  if (!existsSync(env)) return ''
  const linea = readFileSync(env, 'utf8').split(/\r?\n/).find((l) => l.startsWith('VITE_GOOGLE_CLIENT_ID='))
  return linea ? linea.slice('VITE_GOOGLE_CLIENT_ID='.length).trim().replace(/^["']|["']$/g, '') : ''
}

const esperar = async () => {
  for (let i = 0; i < 40; i += 1) {
    try {
      await fetch(BASE)
      return
    } catch {
      await new Promise((r) => setTimeout(r, 250))
    }
  }
  throw new Error('nginx no respondió')
}

const mediana = (valores) => {
  const v = valores.filter((x) => typeof x === 'number').sort((a, b) => a - b)
  return v.length ? v[Math.floor(v.length / 2)] : null
}

const lighthouse = (ruta, archivo) => {
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  execFileSync(
    npx,
    ['-y', 'lighthouse@13.6.0', `${BASE}${ruta}`, '--output=json', `--output-path=${archivo}`, '--quiet',
      '--only-categories=performance,seo,accessibility,best-practices', '--chrome-flags="--headless=new --no-sandbox"'],
    { stdio: 'ignore', shell: process.platform === 'win32' },
  )
  return JSON.parse(readFileSync(archivo, 'utf8'))
}

const medirRuta = (ruta) => {
  const corridas = []
  const nombre = ruta === '/' ? 'inicio' : ruta.slice(1).replace(/\//g, '_')
  const descartadas = []
  for (let n = 1; corridas.length < CORRIDAS && n <= CORRIDAS * 3; n += 1) {
    try {
      const r = lighthouse(ruta, join(SALIDA, `${nombre}-${n}.json`))
      if (typeof r.categories?.performance?.score !== 'number') continue // NO_FCP de Chrome sin cabeza: se repite
      const indice = Math.round(r.environment?.benchmarkIndex ?? 0)
      if (indice < INDICE_MINIMO) { descartadas.push(indice); continue } // equipo ocupado: se repite
      corridas.push({
        indice,
        practicas: Math.round(r.categories['best-practices'].score * 100),
        rendimiento: Math.round(r.categories.performance.score * 100),
        seo: Math.round(r.categories.seo.score * 100),
        accesibilidad: Math.round(r.categories.accessibility.score * 100),
        lcp: r.audits['largest-contentful-paint'].numericValue,
        cls: r.audits['cumulative-layout-shift'].numericValue,
      })
    } catch {
      // corrida fallida: se reintenta dentro del límite
    }
  }
  const campo = (k) => mediana(corridas.map((c) => c[k]))
  return {
    ruta,
    corridas: corridas.map((c) => c.rendimiento),
    indices: corridas.map((c) => c.indice),
    descartadas,
    rendimiento: campo('rendimiento'),
    practicas: campo('practicas'),
    lcp: campo('lcp'),
    cls: campo('cls'),
    seo: campo('seo'),
    accesibilidad: campo('accesibilidad'),
  }
}

mkdirSync(SALIDA, { recursive: true })
const resultados = []
try {
  if (!SIN_BUILD) {
    const id = clientId()
    console.log(`Construyendo ${IMAGEN} (client ID de Google: ${id ? 'sí' : 'no'})…`)
    try {
      docker('build', '-q', '-t', IMAGEN, '--build-arg', `VITE_GOOGLE_CLIENT_ID=${id}`, CARPETA)
    } catch {
      throw new Error('Falló docker build (los argumentos no se muestran: llevan el client ID)')
    }
  }
  try {
    execFileSync('docker', ['rm', '-f', CONTENEDOR], { stdio: 'ignore' })
  } catch { /* no existía */ }
  docker('run', '-d', '--rm', '--name', CONTENEDOR, '--add-host', 'backend:127.0.0.1', '-p', `${PUERTO}:80`, IMAGEN)
  await esperar()
  for (const ruta of RUTAS) {
    const r = medirRuta(ruta)
    resultados.push(r)
    console.log(`${ruta}: ${r.rendimiento} (${r.corridas.join('/')}) · índices ${r.indices.join('/')}${r.descartadas.length ? ` · descartadas ${r.descartadas.join('/')}` : ''}`)
  }
} finally {
  try { docker('stop', CONTENEDOR) } catch { /* ya detenido */ }
}

const fila = (r) =>
  `| \`${r.ruta}\` | ${r.rendimiento ?? '—'} (${r.corridas.join('/')}) | ${r.practicas ?? '—'} | ${r.lcp == null ? '—' : (r.lcp / 1000).toFixed(1) + ' s'} | ${r.cls == null ? '—' : r.cls.toFixed(3)} | ${r.seo ?? '—'} | ${r.accesibilidad ?? '—'} | ${r.indices.join('/')}${r.descartadas.length ? ` (descartadas ${r.descartadas.join('/')})` : ''} |`
const tabla = ['| Ruta | Rendimiento (corridas) | Prácticas recomendadas | LCP | CLS | SEO | Accesibilidad | benchmarkIndex |', '|---|---|---|---|---|---|---|---|', ...resultados.map(fila)].join('\n')
writeFileSync(join(SALIDA, 'resumen.md'), `${tabla}\n`)
writeFileSync(join(SALIDA, 'resumen.json'), JSON.stringify(resultados, null, 2))
console.log(`\nMediana de ${CORRIDAS} corridas (Lighthouse 13.6.0, móvil):\n${tabla}\n\nGuardado en ${SALIDA}`)
