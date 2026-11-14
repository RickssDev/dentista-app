// Spec 022 · CA3, CA13: al navegar en el cliente cambian título, descripción y canónica.
import { afterEach, describe, expect, test } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Link, MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import Metadatos from '../src/components/home/Metadatos.jsx'
import { RUTAS_PUBLICAS, canonica } from '../src/seo/rutas.js'

afterEach(cleanup)

const datos = (ruta) => RUTAS_PUBLICAS.find((r) => r.ruta === ruta)
const descripcion = () => document.head.querySelector('meta[name="description"]')?.getAttribute('content')
const canonicaActual = () => document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')

describe('022 · metadatos al navegar', () => {
  test('de / a /nosotros cambian título, descripción y canónica', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Metadatos />
        <Link to="/nosotros">Nosotros</Link>
      </MemoryRouter>,
    )
    expect(document.title).toBe(datos('/').titulo)

    fireEvent.click(screen.getByText('Nosotros'))

    expect(document.title).toBe(datos('/nosotros').titulo)
    expect(descripcion()).toBe(datos('/nosotros').descripcion)
    expect(canonicaActual()).toBe(canonica('/nosotros'))
  })

  // R1: fuera de la tabla no puede quedar el título de la página anterior (WCAG 2.4.2)
  const DESCRIPCION_INDEX =
    'Dentissa Clínica Dental: odontología general, ortodoncia y estética dental con tecnología avanzada y trato cálido en Ciudad de México.'

  const montar = (inicio) =>
    render(
      <MemoryRouter initialEntries={[inicio]}>
        <Routes>
          <Route
            element={
              <>
                <Metadatos />
                <Outlet />
              </>
            }
          >
            <Route
              path="/nosotros"
              element={
                <>
                  <Link to="/no-existe">Roto</Link>
                  <Link to="/login">Entrar</Link>
                </>
              }
            />
            <Route path="*" element={<h1>Página no encontrada</h1>} />
          </Route>
          <Route path="/login" element={<h1>Iniciar sesión</h1>} />
        </Routes>
      </MemoryRouter>,
    )

  test('de /nosotros a una ruta inexistente: título de la 404 y sin canónica', () => {
    montar('/nosotros')
    expect(document.title).toBe(datos('/nosotros').titulo)

    fireEvent.click(screen.getByText('Roto'))

    expect(document.title).toBe('Página no encontrada | Dentissa')
    expect(canonicaActual()).toBeUndefined()
  })

  test('de /nosotros a /login (fuera del Layout): título y descripción generales, sin canónica', () => {
    montar('/nosotros')
    expect(document.title).toBe(datos('/nosotros').titulo)

    fireEvent.click(screen.getByText('Entrar'))

    expect(document.title).toBe('Dentissa | Clínica Dental')
    expect(descripcion()).toBe(DESCRIPCION_INDEX)
    expect(canonicaActual()).toBeUndefined()
  })
})
