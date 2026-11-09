const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '../../..');
const CARPETAS = ['backend/tests', 'frontend/tests'];
const CORREO = /[\w.+-]+@[\w.-]+\.[a-z]+/gi;

const archivos = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = path.join(dir, e.name);
    return e.isDirectory() ? archivos(ruta) : [ruta];
  });

test('CA8 · todo correo de los archivos de prueba usa @example.test', () => {
  const ajenos = CARPETAS.flatMap((c) => archivos(path.join(RAIZ, c))).flatMap((ruta) =>
    (fs.readFileSync(ruta, 'utf8').match(CORREO) || [])
      .filter((correo) => !correo.endsWith('@example.test'))
      .map((correo) => `${path.relative(RAIZ, ruta)}: ${correo}`),
  );
  expect(ajenos).toEqual([]);
});
