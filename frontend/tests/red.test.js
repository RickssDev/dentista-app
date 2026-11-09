import { test, expect } from 'vitest'

test('CA7 · el frontend no sale a la red en las pruebas', async () => {
  await expect(fetch('https://servicio-externo.invalid/')).rejects.toThrow('Red bloqueada')
})
