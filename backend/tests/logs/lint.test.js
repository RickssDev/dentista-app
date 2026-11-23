// Spec 026, T014: ningún console.* esquiva al logger (TM10).
const path = require('path');
const { ESLint } = require('eslint');

const raiz = path.join(__dirname, '..', '..');
// Se pasa la configuración del proyecto ya cargada: ESLint la importaría con import(),
// que Jest no admite sin --experimental-vm-modules.
const eslint = new ESLint({
  cwd: raiz,
  overrideConfigFile: true,
  overrideConfig: require('../../eslint.config.js'),
});

const reglasCon = async (archivo) => {
  const [resultado] = await eslint.lintText("console.log('x');\n", { filePath: path.join(raiz, archivo) });
  return resultado.messages.map((m) => m.ruleId);
};

test.each([
  'src/modules/citas/citas.service.js',
  'src/services/email.service.js',
  'src/middlewares/errorHandler.js',
  'server.js',
])('026 · TM10 console.log en %s da error no-console', async (archivo) => {
  expect(await reglasCon(archivo)).toContain('no-console');
});

test('026 · TM10 el logger puede escribir en consola', async () => {
  expect(await reglasCon('src/utils/logger.js')).not.toContain('no-console');
});
