jest.mock('axios', () => ({ post: jest.fn().mockResolvedValue({ data: { id: 'x' } }) }));
jest.mock('node-cron', () => ({ schedule: jest.fn() }));
jest.mock('../../src/modules/citas/citas.repository');
jest.mock('../../src/modules/servicios/servicios.repository');
jest.mock('../../src/modules/pacientes/pacientes.repository');

const axios = require('axios');
const cron = require('node-cron');
const repo = require('../../src/modules/citas/citas.repository');
const servicioRepo = require('../../src/modules/servicios/servicios.repository');
const citas = require('../../src/modules/citas/citas.service');
require('../../src/services/reminder.service');

const correrCron = cron.schedule.mock.calls[0][1];

const CITA = {
  id_cita: 1,
  fecha_agendada: '2030-01-01',
  hora: '10:00:00',
  telefono: '5500000000',
  nombre_usuario: 'Ana',
};

const encender = () => {
  process.env.WHATSAPP_ENABLED = 'true';
  process.env.WHATSAPP_TOKEN = 'clave-ficticia';
  process.env.WHATSAPP_PHONE_NUMBER_ID = 'id-ficticio';
};

let log;

beforeEach(() => {
  jest.clearAllMocks();
  log = jest.spyOn(console, 'log').mockImplementation(() => {});
  repo.getCitasParaRecordatorio.mockResolvedValue([CITA]);
  repo.findCitaExistente.mockResolvedValue(null);
  repo.createCita.mockResolvedValue(1);
  repo.getPacienteWhatsApp.mockResolvedValue(CITA);
  repo.getCitaById.mockResolvedValue({ id_servicio: 1, estado: 'pendiente', fecha_agendada: '2030-01-01', hora: '10:00' });
  repo.getCitasDelDia.mockResolvedValue([]);
  repo.getDatosWhatsAppCita.mockResolvedValue(CITA);
  servicioRepo.getServicioById.mockResolvedValue({ nombre_servicio: 'Limpieza', duracion: '01:00' });
});

afterEach(() => {
  process.env.WHATSAPP_ENABLED = 'false';
  delete process.env.WHATSAPP_TOKEN;
  delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  jest.restoreAllMocks();
});

const textoDeLog = () => log.mock.calls.flat().join(' ');

describe('recordatorios', () => {
  test('007 CA6 · con WhatsApp apagado la cita no queda marcada como enviada', async () => {
    await correrCron();
    expect(repo.marcarRecordatorioEnviado).not.toHaveBeenCalled();
    expect(textoDeLog()).not.toMatch(/enviado/i);
  });

  test('007 CA1 · con WhatsApp encendido envía y marca la cita', async () => {
    encender();
    await correrCron();
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(repo.marcarRecordatorioEnviado).toHaveBeenCalledWith(1);
  });
});

describe.each([
  ['crear', () => citas.createCita({ id_paciente: 1, fecha_agendada: '2030-01-02', hora: '10:00', id_servicio: 1 }), /confirmación enviado/],
  ['reprogramar', () => citas.updateCita(1, { fecha_agendada: '2030-01-02', hora: '10:00', motivo: 'cambio' }), /reprogramación enviado/],
  ['cancelar', () => citas.cancelarCita(1, 'motivo'), /cancelación enviado/],
])('aviso al %s una cita', (_nombre, accion, mensaje) => {
  test('OB6 · con WhatsApp apagado no se registra como enviado', async () => {
    await accion();
    expect(textoDeLog()).not.toMatch(mensaje);
  });

  test('OB6 · con WhatsApp encendido se registra el envío', async () => {
    encender();
    await accion();
    expect(textoDeLog()).toMatch(mensaje);
  });
});
