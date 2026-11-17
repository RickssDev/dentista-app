// @vitest-environment node
// Spec 023 · CA10 (review R20, R21): qué comprime nginx.
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'

const NGINX = readFileSync(new URL('../nginx.conf', import.meta.url), 'utf8')
const tipos = (NGINX.match(/^\s*gzip_types\s+([^;]+);/m) || [])[1]?.trim().split(/\s+/) || []

describe('023 · gzip_types de nginx', () => {
  test('existe la directiva', () => {
    expect(tipos.length).toBeGreaterThan(0)
  })

  // nginx está pasando los .js de application/javascript a text/javascript: se cubren los dos
  test('incluye text/javascript además de application/javascript', () => {
    expect(tipos).toContain('application/javascript')
    expect(tipos).toContain('text/javascript')
  })

  // El JSON de la API puede llevar el token y datos de pacientes: sin comprimir en el origen (BREACH)
  test('no incluye application/json', () => {
    expect(tipos).not.toContain('application/json')
  })
})
