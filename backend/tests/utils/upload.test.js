const express = require('express');
const request = require('supertest');

const upload = require('../../src/utils/upload');
const errorHandler = require('../../src/middlewares/errorHandler');

const app = express();
app.post('/subida', upload.single('imagen'), (_req, res) => res.json({ ok: true }));
app.use(errorHandler);

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('014 · un archivo que no es imagen responde 400 e indica el motivo', async () => {
  const r = await request(app)
    .post('/subida')
    .attach('imagen', Buffer.from('texto'), { filename: 'nota.txt', contentType: 'text/plain' });

  expect(r.status).toBe(400);
  expect(r.body.message).toBe('Solo se permiten imágenes');
});
