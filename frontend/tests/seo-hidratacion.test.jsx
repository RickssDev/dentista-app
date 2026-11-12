// Spec 022 · CA13, A4: el HTML prerenderizado se hidrata sin errores, también en otro año.
import { afterEach, describe, expect, test, vi } from 'vitest'
import { act } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../src/App.jsx'
import { render } from '../src/entry-prerender.jsx'
import { RUTAS_PUBLICAS } from '../src/seo/rutas.js'

let raiz

afterEach(() => {
  act(() => raiz?.unmount())
  raiz = null
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const hidratar = async (ruta, { otroAnio = false } = {}) => {
  const html = await render(ruta)
  document.body.innerHTML = `<div id="root">${html}</div>`
  const errores = []
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
      { onRecoverableError: (error) => errores.push(String(error?.message || error)) },
    )
  })
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
  return errores.filter((e) => /hydrat|did not match|Recoverable|mismatch/i.test(e))
}

describe('022 CA13 · hidratación de las páginas públicas', () => {
  test.each(RUTAS_PUBLICAS.map((r) => [r.ruta]))('%s se hidrata sin errores', async (ruta) => {
    expect(await hidratar(ruta)).toEqual([])
  })

  test('la portada se hidrata sin errores aunque el año del navegador sea otro', async () => {
    expect(await hidratar('/', { otroAnio: true })).toEqual([])
  })
})
