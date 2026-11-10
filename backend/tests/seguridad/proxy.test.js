const request = require('supertest');

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({ verifyIdToken: jest.fn() })),
}));

const { createApp } = require('../../src/config/app');

const CLIENTE = '203.0.113.9';
const TUNEL = '172.18.0.2';

const ipRecibida = async (saltos) => {
  process.env.TRUST_PROXY = saltos;
  const app = createApp();
  app.get('/ip', (req, res) => res.json({ ip: req.ip }));
  const r = await request(app).get('/ip').set('X-Forwarded-For', `198.51.100.7, ${CLIENTE}, ${TUNEL}`);
  delete process.env.TRUST_PROXY;
  return r.body.ip;
};

test('RS4.b · con túnel y nginx, TRUST_PROXY=2 identifica al cliente real', async () => {
  expect(await ipRecibida('2')).toBe(CLIENTE);
});

test('RS4.b · TRUST_PROXY=1 identifica al túnel y no al cliente', async () => {
  expect(await ipRecibida('1')).toBe(TUNEL);
});
