// @vitest-environment node
// Spec 023 · CA7, CA8: las fotos y la fuente se sirven desde el propio sitio.
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { IMAGES } from '../src/data/site.js'

const leer = (ruta) => readFileSync(new URL(`../${ruta}`, import.meta.url), 'utf8')
const INDEX = leer('index.html')
const GLOBAL = leer('src/styles/home/global.css')
const MAIN = leer('src/main.jsx')

// Ancho de un WebP leyendo su cabecera (VP8, VP8L o VP8X)
const anchoWebp = (ruta) => {
  const b = readFileSync(new URL(`../${ruta}`, import.meta.url))
  expect(b.toString('ascii', 0, 4)).toBe('RIFF')
  expect(b.toString('ascii', 8, 12)).toBe('WEBP')
  const tipo = b.toString('ascii', 12, 16)
  if (tipo === 'VP8 ') return b.readUInt16LE(26) & 0x3fff
  if (tipo === 'VP8L') return (b.readUInt32LE(21) & 0x3fff) + 1
  if (tipo === 'VP8X') return b.readUIntLE(24, 3) + 1
  throw new Error(`WebP desconocido: ${tipo}`)
}

describe('023 CA8 · sin servicios externos de fuentes', () => {
  test('index.html no enlaza Google Fonts, Unsplash ni el ícono JPEG', () => {
    expect(INDEX).not.toContain('fonts.googleapis.com')
    expect(INDEX).not.toContain('fonts.gstatic.com')
    expect(INDEX).not.toContain('images.unsplash.com')
    expect(INDEX).not.toMatch(/<link[^>]*rel="icon"[^>]*type="image\/jpeg"/)
  })

  test('la fuente del sitio es Plus Jakarta Sans servida por el paquete', () => {
    expect(GLOBAL).toMatch(/--font:\s*"Plus Jakarta Sans Variable"/)
    expect(MAIN).toMatch(/import\s+["']@fontsource-variable\/plus-jakarta-sans["']/)
  })

  test('el texto se ve mientras carga la fuente (font-display: swap)', () => {
    const css = readFileSync(new URL('../node_modules/@fontsource-variable/plus-jakarta-sans/index.css', import.meta.url), 'utf8')
    const reglas = css.match(/@font-face\s*{[^}]*}/g) || []
    expect(reglas.length).toBeGreaterThan(0)
    for (const regla of reglas) expect(regla).toMatch(/font-display:\s*swap/)
  })
})

describe('023 CA7 · fotos propias del sitio', () => {
  test('IMAGES no guarda direcciones externas ni la foto de contacto sin uso', () => {
    for (const [clave, valor] of Object.entries(IMAGES)) {
      expect(String(valor), clave).not.toMatch(/^https?:\/\//)
    }
    expect(IMAGES).not.toHaveProperty('contact')
  })

  test.each([[600], [900], [1200]])('existe nosotros-%i.webp con ese ancho', (ancho) => {
    const ruta = `public/images/nosotros-${ancho}.webp`
    expect(existsSync(new URL(`../${ruta}`, import.meta.url)), ruta).toBe(true)
    expect(anchoWebp(ruta)).toBe(ancho)
  })
})
