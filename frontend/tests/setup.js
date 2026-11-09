// jsdom no implementa estas API del navegador, que usa la pantalla de inicio de sesión.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.scrollTo = () => {}

// Ninguna prueba del frontend sale a la red.
globalThis.fetch = () => Promise.reject(new Error('Red bloqueada en las pruebas'))
