---
spec: 023-rendimiento-sitio
status: approved         # draft | approved (solo el usuario aprueba)
exploration: none
threshold: 80
floor: 3
budget: 3
accepted: none
score: 0
system_version: 1.0.0
created: 2026-11-17
updated: 2026-11-17  # refinado por /analyze A1, A21, A23
---

# Diseño · 023 Rendimiento del sitio público y el login

Hecho con `/design-spec 023` sobre `docs/design/system.md`. Los criterios están en la spec
("Criterios de diseño"). No hay candidatos: ver Resultado.

## Candidatos

Ninguno: sin ciclo por decisión del usuario (ver Decisiones).

## Resultado

**Sin diseño nuevo.** Lo único visible que cambia es el estado inicial del bloque del mapa en
`/contacto`. Se compone solo con piezas que el sistema ya tiene:
- el contenedor `.map`, con el mismo tamaño, borde y radio;
- los botones `.dt-btn`;
- el ícono `pin` de `Icon.jsx`;
- para "Ver mapa", un token que ya existe (`--primary-700`) para cumplir el contraste.

No hay pantalla ni sección nueva. El ciclo de candidatos no se hizo por dos motivos:
- en el equipo no hay Playwright para `evaluate.mjs`;
- la puerta de contraste fallaría en cualquier candidato por la deuda previa DS4 del botón principal
  del resto de la página (el bloque nuevo sí cumple: ver Accesibilidad).

Los criterios K1–K3 se comprueban en la tarea que construye el bloque, con tests y con capturas a 390
y 1440 px que revisa el usuario.

| Criterio | Objetivo | Cómo se comprueba | |
|---|---|---|---|
| K1 · "Ver mapa" visible y accionable (CA6) | visible a 390 y 1440 px; toque ≥ 44 × 44 px; contraste ≥ 4,5:1 | `.dt-btn` mide 46 px de alto; test de contraste de los colores del bloque; captura a ambos anchos | pendiente de `/implement` |
| K2 · El bloque reserva el espacio del mapa (CA6) | el bloque mide lo mismo antes y después de cargar el mapa | test: el mismo `.map` (clases y estilos de tamaño) antes y después de activar "Ver mapa"; captura de ambos estados (Lighthouse no pulsa "Ver mapa") | pendiente de `/implement` |
| K3 · Resto de páginas sin cambios visuales (CA9) | igual que hoy a 390 y 1440 px | capturas antes y después de cada página | pendiente de `/implement` |

## Imágenes de muestra

Ninguna en el bloque. La foto de nosotros, hoy de Unsplash, se aloja en el sitio por CA7. Sigue
siendo una foto de banco (licencia Unsplash) y se puede sustituir por una foto de la clínica fuera
de esta spec. `/contacto` no muestra fotos.

## Pantallas

| Pantalla y estado | Ancho menor | Intermedio | Ancho mayor | Criterios |
|---|---|---|---|---|
| Contacto · bloque del mapa, antes de cargar | 390 | no aplica | 1440 | CA6, K1, K2 |
| Contacto · bloque del mapa, cargado | 390 | no aplica | 1440 | CA6, K2 |
| Contacto · sin JavaScript | 390 | no aplica | 1440 | CA6 |

## Componentes

- **Del sistema:**
  - `.map`, el contenedor actual de `Contact.css`: `aspect-ratio: 21/9`, `min-height: 320px` y en
    móvil `4/5` con `max-height: 460px`, `--radius-lg`, borde `--line`.
  - `.dt-btn` para "Ver mapa", la acción del bloque, con fondo `--primary-700` (`#b63d62`) y texto
    blanco (5,48:1), en lugar de `--primary` (3,96:1, DS4). Solo este botón; hover con
    `--primary-700` y foco con el anillo `--color-focus`.
  - `.dt-btn--ghost` para "Cómo llegar", con borde `--muted` (4,76:1 sobre blanco) en lugar de
    `--line` (DS6), en los dos estados del bloque. Sustituye al `.dt-btn--primary dt-btn--sm` que
    hay hoy sobre el mapa.
  - El ícono `pin`.
- **Composición del estado inicial** (dentro de `.map`, centrada; no es un componente nuevo):
  1. el ícono `pin` en un círculo `--primary-50` con trazo `--primary`;
  2. la etiqueta "Ubicación" en `--muted`;
  3. la dirección de `CLINIC.address` en `--ink`, peso 600;
  4. "Ver mapa" (enlace con aspecto de botón) y "Cómo llegar", en fila que pasa a columna si no caben;
  5. una nota en `--muted`: "El mapa se carga desde Google Maps al pulsar «Ver mapa»."

  Fondo `--tint` (`--color-surface`), sin el brillo animado (`shimmer`) que tiene hoy `.map`.
- **Estado cargado:** el mapa de Google ocupa el mismo `.map`, como hoy, con "Cómo llegar"
  superpuesto abajo a la derecha, con el mismo estilo `ghost` de borde `--muted`.
- **Sin JavaScript:** "Ver mapa" es un enlace a la ubicación en Google Maps (`mapLink`). Con
  JavaScript, el mismo enlace carga el mapa en el sitio en lugar de navegar. Así nunca hay un botón
  que no hace nada.

## Cambios a incorporar al sistema

| Token, componente o regla | Modo | Valor (menor) | Valor (mayor) | Motivo |
|---|---|---|---|---|
| `--space-1` · `--space-2` · `--space-3` · `--space-4` · `--space-6` | fijo | 6 · 10 · 12 · 16 · 24 px | — | P20: el bloque del mapa no puede usar literales de espaciado (/review 023 R2) |
| `--icono-lg` | fijo | 52px | — | Círculo del pin de la vista previa |
| `--text-sm` | fijo | 14px | — | Etiqueta "Ubicación" y nota del bloque |

## Movimiento

Ninguno nuevo. El fundido actual de `.map` al cargar se conserva y respeta
`prefers-reduced-motion`.

## Accesibilidad

- **Contraste:**
  - "Ver mapa": blanco sobre `--primary-700`, 5,48:1 (cumple 4,5:1). Los demás botones principales
    del sitio siguen con la deuda DS4, fuera de esta spec.
  - La dirección (`--ink` sobre `--tint`) y la nota (`--muted` sobre `--tint`, 4,51:1) cumplen.
  - "Cómo llegar": texto `--ink` sobre blanco y borde `--muted` (4,76:1, ≥ 3:1).
- **Toque:** `.dt-btn` mide 46 px de alto.
- **Teclado y foco:** "Ver mapa" es un enlace: se alcanza con Tab y se activa con Enter. Al cargar el mapa, el
  foco pasa al mapa (título "Ubicación de Dentissa en Google Maps"), así que no se pierde. El anillo
  de foco es la regla global `:focus-visible` del sitio (contorno de 3 px `--primary-600`). Orden:
  "Ver mapa" y luego "Cómo llegar".
- **Estructura:** sin encabezados nuevos. El ícono es decorativo (`aria-hidden`).

## Decisiones

| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-17 | diseño | ¿Ciclo de candidatos para el bloque del mapa? | Sin ciclo (`exploration: none`): el bloque usa piezas del sistema; K1–K3 se comprueban en `/implement` con capturas y Lighthouse | usuario |
| 2026-11-17 | implícita | Contraste de "Ver mapa" | ~~Hereda `.dt-btn--primary` (DS4)~~: sustituida por la fila `refinado` de abajo | `docs/design/system.md` (Color, DS4) |
| 2026-11-17 | supuesto | "Ver mapa" sin JavaScript | Enlace a Google Maps que, con JavaScript, carga el mapa en el sitio | sesión |
| 2026-11-17 | cierre | Aprobación del acta | Aprobada | usuario |
| 2026-11-17 | refinado | Contraste de "Ver mapa" contra P16 (la constitución no exime un control nuevo) | Fondo `--primary-700` (5,48:1) solo en este botón; sin cambios al sistema (el token ya existe) | usuario (/analyze A1) |
| 2026-11-17 | refinado | Cómo se comprueba K2 | Test del tamaño de `.map` antes y después y captura de los dos estados, no CLS de Lighthouse | /analyze A21 |
| 2026-11-17 | refinado | Nombres del bloque | "Ver mapa" (enlace, Enter) y "Cómo llegar"; sin "Abrir en Google Maps" | /analyze A23 |
| 2026-11-17 | refinado | Borde de "Cómo llegar" (1,23:1, DS6) contra P16 | Borde `--muted` solo en este bloque, mismo estilo en los dos estados | usuario (/analyze A28) |
| 2026-11-17 | refinado | Fondo de la vista previa y foco | `--tint` sin brillo animado; foco con la regla global `:focus-visible` | /analyze A30, A31 |
| 2026-11-17 | refinado | P20: literales de espaciado y texto en el bloque | Tokens nuevos en el sistema con los mismos valores; se ve igual | usuario (/review 023 R2) |
