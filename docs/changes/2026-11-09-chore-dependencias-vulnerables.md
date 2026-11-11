---
lane: chore
status: released
released: v1.1.0 (2026-11-09)
base: b6088a0                # commit de partida; lo registra la skill al empezar (lo usa lane-check)
relates: []                  # specs cuyo comportamiento toca ([] si ninguna)
covers: []
escalated_to: null           # NNN de la spec si el cambio se escaló al flujo completo
---

# Chore: dependencias vulnerables

## Problema
`npm audit` reportaba 1 vulnerabilidad crítica y 19 altas en dependencias existentes (riesgo RS3 de `docs/security.md`): backend 1 crítica y 9 altas, frontend 10 altas. Bloqueaban `/release` por el principio P11.

## Cambio
`npm audit fix --before=2026-11-02` en cada paquete, sin `--force`: solo cambian los lockfiles, sin versiones mayores ni dependencias directas nuevas, y todas las versiones tienen al menos 7 días.

Producción del backend (17 paquetes), directas:
- `axios` 1.16.1 → 1.21.0: correcciones de seguridad. El único cambio incompatible anunciado afecta a los valores por defecto de cabeceras, que el proyecto no usa.
- `multer` 2.1.1 → 2.5.0: correcciones de seguridad; rechaza límites `fileSize` no enteros, y el proyecto usa un entero.
- `mysql2` 3.20.0 → 3.24.6: correcciones de seguridad; desactiva por defecto el plugin `mysql_clear_password`.

Transitivas de producción del backend: `proxy-addr` 2.0.8 (la crítica), `path-to-regexp` 8.4.2, `body-parser` 2.4.0, `qs` 6.17.1, `follow-redirects` 1.16.2, `form-data` 4.0.6, `sql-escaper` 1.5.2 y otras menores. Dejan de usarse `buffer-from`, `concat-stream`, `denque` y `typedarray`.

Producción del frontend: `react-router-dom` y `react-router` 7.13.2 → 7.18.5, sin cambios incompatibles anunciados en la línea 7, y `set-cookie-parser` 2.7.3.

En desarrollo cambian, entre otras, `vite`, `postcss`, `nanoid`, `esbuild` y `picomatch`.

## Escalado
`aidd.py lane-check` al empezar: no escala. Al cerrar, sobre el diff real: 3 archivos, 0 de código, no escala.

## Verificación
- `npm test`: 61 pruebas y 6 pendientes en backend, 5 en frontend; sin fallos.
- Lint: solo los errores previos (5 en backend, 15 problemas en frontend). Build del frontend: correcto.
- `npm audit --audit-level=high`: sin hallazgos en ambos paquetes. Quedan 21 moderadas o bajas en backend, 2 de ellas en producción, por `uuid` vía `exceljs`, cuya corrección degradaría `exceljs` a una versión incompatible.
- Comprobado aparte con las versiones nuevas: una imagen válida se guarda, una de 7 MB responde 400 con el mensaje de 6 MB, y el escapado de `mysql2` conserva su resultado para texto, número, `null` y fecha.
- **Sin verificar:** las consultas reales contra MySQL con `mysql2` 3.24.6; las pruebas usan una base simulada. Conviene una comprobación manual antes de desplegar.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-09 | implícita | ¿Cuándo se actualizan las dependencias vulnerables? | Tras implementar la spec 018 y antes de liberarla | docs/specs/018-base-tests-autenticacion/plan.md |
| 2026-11-09 | supuesto | ¿Se corrigen las vulnerabilidades moderadas de `uuid`? | No: exigen degradar `exceljs` y no bloquean la liberación | /chore |
