// @vitest-environment node
// Spec 022 · CA1, CA2, CA3, CA4, CA7, CA8, CA10, CA11 y TM1/TM2: lo que recibe el rastreador.
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { render } from '../src/entry-prerender.jsx'
import { construirPagina, estilosDeRuta } from '../src/seo/cabecera.js'
import { RUTAS_PUBLICAS, canonica } from '../src/seo/rutas.js'

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

describe('022 CA10, TM1 · nada privado en lo que se genera', () => {
  test.each(RUTAS)('%s no contiene textos de login, panel ni portal', (ruta) => {
    expect(pagina(ruta).html).not.toMatch(TEXTOS_PRIVADOS)
  })
})

describe('022 CA1 · comprobaciones de Lighthouse SEO sobre el HTML', () => {
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
