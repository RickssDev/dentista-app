// Spec 023 · CA6, K2: el mapa de Google se carga solo cuando el visitante lo pide.
import { afterEach, describe, expect, test } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Contact from '../src/pages/Contact.jsx'
import { mapLink } from '../src/data/site.js'

afterEach(cleanup)

const TITULO_MAPA = 'Ubicación de Dentissa en Google Maps'

const montar = () =>
  render(
    <MemoryRouter>
      <Contact />
    </MemoryRouter>,
  )

const bloque = () => document.querySelector('.map')
const verMapa = () => screen.getByRole('link', { name: /ver mapa/i })
const comoLlegar = () => screen.getAllByRole('link', { name: /cómo llegar/i })
// Lo que fija el tamaño del bloque: sus clases (sin las de estado `is-*`) y su estilo en línea
const tamano = (el) => ({
  clases: [...el.classList].filter((c) => !c.startsWith('is-')).sort(),
  estilo: el.getAttribute('style'),
})

describe('023 CA6 · mapa bajo demanda en contacto', () => {
  test('al abrir no hay mapa: se ven "Ver mapa" (enlace a Google Maps) y "Cómo llegar"', () => {
    montar()
    expect(document.querySelector('iframe')).toBeNull()
    expect(verMapa()).toHaveAttribute('href', mapLink)
    expect(comoLlegar().length).toBeGreaterThan(0)
  })

  test('con clic aparece el mapa en el mismo bloque, sin navegar, y el foco pasa al mapa', () => {
    montar()
    const antes = bloque()
    const medidaAntes = tamano(antes)

    const noCancelado = fireEvent.click(verMapa())

    expect(noCancelado).toBe(false) // el clic se cancela: no se abre Google Maps
    const mapa = screen.getByTitle(TITULO_MAPA)
    expect(mapa.tagName).toBe('IFRAME')
    expect(antes.contains(mapa)).toBe(true)
    expect(bloque()).toBe(antes)
    expect(tamano(bloque())).toEqual(medidaAntes) // K2: el bloque no cambia de tamaño
    expect(document.activeElement).toBe(mapa)
    expect(comoLlegar().length).toBeGreaterThan(0)
  })

  test('con el teclado (foco en "Ver mapa" y Enter) también aparece el mapa con el foco', async () => {
    montar()
    const usuario = userEvent.setup()
    verMapa().focus()
    expect(document.activeElement).toBe(verMapa())

    await usuario.keyboard('{Enter}')

    const mapa = screen.getByTitle(TITULO_MAPA)
    expect(document.activeElement).toBe(mapa)
  })
})
