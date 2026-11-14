// @vitest-environment node
// Spec 022 · CA11, CA12: íconos PNG y la imagen para compartir.
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'

const publico = (archivo) => readFileSync(new URL(`../public/${archivo}`, import.meta.url))

// Ancho y alto de un PNG (cabecera IHDR)
const medidasPng = (buf) => [buf.readUInt32BE(16), buf.readUInt32BE(20)]

// Ancho y alto de un JPEG (primer marcador SOF)
const medidasJpeg = (buf) => {
  let i = 2
  while (i < buf.length) {
    const marcador = buf[i + 1]
    const largo = buf.readUInt16BE(i + 2)
    if (marcador >= 0xc0 && marcador <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marcador)) {
      return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)]
    }
    i += 2 + largo
  }
  throw new Error('JPEG sin marcador SOF')
}

describe('022 CA12 · íconos PNG', () => {
  test.each([
    ['favicon-32.png', 32],
    ['apple-touch-icon.png', 180],
    ['icon-192.png', 192],
    ['icon-512.png', 512],
  ])('%s mide %i px de lado', (archivo, lado) => {
    expect(medidasPng(publico(archivo))).toEqual([lado, lado])
  })

  test('index.html enlaza los íconos', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
    expect(html).toMatch(/<link rel="icon" type="image\/png" sizes="32x32" href="\/favicon-32\.png"/)
    expect(html).toMatch(/<link rel="icon" type="image\/png" sizes="192x192" href="\/icon-192\.png"/)
    expect(html).toMatch(/<link rel="icon" type="image\/png" sizes="512x512" href="\/icon-512\.png"/)
    expect(html).toMatch(/<link rel="apple-touch-icon" sizes="180x180" href="\/apple-touch-icon\.png"/)
  })
})

describe('022 CA11 · imagen para compartir', () => {
  test('og-dentissa.jpg mide 1200×630', () => {
    expect(medidasJpeg(publico('og-dentissa.jpg'))).toEqual([1200, 630])
  })
})
