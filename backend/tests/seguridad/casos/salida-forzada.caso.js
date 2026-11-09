// Lo ejecuta red.test.js en un proceso aparte y espera que falle.
// Usa un dominio reservado (.invalid) que no resuelve a ningún servicio.
const https = require('https');

const DESTINO = 'https://servicio-externo.invalid/';

test('intenta salir con fetch', async () => {
  await fetch(DESTINO).catch(() => {});
});

test('intenta salir con https', async () => {
  await new Promise((resolve) => {
    try {
      https.get(DESTINO, resolve).on('error', resolve);
    } catch {
      resolve();
    }
  });
});
