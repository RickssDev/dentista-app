import { afterEach, describe, expect, test, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('../src/services/api', () => ({
  api: vi.fn(async (ruta) =>
    ruta === '/dashboard/resumen'
      ? { payload: { fecha: '2030-01-01', estadisticas: {}, agendaHoy: [] } }
      : { payload: [] },
  ),
  getImageUrl: (ruta) => ruta,
}))

import { api } from '../src/services/api'
import AdminPanel from '../src/pages/admin/AdminPanel.jsx'

const abrir = (rol, ruta) => {
  localStorage.setItem('rol', rol)
  localStorage.setItem('user', JSON.stringify({ nombre_usuario: 'Ana', rol }))
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/admin/*" element={<AdminPanel />} />
      </Routes>
    </MemoryRouter>,
  )
}

const pidioUsuarios = () => api.mock.calls.some(([ruta]) => ruta === '/usuarios')

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.clearAllMocks()
})

describe('004 CA7 · el Asistente no gestiona usuarios', () => {
  test('el acceso rápido para agregar paciente no aparece', async () => {
    abrir('asistente', '/admin')
    await waitFor(() => expect(api).toHaveBeenCalledWith('/dashboard/resumen'))
    expect(screen.queryByText('Agregar paciente')).toBeNull()
  })

  test('la ruta de usuarios lo devuelve al inicio sin pedir datos', async () => {
    abrir('asistente', '/admin/usuarios')
    await waitFor(() => expect(api).toHaveBeenCalledWith('/dashboard/resumen'))
    expect(pidioUsuarios()).toBe(false)
  })

  test('el Administrador conserva el acceso rápido', async () => {
    abrir('administrador', '/admin')
    expect(await screen.findByText('Agregar paciente')).toBeTruthy()
  })

  test('el Administrador conserva la pantalla de usuarios', async () => {
    abrir('administrador', '/admin/usuarios')
    await waitFor(() => expect(pidioUsuarios()).toBe(true))
  })
})
