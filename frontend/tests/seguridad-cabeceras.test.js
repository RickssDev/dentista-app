// @vitest-environment node
// Spec 024 · CA1–CA4, CA9: las cabeceras de seguridad que nginx añade a todo lo que sirve él mismo.
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'

const ruta = (archivo) => new URL(`../${archivo}`, import.meta.url)
const leer = (archivo) => (existsSync(ruta(archivo)) ? readFileSync(ruta(archivo), 'utf8') : '')

const SEGURIDAD = leer('nginx-seguridad.conf')
const NGINX = leer('nginx.conf')
const DOCKERFILE = leer('Dockerfile')
const INCLUDE = '/etc/nginx/snippets/seguridad.conf'

// Cabeceras del archivo: { nombre en minúsculas: { valor, always } }
const cabeceras = Object.fromEntries(
  [...SEGURIDAD.replace(/#.*$/gm, '').matchAll(/add_header\s+([\w-]+)\s+"([^"]*)"\s*(always)?\s*;/g)].map((m) => [
    m[1].toLowerCase(),
    { valor: m[2], always: Boolean(m[3]) },
  ]),
)

// Contrato del plan (tabla "Contratos y datos")
const CSP_ESPERADA = {
  'default-src': ["'self'"],
  'script-src': ["'self'", 'https://accounts.google.com/gsi/client'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://accounts.google.com/gsi/style'],
  'img-src': ["'self'", 'data:', 'blob:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'https://accounts.google.com/gsi/'],
  'frame-src': ['https://accounts.google.com/gsi/', 'https://maps.google.com', 'https://www.google.com'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'object-src': ["'none'"],
}
const OTRAS = {
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'strict-transport-security': 'max-age=31536000',
}

const directivas = (csp = '') =>
  Object.fromEntries(
    csp
      .split(';')
      .map((d) => d.trim().split(/\s+/))
      .filter((d) => d[0])
      .map(([nombre, ...fuentes]) => [nombre.toLowerCase(), fuentes]),
  )
const csp = () => directivas(cabeceras['content-security-policy']?.valor)

// Bloques location de nginx.conf: [{ patron, cuerpo }] (sin llaves anidadas)
const locations = [...NGINX.replace(/#.*$/gm, '').matchAll(/location\s+([^{]+)\{([^}]*)\}/g)].map((m) => ({
  patron: m[1].trim(),
  cuerpo: m[2],
}))
const PROXIES = ['^~ /api/', '^~ /uploads/']

describe('024 · archivo de cabeceras de seguridad', () => {
  test('existe frontend/nginx-seguridad.conf', () => {
    expect(SEGURIDAD, 'nginx-seguridad.conf').not.toBe('')
  })

  test('las seis cabeceras están, con "always" (también en 404 y redirecciones)', () => {
    for (const nombre of ['content-security-policy', ...Object.keys(OTRAS)]) {
      expect(cabeceras[nombre], nombre).toBeDefined()
      expect(cabeceras[nombre].always, `${nombre} con always`).toBe(true)
    }
  })

  test.each(Object.entries(OTRAS))('CA1, CA2, CA3 · %s tiene el valor exacto del plan', (nombre, valor) => {
    expect(cabeceras[nombre]?.valor).toBe(valor)
  })

  test('CA2 · HSTS sin includeSubDomains ni preload', () => {
    expect(cabeceras['strict-transport-security']?.valor || '').not.toMatch(/includesubdomains|preload/i)
  })
})

describe('024 · política de contenido (CSP)', () => {
  test('CA4 · tiene exactamente las directivas del plan', () => {
    expect(Object.keys(csp()).sort()).toEqual(Object.keys(CSP_ESPERADA).sort())
  })

  test.each(Object.entries(CSP_ESPERADA))('CA4 · %s permite solo lo del plan', (nombre, fuentes) => {
    expect([...(csp()[nombre] || [])].sort()).toEqual([...fuentes].sort())
  })

  test('TM2 · script-src sin código en línea, eval, comodines, data: ni http:', () => {
    const scripts = csp()['script-src'] || []
    expect(scripts.length).toBeGreaterThan(0)
    for (const prohibido of ["'unsafe-inline'", "'unsafe-eval'", '*', 'data:', 'blob:']) {
      expect(scripts, prohibido).not.toContain(prohibido)
    }
    expect(scripts.some((f) => f.startsWith('http:'))).toBe(false)
  })

  test('CA3, TM1 · nadie puede mostrar el sitio en un marco', () => {
    expect(csp()['frame-ancestors']).toEqual(["'none'"])
  })

  test('TM3 · los datos y los formularios solo van al propio sitio (y al login de Google)', () => {
    expect(csp()['default-src']).toEqual(["'self'"])
    expect(csp()['form-action']).toEqual(["'self'"])
    expect(csp()['object-src']).toEqual(["'none'"])
    expect(csp()['base-uri']).toEqual(["'self'"])
  })

  test('CA7 · las vistas previas de imagen (blob:) están permitidas', () => {
    expect(csp()['img-src'] || []).toContain('blob:')
  })
})

describe('024 · nginx.conf y la imagen usan el archivo', () => {
  test('nginx.conf tiene sus location', () => {
    expect(locations.length).toBeGreaterThan(5)
  })

  test('CA8, CA9, TM7 · cada location propia incluye las cabeceras; /api/ y /uploads/ no (helmet)', () => {
    for (const { patron, cuerpo } of locations) {
      const incluye = cuerpo.includes(`include ${INCLUDE};`)
      if (PROXIES.includes(patron)) expect(incluye, `${patron} no debe incluirlas`).toBe(false)
      else expect(incluye, `location ${patron}`).toBe(true)
    }
  })

  test('el Dockerfile copia el archivo a la ruta del include', () => {
    expect(DOCKERFILE).toMatch(new RegExp(`^COPY\\s+nginx-seguridad\\.conf\\s+${INCLUDE.replace(/\//g, '\\/').replace(/\./g, '\\.')}\\s*$`, 'm'))
  })
})
