// Spec 023 · CA3: la foto principal no se oculta a la espera de la app ni parpadea al cargar.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { afterEach, describe, expect, test } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import SmartImage from '../src/components/home/SmartImage.jsx'

afterEach(cleanup)

const contenedor = () => document.querySelector('.smart-img')
const clases = () => [...contenedor().classList]

describe('023 CA3 · SmartImage con priority', () => {
  test('al montarse lleva is-priority y no is-loading', () => {
    render(<SmartImage src="/images/hero-dentissa.webp" alt="Portada" priority />)
    expect(clases()).toContain('is-priority')
    expect(clases()).not.toContain('is-loading')
  })

  test('tras cargar la imagen sigue visible (sin volver a is-loading)', () => {
    render(<SmartImage src="/images/hero-dentissa.webp" alt="Portada" priority />)
    fireEvent.load(contenedor().querySelector('img'))
    expect(clases()).toContain('is-priority')
    expect(clases()).not.toContain('is-loading')
  })

  test('sin priority mantiene el comportamiento de siempre (is-loading hasta cargar)', () => {
    render(<SmartImage src="/images/galeria.webp" alt="Galería" />)
    expect(clases()).toContain('is-loading')
    expect(clases()).not.toContain('is-priority')
  })

  test('el CSS no oculta la imagen con prioridad', () => {
    const css = readFileSync(join(process.cwd(), 'src/styles/home/global.css'), 'utf8')
    const regla = (css.match(/\.smart-img\.is-priority img\s*{([^}]*)}/) || [])[1]
    expect(regla, '.smart-img.is-priority img').toBeDefined()
    expect(regla).toMatch(/opacity:\s*1\b/)
  })
})
