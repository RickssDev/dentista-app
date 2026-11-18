// @vitest-environment node
// Spec 022 · CA7, TM3: datos de la clínica para los buscadores (JSON-LD Dentist).
import { describe, expect, test } from 'vitest'
import { CLINIC, HOURS } from '../src/data/site.js'
import { generarNegocioLocal, serializarJsonLd } from '../src/seo/negocioLocal.js'

describe('022 CA7 · negocio local', () => {
  const datos = generarNegocioLocal()

  test('el JSON-LD es JSON válido', () => {
    expect(JSON.parse(serializarJsonLd(datos))).toEqual(datos)
  })

  test('Dentist con nombre, URL, imagen y teléfono desde site.js', () => {
    expect(datos['@context']).toBe('https://schema.org')
    expect(datos['@type']).toBe('Dentist')
    expect(datos.name).toBe(CLINIC.name)
    expect(datos.url).toBe('https://sistema.dentissa.app/')
    expect(datos.image).toMatch(/^https:\/\/sistema\.dentissa\.app\/.+\.(jpg|png|webp)$/)
    expect(datos.telephone).toBe(CLINIC.phone)
  })

  test('dirección PostalAddress con los campos de site.js que existen', () => {
    expect(datos.address).toEqual({
      '@type': 'PostalAddress',
      addressLocality: 'Lázaro Cárdenas',
      addressRegion: 'Michoacán',
      addressCountry: 'MX',
    })
  })

  test('con calle y código postal, se publican también', () => {
    const conCalle = { ...CLINIC, direccion: { ...CLINIC.direccion, calle: 'Calle 1', codigoPostal: '60950' } }
    expect(generarNegocioLocal(conCalle).address).toMatchObject({ streetAddress: 'Calle 1', postalCode: '60950' })
  })

  test('horario: lunes a viernes 08:00–16:00, sábado 08:00–14:00 y domingo sin horario', () => {
    expect(datos.openingHoursSpecification).toEqual([
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '16:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '08:00', closes: '14:00' },
    ])
  })

  test('un horario que no se puede interpretar lanza un error en lugar de publicarlo', () => {
    const raro = [...HOURS.slice(0, 1).map((h) => ({ ...h, time: 'de 8 a 4' })), ...HOURS.slice(1)]
    expect(() => generarNegocioLocal(CLINIC, raro)).toThrow(/horario/i)
  })
})

describe('022 TM3 · el JSON-LD no puede cerrar la etiqueta script', () => {
  test('un valor con </script> sale escapado', () => {
    const texto = serializarJsonLd({ name: 'Dentissa</script><script>alert(1)</script>' })
    expect(texto).not.toMatch(/<\/script/i)
    expect(texto).toContain(String.fromCharCode(92) + "u003c/script")
    expect(JSON.parse(texto).name).toBe('Dentissa</script><script>alert(1)</script>')
  })
})
