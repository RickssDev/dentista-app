// @vitest-environment node
// Spec 022 · CA5, CA6, CA8: robots.txt y sitemap.xml generados desde la tabla.
import { describe, expect, test } from 'vitest'
import { generarRobots, generarSitemap } from '../src/seo/archivos.js'

describe('022 · robots.txt', () => {
  test('CA5 · permite rastrear e indica el sitemap absoluto', () => {
    const robots = generarRobots()
    expect(robots).toMatch(/^User-agent: \*$/m)
    expect(robots).toMatch(/^Allow: \/$/m)
    expect(robots).toMatch(/^Sitemap: https:\/\/sistema\.dentissa\.app\/sitemap\.xml$/m)
  })

  test('CA8 · no bloquea las rutas privadas: deben poder leer su noindex', () => {
    expect(generarRobots()).not.toMatch(/Disallow/)
  })
})

describe('022 · sitemap.xml', () => {
  const sitemap = generarSitemap()
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

  test('CA6 · es un urlset válido con exactamente las seis páginas públicas', () => {
    expect(sitemap).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/)
    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(urls).toEqual([
      'https://sistema.dentissa.app/',
      'https://sistema.dentissa.app/nosotros',
      'https://sistema.dentissa.app/galeria',
      'https://sistema.dentissa.app/contacto',
      'https://sistema.dentissa.app/aviso-de-privacidad',
      'https://sistema.dentissa.app/terminos-de-servicio',
    ])
  })

  test('CA8 · no lista rutas privadas ni de error', () => {
    for (const url of urls) expect(url).not.toMatch(/login|restablecer|admin|paciente|404/)
  })
})
