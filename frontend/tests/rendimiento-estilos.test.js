// @vitest-environment node
// Spec 023 · CA6, P16, P20: el bloque del mapa cumple contraste y foco y usa solo tokens.
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'

const leer = (ruta) => readFileSync(new URL(`../${ruta}`, import.meta.url), 'utf8')
const GLOBAL = leer('src/styles/home/global.css')
const CONTACT = leer('src/styles/home/Contact.css')

// Tokens de color de :root en global.css
const tokens = Object.fromEntries(
  [...GLOBAL.match(/:root\s*{([^}]*)}/)[1].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map((m) => [m[1], m[2]]),
)
const color = (nombre) => {
  if (nombre === 'blanco') return '#ffffff'
  expect(tokens[nombre], `token --${nombre}`).toBeDefined()
  return tokens[nombre]
}

// Contraste WCAG 2.1
const luminancia = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contraste = (a, b) => {
  const [l1, l2] = [luminancia(color(a)), luminancia(color(b))].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

// Reglas de un CSS (las más internas, también dentro de @media): [{ selector, cuerpo }]
const reglas = (css) =>
  [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: m[1].trim(),
    cuerpo: m[2],
  }))
const regla = (css, selector) => reglas(css).find((r) => r.selector.split(',').map((s) => s.trim()).includes(selector))

describe('023 P16 · contraste del bloque del mapa', () => {
  test.each([
    ['ink', 'tint', 4.5, 'dirección sobre la vista previa'],
    ['muted', 'tint', 4.5, 'nota sobre la vista previa'],
    ['blanco', 'primary-700', 4.5, 'texto de "Ver mapa"'],
    ['ink', 'blanco', 4.5, 'texto de "Cómo llegar"'],
    ['muted', 'blanco', 3, 'borde de "Cómo llegar"'],
    ['primary-600', 'tint', 3, 'anillo de foco sobre la vista previa'],
  ])('%s sobre %s ≥ %s:1 (%s)', (primero, fondo, minimo) => {
    expect(contraste(primero, fondo)).toBeGreaterThanOrEqual(minimo)
  })

  test('la regla global de foco dibuja un contorno de al menos 2 px con un token', () => {
    const foco = regla(GLOBAL, ':focus-visible')
    expect(foco, ':focus-visible').toBeDefined()
    const grosor = Number((foco.cuerpo.match(/outline:\s*(\d+)px\s+solid\s+var\(--[\w-]+\)/) || [])[1])
    expect(grosor).toBeGreaterThanOrEqual(2)
  })
})

describe('023 P20 · el bloque del mapa usa solo tokens', () => {
  test('"Ver mapa" usa --primary-700 de fondo', () => {
    const ver = regla(CONTACT, '.map__ver')
    expect(ver, '.map__ver').toBeDefined()
    expect(ver.cuerpo).toMatch(/background(-color)?:\s*var\(--primary-700\)/)
  })

  test('"Cómo llegar" del bloque usa --muted de borde', () => {
    const llegar = regla(CONTACT, '.map__llegar')
    expect(llegar, '.map__llegar').toBeDefined()
    expect(llegar.cuerpo).toMatch(/border-color:\s*var\(--muted\)/)
  })

  test('la vista previa usa --tint sin brillo animado', () => {
    const mapa = regla(CONTACT, '.map')
    expect(mapa, '.map').toBeDefined()
    expect(mapa.cuerpo).toMatch(/background(-color)?:\s*var\(--tint\)/)
    expect(mapa.cuerpo).not.toMatch(/animation/)
  })

  test('ninguna regla de .map lleva colores literales', () => {
    const delMapa = reglas(CONTACT).filter((r) => /(^|[\s,])\.map(\b|__|\.)/.test(r.selector))
    expect(delMapa.length).toBeGreaterThan(0)
    for (const { selector, cuerpo } of delMapa) {
      expect(cuerpo, selector).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/)
    }
  })

  // Review R2, R10: P20 también prohíbe literales de espaciado y tipografía (los tamaños de
  // contenedor, como min-height o max-height, y los bordes de 1px no son espaciado)
  test('ninguna regla de .map lleva literales de espaciado, tamaño de icono o de texto', () => {
    const PROPIEDADES = /^(margin|padding|gap|row-gap|column-gap|top|right|bottom|left|inset|font-size|width|height)(-[a-z]+)?$/
    const delMapa = reglas(CONTACT).filter((r) => /(^|[\s,])\.map(\b|__|\.)/.test(r.selector))
    for (const { selector, cuerpo } of delMapa) {
      for (const declaracion of cuerpo.split(';')) {
        const [propiedad, valor = ''] = declaracion.split(':').map((s) => s.trim())
        if (!PROPIEDADES.test(propiedad)) continue
        expect(valor, `${selector} { ${propiedad} }`).not.toMatch(/(^|[\s(])[1-9][\d.]*(px|rem|em)\b/)
      }
    }
  })
})

describe('023 · review r1: foco, "Cómo llegar" y tamaño del bloque', () => {
  // El iframe delega el foco en su documento: en Chrome no coincide con :focus ni :focus-visible,
  // pero el bloque sí con :focus-within (comprobado en el navegador en T038)
  test('R1 · con el foco en el mapa, el bloque dibuja un anillo visible hacia dentro', () => {
    const foco = regla(CONTACT, '.map.is-activo:focus-within:not(:has(.map__open:focus))')
    expect(foco, '.map.is-activo:focus-within').toBeDefined()
    const grosor = Number((foco.cuerpo.match(/outline:\s*(\d+)px\s+solid\s+var\(--[\w-]+\)/) || [])[1])
    expect(grosor).toBeGreaterThanOrEqual(2)
    const desplazamiento = Number((foco.cuerpo.match(/outline-offset:\s*(-?\d+)px/) || [])[1])
    expect(desplazamiento).toBeLessThanOrEqual(-2)
  })

  test('R5 · "Cómo llegar" al pasar el ratón usa --primary-700 (≥ 4,5:1 sobre blanco)', () => {
    const encima = regla(CONTACT, '.map__llegar:hover')
    expect(encima, '.map__llegar:hover').toBeDefined()
    expect(encima.cuerpo).toMatch(/(^|;|\s)color:\s*var\(--primary-700\)/)
    expect(contraste('primary-700', 'blanco')).toBeGreaterThanOrEqual(4.5)
  })

  test('R31 · cargar el mapa no cambia el tamaño del bloque', () => {
    const activas = reglas(CONTACT).filter((r) => /\.map\.is-activo/.test(r.selector))
    for (const { selector, cuerpo } of activas) {
      expect(cuerpo, selector).not.toMatch(/(^|;|\s)(aspect-ratio|height|min-height|max-height|padding)\s*:/)
    }
  })
})
