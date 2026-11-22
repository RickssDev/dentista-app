// @vitest-environment node
// Spec 025 · CA1, CA4, CA5, CA6: la imagen del frontend corre sin root en el puerto 80 y sus piezas
// base van con versión exacta y digest. Lee el Dockerfile; lo que pasa dentro del contenedor lo
// comprueba scripts/probar-nginx.mjs.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
// Una instrucción por elemento, con el número de su primera línea en el archivo: se unen las
// continuaciones (\ al final) y se ignoran los comentarios
const DOCKERFILE = readFileSync(join(RAIZ, 'Dockerfile'), 'utf8')
  .split(/\r?\n/)
  .reduce((acc, texto, i) => {
    const abierta = acc.at(-1)?.continua
    if (abierta) acc.at(-1).texto += ` ${texto.trim()}`
    else if (!/^\s*(#|$)/.test(texto)) acc.push({ linea: i + 1, texto: texto.trim() })
    if (acc.length) acc.at(-1).continua = /\\\s*$/.test(texto) && !/^\s*#/.test(texto)
    if (acc.length) acc.at(-1).texto = acc.at(-1).texto.replace(/\s*\\$/, '')
    return acc
  }, [])

const instrucciones = (nombre) => DOCKERFILE.filter(({ texto }) => new RegExp(`^${nombre}\\s`, 'i').test(texto))

// nombre:X.Y.Z-variante@sha256:<64 hex>, con alias de etapa opcional
const FIJADA = /^FROM\s+[a-z0-9._/-]+:\d+\.\d+\.\d+-[a-z0-9.]+@sha256:[0-9a-f]{64}(\s+AS\s+\S+)?$/i

const FROMS = instrucciones('FROM')
const inicioFinal = FROMS.at(-1)?.linea ?? 0
const etapaFinal = (nombre) => instrucciones(nombre).filter(({ linea }) => linea > inicioFinal)

describe('025 · imagen del frontend', () => {
  test('el Dockerfile tiene etapa de build y etapa final', () => {
    expect(FROMS.length).toBeGreaterThanOrEqual(2)
  })

  test('cada FROM fija una versión exacta con digest (CA6)', () => {
    const sinFijar = FROMS.filter(({ texto }) => !FIJADA.test(texto)).map(({ linea, texto }) => `línea ${linea}: ${texto}`)
    expect(sinFijar, 'FROM sin versión exacta y digest').toEqual([])
  })

  test('la etapa final termina con un usuario que no es root (CA1, CA5)', () => {
    const usuarios = etapaFinal('USER').map(({ texto }) => texto.split(/\s+/)[1])
    expect(usuarios.length, 'la etapa final no declara USER').toBeGreaterThan(0)
    expect(usuarios.at(-1), 'el último USER de la etapa final').not.toMatch(/^(root|0)(:|$)/)
    expect(usuarios.filter((u) => /^(root|0)(:|$)/.test(u)), 'USER root en la etapa final').toEqual([])
  })

  test('el contenedor sigue en el puerto 80 (CA4)', () => {
    expect(etapaFinal('EXPOSE').map(({ texto }) => texto)).toContain('EXPOSE 80')
  })
})
