// Spec 022 · CA13, A4: el HTML prerenderizado se hidrata sin errores, también en otro año.
// El HTML se genera en un proceso aparte (tests/support/prerenderizar.mjs), como en el build: en el
// mismo proceso, el contexto del render del servidor se cuela en el del cliente.
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import process from 'node:process'
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest'
import { act } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../src/App.jsx'
import { RUTAS_PUBLICAS } from '../src/seo/rutas.js'

const RUTAS = RUTAS_PUBLICAS.map((r) => r.ruta)
let paginas
let raiz

beforeAll(() => {
  // Vitest corre desde frontend/; en jsdom import.meta.url no es una URL file://
  const carpeta = process.cwd()
  const ayudante = join(carpeta, 'tests', 'support', 'prerenderizar.mjs')
  paginas = JSON.parse(execFileSync(process.execPath, [ayudante, ...RUTAS], { cwd: carpeta, encoding: 'utf8' }))
}, 60_000)

afterEach(() => {
  act(() => raiz?.unmount())
  raiz = null
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const hidratar = async (ruta, { otroAnio = false } = {}) => {
  document.body.innerHTML = `<div id="root">${paginas[ruta]}</div>`
  const errores = []
  // R6: todo error recuperable cuenta (p. ej. "Switched to client rendering"); el filtro es solo para console.error
  const recuperables = []
  vi.spyOn(console, 'error').mockImplementation((...args) => errores.push(args.join(' ')))
  if (otroAnio) {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(new Date().getFullYear() + 1, 0, 2))
  }
  await act(async () => {
    raiz = hydrateRoot(
      document.getElementById('root'),
      <MemoryRouter initialEntries={[ruta]}>
        <AppRoutes />
      </MemoryRouter>,
      { onRecoverableError: (error) => recuperables.push(String(error?.message || error)) },
    )
  })
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
  return [...recuperables, ...errores.filter((e) => /hydrat|did not match|Recoverable|mismatch|Router/i.test(e))]
}

describe('022 CA13 · hidratación de las páginas públicas', () => {
  test.each(RUTAS.map((ruta) => [ruta]))('%s se hidrata sin errores', async (ruta) => {
    expect(paginas[ruta]).toMatch(/<h1/)
    expect(await hidratar(ruta)).toEqual([])
  })

  test('la portada se hidrata sin errores aunque el año del navegador sea otro', async () => {
    expect(await hidratar('/', { otroAnio: true })).toEqual([])
  })
})
