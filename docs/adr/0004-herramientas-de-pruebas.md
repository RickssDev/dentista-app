---
id: 0004
status: accepted
date: 2026-11-09
---

# ADR 0004 · Herramientas de pruebas y linter del backend

## Contexto
El repo no tiene pruebas ni linter en el backend (riesgo RD8). El backend es CommonJS sobre Express 5
y el frontend, ES modules sobre Vite. Las pruebas no pueden depender de MySQL porque el esquema no
está versionado (RD1), ni de servicios externos (spec 018, CA1 y CA7).

## Decisión
- **Backend:** Jest y Supertest, con la API real, los servicios y los repositorios reales sobre un pool de base de datos simulado en memoria.
- **Frontend:** Vitest, jsdom y Testing Library.
- **Linter del backend:** ESLint, en la misma versión que ya usa el frontend.
- **Comando único:** un `package.json` en la raíz, solo con scripts y sin dependencias ni workspaces.

Todas son dependencias de desarrollo. Se instalan con `npm install --before=2026-11-02`, para respetar los 7 días mínimos también en las transitivas.

| Paquete | Versión | Fecha de la versión | Licencia | Repositorio | Script de instalación |
|---|---|---|---|---|---|
| jest | 30.5.2 | 2026-09-18 | MIT | github.com/jestjs/jest | no |
| supertest | 7.3.1 | 2026-10-02 | MIT | github.com/ladjs/supertest | no |
| vitest | 5.0.5 | 2026-10-15 | MIT | github.com/vitest-dev/vitest | no |
| jsdom | 30.1.3 | 2026-10-15 | MIT | github.com/jsdom/jsdom | no |
| @testing-library/react | 16.3.3 | 2026-08-27 | MIT | github.com/testing-library/react-testing-library | no |
| @testing-library/dom | 10.4.2 | 2026-09-13 | MIT | github.com/testing-library/dom-testing-library | no |
| @testing-library/user-event | 14.6.8 | 2026-10-13 | MIT | github.com/testing-library/user-event | no |
| eslint | 9.39.4 | 2026-03-06 | MIT | github.com/eslint/eslint | no |
| @eslint/js | 9.39.4 | 2026-03-06 | MIT | github.com/eslint/eslint | no |
| globals | 16.5.0 | 2025-11-01 | MIT | github.com/sindresorhus/globals | no |

Con estas herramientas, los lockfiles de desarrollo tienen estas transitivas con script de instalación: `@parcel/watcher` y `fsevents` en el backend; `esbuild` y `fsevents` en el frontend.

Comprobado con una prueba de concepto el 2026-11-09, en una copia temporal, sin modificar el código de producción.

## Alternativas consideradas
- Runner integrado de Node en el backend — evita una dependencia, pero su simulación de módulos sigue siendo experimental.
- Vitest también en el backend — su simulación de módulos no intercepta bien `require` de CommonJS.
- MySQL real de pruebas — verifica el SQL, pero exige versionar antes el esquema y tener Docker para correr las pruebas.

## Consecuencias
- Las pruebas corren sin configuración ni servicios externos.
- El SQL real queda sin verificar y la base simulada puede desviarse de MySQL.
- El proyecto mantiene dos herramientas de pruebas, cada una natural para su paquete.
- Las imágenes de producción no incluyen estas herramientas.
