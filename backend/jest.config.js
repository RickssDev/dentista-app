module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  globalSetup: '<rootDir>/tests/support/guard.js',
  setupFiles: ['<rootDir>/tests/support/env.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/support/net.js'],
  // Ninguna prueba abre el pool real: cualquier archivo que cargue config/db recibe la simulación.
  moduleNameMapper: {
    '^.*/config/db$': '<rootDir>/tests/support/fake-db.js',
  },
};
