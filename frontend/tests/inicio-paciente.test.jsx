// Spec 030 · CA7 (caracterización): la tarjeta «Próxima cita» de Inicio y su formulario de
// reprogramar o cancelar se comportan igual antes y después de extraer el formulario a un
// componente compartido. Escrito antes del cambio (T011).
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const PROXIMA = {
  id_cita: 40, id_servicio: 2, nombre_servicio: 'Limpieza', fecha_agendada: '2030-03-10T06:00:00.000Z', hora: '10:00:00',
}

vi.mock('../src/components/sidebar', () => ({ default: () => null }))
vi.mock('../src/services/api', () => ({
  api: vi.fn(async (ruta) => {
    if (ruta === '/citas/proximacita') return { data: PROXIMA }
    if (ruta === '/citas/miscitas') return { payload: [] }
    if (ruta.startsWith('/citas/horarios-disponibles')) return { payload: ['11:00', '12:00'] }
    return { payload: null }
  }),
  getImageUrl: (r) => r,
}))

import { api } from '../src/services/api'
import InicioPaciente from '../src/pages/paciente/InicioPaciente.jsx'

const montar = async () => {
  render(
    <MemoryRouter>
      <InicioPaciente />
    </MemoryRouter>,
  )
  await screen.findByRole('button', { name: /Reprogramar/ })
}

beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}))
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

const llamadas = (metodo) => api.mock.calls.filter(([, m]) => m === metodo)

describe('030 · CA7 Inicio sin cambios', () => {
  test('al montarse pide la próxima cita y muestra sus dos acciones', async () => {
    await montar()
    expect(api.mock.calls.some(([ruta]) => ruta === '/citas/proximacita')).toBe(true)
    expect(screen.getByRole('button', { name: /Reprogramar/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Cancelar cita/ })).toBeTruthy()
  })

  test('reprogramar: campos, horarios del servicio, PUT y aviso de éxito', async () => {
    await montar()
    fireEvent.click(screen.getByRole('button', { name: /Reprogramar/ }))
    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByText('Reprogramar cita')).toBeTruthy()

    fireEvent.change(within(dialogo).getByLabelText('Nueva fecha'), { target: { value: '2030-03-12' } })
    await waitFor(() => expect(api.mock.calls.some(([ruta]) =>
      ruta === '/citas/horarios-disponibles?fecha=2030-03-12&id_servicio=2')).toBe(true))
    fireEvent.change(await within(dialogo).findByLabelText('Nueva hora'), { target: { value: '11:00' } })
    fireEvent.change(within(dialogo).getByLabelText('Motivo'), { target: { value: 'Tengo un viaje' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Reprogramar' }))

    await screen.findByText('Tu cita se reprogramó correctamente.')
    expect(screen.getByText('Cita reprogramada')).toBeTruthy()
    expect(llamadas('PUT')[0]).toEqual(['/citas/mias/40', 'PUT', { fecha_agendada: '2030-03-12', hora: '11:00', motivo: 'Tengo un viaje' }])
  })

  test('cancelar: PATCH con el motivo y aviso de éxito', async () => {
    await montar()
    fireEvent.click(screen.getByRole('button', { name: /Cancelar cita/ }))
    const dialogo = await screen.findByRole('dialog')
    fireEvent.change(within(dialogo).getByLabelText('Motivo'), { target: { value: 'No puedo ir' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar cita' }))

    await screen.findByText('Tu cita se canceló correctamente.')
    expect(screen.getByText('Cita cancelada')).toBeTruthy()
    expect(llamadas('PATCH')[0]).toEqual(['/citas/mias/40/cancelar', 'PATCH', { motivo: 'No puedo ir' }])
  })

  test('un motivo de solo espacios muestra el error del formulario y no llama al servidor', async () => {
    await montar()
    fireEvent.click(screen.getByRole('button', { name: /Cancelar cita/ }))
    const dialogo = await screen.findByRole('dialog')
    fireEvent.change(within(dialogo).getByLabelText('Motivo'), { target: { value: '   ' } })
    fireEvent.submit(dialogo.querySelector('form'))

    expect((await within(dialogo).findByRole('alert')).textContent).toBe('Escribe el motivo de la cancelación.')
    expect(llamadas('PATCH')).toHaveLength(0)
  })
})
