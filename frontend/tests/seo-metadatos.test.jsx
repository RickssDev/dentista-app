// Spec 022 · CA3, CA13: al navegar en el cliente cambian título, descripción y canónica.
import { afterEach, describe, expect, test } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Link, MemoryRouter } from 'react-router-dom'
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
})
