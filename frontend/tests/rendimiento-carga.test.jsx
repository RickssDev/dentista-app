// Spec 023 · CA4, CA5: Google solo en el login, título del login y recarga ante un chunk viejo.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// El botón real exige red externa. El proveedor simulado hace lo que importa del real: al
// montarse inserta el <script> de Google y lo quita al desmontarse (review R8). Las marcas
// data-prueba y el contador dejan ver cuándo y cuántas veces se montan
const google = vi.hoisted(() => ({ montajes: 0 }))
vi.mock('@react-oauth/google', async () => {
  const { useEffect } = await import('react')
  return {
    GoogleOAuthProvider: ({ children }) => {
      useEffect(() => {
        google.montajes += 1
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        document.head.appendChild(script)
        return () => script.remove()
      }, [])
      return <div data-prueba="proveedor-google">{children}</div>
    },
    GoogleLogin: ({ text }) => <div data-prueba="boton-google" data-texto={text} />,
  }
})
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

describe('023 · review r1: login con un solo proveedor y título al salir', () => {
  let pendientes
  beforeEach(() => {
    pendientes = []
    google.montajes = 0
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
  const pintar = () =>
    act(async () => {
      for (const cb of pendientes.splice(0)) cb({ didTimeout: false, timeRemaining: () => 50 })
    })
  const scriptsDeGoogle = () => document.querySelectorAll('script[src*="accounts.google.com/gsi/client"]').length

  test('R7 · al salir del login, el título vuelve al general', () => {
    const { unmount } = montarLogin()
    expect(document.title).toBe('Iniciar sesión | Dentissa')
    unmount()
    expect(document.title).toBe('Dentissa | Clínica Dental')
  })

  test('R9 · tras el pintado hay un solo proveedor y un solo script, con el botón de iniciar sesión', async () => {
    montarLogin()
    await pintar()
    expect(google.montajes).toBe(1)
    expect(scriptsDeGoogle()).toBe(1)
    const boton = document.querySelector('.sign-in .google-btn [data-prueba="boton-google"]')
    expect(boton, 'botón en el panel de iniciar sesión').not.toBeNull()
    expect(boton.getAttribute('data-texto')).toBe('signin_with')
  })

  test('R9 · al cambiar a "Crear cuenta" se mantiene el proveedor y aparece el botón de registro', async () => {
    montarLogin()
    await pintar()
    await act(async () => {
      document.querySelector('.sign-in .cambiar-modo .enlace').click()
    })
    expect(google.montajes).toBe(1)
    expect(scriptsDeGoogle()).toBe(1)
    const boton = document.querySelector('.sign-up .google-btn [data-prueba="boton-google"]')
    expect(boton, 'botón en el panel de registro').not.toBeNull()
    expect(boton.getAttribute('data-texto')).toBe('signup_with')
    expect(document.querySelector('.sign-in .google-btn [data-prueba="boton-google"]')).toBeNull()
  })
})

describe('023 · review r1: cargarPagina robusta', () => {
  test('R11 · con el almacenamiento bloqueado, una carga correcta se resuelve', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'sessionStorage')
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      get() {
        throw new DOMException('Acceso denegado', 'SecurityError')
      },
    })
    try {
      const modulo = { default: () => null }
      await expect(App.cargarPagina(() => Promise.resolve(modulo), vi.fn())()).resolves.toBe(modulo)
    } finally {
      Object.defineProperty(window, 'sessionStorage', descriptor)
    }
  })

  test('R12 · tras recargar por un fallo y cargar bien, un fallo nuevo vuelve a recargar', async () => {
    const error = new Error('chunk viejo')
    const recargar = vi.fn()
    let falla = true
    const cargar = App.cargarPagina(() => (falla ? Promise.reject(error) : Promise.resolve({ default: () => null })), recargar)

    void cargar()
    await new Promise((r) => setTimeout(r, 0))
    expect(recargar).toHaveBeenCalledTimes(1)

    falla = false
    await cargar()

    falla = true
    void cargar()
    await new Promise((r) => setTimeout(r, 0))
    expect(recargar).toHaveBeenCalledTimes(2)
  })
})
