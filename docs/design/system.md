---
status: draft            # draft | approved (solo el usuario aprueba)
source: extracted
version: 1.0.0
extracted_with: 1.19.0
html: docs/design/system.html
canvas: null
widths: [390, 1440]
created: 2026-11-08
updated: 2026-11-08
---

# Sistema de diseño de Dentissa

Fuente de verdad visual del proyecto. Toda pantalla nueva o modificada usa estos tokens y
componentes; un valor que no esté aquí se añade primero aquí. Vista: [system.html](system.html).

## Dirección

Sistema extraído del código el 2026-11-08, **sin capturas** por decisión del usuario: documenta lo
declarado en el CSS, no lo medido en el navegador. Marca: Dentissa es la clínica y Melissa López N.
Odontología Integral, la marca de la odontóloga; ambos nombres son intencionales (confirmado por el usuario, 2026-11-08).

## Color

| Token | Valor | Uso | Contraste sobre su fondo |
|---|---|---|---|
| `--color-bg` | `#ffffff` | Fondo base (`--bg`) | — |
| `--color-surface` | `#fff7f8` | Fondo de sección tintado (`--tint`) | — |
| `--color-text` | `#0f172a` | Texto principal (`--ink`) | 17.85:1 sobre --color-bg |
| `--color-text-muted` | `#64748b` | Texto secundario (`--muted`) | 4.76:1 sobre --color-bg; 4.51:1 sobre --color-surface |
| `--color-primary` | `#d75078` | Acción principal, sitio y login (`--primary`) | — |
| `--color-on-primary` | `#ffffff` | Texto sobre la acción principal | 3.96:1 sobre --color-primary (**no cumple**, DS4) |
| `--color-border` | `#e2e8f0` | Bordes y separadores (`--line`) | 1.23:1 sobre --color-bg (**no cumple** en controles, DS6) |
| `--color-focus` | `#c7446a` | Anillo de foco (`--primary-600`) | 4.70:1 sobre --color-bg |
| `--color-danger` | `#e11d48` | Errores (`--danger`) | 4.70:1 sobre --color-bg |
| `--color-success` | `#047857` | Confirmaciones, valor literal sin token | 5.48:1 sobre --color-bg |

No hay token ni color de aviso (`warning`). Variantes de marca: `--primary-700 #b63d62`,
`--primary-50 #fff4f6`, `--primary-100 #fce1e7`, `--warm #f2b0a6`. Secundario: `--ink-2 #334155`
(10.35:1). En el panel se usa además el rosa `#e94b6a` (DS1). Contrastes calculados de los valores
declarados. Modo oscuro: no aplica.

## Tipografía

| Token | Familia | Pesos | Uso |
|---|---|---|---|
| `--font-sans` | Plus Jakarta Sans, system-ui, sans-serif | 400–800 | Sitio, panel y portal |
| `--font-login` | Jost Variable | variable | Login y restablecer contraseña |
| `--font-mono` | no aplica | — | — |

| Nivel | Móvil | Escritorio | Interlineado |
|---|---|---|---|
| Títulos `h1`–`h4` | no tokenizado | no tokenizado | 1.15, `letter-spacing: -0.02em` |
| Cuerpo | 16px | 16px | 1.6 |
| Botón | 15px | 15px | 1 |

No hay escala tokenizada: se mezclan px y rem; los más frecuentes son 15px, 14px, 16px y 0.85rem.
Fuentes: Plus Jakarta Sans desde Google Fonts, Jost autoalojada con `@fontsource-variable/jost` (DS8).

## Modo de los tokens

Los tamaños son `fijo`, salvo `--gutter`, `--section-y` y `--nav-h`, que son fluidos con `clamp()`.

## Espaciado, radios, bordes y sombras

- Escala de espaciado: no hay.
- Margen lateral de pantalla: `--gutter` = `clamp(16px, 4vw, 32px)`.
- Contenedor: `--container` 1200px. Sección: `--section-y` `clamp(64px, 9vw, 112px)`.
- Radios: `--radius-sm` 10px · `--radius` 16px · `--radius-lg` 24px; solo los usa `global.css`.
- Bordes: 1px. Sombras: `--shadow-sm`, `--shadow`, `--shadow-lg`.
- Objetivo de toque mínimo: sin token; 44–48px en campos y 46px en botones (DS9).

## Componentes

Descritos desde el código; sin recortes porque no hay capturas.

### Botón
Público `.dt-btn`: `primary`, `ghost`, `light`, `outline-light`, `whatsapp`, `sm`, `lg`, `block`. Altura 46px, `sm` 38px, `lg` 54px. Hover, activo y foco; sin `:disabled` (DS10). En modales, `.mf-btn` con primaria, secundaria y peligro, y `:disabled`.

### Campo de formulario
Estilos por pantalla, sin componente común; altura 44–48px. Los errores de los modales usan `<p role="alert">`.

### Lista o tarjeta
`TablaCitas`, `CalendarioMes`, `FiltrosCard` y `EncabezadoModulo` en el panel; `SectionHeader` y `PageHero` en el sitio.

### Aviso, diálogo y mensajes
`ModalFormulario`: `role="dialog"`, `aria-modal`, cierra con Escape y clic en el fondo, bloquea el scroll y enfoca el primer campo; sin trampa de foco (DS10). `ModalConfirmacion` lo envuelve.

### Estados de pantalla
`EmptyState` con reintento en el sitio; `PageLoader` con `role="status"`. El panel y el portal usan texto propio en cada página (DS11).

### Componentes exclusivos
| Componente | Pantalla o sección | Spec |
|---|---|---|
| `CalendarioMes` | Citas del personal | 006 |

## Iconografía

`react-icons` (`Fa*`) e `Icon.jsx` propio, en línea. Sin tokens de tamaño.

## Movimiento

| Token | Valor | Uso |
|---|---|---|
| `--ease` | `cubic-bezier(0.22, 1, 0.36, 1)` | Transiciones del sitio |
| sin token | 200ms | Botones |
| sin token | 500–600ms | Revelados |

Seis hojas de estilo incluyen `prefers-reduced-motion: reduce`.

## Marca en el navegador y al compartir

### Íconos

| Archivo | Tamaño | Origen | Estado |
|---|---|---|---|
| `favicon.jpeg` | no medido | `frontend/public/` | enlazado; JPEG (DS12) |
| `favicon.svg` | — | — | no existe (DS12) |
| `apple-touch-icon.png` | — | — | no existe (DS12) |

`theme-color`: `#0f766e`, ajeno a la paleta (DS7). Logos: `logo-melissa-blanco.png`, `logo-melissa-diente.png`, `logo_pequeno.jpeg`, `logo_textual.jpeg`.

### Tarjeta para compartir

No existe imagen Open Graph (SE5). Diseñarla es una spec propia.

## Pantallas principales

Sin capturas por decisión del usuario; ver el inventario.

## Inventario de vistas

| Vista | Ruta / plantilla | Rol | Capturas | Estado |
|---|---|---|---|---|
| Inicio | `/` · `Home` | público | — | sin captura (decisión del usuario) |
| Nosotros | `/nosotros` · `About` | público | — | sin captura (decisión del usuario) |
| Galería | `/galeria` · `Gallery` | público | — | sin captura (decisión del usuario) |
| Contacto | `/contacto` · `Contact` | público | — | sin captura (decisión del usuario) |
| Aviso de privacidad | `/aviso-de-privacidad` · `Legal` | público | — | sin captura (decisión del usuario) |
| Términos de servicio | `/terminos-de-servicio` · `Legal` | público | — | sin captura (decisión del usuario) |
| No encontrada | `*` · `NotFound` | público | — | sin captura (decisión del usuario) |
| Inicio de sesión | `/login` · `login` | público | — | sin captura (decisión del usuario) |
| Restablecer contraseña | `/restablecer-contrasena` | público | — | sin captura (decisión del usuario) |
| Panel: inicio | `/admin` · `AdminInicio` | personal | — | sin captura (decisión del usuario) |
| Panel: usuarios | `/admin/usuarios` | personal | — | sin captura (decisión del usuario) |
| Panel: citas | `/admin/citas` | personal | — | sin captura (decisión del usuario) |
| Panel: servicios | `/admin/servicios` | personal | — | sin captura (decisión del usuario) |
| Panel: historial | `/admin/historial` | personal | — | sin captura (decisión del usuario) |
| Panel: historial de paciente | `/admin/historial/:idPaciente` | personal | — | sin captura (decisión del usuario) |
| Panel: promociones | `/admin/promociones` | personal | — | sin captura (decisión del usuario) |
| Panel: comentarios | `/admin/comentarios` | personal | — | sin captura (decisión del usuario) |
| Panel: preguntas frecuentes | `/admin/faqs` | personal | — | sin captura (decisión del usuario) |
| Panel: galería | `/admin/galeria` | personal | — | sin captura (decisión del usuario) |
| Panel: reportes | `/admin/reportes` | personal | — | sin captura (decisión del usuario) |
| Completar perfil | `/paciente/completar-perfil` | paciente | — | sin captura (decisión del usuario) |
| Portal: inicio | `/paciente` · `InicioPaciente` | paciente | — | sin captura (decisión del usuario) |
| Portal: citas | `/paciente/citaspaciente` | paciente | — | sin captura (decisión del usuario) |
| Portal: perfil | `/paciente/perfil` | paciente | — | sin captura (decisión del usuario) |

## Reglas de uso

- Colores semánticos siempre acompañados de texto.
- Una acción principal por pantalla.
- Ningún valor literal de color, tamaño o espaciado fuera de los tokens en pantallas nuevas o modificadas (constitución P20).

## Deuda de diseño

Lo que el código hace hoy y no cumple este sistema o las pautas de accesibilidad. No bloquea el
código previo; se corrige cuando una spec toca la pantalla o como objetivo del roadmap.

| ID | Problema | Dónde (evidencia) | Corrección propuesta | Estado |
|---|---|---|---|---|
| DS1 | Dos rosas de marca: `#d75078` y `#e94b6a` (43 usos) | `global.css:5`, `sidebar.css:4`, `adminpanel.css:1569` | Unificar en un token | pendiente |
| DS2 | Colores literales: 263 en el panel y más de 200 en el resto | `adminpanel.css` y otras 14 hojas | Sustituir por tokens al tocar cada pantalla | pendiente |
| DS3 | Paletas paralelas; `--rosa` con tres valores; `--durazno` y `--gris` sin uso | `login.css:4-14`, `restablecerContrasena.css:7-10`, `sidebar.css:4-10` | Consolidar en `global.css` | pendiente |
| DS4 | Texto blanco sobre el rosa principal: 3.96:1 con `#d75078` y 3.70:1 con `#e94b6a` | `.dt-btn--primary`, panel | Oscurecer el fondo de los botones | pendiente |
| DS5 | Rojo de error `#e63946` (4.17:1, 11 usos) distinto de `--danger` | hojas del panel | Usar `--danger` | pendiente |
| DS6 | Borde de campo a 1.23:1 sobre blanco | `--line` en campos | Token de borde de control ≥ 3:1 | pendiente |
| DS7 | `theme-color` ajeno a la paleta | `frontend/index.html:8` | Usar un color de la marca | pendiente |
| DS8 | Dos familias, una externa, y `Arial` en una pantalla | `index.html:15`, `main.jsx:5`, `CompletarPerfil.css:9` | Una familia autoalojada | pendiente |
| DS9 | Controles sin mínimo común; `.dt-btn--sm` de 38px | `global.css:150` y hojas por pantalla | Token de toque de 44px | pendiente |
| DS10 | Modal sin trampa de foco; `.dt-btn` sin `:disabled` | `ModalFormulario.jsx`, `global.css:145-215` | Añadirlos | pendiente |
| DS11 | Estados de carga y error sin componente común en panel y portal | `pages/admin`, `pages/paciente` | Reutilizar un componente | pendiente |
| DS12 | Favicon solo en JPEG, sin íconos PNG/SVG; restos `vite.svg`, `react.svg` y CSS vacíos | `frontend/public/`, `src/assets/`, `src/App.css`, `src/index.css` | Generar los íconos y limpiar | pendiente |

## Decisiones

| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-08 | diseño | ¿Documentar el diseño existente? | Sí, sin cambiar código | usuario |
| 2026-11-08 | diseño | ¿Capturas de las vistas con API simulada? | Sin capturas | usuario |
| 2026-11-08 | brecha | ¿Dentissa o Melissa López N.? | Ambos son intencionales | usuario |
