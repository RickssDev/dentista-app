// Spec 026, T015: la suite no imprime logs (RNF); en producción, silent se ignora (A24, /review R9).
const request = require('supertest');

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({ verifyIdToken: jest.fn() })),
}));

const { createApp } = require('../../src/config/app');
const logger = require('../../src/utils/logger');
const serviciosRepo = require('../../src/modules/servicios/servicios.repository');

const app = createApp();
const NODE_ENV_ORIGINAL = process.env.NODE_ENV;
const pausa = () => new Promise((resolve) => setImmediate(resolve));

let escrito;

beforeEach(() => {
  escrito = [];
  jest.spyOn(process.stdout, 'write').mockImplementation((texto) => {
    escrito.push(String(texto));
    return true;
  });
  jest.spyOn(serviciosRepo, 'getServiciosPublicos').mockRejectedValue(new Error('fallo de prueba'));
});

afterEach(() => {
  process.env.NODE_ENV = NODE_ENV_ORIGINAL;
  jest.restoreAllMocks();
});

test('026 · RNF con LOG_LEVEL=silent y sin captura, /health y un 500 no escriben en stdout', async () => {
  expect(process.env.LOG_LEVEL).toBe('silent');

  await request(app).get('/health');
  const r = await request(app).get('/api/v1/servicios/publicos');
  await pausa();

  expect(r.status).toBe(500);
  expect(escrito).toHaveLength(0);
});

test('026 · RNF en producción, sin captura, silent se ignora: info escribe en stdout y debug no (A24)', () => {
  expect(process.env.LOG_LEVEL).toBe('silent');
  process.env.NODE_ENV = 'production';

  logger.debug('Depuración de prueba');
  expect(escrito).toHaveLength(0);

  logger.info('Información de prueba');
  expect(escrito).toHaveLength(1);
  expect(JSON.parse(escrito[0])).toMatchObject({ level: 'info', message: 'Información de prueba' });
});
