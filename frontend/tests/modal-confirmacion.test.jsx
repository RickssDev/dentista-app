// Spec 021 · regresión de ModalConfirmacion (se usa en 32 lugares): su mensaje es la descripción
// accesible del diálogo, sin romper los botones ni los nombres cuando hay dos abiertos.
import { afterEach, describe, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ModalConfirmacion from '../src/components/ModalConfirmacion.jsx'

afterEach(cleanup)

describe('ModalConfirmacion', () => {
  test('el mensaje es la descripción accesible del diálogo', () => {
    render(
      <ModalConfirmacion abierto titulo="Eliminar servicio" mensaje="¿Seguro que quieres eliminarlo?"
        onConfirmar={() => {}} onCancelar={() => {}} />,
    )
    expect(screen.getByRole('dialog', {
      name: 'Eliminar servicio',
      description: '¿Seguro que quieres eliminarlo?',
    })).toBeTruthy()
  })

  test('con dos abiertos, cada diálogo tiene su propio nombre y su propia descripción', () => {
    render(
      <>
        <ModalConfirmacion abierto titulo="Primero" mensaje="Mensaje uno" onConfirmar={() => {}} onCancelar={() => {}} />
        <ModalConfirmacion abierto titulo="Segundo" mensaje="Mensaje dos" textoCancelar={null} onConfirmar={() => {}} />
      </>,
    )
    expect(screen.getByRole('dialog', { name: 'Primero', description: 'Mensaje uno' })).toBeTruthy()
    expect(screen.getByRole('dialog', { name: 'Segundo', description: 'Mensaje dos' })).toBeTruthy()
  })

  test('los botones siguen funcionando', async () => {
    const onConfirmar = vi.fn()
    const onCancelar = vi.fn()
    render(
      <ModalConfirmacion abierto titulo="Eliminar" mensaje="¿Seguro?" textoConfirmar="Eliminar"
        onConfirmar={onConfirmar} onCancelar={onCancelar} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancelar).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => expect(onConfirmar).toHaveBeenCalledTimes(1))
  })
})
