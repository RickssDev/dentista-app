---
spec: 029-limite-galeria
status: approved            # draft | approved (solo el usuario aprueba)
exploration: none
threshold: 80
floor: 3
budget: 3
accepted: none
score: 0
system_version: 1.0.0
created: 2026-11-23
updated: 2026-11-23
---

# Diseño · 029 Límite de 15 imágenes en la galería

Hecho con `/design-spec 029` sobre `docs/design/system.md`. Los criterios están en la spec
("Criterios de diseño"). No hay candidatos: ver Resultado.

## Candidatos

Ninguno: sin ciclo de candidatos (ver Resultado y Decisiones).

## Resultado

**Sin diseño nuevo.** La spec no crea pantalla ni sección. Solo cambia datos y estados dentro del
encabezado del módulo (`EncabezadoModulo`) del panel de la galería, y todo se compone con piezas
que ya existen:

- **Contador (CA5):** una línea «N de 15 imágenes» debajo de la descripción del encabezado, con el
  mismo estilo de texto secundario (`.encabezado-descripcion`). Con la galería llena, el número se
  mantiene igual («15 de 15 imágenes»): el estado lo comunica el aviso, no un color nuevo.
- **Acción desactivada (CA6):** el botón «Nueva imagen» (`.encabezado-btn`) usa el estado
  desactivado que ya tiene (`opacity: 0.6`, `cursor: not-allowed`). No se quita del DOM ni del
  orden de tabulación: se marca con `aria-disabled="true"` y `aria-describedby` apuntando al aviso,
  y pulsarlo no abre el formulario. Así el lector de pantalla lo anuncia como «no disponible» y lee
  el motivo, cosa que un `disabled` nativo no permite porque saca el botón del foco.
- **Aviso de galería llena (CA6):** un bloque de texto entre el encabezado y los filtros con
  «Llegaste al máximo de 15 imágenes. Elimina una para agregar otra.». Usa variantes de marca que
  ya existen: fondo `--primary-50`, borde `--primary-100` y texto `--ink-2`. Lleva
  `role="status"` para que se anuncie cuando aparece después de agregar la imagen 15. Solo se
  muestra con la galería llena.
- **Rechazo del servidor (CA2, CA7, CA8):** si el alta se rechaza igual, por ejemplo cuando otra
  pestaña llenó la galería, el mensaje sale en el error del formulario que ya existe
  (`<p role="alert">` del modal).

La página pública `/galeria` no cambia (CA9).

El ciclo de candidatos no se hizo porque no hay composición nueva que comparar: son tres estados
de componentes ya diseñados (`references/spec-mode.md` §1, «se omite»). Los criterios K1–K3 se
comprueban en la tarea que construye el panel, con tests y con capturas a 390 y 1440 px que revisa
el usuario.

| Criterio | Objetivo | Cómo se comprueba | |
|---|---|---|---|
| K1 · Contador «N de 15 imágenes» (CA5) | visible sin desplazarse a 390 y 1440 px | test del panel con 3 y 15 imágenes; capturas a ambos anchos | pendiente de `/implement` |
| K2 · Galería llena (CA6) | acción desactivada y aviso visibles a 390 y 1440 px | test: con 15, `aria-disabled="true"`, el clic no abre el formulario y el aviso está; capturas | pendiente de `/implement` |
| K3 · Accesibilidad del estado lleno (CA6, P16) | el lector anuncia «no disponible» y el motivo; contraste AA | test: el botón conserva el foco y su `aria-describedby` apunta al aviso; contraste `--ink-2` sobre `--primary-50` ≥ 4,5:1 | pendiente de `/implement` |

## Imágenes de muestra

Ninguna.

## Pantallas

| Pantalla y estado | Ancho menor | Intermedio | Ancho mayor | Criterios |
|---|---|---|---|---|
| Panel: galería · con sitio (N < 15) | captura a 390 en `/implement` | no aplica | captura a 1440 | CA5 |
| Panel: galería · llena (15) | captura a 390 en `/implement` | no aplica | captura a 1440 | CA5, CA6 |
| Panel: galería · rechazo en el formulario | captura a 390 en `/implement` | no aplica | captura a 1440 | CA2 |

## Componentes

| Componente | Estados que usa | Cambio |
|---|---|---|
| `EncabezadoModulo` | reposo, botón desactivado | Admite una línea de detalle bajo la descripción y el botón con `aria-disabled` y `aria-describedby`. Las demás pantallas que lo usan no cambian |
| `ModalFormulario` | error del formulario | Ninguno: muestra el mensaje de rechazo del servidor |
| Aviso de galería llena | visible solo con 15 | Exclusivo de esta pantalla (ver «Cambios a incorporar al sistema») |

## Cambios a incorporar al sistema

| Cambio | Modo | Motivo |
|---|---|---|
| «Aviso informativo del panel»: bloque de texto con fondo `--primary-50`, borde `--primary-100`, texto `--ink-2` y `role="status"`. No añade tokens nuevos | fijo | El sistema no tiene aviso no-error en el panel (no hay token `warning`, ver system.md → Color). Se documenta para reutilizarlo y no inventar otro |
| `EncabezadoModulo`: botón con `aria-disabled` además de `:disabled` | fijo | Una acción no disponible tiene que seguir siendo anunciable (P16). Atiende **parcialmente** DS10: solo la parte del botón del encabezado del panel; la trampa de foco del modal y el `:disabled` de `.dt-btn` siguen en DS10 |

## Movimiento

Ninguno.

## Accesibilidad

- Contraste: `--ink-2 #334155` sobre `--primary-50 #fff4f6` = 9,63:1, calculado de los valores
  declarados. El contador usa el texto secundario del encabezado, como hoy.
- El botón desactivado al 60 % de opacidad queda bajo 4,5:1. WCAG 1.4.3 exime los controles
  inactivos, y el motivo se da en texto con contraste AA (el aviso).
- Foco: el botón sigue enfocable; el aviso se anuncia por `role="status"` y por `aria-describedby`.
- Toque: el botón mantiene 44 px de alto; a 390 px ocupa el ancho completo, como hoy.

## Decisiones

| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-23 | diseño | ¿Ciclo de candidatos o sin diseño nuevo? | Sin diseño nuevo: tres estados de componentes existentes, sin composición nueva | `references/spec-mode.md` §1 |
| 2026-11-23 | diseño | ¿`disabled` nativo o `aria-disabled`? | `aria-disabled` + `aria-describedby`: el nativo saca el botón del foco y el lector no anuncia el motivo (CA6) | constitución P16 |
| 2026-11-23 | diseño | Color del aviso, sin token `warning` | Variantes de marca existentes (`--primary-50`, `--primary-100`, `--ink-2`), sin tokens nuevos | `docs/design/system.md` → Color |
