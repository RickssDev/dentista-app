// Spec 029 · CA2, CA4, CA5, CA6, CA9, P16, P20: el panel de la galería muestra «N de 15 imágenes»,
// con 15 deja «Nueva imagen» no disponible con un aviso que se anuncia, muestra el rechazo del
// servidor y no cambia la galería pública. La API va simulada con una galería en memoria.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const LLENA = 'La galería admite como máximo 15 imágenes. Elimina una para agregar otra.'
const AVISO = 'Llegaste al máximo de 15 imágenes. Elimina una para agregar otra.'

const sim = vi.hoisted(() => ({ galeria: [], errorAlCrear: null, falloLista: false }))

const crear = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id_imagen: i + 1,
    titulo: `Imagen ${i + 1}`,
    imagen: `/uploads/${i + 1}.jpg`,
    fecha_publicada: '2026-11-01T10:00:00',
    visible: i % 2 === 0 ? 1 : 0,
  }))

vi.mock('../src/services/api', () => ({
  api: vi.fn(async (ruta, metodo = 'GET') => {
    if (ruta === '/imagenes' && metodo === 'GET') {
      if (sim.falloLista) throw new Error('Error interno del servidor')
      return { payload: sim.galeria.map((g) => ({ ...g })) }
    }
    if (ruta === '/imagenes' && metodo === 'POST') {
      if (sim.errorAlCrear) throw new Error(sim.errorAlCrear)
      const id = sim.galeria.length + 100
      sim.galeria.push({ id_imagen: id, titulo: 'Nueva', imagen: '/uploads/n.jpg', fecha_publicada: null, visible: 1 })
      return { payload: id }
    }
    const borrar = /^\/imagenes\/(\d+)$/.exec(ruta)
    if (borrar && metodo === 'DELETE') {
      sim.galeria = sim.galeria.filter((g) => g.id_imagen !== Number(borrar[1]))
      return { payload: null }
    }
    return { payload: null }
  }),
  getImageUrl: (ruta) => ruta,
}))

// La página pública lee sus datos con este hook (CA9)
const publica = vi.hoisted(() => ({ data: [] }))
vi.mock('../src/hooks/usePublicData', () => ({
  usePublicData: () => ({ data: publica.data, loading: false, error: null, retry: () => {} }),
}))

import { api } from '../src/services/api'
import AdminImagenes from '../src/pages/admin/Admingaleria.jsx'
import Gallery from '../src/pages/Gallery.jsx'
import { MAX_IMAGENES_GALERIA } from '../src/utils/limitesGaleria.js'

beforeEach(() => {
  sim.galeria = []
  sim.errorAlCrear = null
  sim.falloLista = false
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

const montarPanel = async (n) => {
  sim.galeria = crear(n)
  render(<AdminImagenes />)
  // Espera a que llegue la lista (la primera tarjeta en pantalla)
  if (n > 0) await screen.findByText('Imagen 1')
  else await waitFor(() => expect(api).toHaveBeenCalled())
}

const botonNueva = () => screen.getByRole('button', { name: /Nueva imagen/ })
const descripcionAccesible = (el) => {
  const ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean)
  return ids.map((id) => document.getElementById(id)?.textContent?.trim() ?? '').join(' ')
}
const pedidasDeLista = () =>
  api.mock.calls.filter(([ruta, metodo]) => ruta === '/imagenes' && (metodo ?? 'GET') === 'GET').length

describe('029 · CA5 contador', () => {
  test('con 3: «3 de 15 imágenes» y el botón disponible', async () => {
    await montarPanel(3)
    expect(screen.getByText('3 de 15 imágenes')).toBeTruthy()
    expect(botonNueva().getAttribute('aria-disabled')).not.toBe('true')
    expect(screen.queryByText(AVISO)).toBeNull()
  })

  test('agregar con 14 pasa a «15 de 15», y eliminar una vuelve a «14 de 15» y reactiva el botón (CA4)', async () => {
    await montarPanel(14)
    expect(screen.getByText('14 de 15 imágenes')).toBeTruthy()

    fireEvent.click(botonNueva())
    const dialogo = await screen.findByRole('dialog')
    fireEvent.change(within(dialogo).getByLabelText('Título'), { target: { value: 'Nueva' } })
    const archivo = new File(['x'], 'nueva.jpg', { type: 'image/jpeg' })
    fireEvent.change(dialogo.querySelector('input[type=file]'), { target: { files: [archivo] } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Crear imagen' }))

    await screen.findByText('15 de 15 imágenes')
    expect(botonNueva().getAttribute('aria-disabled')).toBe('true')

    fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar imagen' })[0])
    const confirmacion = await screen.findByRole('dialog')
    fireEvent.click(within(confirmacion).getByRole('button', { name: 'Eliminar' }))

    await screen.findByText('14 de 15 imágenes')
    expect(botonNueva().getAttribute('aria-disabled')).not.toBe('true')
  })

  test('si la lista no carga: ni contador ni aviso, y el botón como hoy (A16)', async () => {
    sim.falloLista = true
    render(<AdminImagenes />)
    await waitFor(() => expect(pedidasDeLista()).toBe(1))

    expect(screen.queryByText(/de 15 imágenes/)).toBeNull()
    expect(screen.queryByText(AVISO)).toBeNull()
    expect(botonNueva().getAttribute('aria-disabled')).not.toBe('true')
  })
})

describe('029 · CA6 galería llena', () => {
  test('con 15: botón con aria-disabled, descrito por el aviso, el aviso con role=status y el clic no abre el diálogo', async () => {
    await montarPanel(15)
    expect(screen.getByText('15 de 15 imágenes')).toBeTruthy()

    const boton = botonNueva()
    expect(boton.getAttribute('aria-disabled')).toBe('true')
    expect(boton.hasAttribute('disabled')).toBe(false)
    expect(descripcionAccesible(boton)).toBe(AVISO)

    const aviso = screen.getByRole('status')
    expect(aviso.textContent.trim()).toBe(AVISO)

    fireEvent.click(boton)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('029 · CA2 rechazo del servidor', () => {
  test('un 409 al guardar sale en el role=alert del modal y se vuelve a pedir la lista', async () => {
    await montarPanel(14)
    sim.errorAlCrear = LLENA
    const antes = pedidasDeLista()

    fireEvent.click(botonNueva())
    const dialogo = await screen.findByRole('dialog')
    fireEvent.change(within(dialogo).getByLabelText('Título'), { target: { value: 'Otra' } })
    const archivo = new File(['x'], 'otra.jpg', { type: 'image/jpeg' })
    fireEvent.change(dialogo.querySelector('input[type=file]'), { target: { files: [archivo] } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Crear imagen' }))

    const alerta = await within(dialogo).findByRole('alert')
    expect(alerta.textContent).toBe(LLENA)
    await waitFor(() => expect(pedidasDeLista()).toBeGreaterThan(antes))
  })
})

describe('029 · CA9 la galería pública no cambia', () => {
  test('con 15 imágenes visibles no muestra el límite', () => {
    publica.data = crear(15).map((g) => ({ ...g, visible: 1 }))
    render(
      <MemoryRouter>
        <Gallery />
      </MemoryRouter>,
    )
    // «Mostrando 12 de 15» es la paginación de hoy; lo que no debe aparecer es el contador del panel
    expect(document.body.textContent).not.toMatch(/de 15 imágenes/)
    expect(document.body.textContent).not.toContain(AVISO)
  })
})

describe('029 · P16, P20 y constante compartida', () => {
  const GLOBAL = readFileSync(join(process.cwd(), 'src/styles/home/global.css'), 'utf8')
  const PANEL = readFileSync(join(process.cwd(), 'src/styles/adminpanel.css'), 'utf8')
  const token = (nombre) => (GLOBAL.match(new RegExp(`--${nombre}:\\s*(#[0-9a-fA-F]{6})`)) || [])[1]

  const luminancia = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
  }
  const contraste = (a, b) => {
    const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
    return (l1 + 0.05) / (l2 + 0.05)
  }

  test('contraste del aviso (--ink-2 sobre --primary-50) y del contador (--muted sobre blanco) ≥ 4,5:1', () => {
    expect(token('ink-2')).toBeDefined()
    expect(token('primary-50')).toBeDefined()
    expect(contraste(token('ink-2'), token('primary-50'))).toBeGreaterThanOrEqual(4.5)
    expect(contraste(token('muted'), '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })

  // Cuerpo de la regla de un selector exacto en adminpanel.css
  const regla = (css, selector) => {
    const escapado = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return (new RegExp(`(^|\\n)\\s*${escapado}\\s*\\{([^}]*)\\}`).exec(css) || [])[2]
  }
  const LITERAL = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/
  // P20 (review R3): tampoco espaciados, radios, sombras ni duraciones con unidad. Se admiten `0`
  // (sin unidad) y el `1px` de los bordes que documenta system.md; lo que va en var(...) es token.
  const MEDIDA = /(?<![\w.-])\d*\.?\d+(px|rem|em|ms|s)\b/g
  const medidasLiterales = (cuerpo) =>
    cuerpo.split(';').flatMap((declaracion) => {
      const [propiedad, ...resto] = declaracion.split(':')
      const valor = resto.join(':').replace(/var\([^)]*\)/g, '')
      const nombre = (propiedad || '').trim()
      return (valor.match(MEDIDA) || []).filter((m) => !(m === '1px' && nombre.startsWith('border')))
    })

  test('control positivo: el patrón detecta un literal de ejemplo', () => {
    const ejemplo = '.ejemplo { color: #5b6472; }'
    expect(regla(ejemplo, '.ejemplo')).toBeDefined()
    expect(regla(ejemplo, '.ejemplo')).toMatch(LITERAL)
  })

  test('control positivo: detecta espaciados, radios y duraciones literales, y admite el borde de 1px y los tokens', () => {
    const ejemplo = '.ejemplo { margin: 12px 0; border-radius: .5rem; transition: opacity 200ms; border: 1px solid var(--line); padding: var(--space-3) var(--space-4); }'
    expect(medidasLiterales(regla(ejemplo, '.ejemplo'))).toEqual(['12px', '.5rem', '200ms'])
  })

  test.each(['.encabezado-detalle', '.encabezado-btn[aria-disabled="true"]', '.aviso-panel'])(
    'la regla %s existe y no tiene colores ni medidas literales (A4, R3)',
    (selector) => {
      const cuerpo = regla(PANEL, selector)
      expect(cuerpo, `falta la regla ${selector}`).toBeDefined()
      expect(cuerpo).not.toMatch(LITERAL)
      expect(medidasLiterales(cuerpo)).toEqual([])
    },
  )

  // Review R11: el botón no disponible no se oscurece al pasar el ratón como si se pudiera usar
  test('ninguna regla :hover de .encabezado-btn se aplica al botón con aria-disabled', () => {
    const selectores = [...PANEL.matchAll(/(^|\n)([^{}\n]*\.encabezado-btn[^{}\n]*:hover[^{}\n]*)\{/g)]
      .flatMap((m) => m[2].split(',').map((s) => s.trim()))
      .filter((s) => /\.encabezado-btn/.test(s) && /:hover/.test(s))
    expect(selectores.length).toBeGreaterThan(0)
    for (const selector of selectores) {
      expect(selector, `${selector} también afecta al botón no disponible`).toMatch(/:not\(\[aria-disabled="true"\]\)/)
    }
  })

  test('el límite del frontend coincide con el del backend', () => {
    const backend = readFileSync(join(process.cwd(), '../backend/src/modules/images/images.limites.js'), 'utf8')
    const valor = Number((backend.match(/MAX_IMAGENES_GALERIA\s*=\s*(\d+)/) || [])[1])
    expect(valor).toBe(15)
    expect(MAX_IMAGENES_GALERIA).toBe(valor)
  })
})
