const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/', 'uploads/', 'coverage/'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: { globals: globals.jest },
  },
  // Spec 026: todo log pasa por el logger, que oculta los datos sensibles (TM10, constitución P15).
  {
    files: ['src/**/*.js', 'server.js'],
    ignores: ['src/utils/logger.js'],
    rules: { 'no-console': 'error' },
  },
];
