// Spec 029 · CA6 y no regresión: EncabezadoModulo lo usan otras 13 páginas (10 del panel y 3 del
// portal del paciente). Sin las props nuevas debe comportarse como hoy; con `botonNoDisponible`, el
// botón sigue enfocable, se anuncia como no disponible con su motivo y no ejecuta la acción.
import { afterEach, describe, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import EncabezadoModulo from '../src/components/EncabezadoModulo.jsx'

afterEach(cleanup)

describe('029 · EncabezadoModulo sin las props nuevas (como hoy)', () => {
  test('el botón no lleva aria-disabled ni aria-describedby, el clic llama a onBoton y no hay línea de detalle', () => {
    const onBoton = vi.fn()
    const { container } = render(
      <EncabezadoModulo titulo="Servicios" descripcion="Administra los servicios." textoBoton="Nuevo servicio" onBoton={onBoton} />,
    )

    const boton = screen.getByRole('button', { name: /Nuevo servicio/ })
    expect(boton.hasAttribute('aria-disabled')).toBe(false)
    expect(boton.hasAttribute('aria-describedby')).toBe(false)
    expect(boton.hasAttribute('disabled')).toBe(false)
    fireEvent.click(boton)
    expect(onBoton).toHaveBeenCalledTimes(1)
    expect(container.querySelector('.encabezado-detalle')).toBeNull()
    expect(screen.getByText('Administra los servicios.')).toBeTruthy()
  })
})

describe('029 · EncabezadoModulo con las props nuevas', () => {
  test('`detalle` pinta una línea bajo la descripción', () => {
    const { container } = render(
      <EncabezadoModulo titulo="Galería" descripcion="Descripción" detalle="3 de 15 imágenes" textoBoton="Nueva imagen" onBoton={() => {}} />,
    )
    const detalle = container.querySelector('.encabezado-detalle')
    expect(detalle?.textContent).toBe('3 de 15 imágenes')
  })

  test('`botonNoDisponible`: aria-disabled, descrito por el id indicado, enfocable y el clic no llama a onBoton', () => {
    const onBoton = vi.fn()
    render(
      <>
        <EncabezadoModulo titulo="Galería" textoBoton="Nueva imagen" onBoton={onBoton} botonNoDisponible idDescripcionBoton="motivo" />
        <p id="motivo">Llegaste al máximo.</p>
      </>,
    )

    const boton = screen.getByRole('button', { name: /Nueva imagen/ })
    expect(boton.getAttribute('aria-disabled')).toBe('true')
    expect(boton.getAttribute('aria-describedby')).toBe('motivo')
    expect(boton.hasAttribute('disabled')).toBe(false)
    boton.focus()
    expect(document.activeElement).toBe(boton)
    fireEvent.click(boton)
    expect(onBoton).not.toHaveBeenCalled()
  })
})
