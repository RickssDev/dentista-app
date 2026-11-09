module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  // Muestra por nombre cada prueba y cada pendiente en cualquier entorno (spec 018, CA3).
  // Se fija el reporte: Jest usa uno reducido cuando detecta un agente de IA.
  reporters: ['default'],
  verbose: true,
  globalSetup: '<rootDir>/tests/support/guard.js',
  setupFiles: ['<rootDir>/tests/support/env.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/support/net.js'],
  // Ninguna prueba abre el pool real: cualquier archivo que cargue config/db recibe la simulación.
  moduleNameMapper: {
    '^.*/config/db$': '<rootDir>/tests/support/fake-db.js',
  },
};
