// @vitest-environment node
// Spec 022 · CA1, CA2, CA3, CA4, CA7, CA8, CA10, CA11 y TM1/TM2: lo que recibe el rastreador.
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { render } from '../src/entry-prerender.jsx'
import { construirPagina, estilosDeRuta, paginaLogin } from '../src/seo/cabecera.js'
import { datosDeSesion, hostsProhibidos } from '../src/seo/guardas.js'
import { RUTAS_PUBLICAS, TITULO_LOGIN, canonica } from '../src/seo/rutas.js'

const PLANTILLA = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const TEXTOS_PRIVADOS =
  /Entra para ver y agendar tus citas|Crea tu cuenta y agenda tu primera cita|Próxima cita|Cerrar sesión|olvidaste tu contraseña/i

const metaContenido = (html, atributo, valor) =>
  (html.match(new RegExp(`<meta[^>]*${atributo}="${valor}"[^>]*content="([^"]*)"`)) || [])[1]
const enlace = (html, rel) => (html.match(new RegExp(`<link[^>]*rel="${rel}"[^>]*href="([^"]*)"`)) || [])[1]
const h1 = (html) => ((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, '').trim()

const paginas = await Promise.all(
  RUTAS_PUBLICAS.map(async (r) => {
    const cuerpo = await render(r.ruta)
    return { ...r, cuerpo, html: construirPagina(PLANTILLA, { cuerpo, ruta: r.ruta }) }
  }),
)
const pagina = (ruta) => paginas.find((p) => p.ruta === ruta)
const RUTAS = RUTAS_PUBLICAS.map((r) => [r.ruta])

describe('022 CA2 · cada página pública trae su contenido sin JavaScript', () => {
  test.each(RUTAS)('%s tiene su h1 dentro de #root', (ruta) => {
    const { html } = pagina(ruta)
    expect(html).toMatch(/<div id="root"><[\s\S]+<\/div>/)
    expect(h1(html)).not.toBe('')
  })

  // R3: el contenido no puede llegar fuera de su sitio, oculto hasta que corra JavaScript
  test.each(RUTAS)('%s tiene su h1 dentro de <main> y nada pendiente de Suspense', (ruta) => {
    const { html } = pagina(ruta)
    const main = (html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/) || [])[1] || ''
    expect(h1(main)).not.toBe('')
    expect(html).not.toContain('<template id="B:')
    expect(html).not.toContain('<div hidden id="S:')
    expect(html).not.toContain('$RC(')
  })

  test('los h1 son distintos entre las seis páginas', () => {
    const titulos = paginas.map((p) => h1(p.html))
    expect(new Set(titulos).size).toBe(titulos.length)
  })
})

describe('022 CA3, CA4, CA11 · metadatos en el <head> de cada página', () => {
  test.each(RUTAS)('%s', (ruta) => {
    const { html, titulo, descripcion } = pagina(ruta)
    expect(html).toContain(`<title>${titulo}</title>`)
    expect(html.match(/<title>/g)).toHaveLength(1)
    expect(metaContenido(html, 'name', 'description')).toBe(descripcion)
    expect(enlace(html, 'canonical')).toBe(canonica(ruta))
    expect(html.match(/rel="canonical"/g)).toHaveLength(1)
    expect(metaContenido(html, 'property', 'og:title')).toBe(titulo)
    expect(metaContenido(html, 'property', 'og:description')).toBe(descripcion)
    expect(metaContenido(html, 'property', 'og:url')).toBe(canonica(ruta))
    expect(metaContenido(html, 'property', 'og:image')).toBe('https://sistema.dentissa.app/og-dentissa.jpg')
    expect(metaContenido(html, 'name', 'twitter:card')).toBe('summary_large_image')
    expect(html).not.toMatch(/name="robots" content="noindex/)
  })
})

describe('022 CA7 · los datos de la clínica solo van en la portada', () => {
  test('la portada lleva el JSON-LD de Dentist', () => {
    const { html } = pagina('/')
    const json = (html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1]
    expect(JSON.parse(json)['@type']).toBe('Dentist')
  })

  test('las demás páginas no lo llevan', () => {
    for (const p of paginas.filter((x) => x.ruta !== '/')) expect(p.html).not.toContain('application/ld+json')
  })
})

describe('022 CA8, A11 · app.html y 404.html no se indexan', () => {
  const app = construirPagina(PLANTILLA, { cuerpo: '', noindex: true })

  test('app.html lleva noindex sin canónica, Open Graph ni JSON-LD', () => {
    expect(app).toMatch(/<meta name="robots" content="noindex"/)
    expect(app).not.toMatch(/rel="canonical"/)
    expect(app).not.toMatch(/property="og:/)
    expect(app).not.toContain('application/ld+json')
  })

  test('404.html lleva noindex, sin canónica ni Open Graph, y trae "Página no encontrada"', async () => {
    const html = construirPagina(PLANTILLA, {
      cuerpo: await render('/no-existe'),
      noindex: true,
      titulo: 'Página no encontrada | Dentissa',
    })
    expect(html).toMatch(/<meta name="robots" content="noindex"/)
    expect(html).not.toMatch(/rel="canonical"/)
    expect(html).not.toMatch(/property="og:/)
    expect(html).not.toContain('application/ld+json')
    expect(html).toMatch(/Página no encontrada/)
  })
})

describe('022 R7, R10, R11, R16 · construirPagina es estricta y literal', () => {
  test('una plantilla sin <title> lanza un error', () => {
    const sinTitulo = PLANTILLA.replace(/<title>[\s\S]*?<\/title>/, '')
    expect(() => construirPagina(sinTitulo, { cuerpo: '<h1>x</h1>', ruta: '/nosotros' })).toThrow()
  })

  test('una plantilla sin meta description lanza un error', () => {
    const sinDescripcion = PLANTILLA.replace(/<meta name="description"[^>]*>/, '')
    expect(() => construirPagina(sinDescripcion, { cuerpo: '<h1>x</h1>', ruta: '/nosotros' })).toThrow()
  })

  test('los patrones $& y $\' del cuerpo y del título salen literales', () => {
    const html = construirPagina(PLANTILLA, {
      cuerpo: "<h1>a $& b $' c</h1>",
      noindex: true,
      titulo: 'T $& x',
    })
    expect(html).toContain("<div id=\"root\"><h1>a $& b $' c</h1></div>")
    expect(html).toContain('<title>T $&amp; x</title>')
  })

  test.each(RUTAS)('%s lleva og:image:alt', (ruta) => {
    expect(metaContenido(pagina(ruta).html, 'property', 'og:image:alt')).toBeTruthy()
  })
})

describe('022 CA10, TM1 · nada privado en lo que se genera', () => {
  test.each(RUTAS)('%s no contiene textos de login, panel ni portal', (ruta) => {
    expect(pagina(ruta).html).not.toMatch(TEXTOS_PRIVADOS)
  })
})

describe('022 CA1 · subconjunto de comprobaciones de Lighthouse SEO sobre el HTML', () => {
  test.each(RUTAS)('%s: idioma, viewport, alt e hipervínculos rastreables', (ruta) => {
    const { html } = pagina(ruta)
    expect(html).toMatch(/<html lang="es">/)
    expect(html).toMatch(/<meta name="viewport"/)
    for (const img of html.match(/<img\b[^>]*>/g) || []) expect(img).toMatch(/\salt="/)
    for (const a of html.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) || []) {
      const href = (a.match(/href="([^"]*)"/) || [])[1]
      expect(href, a).toBeTruthy()
      expect(href).not.toMatch(/^javascript:/)
      // Nombre accesible como lo calcula Lighthouse: texto, aria-label o alt de una imagen interna
      const texto = a.replace(/<[^>]+>/g, '').trim()
      const nombre = Boolean(texto) || /aria-label="[^"]+"/.test(a) || /<img\b[^>]*\salt="[^"]+"/.test(a)
      expect(nombre, a).toBe(true)
    }
  })
})

describe('022 A5, A16 · cada página enlaza el CSS de su chunk', () => {
  const MANIFIESTO = {
    'index.html': { file: 'assets/index-a.js', css: ['assets/index-a.css'], isEntry: true, dynamicImports: ['src/pages/About.jsx'] },
    'src/pages/About.jsx': { file: 'assets/About-b.js', css: ['assets/About-b.css'], isDynamicEntry: true, imports: ['_comun-c.js'] },
    '_comun-c.js': { file: 'assets/comun-c.js', css: ['assets/comun-c.css'] },
  }

  test('estilosDeRuta devuelve el CSS del módulo y el de sus importaciones', () => {
    expect(estilosDeRuta(MANIFIESTO, 'src/pages/About.jsx')).toEqual(['/assets/About-b.css', '/assets/comun-c.css'])
  })

  test('construirPagina enlaza esos estilos en el <head>', () => {
    const html = construirPagina(PLANTILLA, {
      cuerpo: '<h1>x</h1>',
      ruta: '/nosotros',
      css: estilosDeRuta(MANIFIESTO, 'src/pages/About.jsx'),
    })
    expect(html).toMatch(/<link rel="stylesheet" href="\/assets\/About-b\.css">[\s\S]*<\/head>/)
  })

  test('las páginas con chunk propio declaran su módulo en la tabla', () => {
    const modulos = Object.fromEntries(RUTAS_PUBLICAS.map((r) => [r.ruta, r.modulo]))
    expect(modulos['/nosotros']).toBe('src/pages/About.jsx')
    expect(modulos['/galeria']).toBe('src/pages/Gallery.jsx')
    expect(modulos['/contacto']).toBe('src/pages/Contact.jsx')
  })
})

// ── Spec 023 · CA2, CA3, CA6, CA7, CA8 y TM1: lo que el navegador recibe sin esperar a la app ──
describe('023 CA7, CA8 · sin servicios externos al cargar', () => {
  test.each(RUTAS)('%s no referencia hosts prohibidos', (ruta) => {
    expect(hostsProhibidos(pagina(ruta).html)).toEqual([])
  })
})

describe('023 CA3 · la foto principal de la portada no espera a la app', () => {
  test('su contenedor lleva is-priority y no is-loading', () => {
    const clases = (pagina('/').html.match(/<div class="(smart-img[^"]*hero__image[^"]*)"/) || [])[1]
    expect(clases, 'contenedor de la foto de portada').toBeTruthy()
    expect(clases.split(/\s+/)).toContain('is-priority')
    expect(clases.split(/\s+/)).not.toContain('is-loading')
  })
})

describe('023 CA2, CA7 · la foto de nosotros es propia y no se retrasa', () => {
  test('se carga sin demora y con variantes locales', () => {
    const img = (pagina('/nosotros').html.match(/<img[^>]*alt="Instalaciones de la clínica Dentissa"[^>]*>/) || [])[0]
    expect(img, 'foto de nosotros').toBeTruthy()
    expect(img).toMatch(/loading="eager"/)
    expect(img).toMatch(/srcSet="[^"]*\/images\/nosotros-\d+\.webp/i)
  })
})

describe('023 CA6 · contacto llega sin el mapa', () => {
  test('no hay iframe y sí el enlace "Ver mapa"', () => {
    const { html } = pagina('/contacto')
    expect(html).not.toMatch(/<iframe/)
    expect(html).toMatch(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*Ver mapa(?:(?!<\/a>)[\s\S])*<\/a>/)
  })
})

describe('023 CA5, TM1 · el login prerenderizado', () => {
  const login = async () => paginaLogin(PLANTILLA, { cuerpo: await render('/login') })

  test('lleva noindex, su título y el formulario de acceso', async () => {
    const html = await login()
    expect(html).toMatch(/<meta name="robots" content="noindex"/)
    expect(html).toContain(`<title>${TITULO_LOGIN}</title>`)
    expect(html).toMatch(/id="login-correo"/)
  })

  test('no lleva canónica, Open Graph ni JSON-LD, ni hosts prohibidos', async () => {
    const html = await login()
    expect(html).not.toMatch(/rel="canonical"/)
    expect(html).not.toMatch(/property="og:/)
    expect(html).not.toContain('application/ld+json')
    expect(hostsProhibidos(html)).toEqual([])
  })

  test('no contiene datos de sesión', async () => {
    expect(datosDeSesion(await login())).toEqual([])
  })
})

describe('023 CA1, CA2 · precargas de la fuente y la foto principal', () => {
  const FUENTE = { href: '/assets/plus-jakarta-sans-latin-wght-normal-x.woff2', as: 'font', type: 'font/woff2' }
  const FOTO = { href: '/images/nosotros-900.webp', as: 'image', srcset: '/images/nosotros-600.webp 600w, /images/nosotros-900.webp 900w', sizes: '100vw' }
  const posicion = (html, patron) => html.search(patron)

  test('construirPagina precarga la fuente (crossorigin) y la foto (fetchpriority alta), antes de las hojas de estilo', () => {
    const html = construirPagina(PLANTILLA, {
      cuerpo: '<h1>x</h1>',
      ruta: '/nosotros',
      css: ['/assets/About-x.css'],
      precargas: [FUENTE, FOTO],
    })
    const fuente = /<link rel="preload" href="\/assets\/plus-jakarta-sans-latin-wght-normal-x\.woff2" as="font" type="font\/woff2" crossorigin>/
    const foto = /<link rel="preload" href="\/images\/nosotros-900\.webp" as="image" fetchpriority="high" imagesrcset="\/images\/nosotros-600\.webp 600w, \/images\/nosotros-900\.webp 900w" imagesizes="100vw">/
    expect(html).toMatch(fuente)
    expect(html).toMatch(foto)
    expect(posicion(html, fuente)).toBeLessThan(posicion(html, /<link rel="stylesheet" href="\/assets\/About-x\.css">/))
  })

  test('paginaLogin también escribe sus precargas', () => {
    const html = paginaLogin(PLANTILLA, { cuerpo: '<form id="login-correo"></form>', precargas: [{ ...FUENTE, href: '/assets/jost-latin-wght-normal-x.woff2' }] })
    expect(html).toMatch(/<link rel="preload" href="\/assets\/jost-latin-wght-normal-x\.woff2" as="font" type="font\/woff2" crossorigin>/)
  })

  test('los atributos de las precargas salen escapados', () => {
    const html = construirPagina(PLANTILLA, { cuerpo: '<h1>x</h1>', ruta: '/', precargas: [{ href: '/a"b.webp', as: 'image' }] })
    expect(html).toContain('href="/a&quot;b.webp"')
  })
})
