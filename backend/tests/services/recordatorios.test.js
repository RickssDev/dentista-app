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
const logger = require('../../src/utils/logger');
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

// Spec 026: los avisos se leen de la captura del logger, ya no de console.log.
let captura;

beforeEach(() => {
  jest.clearAllMocks();
  captura = logger.__capturar();
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
  captura.terminar();
  jest.restoreAllMocks();
});

const enviados = (plantilla) =>
  captura.lineas.filter((l) => l.message === 'Aviso de WhatsApp enviado' && l.context.plantilla === plantilla);
const textoDeLog = () => captura.crudas.join('');

describe('recordatorios', () => {
  test('007 CA6 · con WhatsApp apagado la cita no queda marcada como enviada', async () => {
    await correrCron();
    expect(repo.marcarRecordatorioEnviado).not.toHaveBeenCalled();
    expect(textoDeLog()).not.toMatch(/enviado/i);

    // Control positivo: en la misma captura, con WhatsApp encendido sí queda la línea (spec 026, A23).
    encender();
    await correrCron();
    expect(enviados('cita_recordatorio')).toHaveLength(1);
  });

  test('007 CA1 · con WhatsApp encendido envía y marca la cita', async () => {
    encender();
    await correrCron();
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(repo.marcarRecordatorioEnviado).toHaveBeenCalledWith(1);
  });
});

describe.each([
  ['crear', () => citas.createCita({ id_paciente: 1, fecha_agendada: '2030-01-02', hora: '10:00', id_servicio: 1 }), 'appointment_confirmation_1'],
  ['reprogramar', () => citas.updateCita(1, { fecha_agendada: '2030-01-02', hora: '10:00', motivo: 'cambio' }), 'reprogramada_cita'],
  ['cancelar', () => citas.cancelarCita(1, 'motivo'), 'cancelada_cita'],
])('aviso al %s una cita', (_nombre, accion, plantilla) => {
  test('OB6 · con WhatsApp apagado no se registra como enviado', async () => {
    await accion();
    expect(enviados(plantilla)).toHaveLength(0);
    expect(textoDeLog()).not.toMatch(/enviado/i);

    // Control positivo: en la misma captura, con WhatsApp encendido sí queda la línea (spec 026, A23).
    encender();
    await accion();
    expect(enviados(plantilla)).toHaveLength(1);
  });

  test('OB6 · con WhatsApp encendido se registra el envío con la cita y la plantilla', async () => {
    encender();
    await accion();
    expect(enviados(plantilla)).toEqual([expect.objectContaining({ context: { id_cita: 1, plantilla } })]);
  });
});

// Spec 026, T032 (/review R3): un fallo de la base de datos no se atribuye a WhatsApp (CA11).
const errorDeMySQL = () =>
  Object.assign(new Error('fallo de la base de prueba'), { code: 'ER_LOCK_DEADLOCK', errno: 1213, sqlState: '40001' });
const lineasCon = (mensaje) => captura.lineas.filter((l) => l.message === mensaje);

describe('026 · /review R3 fallos de la base de datos en los avisos', () => {
  test('cron: si falla marcar el recordatorio, queda «Recordatorio no marcado» y no «no enviado»', async () => {
    encender();
    // Once: el automock no se restaura entre casos (/review R22).
    repo.marcarRecordatorioEnviado.mockRejectedValueOnce(errorDeMySQL());

    await correrCron();

    expect(enviados('cita_recordatorio')).toHaveLength(1);
    expect(lineasCon('Aviso de WhatsApp no enviado')).toHaveLength(0);
    const [linea, ...otras] = lineasCon('Recordatorio no marcado');
    expect(otras).toHaveLength(0);
    expect(linea).toMatchObject({
      level: 'error',
      context: { id_cita: 1, error_name: 'Error', code: 'ER_LOCK_DEADLOCK' },
    });
    expect(linea.context).not.toHaveProperty('servicio');
  });

  test('cron: tras el fallo al marcar, la ejecución se detiene y cierra con su resumen', async () => {
    encender();
    repo.getCitasParaRecordatorio.mockResolvedValueOnce([CITA, { ...CITA, id_cita: 2 }]);
    repo.marcarRecordatorioEnviado.mockRejectedValueOnce(errorDeMySQL());

    await correrCron();

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(lineasCon('Recordatorio no marcado')).toEqual([
      expect.objectContaining({ context: expect.objectContaining({ id_cita: 1 }) }),
    ]);
    expect(lineasCon('Recordatorios: fin de ejecución')).toEqual([
      expect.objectContaining({ context: { revisadas: 1, enviadas: 1 } }),
    ]);
  });

  test('crear: si falla la consulta del paciente, queda «Aviso de WhatsApp no preparado» y la cita se crea', async () => {
    encender();
    repo.getPacienteWhatsApp.mockRejectedValue(errorDeMySQL());

    const resultado = await citas.createCita({ id_paciente: 1, fecha_agendada: '2030-01-02', hora: '10:00', id_servicio: 1 });

    expect(resultado).toEqual({ id: 1 });
    expect(lineasCon('Aviso de WhatsApp no enviado')).toHaveLength(0);
    const [linea] = lineasCon('Aviso de WhatsApp no preparado');
    expect(linea).toMatchObject({
      level: 'error',
      context: { id_cita: 1, plantilla: 'appointment_confirmation_1', error_name: 'Error' },
    });
    expect(linea.context).not.toHaveProperty('servicio');
  });

  test('crear: si falla el envío, sigue quedando «Aviso de WhatsApp no enviado» con el servicio', async () => {
    encender();
    axios.post.mockRejectedValueOnce(Object.assign(new Error('fallo de Meta'), { response: { status: 400 } }));

    await citas.createCita({ id_paciente: 1, fecha_agendada: '2030-01-02', hora: '10:00', id_servicio: 1 });

    expect(lineasCon('Aviso de WhatsApp no preparado')).toHaveLength(0);
    expect(lineasCon('Aviso de WhatsApp no enviado')).toEqual([
      expect.objectContaining({ context: expect.objectContaining({ id_cita: 1, servicio: 'whatsapp', status: 400 }) }),
    ]);
  });
});
