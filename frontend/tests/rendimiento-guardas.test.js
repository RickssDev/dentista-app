// @vitest-environment node
// Spec 023 · CA4, CA7, CA8 y TM1: las guardas que hacen fallar el build.
import { describe, expect, test } from 'vitest'
import { HOSTS_PROHIBIDOS, datosDeSesion, hostsProhibidos, modulosPrivadosEnEntrada } from '../src/seo/guardas.js'

describe('023 · hostsProhibidos', () => {
  test('la lista es la del plan', () => {
    expect([...HOSTS_PROHIBIDOS].sort()).toEqual(
      ['accounts.google.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'images.unsplash.com', 'maps.google.com', 'maps.googleapis.com'].sort(),
    )
  })

  test.each(HOSTS_PROHIBIDOS.map((h) => [h]))('detecta %s en un atributo', (host) => {
    expect(hostsProhibidos(`<link href="https://${host}/recurso">`)).toEqual([host])
  })

  test('no señala nada en un HTML limpio ni en el enlace de "Cómo llegar"', () => {
    const limpio = '<img src="/images/hero-dentissa.webp"><a href="https://www.google.com/maps/search/?api=1&amp;query=x">Cómo llegar</a>'
    expect(hostsProhibidos(limpio)).toEqual([])
  })
})

describe('023 CA4 · modulosPrivadosEnEntrada', () => {
  const MODULOS = ['src/pages/admin/AdminPanel.jsx', 'src/pages/admin/login.jsx']
  const base = () => ({
    'index.html': { file: 'assets/index.js', isEntry: true, imports: ['_comun.js'], dynamicImports: MODULOS },
    '_comun.js': { file: 'assets/comun.js' },
    'src/pages/admin/AdminPanel.jsx': { file: 'assets/AdminPanel.js', isDynamicEntry: true, imports: ['_comun.js'] },
    'src/pages/admin/login.jsx': { file: 'assets/login.js', isDynamicEntry: true },
  })

  test('no señala nada si los módulos son entradas dinámicas fuera del cierre estático', () => {
    expect(modulosPrivadosEnEntrada(base(), MODULOS)).toEqual([])
  })

  test('señala un módulo incrustado en la entrada (sin clave propia en el manifiesto)', () => {
    const m = base()
    delete m['src/pages/admin/AdminPanel.jsx']
    expect(modulosPrivadosEnEntrada(m, MODULOS)).toEqual(['src/pages/admin/AdminPanel.jsx'])
  })

  test('señala un módulo que no es entrada dinámica', () => {
    const m = base()
    m['src/pages/admin/login.jsx'].isDynamicEntry = false
    expect(modulosPrivadosEnEntrada(m, MODULOS)).toEqual(['src/pages/admin/login.jsx'])
  })

  test('señala un módulo cuyo chunk está en el cierre de importaciones estáticas de index.html', () => {
    const m = base()
    m['_comun.js'].imports = ['src/pages/admin/AdminPanel.jsx']
    expect(modulosPrivadosEnEntrada(m, MODULOS)).toEqual(['src/pages/admin/AdminPanel.jsx'])
  })
})

describe('023 TM1 · datosDeSesion', () => {
  const LOGIN_LIMPIO =
    '<form><input id="login-correo" type="email" autoComplete="email" placeholder="tu@correo.com" value="">' +
    '<input id="reg-correo" placeholder="tu@correo.com"><p>Entra para ver y agendar tus citas</p></form>'

  test('un login limpio, con los placeholders de correo del login real, no tiene datos de sesión', () => {
    expect(datosDeSesion(LOGIN_LIMPIO)).toEqual([])
  })

  test('detecta un token JWT', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.firma'
    expect(datosDeSesion(`<script>var t="${jwt}"</script>`).length).toBeGreaterThan(0)
  })

  test('detecta la palabra "token" entre comillas', () => {
    expect(datosDeSesion('<script>localStorage.setItem("token", x)</script>').length).toBeGreaterThan(0)
  })

  test('detecta un correo en el texto o en un value, no en un placeholder', () => {
    expect(datosDeSesion('<p>Hola paciente@example.test</p>').length).toBeGreaterThan(0)
    expect(datosDeSesion('<input value="paciente@example.test">').length).toBeGreaterThan(0)
    expect(datosDeSesion('<input placeholder="paciente@example.test">')).toEqual([])
  })
})
