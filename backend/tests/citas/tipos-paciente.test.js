jest.mock('../../src/modules/citas/citas.repository');
jest.mock('../../src/modules/servicios/servicios.repository');
jest.mock('../../src/modules/pacientes/pacientes.repository');
jest.mock('../../src/services/whatp.service');

const repo = require('../../src/modules/citas/citas.repository');
const servicioRepo = require('../../src/modules/servicios/servicios.repository');
const pacienteRepo = require('../../src/modules/pacientes/pacientes.repository');
const citas = require('../../src/modules/citas/citas.service');

const LUNES = '2030-01-07';
const ID_USUARIO = 7;
const ID_CITA = 40;

beforeEach(() => {
  jest.resetAllMocks();
  repo.getCitasDelDia.mockResolvedValue([]);
  repo.createCita.mockResolvedValue(99);
  // Spec 030 (T013): una pendiente futura con fecha, hora y duración, para que el rechazo de las
  // citas terminadas (CA10) no aplique a estos casos
  repo.getCitaConUsuario.mockResolvedValue({
    id_cita: ID_CITA, estado: 'pendiente', id_usuario: ID_USUARIO,
    fecha_agendada: new Date(2030, 0, 7), hora: '10:00:00', duracion: '01:00:00',
  });
  repo.getCitaById.mockResolvedValue({ id_cita: ID_CITA, estado: 'pendiente', id_servicio: 1, fecha_agendada: LUNES, hora: '10:00' });
  servicioRepo.getServicioById.mockResolvedValue({ duracion: '01:00', nombre_servicio: 'Limpieza' });
  pacienteRepo.findByUserId.mockResolvedValue({ id_paciente: 3 });
});

describe('005 · agendar como paciente con datos mal formados', () => {
  test.each([
    ['fecha_agendada', [LUNES]],
    ['id_servicio', { id: 1 }],
    ['id_servicio', 'uno'],
  ])('%s = %j responde 400 sin crear la cita', async (campo, valor) => {
    const datos = { fecha_agendada: LUNES, hora: '10:00', id_servicio: 1, [campo]: valor };
    await expect(citas.createCitaPaciente(ID_USUARIO, datos)).rejects.toMatchObject({ statusCode: 400 });
    expect(repo.createCita).not.toHaveBeenCalled();
  });

  test('un servicio que no existe responde 404', async () => {
    servicioRepo.getServicioById.mockResolvedValue(null);
    await expect(
      citas.createCitaPaciente(ID_USUARIO, { fecha_agendada: LUNES, hora: '10:00', id_servicio: 555 }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(repo.createCita).not.toHaveBeenCalled();
  });
});

describe('005 · reprogramar como paciente con datos mal formados', () => {
  test.each([
    ['motivo', { texto: 'x' }],
    ['fecha_agendada', [LUNES]],
  ])('%s = %j responde 400 sin cambiar la cita', async (campo, valor) => {
    const datos = { fecha_agendada: LUNES, hora: '10:00', motivo: 'cambio', [campo]: valor };
    await expect(citas.updateMiCita(ID_USUARIO, ID_CITA, datos)).rejects.toMatchObject({ statusCode: 400 });
    expect(repo.updateCita).not.toHaveBeenCalled();
  });
});

describe('005 y 006 · cancelar con un motivo que no es texto', () => {
  test('el paciente recibe 400 y la cita no cambia', async () => {
    await expect(citas.cancelarMiCita(ID_USUARIO, ID_CITA, { texto: 'x' }))
      .rejects.toMatchObject({ statusCode: 400 });
    expect(repo.updateCita).not.toHaveBeenCalled();
  });

  test('el personal recibe 400 y la cita no cambia', async () => {
    await expect(citas.cancelarCita(ID_CITA, ['x'])).rejects.toMatchObject({ statusCode: 400 });
    expect(repo.updateCita).not.toHaveBeenCalled();
  });
});

describe('006 · consultar una cita', () => {
  test('con un id que no es número responde 400', async () => {
    await expect(citas.getCitaById('abc')).rejects.toMatchObject({ statusCode: 400 });
    expect(repo.getCitaById).not.toHaveBeenCalled();
  });
});
