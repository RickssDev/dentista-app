import { expect, test } from 'vitest'
import { HOURS } from '../src/data/site'

// Debe coincidir con el agendado (citas.service.js, getHorariosDisponibles).
test('el sitio publica el mismo horario que ofrece el agendado', () => {
  expect(HOURS).toEqual([
    { day: 'Lunes - Viernes', time: '8:00 AM - 4:00 PM' },
    { day: 'Sábado', time: '8:00 AM - 2:00 PM' },
    { day: 'Domingo', time: 'Cerrado', closed: true },
  ])
})
