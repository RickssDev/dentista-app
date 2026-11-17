// Spec 023 · CA4, CA5: Google solo en el login, título del login y recarga ante un chunk viejo.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// El botón real exige red externa: se simula el proveedor (solo pinta a sus hijos) y el botón
// Las marcas data-prueba dejan ver cuándo se montan
vi.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }) => <div data-prueba="proveedor-google">{children}</div>,
  GoogleLogin: () => <div data-prueba="boton-google" />,
}))
vi.mock('../src/services/api', async (original) => ({ ...(await original()), api: vi.fn() }))

import * as App from '../src/App.jsx'
import Login from '../src/pages/admin/login.jsx'

// Vitest corre desde frontend/; en jsdom import.meta.url no es una URL file://
const fuente = (ruta) => readFileSync(join(process.cwd(), ruta), 'utf8')

afterEach(() => {
  cleanup()
  sessionStorage.clear()
})

describe('023 CA5 · el inicio de sesión con Google solo se monta en el login', () => {
  test('main.jsx no envuelve la app en GoogleOAuthProvider', () => {
    expect(fuente('src/main.jsx')).not.toMatch(/GoogleOAuthProvider/)
  })

  test('login.jsx monta su propio GoogleOAuthProvider', () => {
    expect(fuente('src/pages/admin/login.jsx')).toMatch(/<GoogleOAuthProvider\b/)
  })

  test.each([['/'], ['/nosotros'], ['/contacto']])('%s no inserta ningún script de accounts.google.com', async (ruta) => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={[ruta]}>
          <App.AppRoutes />
        </MemoryRouter>,
      )
    })
    const scripts = [...document.querySelectorAll('script')].map((s) => s.src)
    expect(scripts.filter((src) => src.includes('accounts.google.com'))).toEqual([])
  })
})

describe('023 A40 · título del login', () => {
  beforeEach(() => {
    document.title = 'Dentissa | Clínica Dental'
  })

  test('al montarse, el login pone "Iniciar sesión | Dentissa"', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(document.title).toBe('Iniciar sesión | Dentissa')
  })
})

describe('023 CA4 · cargarPagina recarga una vez si el chunk ya no existe', () => {
  test('carga el módulo cuando el import funciona', async () => {
    const modulo = { default: () => null }
    const recargar = vi.fn()
    await expect(App.cargarPagina(() => Promise.resolve(modulo), recargar)()).resolves.toBe(modulo)
    expect(recargar).not.toHaveBeenCalled()
  })

  test('si el import falla, recarga la página una sola vez', async () => {
    const error = new Error('Failed to fetch dynamically imported module')
    const recargar = vi.fn()
    const cargar = App.cargarPagina(() => Promise.reject(error), recargar)

    // Primera vez: recarga y la promesa queda pendiente (la página se va a recargar)
    const primera = cargar()
    await new Promise((r) => setTimeout(r, 0))
    expect(recargar).toHaveBeenCalledTimes(1)
    void primera

    // Tras la recarga, si vuelve a fallar no recarga en bucle: propaga el error
    await expect(cargar()).rejects.toBe(error)
    expect(recargar).toHaveBeenCalledTimes(1)
  })
})

describe('023 CA1, CA5 · el botón de Google se monta cuando la página ya está pintada', () => {
  let pendientes
  beforeEach(() => {
    pendientes = []
    vi.stubGlobal('requestIdleCallback', vi.fn((cb) => pendientes.push(cb)))
    vi.stubGlobal('cancelIdleCallback', vi.fn())
  })
  afterEach(() => vi.unstubAllGlobals())

  const montarLogin = () =>
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>,
    )

  test('al montar el login, el contenedor del botón está pero Google aún no se monta', () => {
    montarLogin()
    expect(document.querySelector('.google-btn')).not.toBeNull()
    expect(document.querySelector('[data-prueba="proveedor-google"]')).toBeNull()
    expect(document.querySelector('[data-prueba="boton-google"]')).toBeNull()
  })

  test('cuando el navegador queda libre tras cargar, se montan el proveedor y el botón', async () => {
    montarLogin()
    expect(pendientes.length).toBeGreaterThan(0)
    await act(async () => {
      for (const cb of pendientes.splice(0)) cb({ didTimeout: false, timeRemaining: () => 50 })
    })
    expect(document.querySelector('[data-prueba="proveedor-google"]')).not.toBeNull()
    expect(document.querySelector('[data-prueba="boton-google"]')).not.toBeNull()
  })
})
