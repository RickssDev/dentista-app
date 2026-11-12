---
spec: 022-sitio-indexable
verdict: approved
round: 2
date: 2026-11-12
base: 17efa2e
head: 333a02c
human_signoff: RickssDev 2026-11-12
---

# Review · 022 Sitio indexable

## Resumen
Ronda 2 (`--rerun`, sin subagente: `code.diff` de 22 KB, releído desde cero). Están corregidos los
16 hallazgos que el usuario eligió (R1–R11, R15, R16, R19, R20), cada uno con una prueba que fallaba
antes y ahora pasa. No aparecen hallazgos nuevos. Los menores aceptados (R12–R14, R17, R18, R21–R23)
van al roadmap.
Conteo: bloqueante 0 · importante 0 · menor 0 (nuevos en esta ronda)

## Verificación automática
| Comando | Resultado |
|---|---|
| `npm test` | ✅ backend 256 + 5 `todo`; frontend 96/96 (13 archivos). Las pruebas nuevas de UI y asíncronas, en dos ejecuciones |
| `npx eslint .` (frontend) | ✅ 13 problemas, los mismos previos; archivos tocados limpios |
| `npm run build --prefix frontend` | ✅ prerender sin `<div hidden id="S:` en ninguna página |
| `node scripts/probar-nginx.mjs` | ✅ 22/22 |
| `npm audit --audit-level=high` | ✅ 0 vulnerabilidades |
| `aidd.py validate docs/specs/022-sitio-indexable` | ✅ 0 errores |

## Seguimiento de la ronda 1
| ID | Estado | Evidencia |
|---|---|---|
| R1 | corregido | T033 falla antes y pasa después (T040): la 404 se titula "Página no encontrada \| Dentissa" y `/login` vuelve al título general, sin canónica |
| R2 | corregido | T035: `/%5Cevil.com/` y `/%0D%0A…/` dan 404 (T042); la captura solo admite caracteres seguros |
| R3 | corregido | T034 y T037 fallaban en `/` y `/contacto`; con `progressiveChunkSize: Infinity` (T041) el contenido queda dentro de `<main>` |
| R4 | corregido | `/contacto/?utm=1` → 301 `/contacto?utm=1` (T035, T042) |
| R5 | corregido | `probar-nginx` recorre `RUTAS_NO_INDEXABLES` y las anidadas; `seo-rutas` compara la regex de nginx con la constante (comprobado rompiendo) |
| R6 | corregido | `onRecoverableError` ya no se filtra. Destapó el aviso "Switched to client rendering" de R3, hoy resuelto |
| R7 | corregido | La guarda lee el HTML final y exige una sola canónica (comprobado rompiendo la plantilla) |
| R8 | corregido | `probar-nginx` importa la tabla; `seo-rutas` compara los `location =` (comprobado quitando `/galeria`) |
| R9 | corregido | `docs/seo.md` → "Exclusiones deliberadas" |
| R10 | corregido | Reemplazos con función; prueba con `$&` y `$'` |
| R11 | corregido | `construirPagina` lanza un error sin `<title>` o sin descripción; el build se detiene |
| R15 | corregido | Cubierto por T033 |
| R16 | corregido | `og:image:alt` en las seis páginas; `twitter:card` documentado en `seo.md` |
| R19 | corregido | ESLint aplica 61 reglas a `tests/support/*.mjs` |
| R20 | corregido | Bloque renombrado a "subconjunto de comprobaciones de Lighthouse SEO" |

## Criterios de aceptación
| CA | Test | Estado | Nota |
|---|---|---|---|
| CA1 | Lighthouse manual (T060) · `seo-prerender.test.jsx` | ✅ | Los cambios de esta ronda no tocan lo que mide la auditoría SEO |
| CA2 | `seo-prerender.test.jsx` | ✅ | `<h1>` dentro de `<main>` en las seis páginas |
| CA3–CA7, CA10–CA12 | sin cambios respecto a la ronda 1 | ✅ | |
| CA8 | `probar-nginx`, `seo-rutas.test.js` | ✅ | Las siete rutas privadas probadas |
| CA9 | `probar-nginx` | ✅ | |
| CA13 | `seo-metadatos`, `seo-hidratacion`, `probar-nginx` | ✅ | |

## Conformidad con el plan
- Cambios fuera del plan: ninguno; `scope.md` sin archivos sin tarea ni tareas sin diff.
- Partes del plan sin implementar: ninguna.

## Seguridad
| Herramienta | Resultado |
|---|---|
| gitleaks | ✅ (CI del PR) |
| SCA | ✅ sin altas ni críticas |

| Tema OWASP | Resultado | Evidencia |
|---|---|---|
| A05 Configuración (nginx) | ✅ | Open redirect cerrado (R2) |

## Observabilidad
- Sin cambios de logs, auditoría ni métricas.

## SEO
| Tema | Resultado | Evidencia |
|---|---|---|
| 1. Contenido sin JavaScript | ✅ | `dist/index.html` y `dist/contacto/index.html` sin contenido oculto |
| 7. Vista previa al compartir | ✅ | `og:image:alt` presente |
- Sección "Descubribilidad" del plan aplicada: sí.

## Hallazgos
| ID | Severidad | Archivo:línea | Hallazgo | Sugerencia |
|---|---|---|---|---|

## Preparación para release
- Rollback factible: sí, reconstruyendo el frontend con el tag anterior.
- Migraciones: no hay.
- Docs: `seo.md` actualizado (R9, R16).

## Tareas añadidas
- Ninguna en esta ronda (las de la ronda 1, T033–T044, están hechas).

## Aceptados sin tarea
- **R12** → roadmap: `/index.html`, `/<ruta>/index.html` y `/app.html` responden 200 (la canónica evita el duplicado)
- **R13** → roadmap: las rutas con mayúsculas (`/Nosotros`) dan 404; documentarlo o redirigirlas
- **R14** → roadmap: la prueba de hidratación no usa el árbol raíz de `main.jsx`
- **R17** → roadmap: salto a h3 en el footer, logo sin `width`/`height`, `theme-color` fuera de los tokens, `vite.svg` publicado (spec de rendimiento o deuda de diseño)
- **R18** → roadmap: lógica de `estilosNuevos` repetida y estilos distintos entre los scripts de `frontend/scripts`
- **R21** → roadmap: `probar-nginx.mjs` sin mensaje propio con el puerto ocupado
- **R22** → roadmap: sin cabeceras de seguridad en nginx; `add_header` en la ubicación privada anula las del server
- **R23** → roadmap: accesibilidad previa (foco al navegar en la SPA, texto del loader, `aria-hidden` del skeleton)
