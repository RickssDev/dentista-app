const { spawnSync } = require('child_process');
const path = require('path');

const BACKEND = path.resolve(__dirname, '../..');
const JEST = require.resolve('jest/bin/jest');
const PENDIENTES = ['001 CA9 ·', '001 CA10 ·', '002 CA8 ·', '003 CA9 ·', '003 CA10 ·'];

test('CA3 · la salida de la suite muestra cada pendiente por su nombre', () => {
  const r = spawnSync(process.execPath, [JEST, '--testPathPatterns', 'tests/auth'], {
    cwd: BACKEND,
    encoding: 'utf8',
  });
  const salida = `${r.stdout}${r.stderr}`;
  expect(PENDIENTES.filter((nombre) => !salida.includes(nombre))).toEqual([]);
}, 60000);
