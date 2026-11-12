// @vitest-environment node
// Spec 022 · CA3, CA4: título, descripción y canónica propios por página pública.
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { RUTAS_PUBLICAS, RUTAS_NO_INDEXABLES, SITIO, canonica } from '../src/seo/rutas.js'

const ESPERADAS = ['/', '/nosotros', '/galeria', '/contacto', '/aviso-de-privacidad', '/terminos-de-servicio']

describe('022 · tabla de rutas públicas', () => {
  test('son exactamente las seis páginas públicas', () => {
    expect(RUTAS_PUBLICAS.map((r) => r.ruta)).toEqual(ESPERADAS)
  })

  test('CA3 · títulos únicos que incluyen "Dentissa"', () => {
    const titulos = RUTAS_PUBLICAS.map((r) => r.titulo)
    expect(new Set(titulos).size).toBe(titulos.length)
    for (const titulo of titulos) expect(titulo).toMatch(/Dentissa/)
  })

  test('CA3 · descripciones únicas de 70 a 160 caracteres', () => {
    const descripciones = RUTAS_PUBLICAS.map((r) => r.descripcion)
    expect(new Set(descripciones).size).toBe(descripciones.length)
    for (const d of descripciones) {
      expect(d.length).toBeGreaterThanOrEqual(70)
      expect(d.length).toBeLessThanOrEqual(160)
    }
  })

  test('CA4 · canónica absoluta en sistema.dentissa.app sin barra final', () => {
    expect(SITIO).toBe('https://sistema.dentissa.app')
    expect(canonica('/')).toBe('https://sistema.dentissa.app/')
    expect(canonica('/nosotros')).toBe('https://sistema.dentissa.app/nosotros')
    for (const { ruta } of RUTAS_PUBLICAS.filter((r) => r.ruta !== '/')) {
      expect(canonica(ruta)).not.toMatch(/\/$/)
    }
  })

})

// R5, R8: nginx y la tabla no pueden separarse (una página sin su location da 404 en producción)
describe('022 · nginx.conf sigue a la tabla de rutas', () => {
  const NGINX = readFileSync(new URL('../nginx.conf', import.meta.url), 'utf8')

  test('las location exactas son las páginas públicas de la tabla', () => {
    const exactas = [...NGINX.matchAll(/location = (\S+)/g)].map((m) => m[1]).filter((r) => r !== '/404.html')
    expect(exactas.sort()).toEqual(RUTAS_PUBLICAS.map((r) => r.ruta).sort())
  })

  test('la regla de privadas con noindex incluye cada ruta no indexable', () => {
    const regla = (NGINX.match(/location ~ \^\/\(([^)]+)\)\(\/\.\*\)\?\$ \{[^}]*X-Robots-Tag "noindex"/) || [])[1]
    expect(regla, 'regla de privadas con X-Robots-Tag').toBeTruthy()
    const privadas = regla.split('|').map((r) => `/${r}`)
    expect(privadas.sort()).toEqual([...RUTAS_NO_INDEXABLES].sort())
  })
})
