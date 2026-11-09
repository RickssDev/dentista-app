const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BACKEND = path.resolve(__dirname, '../..');
const JEST = require.resolve('jest/bin/jest');

const entornoLimpio = () => {
  const env = { ...process.env };
  delete env.DB_HOST;
  return env;
};

// Lanza la suite real, con su globalSetup, sobre un archivo de prueba inofensivo.
const correrSuite = (env) => {
  const r = spawnSync(process.execPath, [JEST, '--testPathPatterns', 'seguridad/fixtures'], {
    cwd: BACKEND,
    env,
    encoding: 'utf8',
  });
  return { status: r.status, salida: `${r.stdout}${r.stderr}` };
};

describe('la suite se niega a correr contra producción', () => {
  test('CA6 · con NODE_ENV=production termina con error y explica el motivo', () => {
    const { status, salida } = correrSuite({ ...entornoLimpio(), NODE_ENV: 'production' });
    expect(status).not.toBe(0);
    expect(salida).toMatch(/Suite detenida/);
    expect(salida).not.toMatch(/Tests:/);
  }, 60000);

  test('CA6 · con un DB_HOST externo termina con error y explica el motivo', () => {
    const { status, salida } = correrSuite({ ...entornoLimpio(), DB_HOST: 'bd.externa.example.test' });
    expect(status).not.toBe(0);
    expect(salida).toMatch(/Suite detenida/);
    expect(salida).not.toMatch(/Tests:/);
  }, 60000);

  test('CA6 · con un entorno local la suite corre', () => {
    const { status, salida } = correrSuite({ ...entornoLimpio(), DB_HOST: '127.0.0.1' });
    expect(status).toBe(0);
    expect(salida).toMatch(/Tests:/);
  }, 60000);

  test('CA6 · un .env con host externo no se carga', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dentissa-env-'));
    fs.writeFileSync(path.join(dir, '.env'), 'DB_HOST=bd.externa.example.test\n');
    const app = JSON.stringify(path.join(BACKEND, 'src/config/app.js'));
    const r = spawnSync(
      process.execPath,
      ['-e', `require(${app}); console.log(process.env.DB_HOST || 'sin-cargar')`],
      { cwd: dir, env: entornoLimpio(), encoding: 'utf8' },
    );
    fs.rmSync(dir, { recursive: true, force: true });
    expect(r.stdout.trim()).toBe('sin-cargar');
  }, 60000);
});
