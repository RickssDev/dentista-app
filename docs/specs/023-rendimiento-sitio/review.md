---
spec: 023-rendimiento-sitio
verdict: approved
round: 3
date: 2026-11-17
base: 8a6396c
head: f5f9aa2
human_signoff: RickssDev 2026-11-17 (revisó y fusionó el PR #79)
---

# Review · 023 Rendimiento del sitio público y el login

## Resumen
Ronda 3 (`--rerun`) sobre `8a6396c..f5f9aa2`: las tareas T048–T050 de la ronda 2. `code.diff`
ocupa 5 KB, así que la hice sin subagentes, releyendo el diff desde cero, y comprobé en Chrome.

R37 y R38 quedan resueltos y no hay hallazgos nuevos. El veredicto es `approved`. Falta la firma
humana: la definición de terminado pide que una persona revise el PR.

Conteo (nuevos): bloqueante 0 · importante 0 · menor 0.

## Verificación automática
| Comando | Resultado |
|---|---|
| `npm test` | ✅ backend 24/24 suites; frontend 189/189. Los tests de T048, dos veces en su tarea |
| `npx eslint` (archivos tocados) | ✅ 0 errores. Totales sin cambios: frontend 7 errores y backend 4, en archivos ajenos a la spec (línea base: 10 y 5) |
| `npm run build` | ✅ todas las guardas activas |
| `aidd.py validate` | ✅ 0 errores |
| CI | "Lint y build" y "Artefactos del flujo" ✅; "Seguridad (solo cambios del PR)" ❌ por picomatch, con excepción vigente (R40, al roadmap) |

## Seguimiento de la ronda 2
| ID | Estado | Evidencia |
|---|---|---|
| R37 | ✅ resuelto | `Gallery.jsx`: `<p class="sr-only" role="status">`, siempre montado en la sección y solo con cambios de texto; el aviso visible sin `role`. T048 comprueba que es el mismo nodo de cargando a error, a vacía y con fotos. En Chrome, la región está en el HTML prerenderizado (vacía), es el mismo nodo tras hidratar, recibe el texto del error y en el árbol de accesibilidad es `status` con `live=polite` |
| R38 | ✅ resuelto | `docs/security.md`: la fila cubre frontend (Vite, ESLint) y backend (Jest); `npm audit --omit=dev` sin altas en los dos |
| R39, R40 | aceptados | Al roadmap (ronda 2) |
| R6 | ✅ resuelto | Con R37, el aviso se anuncia; el foco al reintentar ya estaba |

## Criterios de aceptación
| CA | Test | Estado | Nota |
|---|---|---|---|
| CA1 | `medir-rendimiento.mjs` (manual) | ✅ | Login 99 y nosotros 97, aceptados por el usuario. La región nueva no cambia la carga (texto oculto de 1×1 px) |
| CA2 | `medir-rendimiento.mjs`, guardas del build | ✅ | La región tiene `position: absolute`: no mueve la maquetación |
| CA3–CA8, CA10 | como en la ronda 2 | ✅ | |
| CA9 | `galeria-estados`, `rendimiento-carga`, hidratación | ✅ | |

## Conformidad con el plan
- Cambios fuera del plan: ninguno (`scope.md`: 0 archivos sin tarea; T050 es solo de documentación).
- Partes del plan sin implementar: ninguna.

## Constitution Check (sobre el código)
| Principio | Resultado | Evidencia |
|---|---|---|
| P2 Tests | ✅ | T048 falló antes de T049 por la razón esperada |
| P11 Vulnerabilidades | ✅ excepción | picomatch en frontend y backend, solo en desarrollo |
| P16 WCAG AA | ✅ | 4.1.3 con una región de estado montada antes de recibir su texto |
| P20 Sistema de diseño | ✅ | `.sr-only` es una utilidad de accesibilidad, sin valores visuales del sistema |
| Resto | ✅ / ➖ | Como en las rondas anteriores |

## Seguridad
| Herramienta | Resultado |
|---|---|
| gitleaks | ✅ en CI (el diff de esta ronda no tiene datos) |
| SCA | ⚠ solo GHSA-fc5q-39xc-vjpf (desarrollo), con excepción hasta 2027-01-31; `--omit=dev` sin altas |

Sin cambios de superficie: ni endpoints, ni datos, ni dependencias en esta ronda.

## Observabilidad
- Sin logs ni eventos de auditoría nuevos.

## SEO
| Tema | Resultado | Evidencia |
|---|---|---|
| Contenido sin JS | ✅ | `/galeria` prerenderizada con la región vacía; sin cambios de título, descripción ni canónica |

## Hallazgos
| ID | Severidad | Archivo:línea | Hallazgo | Sugerencia |
|---|---|---|---|---|

Ninguno nuevo.

## Preparación para release
- Rollback factible: sí (reconstruir el frontend del commit anterior); sin datos ni migraciones.
- Docs: `architecture.md`, `seo.md`, `security.md` y `system.md` al día.
- SCA: sin altas en producción; excepción vigente para la de desarrollo.
- Firma humana pendiente (definición de terminado: "Una persona revisó el PR").

## Tareas añadidas
- Ninguna.

## Aceptados sin tarea
- Los de las rondas 1 y 2 (`history/review.r1.md`, `history/review.r2.md`): R13, R14, R24–R30, R32–R34, R36, R39 y R40.
