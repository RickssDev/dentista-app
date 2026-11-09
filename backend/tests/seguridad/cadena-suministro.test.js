const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '../../..');
const leer = (ruta) => fs.readFileSync(path.join(RAIZ, ruta), 'utf8');
const paquete = (nombre) => JSON.parse(leer(`${nombre}/package.json`));
const registradas = require('./dependencias-produccion.json');

const HERRAMIENTAS = {
  backend: ['jest', 'supertest', 'eslint', '@eslint/js', 'globals'],
  frontend: ['vitest', 'jsdom', '@testing-library/react', '@testing-library/dom', '@testing-library/user-event'],
};

const WORKFLOW = '.github/workflows/ai-dd.yml';

describe('TM4 · cadena de suministro', () => {
  test.each(['backend', 'frontend'])('las herramientas de %s son solo de desarrollo', (nombre) => {
    const { dependencies, devDependencies } = paquete(nombre);
    for (const herramienta of HERRAMIENTAS[nombre]) {
      expect(dependencies).not.toHaveProperty([herramienta]);
      expect(devDependencies).toHaveProperty([herramienta]);
    }
  });

  // Se compara por nombre: actualizar versiones no exige tocar la lista.
  test.each(['backend', 'frontend'])('P3 · las dependencias de producción de %s están registradas', (nombre) => {
    expect(Object.keys(paquete(nombre).dependencies).sort()).toEqual([...registradas[nombre]].sort());
  });

  test('cada paquete versiona su lockfile', () => {
    expect(fs.existsSync(path.join(RAIZ, 'backend/package-lock.json'))).toBe(true);
    expect(fs.existsSync(path.join(RAIZ, 'frontend/package-lock.json'))).toBe(true);
  });

  test('la imagen del backend no incluye pruebas ni herramientas de desarrollo', () => {
    expect(leer('backend/Dockerfile.prod')).toMatch(/npm ci --omit=dev/);
    expect(leer('backend/.dockerignore').split(/\r?\n/)).toContain('tests');
  });

  test('la imagen final del frontend solo recibe la build', () => {
    const final = leer('frontend/Dockerfile').split(/FROM nginx/)[1];
    expect(final).toMatch(/COPY --from=build \/app\/dist/);
    expect(final).not.toMatch(/npm /);
  });
});

describe('workflow de integración continua', () => {
  const workflow = leer(WORKFLOW);
  const job = (nombre) =>
    workflow.match(new RegExp(`^  ${nombre}:\\r?\\n[\\s\\S]*?(?=^  [\\w-]+:\\r?\\n|(?![\\s\\S]))`, 'm'))[0];

  test('TM5 · tiene permisos de solo lectura, sin pull_request_target ni secretos', () => {
    expect(workflow).toMatch(/^permissions:\r?\n\s+contents: read/m);
    expect(workflow).not.toMatch(/pull_request_target/);
    expect(workflow).not.toMatch(/secrets\./);
  });

  test('CA9 · ejecuta las pruebas en cada propuesta de cambio, con límite de 5 minutos', () => {
    expect(workflow).toMatch(/^\s+pull_request:/m);
    const calidad = job('calidad');
    expect(calidad).toMatch(/if: github\.event_name == 'pull_request'/);
    expect(calidad).not.toMatch(/continue-on-error/);
    const paso = calidad.match(/^\s+- name: Pruebas\s*?\r?\n[\s\S]*?(?=\r?\n\s+- )/m);
    expect(paso).not.toBeNull();
    expect(paso[0]).not.toMatch(/^\s+if:/m);
    expect(paso[0]).toMatch(/^\s*timeout-minutes: 5\s*$/m);
    expect(paso[0]).toMatch(/npm test/);
  });

  test('P11 · audita las dependencias de ambos paquetes en cada PR', () => {
    const seguridad = job('seguridad-pr');
    expect(seguridad).toMatch(/npm --prefix backend audit --audit-level=high/);
    expect(seguridad).toMatch(/npm --prefix frontend audit --audit-level=high/);
  });

  test('CA10 · revisa el estilo del backend solo en los archivos cambiados', () => {
    const paso = workflow.match(/- name: Lint de backend[\s\S]*?(?=\r?\n\s+- )/);
    expect(paso).not.toBeNull();
    expect(paso[0]).toMatch(/git diff --name-only/);
    expect(paso[0]).toMatch(/grep '\^backend\//);
    expect(paso[0]).toMatch(/eslint/);
  });
});
