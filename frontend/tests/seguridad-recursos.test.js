// @vitest-environment node
// Spec 024 · CA7 (/analyze A2, A6): el código no usa recursos de orígenes que la CSP bloquearía.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const FRONTEND = fileURLToPath(new URL('..', import.meta.url))
const SRC = join(FRONTEND, 'src')

const archivos = (carpeta) =>
  readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre)
    return statSync(ruta).isDirectory() ? archivos(ruta) : /\.(jsx?|css|html)$/.test(nombre) ? [ruta] : []
  })
const CODIGO = archivos(SRC).map((ruta) => ({ ruta: relative(FRONTEND, ruta), texto: readFileSync(ruta, 'utf8') }))

// Orígenes de la CSP: de nginx-seguridad.conf si existe; si no, los del plan (tabla de Contratos)
const CSP_DEL_PLAN = [
  'https://accounts.google.com/gsi/client',
  'https://accounts.google.com/gsi/style',
  'https://accounts.google.com/gsi/',
  'https://maps.google.com',
  'https://www.google.com',
]
const conf = join(FRONTEND, 'nginx-seguridad.conf')
const CSP = existsSync(conf)
  ? [...new Set((readFileSync(conf, 'utf8').match(/Content-Security-Policy\s+"([^"]*)"/) || ['', ''])[1].match(/https:\/\/[^\s;]+/g) || [])]
  : CSP_DEL_PLAN

// Lista cerrada (/analyze A14): URLs absolutas que no son recursos que el navegador cargue en la
// página, cada una con su motivo. Una URL nueva fuera de aquí y de la CSP hace fallar la prueba.
const ENLACES = {
  'http://www.w3.org': 'espacio de nombres de los SVG (xmlns), no se descarga',
  'http://localhost': 'respaldo de desarrollo de la URL de la API cuando no hay ventana ni VITE_API_URL',
  'https://wa.me': 'enlace para escribir por WhatsApp (navegación, no recurso)',
  'https://facebook.com': 'enlace a la red social (navegación)',
  'https://instagram.com': 'enlace a la red social (navegación)',
  'https://schema.org': 'identificador del vocabulario de los datos para buscadores',
  'http://www.sitemaps.org': 'espacio de nombres del sitemap.xml',
  'https://sistema.dentissa.app': 'el propio sitio (URL canónica)',
}

// La lista compara protocolo y host, sin puerto (http://localhost:3000 es el respaldo de desarrollo)
const permitida = (url) => {
  const { origin, protocol, hostname } = new URL(url)
  return `${protocol}//${hostname}` in ENLACES || CSP.some((fuente) => url.startsWith(fuente) || origin === fuente.replace(/\/$/, ''))
}

describe('024 · recursos del código frente a la CSP', () => {
  test('toda URL absoluta de src/ es un enlace conocido o un origen de la CSP', () => {
    const fuera = []
    for (const { ruta, texto } of CODIGO) {
      for (const url of texto.match(/https?:\/\/[A-Za-z0-9.-]+[^\s"'`)<>]*/g) || []) {
        if (!permitida(url)) fuera.push(`${ruta}: ${url}`)
      }
    }
    expect(fuera).toEqual([])
  })

  test('el marcador de "sin imagen" es una imagen del propio sitio', () => {
    const api = CODIGO.find((a) => a.ruta.replace(/\\/g, '/') === 'src/services/api.js').texto
    const marcador = (api.match(/getImageUrl\s*=\s*\(\s*img\s*,\s*placeholder\s*=\s*["'`]([^"'`]+)["'`]/) || [])[1]
    expect(marcador, 'valor por defecto de getImageUrl').toBeDefined()
    expect(marcador).toMatch(/^\/(?!\/)/)
    expect(existsSync(join(FRONTEND, 'public', marcador)), `public${marcador}`).toBe(true)
  })

  test('si el código usa URL.createObjectURL, la CSP permite blob: en imágenes', () => {
    const usaBlob = CODIGO.some(({ texto }) => /URL\.createObjectURL\(/.test(texto))
    expect(usaBlob).toBe(true)
    const politica = existsSync(conf) ? readFileSync(conf, 'utf8') : ''
    const imgSrc = (politica.match(/img-src([^;"]*)/) || ['', ''])[1]
    expect(imgSrc.split(/\s+/), 'img-src en nginx-seguridad.conf').toContain('blob:')
  })
})
