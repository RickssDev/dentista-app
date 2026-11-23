// Spec 026, T012: correlación de mensajes por petición y por trabajo (CA4–CA6, CA8; TM7, TM8).
const bcrypt = require('bcrypt');
const request = require('supertest');

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({ verifyIdToken: jest.fn() })),
}));
jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('node-cron', () => ({ schedule: jest.fn() }));
jest.mock('../../src/modules/citas/citas.repository');
jest.mock('../../src/modules/servicios/servicios.repository');
jest.mock('../../src/modules/pacientes/pacientes.repository');

const axios = require('axios');
const cron = require('node-cron');
const db = require('../../src/config/db');
const JWTFactory = require('../../src/utils/JWTFactory');
const { createApp } = require('../../src/config/app');
const logger = require('../../src/utils/logger');
const citasRepo = require('../../src/modules/citas/citas.repository');
const serviciosRepo = require('../../src/modules/servicios/servicios.repository');
const pacientesRepo = require('../../src/modules/pacientes/pacientes.repository');
require('../../src/services/reminder.service');

const app = createApp();
const correrCron = cron.schedule.mock.calls[0][1];
const ATENDIDA = 'Petición atendida';

const CITA = {
  id_cita: 41,
  fecha_agendada: '2030-01-02',
  hora: '10:00:00',
  telefono: '5512345678',
  nombre_usuario: 'Nombre Centinela',
};

const pausa = () => new Promise((resolve) => setImmediate(resolve));

const encenderWhatsApp = () => {
  process.env.WHATSAPP_ENABLED = 'true';
  process.env.WHATSAPP_TOKEN = 'clave-ficticia';
  process.env.WHATSAPP_PHONE_NUMBER_ID = 'id-ficticio';
};

const sesion = (rol = 'Administrador') => {
  const usuario = db.agregarUsuario({ correo: 'personal@example.test', nombre_usuario: 'Ana', id_rol: 1 });
  return {
    id: usuario.id_usuario,
    cabecera: `Bearer ${new JWTFactory().createToken({ id: usuario.id_usuario, rol })}`,
  };
};

// Ejecuta una petición con captura y devuelve la respuesta y sus líneas (por request_id).
const peticion = async (hacer) => {
  const captura = logger.__capturar();
  let respuesta;
  try {
    respuesta = await hacer();
    await pausa();
  } finally {
    captura.terminar();
  }
  const id = respuesta.headers['x-request-id'];
  return { respuesta, id, todas: captura.lineas, lineas: captura.lineas.filter((l) => l.request_id === id) };
};

const atendidas = (lineas) => lineas.filter((l) => l.message === ATENDIDA);

beforeEach(() => {
  db.reiniciar();
  jest.clearAllMocks();
  axios.post.mockResolvedValue({ data: { messages: [{ id: 'wamid.prueba' }] } });
  citasRepo.findCitaExistente.mockResolvedValue(null);
  citasRepo.createCita.mockResolvedValue(CITA.id_cita);
  citasRepo.getPacienteWhatsApp.mockResolvedValue(CITA);
  citasRepo.getCitasDelDia.mockResolvedValue([]);
  citasRepo.getCitasParaRecordatorio.mockResolvedValue([CITA]);
  serviciosRepo.getServicioById.mockResolvedValue({ nombre_servicio: 'Limpieza', duracion: '01:00' });
  serviciosRepo.getServiciosPublicos.mockResolvedValue([]);
  pacientesRepo.getPacientesSelect.mockResolvedValue([]);
});

afterEach(() => {
  process.env.WHATSAPP_ENABLED = 'false';
  delete process.env.WHATSAPP_TOKEN;
  delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  delete process.env.RESEND_API_KEY;
  delete global.fetch;
  jest.restoreAllMocks();
});

describe('026 · CA4 todas las líneas de una petición llevan su identificador (TM8)', () => {
  test('crear una cita con aviso de confirmación por WhatsApp', async () => {
    encenderWhatsApp();
    const { cabecera } = sesion();
    const { respuesta, id, todas, lineas } = await peticion(() =>
      request(app)
        .post('/api/v1/citas')
        .set('Authorization', cabecera)
        .send({ id_paciente: 3, fecha_agendada: CITA.fecha_agendada, hora: '10:00', id_servicio: 1 }),
    );

    expect(respuesta.status).toBe(201);
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(lineas.map((l) => l.message)).toEqual(
      expect.arrayContaining(['Aviso de WhatsApp enviado', ATENDIDA]),
    );
    expect(todas.every((l) => l.request_id === id)).toBe(true);
  });

  test('solicitar la recuperación de contraseña con envío de correo', async () => {
    db.agregarUsuario({
      correo: 'paciente@example.test',
      nombre_usuario: 'Ana',
      contrasena: bcrypt.hashSync('clave-de-prueba-1', 4),
    });
    process.env.RESEND_API_KEY = 'clave-ficticia';
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ id: 'correo-de-prueba' }) }));

    const { respuesta, id, todas, lineas } = await peticion(() =>
      request(app).post('/api/v1/auth/olvide-contrasena').send({ correo: 'paciente@example.test' }),
    );

    expect(respuesta.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(lineas.map((l) => l.message)).toEqual(expect.arrayContaining(['Correo enviado', ATENDIDA]));
    expect(todas.every((l) => l.request_id === id)).toBe(true);
  });
});

describe('026 · CA5 identificador propio por ejecución del trabajo de recordatorios', () => {
  test('job_id común dentro de cada ejecución y distinto entre ejecuciones', async () => {
    encenderWhatsApp();
    citasRepo.getCitasParaRecordatorio.mockResolvedValue([CITA, { ...CITA, id_cita: 42 }]);

    const ejecutar = async () => {
      const captura = logger.__capturar();
      try {
        await correrCron();
      } finally {
        captura.terminar();
      }
      return captura.lineas;
    };

    const primera = await ejecutar();
    const segunda = await ejecutar();

    for (const lineas of [primera, segunda]) {
      expect(lineas.length).toBeGreaterThan(1);
      expect(lineas.every((l) => l.job_id && l.job_id === lineas[0].job_id)).toBe(true);
      expect(lineas.some((l) => l.request_id)).toBe(false);
    }
    expect(primera[0].job_id).not.toBe(segunda[0].job_id);
  });
});

describe('026 · CA8 una línea «Petición atendida» por petición (TM7, A1)', () => {
  test('200: una sola línea, informativa, con método, ruta, estado y duración', async () => {
    const { lineas } = await peticion(() => request(app).get('/api/v1/servicios/publicos'));
    const [linea, ...otras] = atendidas(lineas);

    expect(otras).toHaveLength(0);
    expect(linea).toMatchObject({
      level: 'info',
      context: { method: 'GET', route: '/api/v1/servicios/publicos', status: 200 },
    });
    expect(typeof linea.context.duration_ms).toBe('number');
  });

  test('la ruta se registra sin parámetros de consulta (búsqueda de pacientes por nombre)', async () => {
    const { cabecera } = sesion();
    const { respuesta, lineas } = await peticion(() =>
      request(app).get('/api/v1/pacientes?busqueda=Nombre%20Centinela').set('Authorization', cabecera),
    );

    expect(respuesta.status).toBe(200);
    expect(atendidas(lineas)).toHaveLength(1);
    expect(atendidas(lineas)[0].context.route).toBe('/api/v1/pacientes');
    expect(JSON.stringify(lineas)).not.toMatch(/Centinela|busqueda/);
  });

  test('401: advertencia sin pila en ninguna línea', async () => {
    const { lineas } = await peticion(() => request(app).get('/api/v1/servicios'));
    const linea = atendidas(lineas);

    expect(linea).toHaveLength(1);
    expect(linea[0]).toMatchObject({ level: 'warn', context: { status: 401 } });
    expect(JSON.stringify(lineas)).not.toContain('"stack"');
  });

  test('500: error con la pila dentro de «Petición atendida» y en ninguna otra línea', async () => {
    serviciosRepo.getServiciosPublicos.mockRejectedValue(new TypeError('fallo de prueba'));
    const { respuesta, lineas } = await peticion(() => request(app).get('/api/v1/servicios/publicos'));
    const linea = atendidas(lineas);

    expect(respuesta.status).toBe(500);
    expect(linea).toHaveLength(1);
    expect(linea[0]).toMatchObject({ level: 'error', context: { status: 500, error: { error_name: 'TypeError' } } });
    expect(linea[0].context.error.stack).toContain('TypeError');
    expect(lineas.filter((l) => JSON.stringify(l).includes('"stack"'))).toHaveLength(1);
  });

  test('la ruta de salud se registra como depuración', async () => {
    const { lineas } = await peticion(() => request(app).get('/health'));

    expect(atendidas(lineas)).toHaveLength(1);
    expect(atendidas(lineas)[0].level).toBe('debug');
  });
});

describe('026 · CA6 actor de la petición', () => {
  test('con sesión se registra el id numérico del usuario y no su correo', async () => {
    const { id, cabecera } = sesion();
    const { lineas } = await peticion(() =>
      request(app).get('/api/v1/pacientes').set('Authorization', cabecera),
    );

    expect(atendidas(lineas)[0].actor_id).toBe(id);
    expect(JSON.stringify(lineas)).not.toContain('personal@example.test');
  });

  test('sin sesión no hay actor_id', async () => {
    const { lineas } = await peticion(() => request(app).get('/api/v1/servicios/publicos'));

    expect(atendidas(lineas)[0]).not.toHaveProperty('actor_id');
  });
});

// Spec 026, T031: huecos que encontró /review ronda 1 (R2, R13).
describe('026 · /review R13 CA4 también para los errores del proveedor', () => {
  test('WhatsApp rechaza: «Aviso de WhatsApp no enviado» lleva el identificador de la petición', async () => {
    encenderWhatsApp();
    axios.post.mockRejectedValue(Object.assign(new Error('fallo de Meta'), { response: { status: 500 } }));
    const { cabecera } = sesion();
    const { respuesta, id, todas, lineas } = await peticion(() =>
      request(app)
        .post('/api/v1/citas')
        .set('Authorization', cabecera)
        .send({ id_paciente: 3, fecha_agendada: CITA.fecha_agendada, hora: '10:00', id_servicio: 1 }),
    );

    expect(respuesta.status).toBe(201);
    expect(lineas.map((l) => l.message)).toEqual(
      expect.arrayContaining(['Aviso de WhatsApp no enviado', ATENDIDA]),
    );
    expect(todas.every((l) => l.request_id === id)).toBe(true);
  });

  test('Resend responde 500: «Correo no enviado» lleva el identificador de la petición', async () => {
    db.agregarUsuario({
      correo: 'paciente@example.test',
      nombre_usuario: 'Ana',
      contrasena: bcrypt.hashSync('clave-de-prueba-1', 4),
    });
    process.env.RESEND_API_KEY = 'clave-ficticia';
    global.fetch = jest.fn(async () => ({ ok: false, status: 500, text: async () => '{"name":"internal_server_error"}' }));

    const { respuesta, id, todas, lineas } = await peticion(() =>
      request(app).post('/api/v1/auth/olvide-contrasena').send({ correo: 'paciente@example.test' }),
    );

    expect(respuesta.status).toBe(200);
    expect(lineas.map((l) => l.message)).toEqual(expect.arrayContaining(['Correo no enviado', ATENDIDA]));
    expect(todas.every((l) => l.request_id === id)).toBe(true);
  });
});

describe('026 · /review R2 petición abortada por el cliente', () => {
  const http = require('http');
  const express = require('express');
  const { requestId } = require('../../src/middlewares/requestId');
  const registroPeticion = require('../../src/middlewares/registroPeticion');

  let servidor;
  let temporizadores;

  beforeEach(async () => {
    temporizadores = [];
    const mini = express();
    mini.use(requestId);
    mini.use(registroPeticion);
    mini.get('/lenta', (_req, res) => {
      temporizadores.push(setTimeout(() => res.end('tarde'), 300));
    });
    mini.get('/rapida', (_req, res) => res.end('ok'));
    servidor = mini.listen(0);
    await new Promise((resolve) => servidor.once('listening', resolve));
  });

  afterEach(async () => {
    temporizadores.forEach(clearTimeout);
    await new Promise((resolve) => servidor.close(resolve));
  });

  // Espera por condición, no por tiempo: hasta que aparezca la línea o venza el plazo.
  const esperarLinea = async (captura, plazoMs = 2000) => {
    const limite = Date.now() + plazoMs;
    while (Date.now() < limite) {
      const linea = captura.lineas.find((l) => l.message === ATENDIDA);
      if (linea) return linea;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    return null;
  };

  test('una petición cortada deja una sola línea con aborted, sin estado y como advertencia', async () => {
    const captura = logger.__capturar();
    try {
      const { port } = servidor.address();
      const cliente = http.get({ port, path: '/lenta' });
      cliente.on('error', () => {});
      temporizadores.push(setTimeout(() => cliente.destroy(), 50));

      const linea = await esperarLinea(captura);
      // Dejar que la respuesta tardía llegue a escribirse: no debe sumar otra línea.
      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(linea).toMatchObject({ level: 'warn', context: { route: '/lenta', status: null, aborted: true } });
      expect(captura.lineas.filter((l) => l.message === ATENDIDA)).toHaveLength(1);
    } finally {
      captura.terminar();
    }
  });

  test('una petición completa no lleva aborted', async () => {
    const captura = logger.__capturar();
    try {
      const { port } = servidor.address();
      await new Promise((resolve, reject) => {
        http.get({ port, path: '/rapida' }, (res) => {
          res.resume();
          res.on('end', resolve);
        }).on('error', reject);
      });
      const linea = await esperarLinea(captura);

      expect(linea).toMatchObject({ level: 'info', context: { status: 200 } });
      expect(linea.context).not.toHaveProperty('aborted');
    } finally {
      captura.terminar();
    }
  });
});
