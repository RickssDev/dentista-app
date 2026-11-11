// Spec 021 · CA11: el panel muestra el motivo del rechazo en un aviso que se anuncia a lectores de
// pantalla, conserva lo escrito y no vuelve a pedir la lista de cuentas.
import { afterEach, describe, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const ULTIMO = 'Debe quedar al menos un Administrador activo'
const CORREO_REGISTRADO = 'El correo ya está registrado'

const cuenta = {
  id: 5,
  nombre: 'Ana',
  apellido: 'Pérez',
  email: 'ana@example.test',
  telefono: '5512345678',
  imagen: null,
  estado: 'activo',
  rol: { id: 1, nombre: 'Administrador' },
}

vi.mock('../src/services/api', () => ({
  api: vi.fn(async (ruta, metodo = 'GET') => {
    if (ruta === '/usuarios' && metodo === 'GET') return { payload: [cuenta] }
    if (ruta === '/usuarios/5' && metodo === 'GET') return { payload: cuenta }
    if (ruta === '/usuarios/5' && metodo === 'PUT') throw new Error(CORREO_REGISTRADO)
    if (ruta === '/usuarios/5' && metodo === 'DELETE') throw new Error(ULTIMO)
    return { payload: [] }
  }),
  getImageUrl: (ruta) => ruta,
}))

import { api } from '../src/services/api'
import AdminUsuarios from '../src/pages/admin/AdminUsuarios.jsx'

const pedidasDeLista = () =>
  api.mock.calls.filter(([ruta, metodo]) => ruta === '/usuarios' && (metodo ?? 'GET') === 'GET').length

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('021 CA11 · avisos de la pantalla de usuarios', () => {
  test('guardar con 400 muestra el mensaje en role=alert y conserva lo escrito', async () => {
    render(<AdminUsuarios />)
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }))

    const nombre = await screen.findByDisplayValue('Ana')
    fireEvent.change(nombre, { target: { value: 'Ana María' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByRole('alert')).toHaveProperty('textContent', CORREO_REGISTRADO)
    expect(screen.getByDisplayValue('Ana María')).toBeTruthy()
  })

  test('eliminar con 409 muestra el motivo como descripción accesible del diálogo y no vuelve a pedir la lista', async () => {
    render(<AdminUsuarios />)
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar usuario' }))
    const antes = pedidasDeLista()

    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))

    const aviso = await screen.findByRole('dialog', { description: ULTIMO })
    expect(aviso).toBeTruthy()
    await waitFor(() => expect(api).toHaveBeenCalledWith('/usuarios/5', 'DELETE'))
    expect(pedidasDeLista()).toBe(antes)
  })
})
