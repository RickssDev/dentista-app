jest.mock('../../src/modules/citas/citas.repository');
jest.mock('../../src/modules/servicios/servicios.repository');
jest.mock('../../src/modules/pacientes/pacientes.repository');

const repo = require('../../src/modules/citas/citas.repository');
const servicioRepo = require('../../src/modules/servicios/servicios.repository');
const citas = require('../../src/modules/citas/citas.service');

const LUNES = '2030-01-07';
const SABADO = '2030-01-05';
const DOMINGO = '2030-01-06';

beforeEach(() => {
  repo.getCitasDelDia.mockResolvedValue([]);
  servicioRepo.getServicioById.mockResolvedValue({ duracion: '01:00' });
});

test('005 CA1 · de lunes a viernes ofrece de 8:00 a 16:00', async () => {
  const horarios = await citas.getHorariosDisponibles(LUNES, 1);
  expect(horarios[0]).toBe('08:00');
  expect(horarios[horarios.length - 1]).toBe('15:00');
  expect(horarios).toHaveLength(8);
});

test('005 CA1 · el sábado ofrece de 8:00 a 14:00', async () => {
  const horarios = await citas.getHorariosDisponibles(SABADO, 1);
  expect(horarios[0]).toBe('08:00');
  expect(horarios[horarios.length - 1]).toBe('13:00');
  expect(horarios).toHaveLength(6);
});

test('005 CA1 · el domingo no ofrece horarios', async () => {
  await expect(citas.getHorariosDisponibles(DOMINGO, 1)).resolves.toEqual([]);
});
