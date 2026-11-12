// @vitest-environment node
// Spec 022 · CA3, CA4: título, descripción y canónica propios por página pública.
import { describe, expect, test } from 'vitest'
import { RUTAS_PUBLICAS, RUTAS_NO_INDEXABLES, SITIO, canonica } from '../src/seo/rutas.js'

const ESPERADAS = ['/', '/nosotros', '/galeria', '/contacto', '/aviso-de-privacidad', '/terminos-de-servicio']

describe('022 · tabla de rutas públicas', () => {
  test('son exactamente las seis páginas públicas', () => {
    expect(RUTAS_PUBLICAS.map((r) => r.ruta)).toEqual(ESPERADAS)
  })

  test('CA3 · títulos únicos que incluyen "Dentissa"', () => {
    const titulos = RUTAS_PUBLICAS.map((r) => r.titulo)
    expect(new Set(titulos).size).toBe(titulos.length)
    for (const titulo of titulos) expect(titulo).toMatch(/Dentissa/)
  })

  test('CA3 · descripciones únicas de 70 a 160 caracteres', () => {
    const descripciones = RUTAS_PUBLICAS.map((r) => r.descripcion)
    expect(new Set(descripciones).size).toBe(descripciones.length)
    for (const d of descripciones) {
      expect(d.length).toBeGreaterThanOrEqual(70)
      expect(d.length).toBeLessThanOrEqual(160)
    }
  })

  test('CA4 · canónica absoluta en sistema.dentissa.app sin barra final', () => {
    expect(SITIO).toBe('https://sistema.dentissa.app')
    expect(canonica('/')).toBe('https://sistema.dentissa.app/')
    expect(canonica('/nosotros')).toBe('https://sistema.dentissa.app/nosotros')
    for (const { ruta } of RUTAS_PUBLICAS.filter((r) => r.ruta !== '/')) {
      expect(canonica(ruta)).not.toMatch(/\/$/)
    }
  })

  test('las rutas privadas no están en la tabla', () => {
    expect(RUTAS_NO_INDEXABLES).toEqual(expect.arrayContaining(['/login', '/restablecer-contrasena', '/admin', '/paciente']))
    const publicas = RUTAS_PUBLICAS.map((r) => r.ruta)
    for (const privada of RUTAS_NO_INDEXABLES) expect(publicas).not.toContain(privada)
  })
})
