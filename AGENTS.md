# Dentissa

Sitio público y sistema de gestión de una clínica dental: los pacientes agendan citas y el personal
(Administrador y Asistente) gestiona citas, historial clínico, servicios, promociones, galería y
reportes. Está en producción y maneja datos de salud.

> Antes de cualquier cambio lee [docs/constitution.md](docs/constitution.md). Si algo aquí
> contradice la constitución, prevalece la constitución.

## Stack
JavaScript · React 19 + Vite 7 · Node 22 + Express 5 · MySQL 8 con SQL manual · npm · tipo: `monorepo` (`backend/` y `frontend/`, sin workspaces)

## Comandos
```bash
npm ci --prefix backend && npm ci --prefix frontend  # instalar
npm run dev --prefix backend                         # API local
npm run dev --prefix frontend                        # SPA local
npm test                                             # pruebas de backend y frontend (no usan datos ni servicios reales)
npm run lint --prefix backend                        # lint del backend  # ⚠ 5 errores previos en backend/src
npm run lint --prefix frontend                       # lint del frontend  # ⚠ 10 errores previos
npm run build --prefix frontend                      # build
```

## Flujo de trabajo
1. `/specify` → spec en `docs/specs/NNN-<slug>/spec.md`
   - Con pantallas: `/design-spec NNN` → criterios de diseño, ciclo de candidatos y `design.md` aprobado
2. `/plan` → `plan.md` con Constitution Check
3. `/tasks` → `tasks.md`
4. `/analyze` → verificación independiente de consistencia → `analysis.md`
5. `/implement` → solo tareas aprobadas, una a la vez, con tests
6. `/review` → contra spec, plan y constitución → `review.md`
7. `/release` → versión, changelog y, con tu aprobación, producción

Trabajo que no añade comportamiento (carriles ligeros, ficha en `docs/changes/`): `/fix` para un
bug (`--hotfix` en producción), `/refactor` para deuda sin cambio de comportamiento, `/chore` para
dependencias, configuración y docs. Si el cambio crece o toca contratos, datos o seguridad, pasa
al flujo completo. `/sync` concilia lo que se hizo fuera del flujo.

Usa `/clarify` para cerrar ambigüedades de una spec antes de aprobarla. Sistema de diseño:
`/design-spec system`. Sitio público: `/seo audit` para re-auditar el SEO técnico. Estado de todas las specs:
`python .ai/bin/aidd.py status`.

No implementes sin spec aprobada o ficha abierta de un carril. No hagas commit sin que pasen los tests y el lint de lo que tocaste.
Nunca despliegues a producción sin aprobación explícita; sigue [docs/deployment.md](docs/deployment.md).
Nunca escribas secretos en el código, los logs ni los docs.

## Reglas y estilo
- Backend: módulos en `backend/src/modules/<dominio>/` con `.routes`, `.controller`, `.service` y `.repository`; CommonJS.
- Errores: los services lanzan `AppError(mensaje, status)`, los controllers usan `catchAsync` y responden con `HandleResponse`.
- SQL siempre con parámetros `?`, solo en repositories; columnas en `snake_case` en español, y la API responde en camelCase.
- Rutas protegidas con `verifyToken` y `authorizeRoles`; roles: `Administrador`, `Asistente`, `Paciente`.
- Frontend: componentes y páginas en PascalCase `.jsx`; helpers en camelCase; CSS en `src/styles/`; llamadas HTTP en `src/services/`.
- Dominio, mensajes y comentarios en español; verbos CRUD técnicos en inglés.
- Fechas de negocio en `America/Mexico_City`.
- Commits: Conventional Commits en español, `tipo(ámbito): descripción`. El historial usa también `update`.

## Mapa del repositorio
| Ruta | Contenido |
|---|---|
| `backend/server.js` | Entrada de la API y arranque del cron |
| `backend/src/modules/` | Dominios de la API |
| `backend/src/{config,middlewares,utils,services}/` | Transversales e integraciones |
| `backend/docker-compose*.yml`, `Caddyfile` | Despliegue |
| `frontend/src/pages/` | Vistas públicas, `admin/` y `paciente/` |
| `frontend/src/components/`, `styles/` | Componentes y CSS |
| `frontend/src/services/`, `api/` | Cliente de la API |
| `.ai/` | Configuración y validador del flujo |
| `docs/` | Fuente de verdad del proyecto |

## Documentación
- [Constitución](docs/constitution.md) — principios innegociables
- [Arquitectura](docs/architecture.md)
- [Despliegue](docs/deployment.md) — entornos, deploy y rollback
- [Seguridad](docs/security.md) — datos sensibles, auth, herramientas y excepciones
- [Observabilidad](docs/observability.md) — logs, correlación, auditoría, métricas y alertas
- [SEO técnico](docs/seo.md) — URL canónica, rutas indexables y brechas
- [Sistema de diseño](docs/design/system.md) — tokens, componentes y deuda ([vista](docs/design/system.html))
- [Roadmap](docs/roadmap.md) — etapa actual y objetivos
- [Specs](docs/specs/README.md)
- [ADRs](docs/adr/)
- [Plantillas](docs/templates/)

El plugin `design` de Anthropic no está en esta sesión: la revisión de diseño la hace cada skill por su cuenta.
