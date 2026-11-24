// Spec 030 · CA1, CA2, CA7, CA8, CA10, TM1–TM3: «Mis citas» dice qué citas se pueden modificar
// (pendientes que aún no empiezan, en la hora de México) y el servidor rechaza reprogramar o cancelar
// una pendiente que ya terminó. Cada cuenta solo ve y cambia sus propias citas.
// La hora se fija a las 23:30 de México del 2030-03-05, cuando en UTC ya es el 2030-03-06 (A21).
const request = require('supertest');

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({ verifyIdToken: jest.fn() })),
}));
jest.mock('../../src/modules/citas/citas.repository');
jest.mock('../../src/modules/servicios/servicios.repository');
jest.mock('../../src/modules/pacientes/pacientes.repository');
jest.mock('../../src/services/whatp.service');

const db = require('../../src/config/db');
const JWTFactory = require('../../src/utils/JWTFactory');
const repo = require('../../src/modules/citas/citas.repository');
const servicioRepo = require('../../src/modules/servicios/servicios.repository');
const pacienteRepo = require('../../src/modules/pacientes/pacientes.repository');
const citas = require('../../src/modules/citas/citas.service');
const { createApp } = require('../../src/config/app');

const app = createApp();
const AHORA_UTC = new Date('2030-03-06T05:30:00Z'); // 23:30 del 2030-03-05 en México (UTC-6)
// Como el driver: las columnas DATE llegan como Date a medianoche local
const dia = (d) => new Date(2030, 2, d);
const HOY = dia(5);
const MAÑANA = dia(6);
const AYER = dia(4);
const PASADA = 'Esta cita ya pasó y no se puede modificar.';
const ROLES = { 1: 'Administrador', 2: 'Asistente', 3: 'Paciente' };

const fila = (cambios) => ({
  id_cita: 40, fecha_agendada: MAÑANA, hora: '10:00:00', estado: 'pendiente', motivo: null,
  nombre_servicio: 'Limpieza', id_servicio: 2, duracion: '01:00:00', comentado: 0, ...cambios,
});

beforeEach(() => {
  jest.resetAllMocks();
  jest.useFakeTimers({ now: AHORA_UTC, doNotFake: ['nextTick', 'setImmediate'] });
  db.reiniciar();
  ['log', 'info', 'warn', 'error'].forEach((m) => jest.spyOn(console, m).mockImplementation(() => {}));
  pacienteRepo.findByUserId.mockResolvedValue({ id_paciente: 3 });
  repo.getCitasDelDia.mockResolvedValue([]);
  repo.updateCita.mockResolvedValue();
  servicioRepo.getServicioById.mockResolvedValue({ duracion: '01:00:00', nombre_servicio: 'Limpieza' });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('030 · modificable en «Mis citas» (CA1, CA2)', () => {
  const modificableDe = async (cambios) => {
    repo.getMisCitas.mockResolvedValue([fila(cambios)]);
    const [cita] = await citas.getMisCitas(7);
    return cita;
  };

  test.each([
    ['una pendiente de mañana', { fecha_agendada: MAÑANA, hora: '10:00:00' }],
    ['una pendiente de hoy que empieza dentro de un minuto', { fecha_agendada: HOY, hora: '23:31:00' }],
  ])('%s es modificable', async (_caso, cambios) => {
    expect((await modificableDe(cambios)).modificable).toBe(true);
  });

  test.each([
    ['una que empieza justo ahora', { fecha_agendada: HOY, hora: '23:30:00' }],
    ['una de hoy que empezó hace un minuto (sin terminar)', { fecha_agendada: HOY, hora: '23:29:00' }],
    ['una de ayer', { fecha_agendada: AYER, hora: '10:00:00' }],
    ['una completada de mañana', { estado: 'completada' }],
    ['una cancelada de mañana', { estado: 'cancelada' }],
  ])('%s no es modificable', async (_caso, cambios) => {
    expect((await modificableDe(cambios)).modificable).toBe(false);
  });

  test('cada cita incluye id_servicio y no expone la duración', async () => {
    const cita = await modificableDe({});
    expect(cita.id_servicio).toBe(2);
    expect(cita).not.toHaveProperty('duracion');
  });
});

describe('030 · el servidor rechaza modificar una pendiente que ya terminó (CA10, CA7)', () => {
  const propia = (cambios) => repo.getCitaConUsuario.mockResolvedValue({
    id_cita: 40, estado: 'pendiente', id_paciente: 3, id_usuario: 7,
    fecha_agendada: HOY, hora: '22:29:00', duracion: '01:00:00', ...cambios,
  });
  const reprogramar = () => citas.updateMiCita(7, 40, { fecha_agendada: '2030-03-11', hora: '10:00', motivo: 'cambio' });
  const cancelar = () => citas.cancelarMiCita(7, 40, 'no puedo');

  beforeEach(() => {
    repo.getCitaById.mockResolvedValue({ id_cita: 40, estado: 'pendiente', id_servicio: 2, fecha_agendada: HOY, hora: '23:00:00' });
    repo.getDatosWhatsAppCita.mockResolvedValue(null);
  });

  test.each([
    ['terminó hace un minuto', { hora: '22:29:00' }],
    ['termina justo ahora', { hora: '22:30:00' }],
    ['es de ayer', { fecha_agendada: AYER, hora: '10:00:00' }],
  ])('si %s, reprogramar y cancelar responden 400 sin cambiar la cita', async (_caso, cambios) => {
    propia(cambios);
    await expect(reprogramar()).rejects.toMatchObject({ statusCode: 400, message: PASADA });
    await expect(cancelar()).rejects.toMatchObject({ statusCode: 400, message: PASADA });
    expect(repo.updateCita).not.toHaveBeenCalled();
  });

  test('una cita en curso (empezó y no ha terminado) se sigue pudiendo cancelar, como en Inicio', async () => {
    propia({ hora: '23:00:00' });
    await cancelar();
    expect(repo.updateCita).toHaveBeenCalledWith(40, expect.objectContaining({ estado: 'cancelada' }));
  });

  // De hoy y más tarde, para que la regla tenga que mirar la duración
  test('una pendiente de hoy, más tarde, con duración NULL se sigue pudiendo cancelar', async () => {
    propia({ fecha_agendada: HOY, hora: '23:45:00', duracion: null });
    await cancelar();
    expect(repo.updateCita).toHaveBeenCalled();
  });

  test('una cita de otro paciente responde 404 antes de mirar si pasó (TM1)', async () => {
    propia({ id_usuario: 99 });
    await expect(cancelar()).rejects.toMatchObject({ statusCode: 404 });
    expect(repo.updateCita).not.toHaveBeenCalled();
  });
});

describe('030 · por HTTP: permisos y propiedad (CA8, TM1, TM3)', () => {
  // La cita existe y se podría actualizar: el 404 solo puede venir de la comprobación de propiedad
  beforeEach(() => {
    repo.getCitaById.mockResolvedValue({ id_cita: 40, estado: 'pendiente', id_servicio: 2, fecha_agendada: MAÑANA, hora: '10:00:00' });
    repo.getDatosWhatsAppCita.mockResolvedValue(null);
  });

  const sesion = (id_rol) => {
    const usuario = db.agregarUsuario({ correo: `rol${id_rol}@example.test`, nombre_usuario: 'Ana', id_rol });
    return { id: usuario.id_usuario, cabecera: `Bearer ${new JWTFactory().createToken({ id: usuario.id_usuario, rol: ROLES[id_rol] })}` };
  };

  test('GET /miscitas sin token → 401', async () => {
    const r = await request(app).get('/api/v1/citas/miscitas');
    expect(r.status).toBe(401);
    expect(repo.getMisCitas).not.toHaveBeenCalled();
  });

  test.each([[3], [1], [2]])('con rol %i, GET /miscitas solo pide las citas del perfil de esa cuenta', async (id_rol) => {
    const { id, cabecera } = sesion(id_rol);
    pacienteRepo.findByUserId.mockImplementation(async (idUsuario) => ({ id_paciente: 500 + Number(idUsuario) }));
    repo.getMisCitas.mockResolvedValue([fila({})]);
    const r = await request(app).get('/api/v1/citas/miscitas').set('Authorization', cabecera);
    expect(r.status).toBe(200);
    expect(pacienteRepo.findByUserId).toHaveBeenCalledWith(id);
    expect(repo.getMisCitas).toHaveBeenCalledWith(500 + id);
    expect(r.body.payload[0]).toMatchObject({ id_servicio: 2, modificable: true });
  });

  test.each([[3], [2]])('con rol %i, reprogramar o cancelar la cita de otro → 404 sin actualizar', async (id_rol) => {
    const { cabecera } = sesion(id_rol);
    repo.getCitaConUsuario.mockResolvedValue({
      id_cita: 40, estado: 'pendiente', id_usuario: 999, fecha_agendada: MAÑANA, hora: '10:00:00', duracion: '01:00:00',
    });
    const put = await request(app).put('/api/v1/citas/mias/40').set('Authorization', cabecera)
      .send({ fecha_agendada: '2030-03-11', hora: '10:00', motivo: 'x' });
    const patch = await request(app).patch('/api/v1/citas/mias/40/cancelar').set('Authorization', cabecera).send({ motivo: 'x' });
    expect(put.status).toBe(404);
    expect(patch.status).toBe(404);
    expect(repo.updateCita).not.toHaveBeenCalled();
  });

  test('cancelar una completada propia → 400', async () => {
    const { id, cabecera } = sesion(3);
    repo.getCitaConUsuario.mockResolvedValue({
      id_cita: 40, estado: 'completada', id_usuario: id, fecha_agendada: MAÑANA, hora: '10:00:00', duracion: '01:00:00',
    });
    const r = await request(app).patch('/api/v1/citas/mias/40/cancelar').set('Authorization', cabecera).send({ motivo: 'x' });
    expect(r.status).toBe(400);
    expect(repo.updateCita).not.toHaveBeenCalled();
  });

  test('una pendiente propia terminada → 400 con el cuerpo exacto', async () => {
    const { id, cabecera } = sesion(3);
    repo.getCitaConUsuario.mockResolvedValue({
      id_cita: 40, estado: 'pendiente', id_usuario: id, fecha_agendada: HOY, hora: '22:00:00', duracion: '01:00:00',
    });
    const r = await request(app).patch('/api/v1/citas/mias/40/cancelar').set('Authorization', cabecera).send({ motivo: 'x' });
    expect(r.status).toBe(400);
    expect(r.body).toEqual({ success: false, status: 'fail', message: PASADA });
  });
});

describe('030 · P9: las consultas del repositorio real llevan los ids en los parámetros', () => {
  const real = jest.requireActual('../../src/modules/citas/citas.repository');

  test.each([
    ['getMisCitas', (r) => r.getMisCitas(77123)],
    ['getCitaConUsuario', (r) => r.getCitaConUsuario(77123)],
  ])('%s', async (_nombre, llamar) => {
    const consulta = jest.spyOn(db.pool, 'query').mockResolvedValue([[]]);
    await llamar(real);
    const [sql, params] = consulta.mock.calls[0];
    expect(sql).toContain('?');
    expect(sql).not.toContain('77123');
    expect(params).toContain(77123);
  });

  test('getMisCitas trae id_servicio y getCitaConUsuario fecha, hora y duración con LEFT JOIN', async () => {
    const consulta = jest.spyOn(db.pool, 'query').mockResolvedValue([[]]);
    await real.getMisCitas(1);
    await real.getCitaConUsuario(1);
    const [misCitas] = consulta.mock.calls[0];
    const [conUsuario] = consulta.mock.calls[1];
    expect(misCitas).toMatch(/c\.id_servicio/);
    expect(conUsuario).toMatch(/c\.fecha_agendada/);
    expect(conUsuario).toMatch(/c\.hora/);
    expect(conUsuario).toMatch(/duracion/);
    expect(conUsuario).toMatch(/LEFT JOIN\s+servicio/i);
  });
});
