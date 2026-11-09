import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// Evita cargar Google: el botón real exige su proveedor y red externa.
vi.mock('@react-oauth/google', () => ({ GoogleLogin: () => null }))
vi.mock('../src/services/api', () => ({ api: vi.fn() }))

import { api } from '../src/services/api'
import Login from '../src/pages/admin/login.jsx'

const iniciarSesion = async (payload) => {
  api.mockResolvedValue({ payload: { token: 'token-de-prueba', ...payload } })

  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<p>destino panel</p>} />
        <Route path="/paciente" element={<p>destino portal</p>} />
        <Route path="/paciente/completar-perfil" element={<p>destino completar perfil</p>} />
      </Routes>
    </MemoryRouter>,
  )

  const usuario = userEvent.setup()
  const correo = document.getElementById('login-correo')
  await usuario.type(correo, 'paciente@example.test')
  await usuario.type(document.getElementById('login-pass'), 'clave-de-prueba-1')
  await usuario.click(correo.closest('form').querySelector('button[type=submit]'))
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('001 CA8 · redirección tras iniciar sesión', () => {
  test.each(['Administrador', 'Asistente'])('001 CA8 · %s va al panel', async (rol) => {
    await iniciarSesion({ user: { rol } })
    expect(await screen.findByText('destino panel')).toBeTruthy()
  })

  test('001 CA8 · el paciente con perfil va al portal', async () => {
    await iniciarSesion({ user: { rol: 'Paciente' }, tienePerfilPaciente: true })
    expect(await screen.findByText('destino portal')).toBeTruthy()
  })

  test('001 CA8 · el paciente sin perfil va a completarlo', async () => {
    await iniciarSesion({ user: { rol: 'Paciente' }, tienePerfilPaciente: false })
    expect(await screen.findByText('destino completar perfil')).toBeTruthy()
  })
})
