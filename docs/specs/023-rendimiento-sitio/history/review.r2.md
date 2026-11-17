---
spec: 023-rendimiento-sitio
verdict: changes_requested
round: 2
date: 2026-11-17
base: 52ea25a
head: 8a6396c
human_signoff: pending
---

# Review · 023 Rendimiento del sitio público y el login

## Resumen
Ronda 2 (`--rerun`) sobre `52ea25a..8a6396c`: las correcciones T036–T047 de la ronda 1. Las hice sin
subagentes, porque `code.diff` ocupa 29 KB; releí el diff desde cero y comprobé en el navegador.

Los dos bloqueantes y los ocho importantes de la ronda 1 están resueltos, igual que los menores que se
eligieron. Queda abierta la mitad de R6: el aviso de la galería tiene `role="status"`, pero la región
nace con su texto dentro y los lectores de pantalla no suelen anunciarla (R37).

El usuario decide corregir R37 y la fila de la excepción (R38), y llevar R39 y R40 al roadmap.

Conteo (nuevos): bloqueante 0 · importante 1 · menor 3.

## Verificación automática
| Comando | Resultado |
|---|---|
| `npm test` | ✅ backend 24/24 suites; frontend 188/188. Los tests nuevos de UI y asíncronos, dos veces en su tarea |
| `npx eslint` (archivos tocados) | ✅ 0 errores. Totales: frontend 7 errores, backend 4, todos en archivos que la spec no toca (línea base: 10 y 5) |
| `npm run build` | ✅ todas las guardas activas, incluidas las nuevas de T045 (comprobadas rompiendo cada regla) |
| `node scripts/probar-nginx.mjs` | ✅ todas las comprobaciones |
| `aidd.py validate` | ✅ 0 errores |
| CI "Lint y build" · "Artefactos del flujo" | ✅ |
| CI "Seguridad (solo cambios del PR)" | ❌ picomatch, con excepción vigente (R3, R40) |

## Seguimiento de la ronda 1
| ID | Estado | Evidencia |
|---|---|---|
| R1 | ✅ resuelto | `Contact.css`: anillo de 3px hacia dentro en `.map.is-activo:focus-within`. En Chrome, el `iframe` no coincide con `:focus` ni con `:focus-visible`; el bloque sí con `:focus-within`. Captura de T038 tras Tab y Enter |
| R2 | ✅ resuelto | Tokens `--space-*`, `--icono-lg` y `--text-sm` (T037, `system.md`); `.map*` sin literales (test de T036) |
| R3 | ✅ excepción | `docs/security.md`, vence 2027-01-31; la fila no menciona el backend (R38) |
| R4 | ✅ resuelto | `Contact.jsx:115` sin `dt-btn--sm`; 46px medidos en los dos estados |
| R5 | ✅ resuelto | `.map__llegar:hover` con `--primary-700` (5,48:1) |
| R6 | ⚠ parcial | Foco a la sección al reintentar ✅. El `role="status"` se monta junto con su texto (R37) |
| R7 | ✅ resuelto | Limpieza del efecto a `TITULO_GENERAL`; test |
| R8 | ✅ resuelto | El proveedor simulado inserta el `<script>`; comprobado rompiendo (fallan las tres públicas) |
| R9 | ✅ resuelto | Un solo `GoogleOAuthProvider` con portal al panel visible. Tests de cambio de panel; en Chrome, `gsi/client` se pide una sola vez y el botón cambia de panel |
| R10 | ✅ resuelto | Test de literales de medida en `.map*` |
| R11 | ✅ resuelto | `almacen()` con `try/catch`; test con `sessionStorage` que lanza un error |
| R12 | ✅ resuelto | Test falla → recarga → bien → falla → recarga; comprobado rompiendo |
| R15 | ✅ resuelto | Se cancela solo con la API que se usó |
| R16, R17, R22 | ✅ resueltos | Guardas del build comprobadas rompiendo; el mensaje dice solo "(JWT)" o "(correo)" |
| R18, R19, R23, R35 | ✅ resueltos | `seo.md`, `plan.md` y nota de T001 |
| R20, R21 | ✅ resueltos | `gzip_types` con `text/javascript` y sin `application/json`; test nuevo |
| R31 | ✅ resuelto | Test de que `.map.is-activo` no cambia el tamaño |

## Criterios de aceptación
| CA | Test | Estado | Nota |
|---|---|---|---|
| CA1 | `medir-rendimiento.mjs` (manual) | ✅ | Sin cambios de carga desde la ronda 1; login 99 y nosotros 97 aceptados |
| CA2 | `medir-rendimiento.mjs`, guardas del build | ✅ | La precarga de la foto ya se exige en `/` y `/nosotros` |
| CA3, CA4, CA7, CA8 | sin cambios | ✅ | |
| CA5 | `rendimiento-carga` | ✅ | Un solo proveedor, el script solo en `/login` |
| CA6 | `rendimiento-mapa`, `rendimiento-estilos` | ✅ | Foco visible, 46px, contraste al pasar el ratón |
| CA9 | `galeria-estados`, `rendimiento-carga` | ⚠ | Anuncio del aviso de la galería (R37) |
| CA10 | `rendimiento-nginx`, `probar-nginx` | ✅ | |

## Conformidad con el plan
- Cambios fuera del plan: ninguno (`scope.md`: 0 archivos sin tarea). T046 y T047 son solo de documentación.
- Partes del plan sin implementar: ninguna.

## Constitution Check (sobre el código)
| Principio | Resultado | Evidencia |
|---|---|---|
| P2 Tests | ✅ | R8 y R10 resueltos; cada caso que pasa desde el principio se comprobó rompiendo |
| P11 Vulnerabilidades | ✅ excepción | picomatch, solo en desarrollo y build; `--omit=dev`: 0 altas en los dos paquetes |
| P16 WCAG AA | ⚠ | R37 (4.1.3, mensajes de estado) |
| P20 Sistema de diseño | ✅ | Tokens nuevos documentados en `system.md` |
| Resto | ✅ / ➖ | Como en la ronda 1 |

## Seguridad
| Herramienta | Resultado |
|---|---|
| gitleaks | ✅ local en `52ea25a..HEAD`: sin fugas (escaneo parcial, porque el worktree no monta el `.git` principal); en CI, completo y sin hallazgos |
| SCA `npm audit --audit-level=high` | ⚠ frontend 5 altas y backend 36, todas por GHSA-fc5q-39xc-vjpf (picomatch), con excepción. `--omit=dev`: frontend 0; backend 2 moderadas (uuid, previas), ninguna alta |

| Tema OWASP (2025) | Resultado | Evidencia |
|---|---|---|
| A02 Configuración incorrecta | ✅ | El JSON de la API ya no se comprime (R21); las cabeceras de seguridad siguen en el roadmap (R24) |
| A03 Cadena de suministro | ✅ excepción | picomatch (R3) |
| A04 Datos | ✅ | TM1 sin imprimir el dato (R22); mapeo corregido a A02:2025 en el plan (R23) |

## Observabilidad
- Sin logs ni eventos de auditoría nuevos. El error de la guarda TM1 ya no muestra el dato encontrado.

## SEO
| Tema | Resultado | Evidencia |
|---|---|---|
| Indexación y canónica | ✅ | `login.html` sin Open Graph (la guarda falla si aparece) |
| Precargas | ✅ | Foto principal exigida en `/` y `/nosotros` |
- "Descubribilidad" del plan aplicada: sí; `seo.md` al día (R18).

## Hallazgos
| ID | Severidad | Archivo:línea | Hallazgo | Sugerencia |
|---|---|---|---|---|
| R37 | importante | frontend/src/pages/Gallery.jsx:116-119 | El `role="status"` del aviso se monta a la vez que su texto (pasa del esqueleto al aviso de error o vacía). NVDA y JAWS no suelen anunciar una región viva que nace con contenido (WCAG 4.1.3); la regla del flujo pide una sola región montada antes de recibir el texto | Una región de estado oculta visualmente, siempre montada en la sección, cuyo texto cambia (vacío al cargar y al mostrar fotos; error o vacía según el caso); el aviso visible sin `role` |
| R38 | menor | docs/security.md (Excepciones) | La fila de GHSA-fc5q-39xc-vjpf solo menciona el frontend; el backend tiene la misma advisory vía Jest (36 altas en `npm audit`, 0 con `--omit=dev`) | Ampliar la fila al backend |
| R39 | menor | frontend/src/styles/home/Contact.css:200 | `:focus-within` también dibuja el anillo cuando se hace clic con el ratón dentro del mapa | Aceptado: el `iframe` no expone `:focus-visible`; se ve un anillo de más, nunca uno de menos |
| R40 | menor | .github/workflows (job "Seguridad (solo cambios del PR)") | El job ejecuta `npm audit --audit-level=high` sin leer las excepciones de `docs/security.md`: sigue en rojo con una excepción vigente | `/chore`: que el workflow ignore solo las advisories con excepción vigente |

## Preparación para release
- Rollback factible: sí (reconstruir el frontend del commit anterior); sin datos ni migraciones.
- Docs: `architecture.md`, `seo.md` y `security.md` al día salvo R38.
- SCA: sin altas en producción; excepción vigente para la de desarrollo.

## Tareas añadidas
Decisión del usuario (2026-11-17): corregir R37 y R38; R39 y R40 al roadmap (merge con el check de seguridad en rojo, sabiendo el motivo).
- T048 ← R37
- T049 ← R37
- T050 ← R38

## Aceptados sin tarea
- **R39** → roadmap: el anillo del mapa también aparece al hacer clic con el ratón (`:focus-within`)
- **R40** → roadmap: que el job de seguridad del CI respete las excepciones de `docs/security.md` (`/chore`)
