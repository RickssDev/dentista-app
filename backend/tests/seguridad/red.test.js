const { spawnSync } = require('child_process');
const path = require('path');

const BACKEND = path.resolve(__dirname, '../..');
const JEST = require.resolve('jest/bin/jest');

const correrCaso = (nombre, envExtra = {}) => {
  const r = spawnSync(process.execPath, [JEST, '--testMatch', `**/casos/${nombre}`], {
    cwd: BACKEND,
    env: { ...process.env, ...envExtra },
    encoding: 'utf8',
  });
  return { status: r.status, salida: `${r.stdout}${r.stderr}` };
};

describe('las pruebas no generan comunicaciones reales', () => {
  test('CA7 · una salida externa forzada hace fallar el archivo donde ocurre', () => {
    const { status, salida } = correrCaso('salida-forzada.caso.js');
    expect(status).not.toBe(0);
    expect(salida).toMatch(/Intento de salida externa/);
    // Con esquema lo registra el bloqueo de fetch; solo con el host, el de sockets.
    expect(salida).toMatch(/Intento de salida externa: https:\/\/servicio-externo\.invalid/);
    expect(salida).toMatch(/Intento de salida externa: servicio-externo\.invalid/);
  }, 60000);

  test('CA7 · las claves presentes en el entorno no llegan a las pruebas', () => {
    const { status, salida } = correrCaso('claves-eliminadas.caso.js', {
      RESEND_API_KEY: 'clave-ficticia',
      WHATSAPP_TOKEN: 'clave-ficticia',
      WHATSAPP_PHONE_NUMBER_ID: 'id-ficticio',
    });
    expect(salida).toMatch(/1 passed/);
    expect(status).toBe(0);
  }, 60000);
});
