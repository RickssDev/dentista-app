// Spec 026, T011: cabecera X-Request-Id en toda respuesta (CA1–CA3, CA12; TM1, TM2).
const request = require('supertest');

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({ verifyIdToken: jest.fn() })),
}));

const { createApp } = require('../../src/config/app');
const logger = require('../../src/utils/logger');
const serviciosRepo = require('../../src/modules/servicios/servicios.repository');

const app = createApp();
const CABECERA = 'x-request-id';
const PUBLICOS = '/api/v1/servicios/publicos';

// El registro de la petición se escribe al terminar la respuesta; se espera un ciclo antes de leer.
const pausa = () => new Promise((resolve) => setImmediate(resolve));

const conCaptura = async (fn, opciones) => {
  const captura = logger.__capturar(opciones);
  try {
    const respuesta = await fn();
    await pausa();
    return { respuesta, captura };
  } finally {
    captura.terminar();
  }
};

beforeEach(() => {
  jest.spyOn(serviciosRepo, 'getServiciosPublicos').mockResolvedValue([]);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('026 · CA1 cabecera en toda respuesta', () => {
  const casos = [
    ['200 público', () => request(app).get(PUBLICOS), 200],
    ['401 ruta protegida sin token', () => request(app).get('/api/v1/servicios'), 401],
    ['404 ruta inexistente', () => request(app).get('/api/v1/no-existe'), 404],
    ['salud', () => request(app).get('/health'), 200],
  ];

  test.each(casos)('%s', async (_nombre, hacer, estado) => {
    const r = await hacer();

    expect(r.status).toBe(estado);
    expect(r.headers[CABECERA]).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
  });

  test('500 desde un repositorio que lanza, pasando por errorHandler', async () => {
    serviciosRepo.getServiciosPublicos.mockRejectedValue(new Error('fallo de prueba'));
    const r = await request(app).get(PUBLICOS);

    expect(r.status).toBe(500);
    expect(r.body.success).toBe(false);
    expect(r.headers[CABECERA]).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
  });

  test('distinta en dos peticiones', async () => {
    const a = await request(app).get('/health');
    const b = await request(app).get('/health');

    expect(a.headers[CABECERA]).not.toBe(b.headers[CABECERA]);
  });

  test('429 del limitador de login', async () => {
    let r;
    for (let i = 0; i < 11; i += 1) {
      r = await request(app)
        .post('/api/v1/auth/login')
        .send({ correo: 'nadie@example.test', contrasena: 'incorrecta-1' });
    }

    expect(r.status).toBe(429);
    expect(r.headers[CABECERA]).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
  });
});

describe('026 · CA2 eco del identificador válido', () => {
  test('devuelve el mismo valor y lo usa en las líneas de la petición', async () => {
    const { respuesta, captura } = await conCaptura(() =>
      request(app).get(PUBLICOS).set('X-Request-Id', 'abc12345-XYZ_9'),
    );

    expect(respuesta.headers[CABECERA]).toBe('abc12345-XYZ_9');
    expect(captura.lineas.length).toBeGreaterThan(0);
    expect(captura.lineas.every((l) => l.request_id === 'abc12345-XYZ_9')).toBe(true);
  });
});

describe('026 · CA3 identificador inválido (abuso; TM1, TM2)', () => {
  const invalidos = [
    ['65 caracteres', 'a'.repeat(65)],
    ['menos de 8', 'abc1234'],
    ['con espacio', 'abc12345 xyz'],
    ['con punto y coma', 'abc12345;xyz'],
    ['con fragmento JSON', 'abc12345"}xyz'],
    ['con tabulador', 'abc12345\txyz'],
  ];

  test.each(invalidos)('%s: se genera otro y el valor no aparece en las líneas', async (_nombre, valor) => {
    const { respuesta, captura } = await conCaptura(() => request(app).get(PUBLICOS).set('X-Request-Id', valor));

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers[CABECERA]).not.toBe(valor);
    expect(respuesta.headers[CABECERA]).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    expect(captura.lineas.length).toBeGreaterThan(0);
    expect(captura.crudas.join('')).not.toContain(valor);
  });

  test('el validador rechaza saltos de línea, que el cliente HTTP de Node no deja enviar (A4)', () => {
    const { esIdValido } = require('../../src/middlewares/requestId');

    expect(esIdValido('abc12345-XYZ_9')).toBe(true);
    expect(esIdValido('abc12345\nxyz')).toBe(false);
    expect(esIdValido('abc12345\rxyz')).toBe(false);
    expect(esIdValido('abc12345-xyz\n')).toBe(false);
    expect(esIdValido(undefined)).toBe(false);
    expect(esIdValido(['abc12345', 'def67890'])).toBe(false);
  });
});

describe('026 · CA12 un fallo del log no cambia la respuesta', () => {
  test.each([
    ['salud', '/health', 200],
    ['404', '/api/v1/no-existe', 404],
  ])('%s responde igual con el destino del logger roto', async (_nombre, ruta, estado) => {
    const normal = await request(app).get(ruta);
    const alEscribir = jest.fn(() => {
      throw new Error('disco lleno');
    });
    const { respuesta } = await conCaptura(() => request(app).get(ruta), { alEscribir });

    expect(alEscribir).toHaveBeenCalled();
    expect(respuesta.status).toBe(estado);
    expect(respuesta.status).toBe(normal.status);
    expect(respuesta.body).toEqual(normal.body);
  });
});
