jest.mock('../../src/modules/citas/citas.repository');
jest.mock('../../src/modules/servicios/servicios.repository');
jest.mock('../../src/modules/pacientes/pacientes.repository');
jest.mock('../../src/services/whatp.service');

const repo = require('../../src/modules/citas/citas.repository');
const servicioRepo = require('../../src/modules/servicios/servicios.repository');
const pacienteRepo = require('../../src/modules/pacientes/pacientes.repository');
const citas = require('../../src/modules/citas/citas.service');

const LUNES = '2030-01-07';
const SABADO = '2030-01-05';
const DOMINGO = '2030-01-06';
const ID_USUARIO = 7;
const ID_CITA = 40;

beforeEach(() => {
  jest.resetAllMocks();
  repo.getCitasDelDia.mockResolvedValue([]);
  repo.createCita.mockResolvedValue(99);
  repo.updateCita.mockResolvedValue();
  repo.getCitaConUsuario.mockResolvedValue({ id_cita: ID_CITA, estado: 'pendiente', id_usuario: ID_USUARIO });
  repo.getCitaById.mockResolvedValue({ id_cita: ID_CITA, estado: 'pendiente', id_servicio: 1, fecha_agendada: LUNES, hora: '10:00' });
  servicioRepo.getServicioById.mockResolvedValue({ duracion: '01:00', nombre_servicio: 'Limpieza' });
  pacienteRepo.findByUserId.mockResolvedValue({ id_paciente: 3 });
});

const fueraDeHorario = [
  ['el domingo', DOMINGO, '10:00'],
  ['antes de las 8:00', LUNES, '07:00'],
  ['si termina después de las 16:00 entre semana', LUNES, '15:30'],
  ['el sábado a partir de las 14:00', SABADO, '14:00'],
  ['con una hora mal escrita', LUNES, 'abc'],
  ['con una hora que no es texto', LUNES, 900],
  ['con minutos imposibles', LUNES, '10:75'],
  ['en una fecha que no existe', '2030-02-31', '10:00'],
];

describe('005 · el paciente solo agenda dentro del horario de atención', () => {
  test.each(fueraDeHorario)('agendar %s responde 400 y no crea la cita', async (_caso, fecha, hora) => {
    await expect(
      citas.createCitaPaciente(ID_USUARIO, { fecha_agendada: fecha, hora, id_servicio: 1 }),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(repo.createCita).not.toHaveBeenCalled();
  });

  test.each([
    ['entre semana a las 15:00', LUNES, '15:00'],
    ['el sábado a las 13:00', SABADO, '13:00'],
  ])('agendar %s crea la cita', async (_caso, fecha, hora) => {
    await expect(
      citas.createCitaPaciente(ID_USUARIO, { fecha_agendada: fecha, hora, id_servicio: 1 }),
    ).resolves.toEqual({ id: 99 });
  });

  test.each(fueraDeHorario)('reprogramar %s responde 400 y no cambia la cita', async (_caso, fecha, hora) => {
    await expect(
      citas.updateMiCita(ID_USUARIO, ID_CITA, { fecha_agendada: fecha, hora, motivo: 'cambio' }),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(repo.updateCita).not.toHaveBeenCalled();
  });

  test('reprogramar dentro del horario actualiza la cita', async () => {
    await citas.updateMiCita(ID_USUARIO, ID_CITA, { fecha_agendada: LUNES, hora: '11:00', motivo: 'cambio' });
    expect(repo.updateCita).toHaveBeenCalled();
  });
});

describe('006 · el personal no tiene validación de horario (decisión del usuario, 2026-11-10)', () => {
  test('el personal puede crear una cita en domingo', async () => {
    repo.findCitaExistente.mockResolvedValue(null);
    await expect(
      citas.createCita({ id_paciente: 3, fecha_agendada: DOMINGO, hora: '10:00', id_servicio: 1 }),
    ).resolves.toBeDefined();
    expect(repo.createCita).toHaveBeenCalled();
  });

  test('el personal puede reprogramar una cita a domingo', async () => {
    await citas.updateCita(ID_CITA, { fecha_agendada: DOMINGO, hora: '10:00', motivo: 'urgencia' });
    expect(repo.updateCita).toHaveBeenCalled();
  });
});
