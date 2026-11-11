---
lane: fix
status: released
released: v1.1.1 (2026-11-11)
base: 2d44f97
relates: [005, 006, 008, 015]
covers: []
escalated_to: null
---

# Fix: datos mal formados del paciente llegan a la base de datos y responden 500

## Problema
Varias rutas con sesión pasan campos del cuerpo a MySQL sin comprobar su tipo ni sus valores
permitidos. Un objeto, una lista, una fecha imposible o un valor fuera del `enum` termina en un
error de MySQL (500) o se guarda distinto de lo enviado, en lugar de responder 400:
- Perfil del paciente (008): `direccion`, `fecha_nacimiento`, `genero` al crear; `telefono`,
  `direccion`, `genero` al editar. Desde la web, "Mi perfil" puede enviar `genero: ""` (opción
  "Seleccionar...") a una columna `enum`.
- Reseñas (015): `comentario`, `calificacion`, `id_cita`.
- Citas del paciente (005): `fecha_agendada`, `id_servicio` y `motivo`; un servicio inexistente
  también da 500.
- `GET /citas/:id` (006) con un id que no es número lanza `Error` en vez de `AppError`: 500.

Detectado en las revisiones ligeras de las fichas `2026-11-10-fix-registro-campos-no-texto` y
en las observaciones de la spec 006.

## Reproducción
- `backend/tests/pacientes/perfil-tipos.test.js` (008), `backend/tests/comentarios/comentario-tipos.test.js`
  (015) y `backend/tests/citas/tipos-paciente.test.js` (005, 006): antes del arreglo fallan 26 de 30
  casos (se acepta el dato y se guarda, o `Received promise resolved instead of rejected`; con un
  servicio inexistente o un id de cita no numérico, error no operacional → 500).
- Los casos `fecha_agendada: [fecha]` ya pasaban: los rechaza `validarHorarioDeAtencion` (ficha
  `2026-11-10-fix-horario-cita-paciente`). Se dejan como caracterización.

## Causa raíz
Los servicios solo comprobaban que los campos no estuvieran vacíos. Un valor no vacío de otro tipo
(objeto, lista, texto no numérico), una fecha imposible o un valor fuera del `enum` pasaba directo
al repositorio; mysql2 lo convierte en SQL y MySQL 8 en modo estricto lo rechaza (500) o se guarda
otro valor. Además, `getCitaById` lanzaba `Error` en vez de `AppError` y `createCitaPaciente` no
comprobaba que el servicio existiera.

## Cambio
- `backend/src/modules/pacientes/pacientes.service.js`: validaciones de teléfono (10 dígitos, ahora
  también al editar), dirección (texto hasta 400), género (`masculino`, `femenino`, `otro`; vacío
  → `null`) y fecha de nacimiento (`AAAA-MM-DD` real), antes de escribir.
- `backend/src/modules/comentarios/comen.service.js`: `comentario` texto, `calificacion` y `id_cita`
  enteros; el repositorio recibe solo esos tres campos ya convertidos. El rango 1–5 se revisa donde
  antes.
- `backend/src/modules/citas/citas.service.js`: `id_servicio` entero positivo y 404 si el servicio no
  existe al agendar; `motivo` texto al reprogramar y al cancelar (paciente y personal);
  `getCitaById` con id no numérico responde 400.
- Commit `fix(fix-tipos-entrada-paciente): validar tipos de perfil, reseñas y citas antes de la
  base de datos`.

## Escalado
`lane-check` al cerrar: "Escalar: no. El cambio cabe en el carril" (3 archivos de código).

## Verificación
- Las pruebas nuevas fallan con el código revertido (26 de 30) y pasan con él.
- Suite del backend: 160 pasan, 5 pendientes (`todo`), 0 fallos.
- Lint del backend: los 4 errores previos; los archivos tocados sin errores.
- Revisión ligera: sin bloqueantes y sin regresiones con la web. Revisados los envíos de
  `CompletarPerfil`, `PerfilPaciente`, `CitasPaciente`, `InicioPaciente` y `CitasAdmin`; todos
  cumplen las nuevas reglas. Hallazgo menor corregido: el motivo al cancelar tenía el mismo defecto.
- Liberada en v1.1.1 (2026-11-11), aprobada por el usuario. En producción: servicios arriba, `DELETE /api/v1/citas/1` responde 404 "Cannot DELETE", agendar, crear y cancelar funcionan y sin errores 500 en los logs.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-10 | implícita | Un dato mal formado debe responder 400, no 500 ni guardarse alterado | Defecto evidente; se valida antes de llegar a la base de datos | síntoma |
| 2026-11-10 | supuesto | ¿Una ficha para los cuatro casos? | Sí, son el mismo defecto en 3 servicios | usuario |
| 2026-11-10 | supuesto | Editar el perfil ahora exige teléfono de 10 dígitos, como al crearlo (008 CA1); antes no validaba | La web ya lo limpia a 10 dígitos y es la única que usa la ruta | /fix |
| 2026-11-10 | supuesto | `genero: ""` ("Seleccionar...") se guarda como `null`; antes daba 500 | Equivale a sin género, el valor por defecto de la columna | /fix |
| 2026-11-10 | supuesto | Una calificación no entera (4.5, "abc") responde 400 antes de comprobar la cita (403/404) | No revela nada de la cita; el rango 1–5 sigue en su lugar | /fix |
