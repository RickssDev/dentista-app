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
updated: 2026-11-17
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
- el ícono `pin` de `Icon.jsx`.

No hay pantalla ni sección nueva. El ciclo de candidatos no se hizo por dos motivos:
- en el equipo no hay Playwright para `evaluate.mjs`;
- la puerta de contraste fallaría en cualquier candidato por la deuda previa DS4 del botón principal.

Los criterios K1–K3 se comprueban en la tarea que construye el bloque. Esa tarea hace capturas a 390
y 1440 px, mide CLS con Lighthouse y la revisión manual la hace el usuario.

| Criterio | Objetivo | Cómo se comprueba | |
|---|---|---|---|
| K1 · "Ver mapa" visible y accionable (CA6) | visible a 390 y 1440 px; toque ≥ 44 × 44 px | `.dt-btn` mide 46 px de alto; captura a ambos anchos en `/implement` | pendiente de `/implement` |
| K2 · El bloque reserva el espacio del mapa (CA2, CA6) | sin salto al cargar el mapa; CLS ≤ 0,1 | mismo `.map` con `aspect-ratio` y `min-height` antes y después; Lighthouse en `/contacto` | pendiente de `/implement` |
| K3 · Resto de páginas sin cambios visuales (CA9) | igual que hoy a 390 y 1440 px | capturas antes y después de cada página | pendiente de `/implement` |

## Imágenes de muestra

Ninguna en el bloque. Las fotos de nosotros y contacto, hoy de Unsplash, se alojan en el sitio por
CA7. Siguen siendo fotos de banco (licencia Unsplash) y se pueden sustituir por fotos de la clínica
fuera de esta spec.

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
  - `.dt-btn--primary` para "Ver mapa", la acción del bloque.
  - `.dt-btn--ghost` para "Cómo llegar".
  - El ícono `pin`.
- **Composición del estado inicial** (dentro de `.map`, centrada; no es un componente nuevo):
  1. el ícono `pin` en un círculo `--primary-50` con trazo `--primary`;
  2. la etiqueta "Ubicación" en `--muted`;
  3. la dirección de `CLINIC.address` en `--ink`, peso 600;
  4. los botones "Ver mapa" y "Cómo llegar", en fila que pasa a columna si no caben;
  5. una nota en `--muted`: "El mapa se carga desde Google Maps al pulsar «Ver mapa»."

  Fondo `--tint` (`--color-surface`).
- **Estado cargado:** el mapa de Google ocupa el mismo `.map`, como hoy, con "Cómo llegar"
  superpuesto abajo a la derecha.
- **Sin JavaScript:** "Ver mapa" es un enlace a la ubicación en Google Maps (`mapLink`). Con
  JavaScript, el mismo enlace carga el mapa en el sitio en lugar de navegar. Así nunca hay un botón
  que no hace nada.

## Cambios a incorporar al sistema

Ninguno.

## Movimiento

Ninguno nuevo. El fundido actual de `.map` al cargar se conserva y respeta
`prefers-reduced-motion`.

## Accesibilidad

- **Contraste:**
  - "Ver mapa" hereda el contraste de `.dt-btn--primary`: 3,96:1, deuda DS4 que comparten todos
    los botones principales del sitio y que se corrige fuera de esta spec.
  - La dirección (`--ink` sobre `--tint`) y la nota (`--muted` sobre `--tint`, 4,51:1) cumplen.
- **Toque:** `.dt-btn` mide 46 px de alto.
- **Teclado y foco:** "Ver mapa" se alcanza con Tab y se activa con Enter. Al cargar el mapa, el
  foco pasa al mapa (título "Ubicación de Dentissa en Google Maps"), así que no se pierde. Orden:
  "Ver mapa" y luego "Cómo llegar".
- **Estructura:** sin encabezados nuevos. El ícono es decorativo (`aria-hidden`).

## Decisiones

| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-17 | diseño | ¿Ciclo de candidatos para el bloque del mapa? | Sin ciclo (`exploration: none`): el bloque usa piezas del sistema; K1–K3 se comprueban en `/implement` con capturas y Lighthouse | usuario |
| 2026-11-17 | implícita | Contraste de "Ver mapa" | Hereda `.dt-btn--primary` (DS4, 3,96:1); se corrige con DS4 para todo el sitio, no aquí | `docs/design/system.md` (Color, DS4) |
| 2026-11-17 | supuesto | "Ver mapa" sin JavaScript | Enlace a Google Maps que, con JavaScript, carga el mapa en el sitio | sesión |
| 2026-11-17 | cierre | Aprobación del acta | Aprobada | usuario |
