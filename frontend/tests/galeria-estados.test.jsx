// Spec 023 · CA2, CA9: la galería no salta al pasar del esqueleto al aviso de error o de vacía.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const estado = vi.hoisted(() => ({ actual: { data: [], loading: true, error: null, retry: () => {} } }))
vi.mock('../src/hooks/usePublicData', () => ({ usePublicData: () => estado.actual }))

import Gallery from '../src/pages/Gallery.jsx'

afterEach(cleanup)

const montar = (actual) => {
  estado.actual = { data: [], loading: false, error: null, retry: () => {}, ...actual }
  return render(
    <MemoryRouter>
      <Gallery />
    </MemoryRouter>,
  )
}

// La cuadrícula que fija el alto de la sección: siempre 8 huecos
const cuadricula = () => {
  const grid = document.querySelector('section.section--flush-top .gallery-grid')
  expect(grid, '.gallery-grid').not.toBeNull()
  return grid
}

describe('023 · la galería reserva el alto del esqueleto', () => {
  test('cargando: la cuadrícula de 8 huecos', () => {
    montar({ loading: true })
    expect(cuadricula().children).toHaveLength(8)
  })

  test('error: la misma cuadrícula, invisible y oculta a lectores, con el aviso y "Reintentar"', () => {
    montar({ error: new Error('red') })
    const grid = cuadricula()
    expect(grid.children).toHaveLength(8)
    expect(grid.getAttribute('aria-hidden')).toBe('true')
    const contenedor = grid.parentElement
    expect(contenedor.textContent).toMatch(/No pudimos cargar la galería/)
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeTruthy()
  })

  test('vacía: la misma cuadrícula, invisible, con "Galería en preparación"', () => {
    montar({ data: [] })
    const grid = cuadricula()
    expect(grid.children).toHaveLength(8)
    expect(grid.getAttribute('aria-hidden')).toBe('true')
    expect(grid.parentElement.textContent).toMatch(/Galería en preparación/)
  })

  // Review R6: el aviso se anuncia y, al reintentar, el foco no cae al body
  test('error y vacía: el aviso está en una región role="status"', () => {
    montar({ error: new Error('red') })
    expect(screen.getByText(/No pudimos cargar la galería/).closest('[role="status"]')).not.toBeNull()
    cleanup()
    montar({ data: [] })
    expect(screen.getByText(/Galería en preparación/).closest('[role="status"]')).not.toBeNull()
  })

  test('al pulsar "Reintentar", el foco pasa a la sección de la galería (enfocable con tabIndex -1)', () => {
    const retry = vi.fn()
    montar({ error: new Error('red'), retry })
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))
    expect(retry).toHaveBeenCalledTimes(1)
    const seccion = document.querySelector('section.section--flush-top')
    expect(document.activeElement).toBe(seccion)
    expect(seccion.getAttribute('tabindex')).toBe('-1')
    expect(seccion.getAttribute('aria-label')).toBeTruthy()
  })

  test('el CSS oculta la reserva sin quitarle el espacio', () => {
    const css = readFileSync(join(process.cwd(), 'src/styles/home/Gallery.css'), 'utf8')
    const regla = (css.match(/\.gallery-estado__reserva\s*{([^}]*)}/) || [])[1]
    expect(regla, '.gallery-estado__reserva').toBeDefined()
    expect(regla).toMatch(/visibility:\s*hidden/)
    expect(regla).not.toMatch(/display:\s*none/)
  })
})
