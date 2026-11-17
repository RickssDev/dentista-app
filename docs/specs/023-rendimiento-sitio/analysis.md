---
result: pass
round: 2
mode: full
constitution_version: 1.0.0
date: 2026-11-17
spec_sha: 5b88f7eed3b9
plan_sha: 9059c26e13ef
tasks_sha: 00ebc05c27f1
---

# Análisis · 023 Rendimiento del sitio público y el login

## Resumen
**Pasa.** Un subagente revisó entera la versión corregida tras la ronda 1
([history/analysis.r1.md](history/analysis.r1.md)):
- de la ronda 1, 20 hallazgos quedaron resueltos y A7 seguía abierto por una frase residual del
  acta de diseño;
- seis correcciones (A3, A9, A10, A14, A15 y A20) introdujeron hallazgos nuevos, que están entre
  los 14 nuevos de esta ronda (A28–A41).

Todos se corrigieron en esta misma ronda, con tres decisiones del usuario. Las huellas de arriba
son de los artefactos ya corregidos. Comprobé cada corrección releyendo las secciones afectadas
contra el código, sin subagente (delta pequeño). No quedan hallazgos abiertos.
Conteo de la ronda (nuevos): CRÍTICA 1 · ALTA 2 · MEDIA 8 · BAJA 3, todos corregidos

Huellas actualizadas el 2026-11-17 tras la aprobación del usuario: solo cambiaron los campos `status` y una fila del Historial de la spec (`git diff e41b643 936a965`).

## Cobertura
| Métrica | Valor |
|---|---|
| Criterios con tarea de test e implementación | 10 / 10 (CA1 y CA2 con medición manual en T002 y T060) |
| Amenazas con control y test | 1 / 1 (TM1: T020, T027 / T013, T015) |
| Principios de la constitución evaluados | 20 / 20 |

## Seguimiento de rondas anteriores
| ID | Severidad | Estado | Evidencia |
|---|---|---|---|
| A1 | CRÍTICA | resuelto | `design.md`: "Ver mapa" con `--primary-700` (5,48:1); T014 lo prueba |
| A2 | ALTA | resuelto | T028 activa los hosts y depende de T024–T027 |
| A3 | ALTA | resuelto con efecto nuevo (→ A33, corregido) | Reglas activadas por tarea; build en verde por commit |
| A4 | ALTA | resuelto | `modulosPrivadosEnEntrada` con `isDynamicEntry` y cierre de `imports` |
| A5 | ALTA | resuelto | T022 incluye `login-redireccion.test.jsx` |
| A6 | ALTA | resuelto | T023 añade `srcSet`; T025 depende de T023 |
| A7 | ALTA | resuelto | La frase residual de `design.md` ("Imágenes de muestra") se corrigió en esta ronda |
| A8 | ALTA | resuelto | PR #78 como requisito previo (plan, nota de T002) |
| A9 | ALTA | resuelto con efecto nuevo (→ A29, corregido) | TM1 en plan y tareas |
| A10 | ALTA | resuelto con efecto nuevo (→ A30, corregido) | Contraste y foco en T014 |
| A11 | ALTA | resuelto | T014: sin literales en las reglas de `.map` |
| A12–A13, A16–A19, A21–A27 | MEDIA/BAJA | resueltos | Ver tabla de la ronda 2 del subagente (resumen arriba) |
| A14 | MEDIA | resuelto con efecto nuevo (→ A32, corregido) | `paginaLogin` compartida |
| A15 | MEDIA | resuelto | T012 |
| A20 | MEDIA | resuelto con efecto nuevo (→ A34, corregido) | `sitemap.xml` y `robots.txt` en T017 |

## Hallazgos nuevos
| ID | Categoría | Severidad | Ubicación | Hallazgo | Corrección (aplicada) |
|---|---|---|---|---|---|
| A28 | Constitución P16 | CRÍTICA | `design.md`; `global.css:185` | "Cómo llegar" (`ghost`) con borde `--line` 1,23:1 en un control nuevo | Borde `--muted` (4,76:1) en los dos estados (decisión del usuario); probado en T014 |
| A29 | Viabilidad / TM1 | ALTA | TM1; T013, T015, T027; `login.jsx:369,411,536` | `datosDeSesion` daba positivo con los `placeholder="tu@correo.com"` del login real | La regla mira el texto y los `value`, no los `placeholder`; el caso limpio de T013 usa esos placeholders |
| A30 | Viabilidad / P16 | ALTA | T014; plan; `design.md` | No existe `.dt-btn:focus-visible`; el foco es la regla global (`global.css:94`) | T014 prueba la regla global (≥ 2 px) y el anillo `--primary-600` sobre `--tint` (≥ 3:1) |
| A31 | Cobertura P16/P20 | MEDIA | T014; `Contact.css:183-196` | La vista previa podía quedar sobre el brillo animado con literales | Estado inicial `var(--tint)` sin animación; literales prohibidos en toda regla de `.map` |
| A32 | Test | MEDIA | T015 | `paginaLogin` y `TITULO_LOGIN` no existían al escribir el test | T015 crea `TITULO_LOGIN` y la firma de `paginaLogin`; llamadas dentro de cada `test` |
| A33 | Inconsistencia | MEDIA | `tasks.md` (cabecera) | "Tests en verde en cada commit" no se cumple con tests escritos antes | Build en verde por commit; tests nuevos en rojo hasta su tarea; PR al final |
| A34 | CA10 | MEDIA | plan; T017 | La exención de `robots.txt` era falsa (66 bytes > 20) | `robots.txt` entra en la comprobación de gzip |
| A35 | Viabilidad | MEDIA | plan; T010 | La variable es `--font`, no `--font-sans` | Plan y T010 usan `--font` |
| A36 | Ambigüedad | MEDIA | CA8 | El marco de Google en `/login` carga su fuente | CA8 lo exceptúa solo en `/login` (decisión del usuario) |
| A37 | Riesgos | MEDIA | plan Rollout; T021 | Un chunk viejo tras un despliegue deja la pantalla en blanco | `cargarPagina` recarga una vez (T012, T021) y comprobación en T097 |
| A38 | Cobertura | MEDIA | CA3 | "No parpadea con JavaScript" sin prueba | T018 (jsdom) y T023 depende de ella |
| A39 | Inconsistencia | BAJA | plan | Números de tarea desfasados | Alineados (T021, T022, T027) |
| A40 | Inconsistencia | BAJA | plan; `Metadatos.jsx` | Título de `/login` distinto al cargar y al navegar | "Iniciar sesión \| Dentissa" en los dos casos (decisión del usuario; T012, T022) |
| A41 | Constitución P4 | BAJA | ADR 0010 | El ADR no recogía la división de código ni las guardas | Añadidas al ADR 0010 |

## Decisiones pendientes del usuario
Ninguna. Respondidas el 2026-11-17: A28 (borde `--muted`), A36 (excepción del marco de Google en
`/login`) y A40 ("Iniciar sesión | Dentissa").

## Aceptados
Ninguno: se corrigieron todos.
