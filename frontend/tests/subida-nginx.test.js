// @vitest-environment node
// Spec 014 · CA2 (hotfix 2026-11-23, docs/changes/2026-11-23-hotfix-limite-subida-nginx.md):
// nginx deja pasar a Express una imagen del límite de la app. Sin client_max_body_size, nginx corta
// en 1 MB con un 413 antes de que Express aplique su propio límite y su mensaje.
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { MAX_IMAGEN_BYTES } from '../src/utils/validarImagen.js'

const NGINX = readFileSync(new URL('../nginx.conf', import.meta.url), 'utf8')

// Bloque completo de una location (de "location" a su llave de cierre, contando llaves anidadas);
// anclado al inicio de línea para no confundirlo con un comentario
const bloque = (prefijo) => {
  const escapado = prefijo.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
  const m = new RegExp(`^[ \\t]*location\\s+${escapado}\\s*\\{`, 'm').exec(NGINX)
  if (!m) return ''
  let nivel = 0
  for (let i = m.index; i < NGINX.length; i += 1) {
    if (NGINX[i] === '{') nivel += 1
    if (NGINX[i] === '}' && --nivel === 0) return NGINX.slice(m.index, i + 1)
  }
  return ''
}

const aBytes = (valor) => {
  const [, n, unidad = ''] = /^(\d+)([kKmMgG]?)$/.exec(valor) || []
  if (!n) return NaN
  return Number(n) * ({ '': 1, k: 1024, m: 1024 ** 2, g: 1024 ** 3 })[unidad.toLowerCase()]
}

const limite = (texto) => (texto.match(/^\s*client_max_body_size\s+(\S+);/m) || [])[1]

describe('014 · CA2 · tamaño máximo de petición en nginx', () => {
  const api = limite(bloque('^~ /api/'))

  test('/api/ fija client_max_body_size', () => {
    expect(api).toBeDefined()
  })

  // Una imagen del límite más los campos del formulario multipart
  test('/api/ admite una imagen del límite de la app', () => {
    expect(aBytes(api)).toBeGreaterThan(MAX_IMAGEN_BYTES)
  })

  // Con margen, no sin límite: 0 lo desactiva y dejaría a Express recibir cuerpos de cualquier tamaño
  test('/api/ no pasa de 8 MB', () => {
    expect(aBytes(api)).toBeLessThanOrEqual(8 * 1024 ** 2)
  })

  // Solo /api/ sube archivos: el resto del sitio conserva el 1 MB por defecto
  test('no se sube el límite fuera de /api/', () => {
    const fuera = NGINX.replace(bloque('^~ /api/'), '')
    expect(limite(fuera)).toBeUndefined()
  })
})
