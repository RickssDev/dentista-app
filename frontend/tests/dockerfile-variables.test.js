// @vitest-environment node
// Ficha 2026-11-17-fix-dockerfile-google-client-id: Vite incrusta las variables VITE_* al construir;
// dentro de Docker solo llegan las que el Dockerfile declara como ARG y pasa a ENV (.env no se copia).
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const DOCKERFILE = readFileSync(join(RAIZ, 'Dockerfile'), 'utf8')

const archivos = (carpeta) =>
  readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre)
    return statSync(ruta).isDirectory() ? archivos(ruta) : /\.(jsx?|mjs)$/.test(nombre) ? [ruta] : []
  })

const usadas = [
  ...new Set(
    archivos(join(RAIZ, 'src')).flatMap((ruta) =>
      [...readFileSync(ruta, 'utf8').matchAll(/import\.meta\.env\.(VITE_[A-Z0-9_]+)/g)].map((m) => m[1]),
    ),
  ),
].sort()

// Opcionales: tienen un respaldo correcto en el contenedor y no hace falta pasarlas al build
const OPCIONALES = {
  VITE_ASSETS_URL: 'sin ella, src/services/api.js usa el mismo origen que la API (nginx hace de proxy)',
}
const exigidas = usadas.filter((v) => !(v in OPCIONALES))

describe('fix · el Dockerfile del frontend pasa al build cada variable VITE_* del código', () => {
  test('el código usa variables VITE_*', () => {
    expect(usadas).toContain('VITE_GOOGLE_CLIENT_ID')
  })

  test('cada opcional sigue usándose y tiene su motivo', () => {
    for (const [variable, motivo] of Object.entries(OPCIONALES)) {
      expect(usadas, variable).toContain(variable)
      expect(motivo).toBeTruthy()
    }
  })

  test.each(exigidas.map((v) => [v]))('%s se declara como ARG y se pasa a ENV', (variable) => {
    expect(DOCKERFILE).toMatch(new RegExp(`^ARG ${variable}(=|\\s|$)`, 'm'))
    expect(DOCKERFILE).toMatch(new RegExp(`^ENV ${variable}=\\$${variable}\\s*$`, 'm'))
  })
})
