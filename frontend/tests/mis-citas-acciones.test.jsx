// Spec 030 · CA1–CA6, CA9, P16, P17, P20: «Mis citas» ofrece «Reprogramar» y «Cancelar cita» en las
// citas que el servidor marca como modificables, con el mismo formulario y los mismos avisos que
// Inicio, y devuelve el foco a un control con foco visible al cerrar.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const sim = vi.hoisted(() => ({ citas: [], errorAlGuardar: null, falloRecarga: false, pedidas: 0, retenerRecarga: null }))

const cita = (cambios) => ({
  id: 40, id_servicio: 2, nombre_servicio: 'Limpieza', fecha_agendada: '2030-03-10T06:00:00.000Z',
  hora: '10:00:00', estado: 'pendiente', motivo: null, comentado: false, modificable: true, ...cambios,
})

vi.mock('../src/components/sidebar', () => ({ default: () => null }))
vi.mock('../src/services/api', () => ({
  api: vi.fn(async (ruta, metodo = 'GET', datos) => {
    if (ruta === '/citas/miscitas') {
      sim.pedidas += 1
      // R1: la recarga posterior a una acción puede quedar pendiente hasta que el test la suelte
      if (sim.retenerRecarga && sim.pedidas > 1) await sim.retenerRecarga
      if (sim.falloRecarga && sim.pedidas > 1) throw new Error('Error interno del servidor')
      return { payload: sim.citas.map((c) => ({ ...c })) }
    }
    if (ruta === '/servicios/publicos') return { payload: [] }
    if (ruta === '/comentarios' && metodo === 'POST') return { message: 'ok' }
    if (ruta.startsWith('/citas/horarios-disponibles')) return { payload: ['11:00', '12:00'] }
    const reprogramar = /^\/citas\/mias\/(\d+)$/.exec(ruta)
    if (reprogramar && metodo === 'PUT') {
      if (sim.errorAlGuardar) throw new Error(sim.errorAlGuardar)
      sim.citas = sim.citas.map((c) => (c.id === Number(reprogramar[1])
        ? { ...c, fecha_agendada: `${datos.fecha_agendada}T06:00:00.000Z`, hora: `${datos.hora}:00` } : c))
      return { message: 'ok' }
    }
    const cancelar = /^\/citas\/mias\/(\d+)\/cancelar$/.exec(ruta)
    if (cancelar && metodo === 'PATCH') {
      if (sim.errorAlGuardar) throw new Error(sim.errorAlGuardar)
      sim.citas = sim.citas.map((c) => (c.id === Number(cancelar[1]) ? { ...c, estado: 'cancelada', modificable: false } : c))
      return { message: 'ok' }
    }
    return { payload: null }
  }),
  getImageUrl: (r) => r,
}))

import { api } from '../src/services/api'
import CitasPaciente from '../src/pages/paciente/CitasPaciente.jsx'

const NOMBRE_REPROGRAMAR = 'Reprogramar cita de Limpieza del 10/03/2030 a las 10:00 AM'
const NOMBRE_CANCELAR = 'Cancelar cita de Limpieza del 10/03/2030 a las 10:00 AM'

beforeEach(() => {
  sim.citas = []
  sim.errorAlGuardar = null
  sim.falloRecarga = false
  sim.pedidas = 0
  sim.retenerRecarga = null
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

const montar = async (citas) => {
  sim.citas = citas
  render(
    <MemoryRouter>
      <CitasPaciente />
    </MemoryRouter>,
  )
  await waitFor(() => expect(sim.pedidas).toBeGreaterThan(0))
  if (citas.length) await screen.findAllByText(citas[0].nombre_servicio)
}

const llamadas = (metodo) => api.mock.calls.filter(([, m]) => m === metodo)

const reprogramar = async (dialogo, motivo = 'Tengo un viaje') => {
  fireEvent.change(within(dialogo).getByLabelText('Nueva fecha'), { target: { value: '2030-03-12' } })
  const hora = within(dialogo).getByLabelText('Nueva hora')
  await waitFor(() => expect(within(hora).queryByRole('option', { name: /11:00/ })).not.toBeNull())
  fireEvent.change(hora, { target: { value: '11:00' } })
  fireEvent.change(within(dialogo).getByLabelText('Motivo'), { target: { value: motivo } })
  fireEvent.click(within(dialogo).getByRole('button', { name: 'Reprogramar' }))
}

describe('030 · qué tarjetas ofrecen las acciones (CA1, CA2, P17)', () => {
  test('una modificable muestra los dos botones con su cita en el nombre accesible', async () => {
    await montar([cita({})])
    expect(screen.getByRole('button', { name: NOMBRE_REPROGRAMAR }).textContent).toMatch(/Reprogramar/)
    expect(screen.getByRole('button', { name: NOMBRE_CANCELAR }).textContent).toMatch(/Cancelar cita/)
  })

  test('una pendiente con modificable: false y una completada no los muestran; la completada conserva su comentario', async () => {
    await montar([
      cita({ id: 41, modificable: false }),
      cita({ id: 42, estado: 'completada', modificable: false }),
    ])
    expect(screen.queryByRole('button', { name: /^Reprogramar cita/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Cancelar cita/ })).toBeNull()
    expect(screen.getByRole('button', { name: /Dejar comentario/ })).toBeTruthy()
  })
})

describe('030 · reprogramar y cancelar (CA3–CA6)', () => {
  test('reprogramar usa los horarios del servicio, manda el PUT, actualiza la tarjeta y avisa', async () => {
    await montar([cita({})])
    fireEvent.click(screen.getByRole('button', { name: NOMBRE_REPROGRAMAR }))
    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByText('Reprogramar cita')).toBeTruthy()
    await reprogramar(dialogo)

    await screen.findByText('Tu cita se reprogramó correctamente.')
    expect(screen.getByText('Cita reprogramada')).toBeTruthy()
    expect(api.mock.calls.some(([r]) => r === '/citas/horarios-disponibles?fecha=2030-03-12&id_servicio=2')).toBe(true)
    expect(llamadas('PUT')[0]).toEqual(['/citas/mias/40', 'PUT', { fecha_agendada: '2030-03-12', hora: '11:00', motivo: 'Tengo un viaje' }])
    expect(sim.pedidas).toBe(2)
    expect(screen.getByText('12/03/2030')).toBeTruthy()
  })

  test('cancelar manda el PATCH; la tarjeta queda cancelada sin botones y sale el aviso', async () => {
    await montar([cita({})])
    fireEvent.click(screen.getByRole('button', { name: NOMBRE_CANCELAR }))
    const dialogo = await screen.findByRole('dialog')
    fireEvent.change(within(dialogo).getByLabelText('Motivo'), { target: { value: 'No puedo ir' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar cita' }))

    await screen.findByText('Tu cita se canceló correctamente.')
    expect(screen.getByText('Cita cancelada')).toBeTruthy()
    expect(llamadas('PATCH')[0]).toEqual(['/citas/mias/40/cancelar', 'PATCH', { motivo: 'No puedo ir' }])
    expect(screen.getByText('cancelada')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^Cancelar cita de/ })).toBeNull()
  })

  test('un rechazo del servidor sale en el formulario y la tarjeta conserva sus datos', async () => {
    await montar([cita({})])
    sim.errorAlGuardar = 'El horario seleccionado ya está ocupado'
    fireEvent.click(screen.getByRole('button', { name: NOMBRE_REPROGRAMAR }))
    const dialogo = await screen.findByRole('dialog')
    await reprogramar(dialogo)

    expect((await within(dialogo).findByRole('alert')).textContent).toBe('El horario seleccionado ya está ocupado')
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByText('10/03/2030')).toBeTruthy()
    expect(screen.getByRole('button', { name: NOMBRE_REPROGRAMAR })).toBeTruthy()
  })

  test('un motivo de solo espacios muestra el error del formulario sin llamar al servidor', async () => {
    await montar([cita({})])
    fireEvent.click(screen.getByRole('button', { name: NOMBRE_CANCELAR }))
    const dialogo = await screen.findByRole('dialog')
    fireEvent.change(within(dialogo).getByLabelText('Motivo'), { target: { value: '   ' } })
    fireEvent.submit(dialogo.querySelector('form'))
    expect((await within(dialogo).findByRole('alert')).textContent).toBe('Escribe el motivo de la cancelación.')
    expect(llamadas('PATCH')).toHaveLength(0)
  })

  test('con dos pendientes, la llamada va a la elegida y la otra conserva sus botones', async () => {
    await montar([
      cita({ id: 40 }),
      cita({ id: 41, nombre_servicio: 'Ortodoncia', fecha_agendada: '2030-03-11T06:00:00.000Z' }),
    ])
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar cita de Ortodoncia del 11/03/2030 a las 10:00 AM' }))
    const dialogo = await screen.findByRole('dialog')
    fireEvent.change(within(dialogo).getByLabelText('Motivo'), { target: { value: 'No puedo ir' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar cita' }))

    await screen.findByText('Tu cita se canceló correctamente.')
    expect(llamadas('PATCH')[0][0]).toBe('/citas/mias/41/cancelar')
    expect(screen.getByRole('button', { name: NOMBRE_REPROGRAMAR })).toBeTruthy()
    expect(screen.getByRole('button', { name: NOMBRE_CANCELAR })).toBeTruthy()
  })
})

describe('030 · foco (CA9, P16)', () => {
  test('cerrar el formulario sin guardar devuelve el foco al botón que lo abrió', async () => {
    await montar([cita({})])
    const boton = screen.getByRole('button', { name: NOMBRE_REPROGRAMAR })
    fireEvent.click(boton)
    const dialogo = await screen.findByRole('dialog')
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: NOMBRE_REPROGRAMAR })))
  })

  test('tras el aviso de reprogramar, el foco va al botón «Reprogramar» de esa tarjeta', async () => {
    await montar([cita({})])
    fireEvent.click(screen.getByRole('button', { name: NOMBRE_REPROGRAMAR }))
    await reprogramar(await screen.findByRole('dialog'))
    fireEvent.click(await screen.findByRole('button', { name: 'Aceptar' }))
    await waitFor(() => expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Reprogramar cita de Limpieza del 12/03/2030 a las 11:00 AM' })))
  })

  test('tras el aviso de cancelar, el foco va a «Agendar nueva cita»', async () => {
    await montar([cita({})])
    fireEvent.click(screen.getByRole('button', { name: NOMBRE_CANCELAR }))
    const dialogo = await screen.findByRole('dialog')
    fireEvent.change(within(dialogo).getByLabelText('Motivo'), { target: { value: 'No puedo ir' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar cita' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Aceptar' }))
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: /Agendar nueva cita/ })))
  })

  test('si la recarga de la lista falla, el foco va a «Agendar nueva cita» al cerrar el aviso', async () => {
    await montar([cita({})])
    sim.falloRecarga = true
    fireEvent.click(screen.getByRole('button', { name: NOMBRE_REPROGRAMAR }))
    await reprogramar(await screen.findByRole('dialog'))
    fireEvent.click(await screen.findByRole('button', { name: 'Aceptar' }))
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: /Agendar nueva cita/ })))
  })
})

describe('030 · correcciones de la review (R1, R2, R5)', () => {
  test('R1: con la recarga pendiente, «Aceptar» deja el foco en «Agendar nueva cita», no en el body', async () => {
    await montar([cita({})])
    let soltar
    sim.retenerRecarga = new Promise((resolve) => { soltar = resolve })
    fireEvent.click(screen.getByRole('button', { name: NOMBRE_CANCELAR }))
    const dialogo = await screen.findByRole('dialog')
    fireEvent.change(within(dialogo).getByLabelText('Motivo'), { target: { value: 'No puedo ir' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar cita' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Aceptar' }))
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: /Agendar nueva cita/ })))
    soltar()
    await waitFor(() => expect(screen.getByText('cancelada')).toBeTruthy())
  })

  test('R1: un aviso posterior sin acción no mueve el foco al destino de la acción anterior', async () => {
    await montar([cita({}), cita({ id: 42, estado: 'completada', modificable: false })])
    let soltar
    sim.retenerRecarga = new Promise((resolve) => { soltar = resolve })
    fireEvent.click(screen.getByRole('button', { name: NOMBRE_REPROGRAMAR }))
    await reprogramar(await screen.findByRole('dialog'))
    fireEvent.click(await screen.findByRole('button', { name: 'Aceptar' }))
    soltar()
    await screen.findByText('12/03/2030')

    fireEvent.click(screen.getByRole('button', { name: /Dejar comentario/ }))
    const dialogo = await screen.findByRole('dialog')
    fireEvent.click(within(dialogo).getByRole('radio', { name: '5 estrellas' }))
    fireEvent.change(within(dialogo).getByRole('textbox'), { target: { value: 'Muy bien' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Enviar comentario' }))
    const aceptar = await screen.findByRole('button', { name: 'Aceptar' })
    fireEvent.click(aceptar)
    await new Promise((r) => setTimeout(r, 20))
    expect(document.activeElement).not.toBe(screen.getByRole('button', { name: 'Reprogramar cita de Limpieza del 12/03/2030 a las 11:00 AM' }))
  })

  test('R2: si la recarga posterior falla, se sigue viendo el aviso de éxito y la lista conserva sus tarjetas', async () => {
    await montar([cita({})])
    sim.falloRecarga = true
    fireEvent.click(screen.getByRole('button', { name: NOMBRE_REPROGRAMAR }))
    await reprogramar(await screen.findByRole('dialog'))
    await waitFor(() => expect(sim.pedidas).toBe(2))
    await new Promise((r) => setTimeout(r, 20))
    expect(screen.getByText('Tu cita se reprogramó correctamente.')).toBeTruthy()
    expect(screen.queryByText('No se pudieron cargar tus citas')).toBeNull()
    expect(screen.getByText('Limpieza')).toBeTruthy()
  })

  test('R5: reprogramar con dos pendientes cambia solo la elegida', async () => {
    await montar([
      cita({ id: 40 }),
      cita({ id: 41, nombre_servicio: 'Ortodoncia', fecha_agendada: '2030-03-11T06:00:00.000Z' }),
    ])
    fireEvent.click(screen.getByRole('button', { name: NOMBRE_REPROGRAMAR }))
    await reprogramar(await screen.findByRole('dialog'))
    await screen.findByText('Tu cita se reprogramó correctamente.')
    expect(llamadas('PUT')[0][0]).toBe('/citas/mias/40')
    expect(screen.getByText('11/03/2030')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reprogramar cita de Ortodoncia del 11/03/2030 a las 10:00 AM' })).toBeTruthy()
  })

  test('R5: la cancelada no muestra ni «Reprogramar» ni «Cancelar cita»', async () => {
    await montar([cita({})])
    fireEvent.click(screen.getByRole('button', { name: NOMBRE_CANCELAR }))
    const dialogo = await screen.findByRole('dialog')
    fireEvent.change(within(dialogo).getByLabelText('Motivo'), { target: { value: 'No puedo ir' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar cita' }))
    await screen.findByText('Tu cita se canceló correctamente.')
    await waitFor(() => expect(screen.getByText('cancelada')).toBeTruthy())
    expect(screen.queryByRole('button', { name: /^Reprogramar cita de/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Cancelar cita de/ })).toBeNull()
  })

  test('R5: un rechazo al cancelar sale en el formulario y la tarjeta queda intacta', async () => {
    await montar([cita({})])
    sim.errorAlGuardar = 'Solo puedes modificar citas pendientes'
    fireEvent.click(screen.getByRole('button', { name: NOMBRE_CANCELAR }))
    const dialogo = await screen.findByRole('dialog')
    fireEvent.change(within(dialogo).getByLabelText('Motivo'), { target: { value: 'No puedo ir' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar cita' }))
    expect((await within(dialogo).findByRole('alert')).textContent).toBe('Solo puedes modificar citas pendientes')
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Volver' }))
    expect(screen.getByRole('button', { name: NOMBRE_CANCELAR })).toBeTruthy()
    expect(screen.getByText('pendiente')).toBeTruthy()
  })
})

describe('030 · P20: el formulario compartido no tiene valores visuales literales', () => {
  const LITERAL = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|\b\d*\.?\d+(px|rem|em)\b|ancho=\{\s*\d|style=/

  test('control positivo: el patrón detecta literales de ejemplo', () => {
    for (const ejemplo of ['color: "#5b6472"', 'ancho={500}', 'style={{ gap: 8 }}', 'padding: "12px"']) {
      expect(ejemplo).toMatch(LITERAL)
    }
  })

  test('src/components/ModalAccionCita.jsx no los contiene', () => {
    const codigo = readFileSync(join(process.cwd(), 'src/components/ModalAccionCita.jsx'), 'utf8')
    expect(codigo).not.toMatch(LITERAL)
  })
})
