---
id: 018
slug: base-tests-autenticacion
status: released
released: v1.1.0 (2026-11-09)
created: 2026-11-09
extends: []
---

# 018 · Base de tests, integración continua y autenticación

## Problema
El sistema está en producción con datos de salud y no tiene ninguna prueba automatizada: cada cambio se valida a mano. Un error en el acceso puede dejar fuera a pacientes y personal, o abrir la puerta a quien no debe, sin que nadie lo note antes de desplegar. Esta spec crea la base de pruebas, las ejecuta en cada propuesta de cambio y verifica la autenticación actual. Atiende el riesgo RD8 **parcialmente**: las citas quedan para la spec siguiente.

## Historias de usuario
- Como desarrollador, quiero ejecutar todas las pruebas con un solo comando para saber si rompí algo antes de proponer un cambio.
- Como revisor, quiero ver el resultado de las pruebas en cada propuesta de cambio para no integrar lo que rompe el sistema.
- Como responsable de la clínica, quiero que el registro, el inicio de sesión y la recuperación de contraseña estén verificados para que un cambio no impida el acceso.
- Como responsable de los datos, quiero que las pruebas nunca toquen información real para proteger a los pacientes.

## Criterios de aceptación
- [x] CA1 · Dado el repositorio con sus dependencias instaladas y sin credenciales ni servicios reales, cuando un desarrollador ejecuta el único comando documentado, entonces corren las pruebas del servidor y de la interfaz y se informa, para cada una, si aprobó o falló.
- [x] CA2 · Dado cada criterio que hoy se cumple en las specs 001 (CA1 a CA8), 002 (CA1 a CA7) y 003 (CA1 a CA8), cuando corre la suite, entonces existe al menos una prueba que lo verifica y el criterio queda marcado como cubierto en su spec.
- [x] CA3 · Dados los criterios aún incumplidos (001 CA9 y CA10, 002 CA8, 003 CA9 y CA10), cuando corre la suite, entonces cada uno aparece como prueba pendiente visible y no hace fallar el resultado.
- [x] CA4 · Dado el trabajo terminado de esta spec, cuando se comparan las respuestas del sistema antes y después para los criterios del CA2, entonces son las mismas: esta spec no cambia el comportamiento.
- [x] CA5 · Dado un defecto descubierto al escribir una prueba, cuando se confirma, entonces queda como prueba pendiente visible y registrado en el roadmap, sin corregirse en esta spec.
- [x] CA6 · (abuso) Dado un entorno configurado con acceso a los datos de producción, cuando alguien ejecuta la suite, entonces se niega a correr y termina con un mensaje que explica el motivo.
- [x] CA7 · (abuso) Dada una ejecución de la suite, cuando termina, entonces no se envió ningún correo ni mensaje real, ni se hizo ninguna verificación real ante un proveedor externo.
- [x] CA8 · (abuso) Dados los datos de prueba incluidos en el repositorio, cuando se revisan, entonces son ficticios y no contienen información de personas reales ni credenciales.
- [x] CA9 · Dada una propuesta de cambio, cuando se abre o se actualiza, entonces corren automáticamente las pruebas, y si alguna falla la propuesta muestra el estado fallido.
- [x] CA10 · Dada una propuesta de cambio que modifica código del servidor, cuando se valida, entonces se revisa el estilo solo de los archivos cambiados, de modo que el código previo no la bloquee.

## Fuera de alcance
- Pruebas de citas y del perfil del paciente: spec 019 (prevista).
- Pruebas de la portada: spec 020 (prevista).
- Pruebas de gestión de usuarios: objetivo 2 del roadmap.
- Corregir cualquier criterio que hoy no se cumple o defecto que aparezca.
- Exigir un porcentaje mínimo de cobertura de código.
- Pruebas de punta a punta en un navegador real.
- Bloquear la integración desde la configuración del repositorio.

## Seguridad y privacidad
- Datos sensibles involucrados: ninguno real. Las pruebas usan solo datos ficticios de cuentas y contraseñas.
- Quién puede hacer qué: cualquier desarrollador puede ejecutar la suite; nadie puede ejecutarla contra datos de producción.
- Casos de abuso:
  - Como desarrollador descuidado, ejecuto la suite apuntando a producción → se niega a correr (CA6).
  - Como desarrollador descuidado, ejecuto la suite con claves reales → no sale ninguna comunicación real (CA7).
  - Como colaborador, copio datos reales para una prueba → la revisión lo rechaza (CA8).

## Cobertura de riesgos
| Corrección | Alcance | Criterios / motivo y destino |
|---|---|---|
| RD8.a — Adoptar un framework de tests en backend y frontend, con ADR | dentro | CA1 |
| RD8.b — Cubrir autenticación (parte de esta corrección) | dentro | CA2, CA3 |
| RD8.b — Cubrir citas (parte de esta corrección) | fuera | Se divide por tamaño → spec 019 (prevista) |
| RD8.c — Activar la validación automática y añadir tests y linter del backend | dentro | CA9, CA10 |

## Auditoría
No aplica: esta spec no cambia ningún flujo ni añade acceso a datos. La auditoría de la autenticación se atiende en el objetivo 3 del roadmap.

## Requisitos no funcionales
- La suite completa termina en menos de 5 minutos.
- Dos ejecuciones consecutivas sin cambios dan el mismo resultado.

## Preguntas abiertas

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-09 | brecha | ¿Una spec o varias? | Tres: 018 base, CI y autenticación; 019 citas y pacientes; 020 portada | usuario |
| 2026-11-09 | brecha | ¿Qué entra en citas y pacientes (spec 019)? | Citas del paciente (005), citas del personal (006) y perfil (008); sin recordatorios ni historial | usuario |
| 2026-11-09 | brecha | ¿Qué cubre la landing (spec 020)? | Solo la portada | usuario |
| 2026-11-09 | brecha | ¿Qué hacen las pruebas con lo que hoy no se cumple? | Sin cambiar comportamiento: quedan como pruebas pendientes visibles | usuario |
| 2026-11-09 | implícita | ¿Cuándo se exigen pruebas? | Todo cambio de comportamiento lleva prueba antes de integrarse | docs/constitution.md P2 |
| 2026-11-09 | implícita | ¿Las pruebas corren en cada propuesta de cambio, incluido el linter? | Sí, con validación, lint, build y tests | docs/roadmap.md objetivo 1 |
| 2026-11-09 | implícita | ¿Cómo se registra la herramienta? | Con un ADR | docs/deployment.md RD8.a |
| 2026-11-09 | supuesto | ¿Cómo se protege la información real? | La suite se niega a correr contra producción | /specify |
| 2026-11-09 | supuesto | ¿Cuánto puede tardar la suite? | Menos de 5 minutos | /specify |
| 2026-11-09 | supuesto | ¿Cómo se mide la cobertura? | Por criterio de spec cubierto, no por porcentaje de código | /specify |

## Notas para /plan
- Código de partida: `backend/src/config/app.js` crea la app sin arrancar el cron de `backend/server.js`.
- 001 CA3 depende de `NODE_ENV`; 001 CA8 se verifica en la interfaz.
- `.github/workflows/ai-dd.yml` ya existe y tiene un comentario donde añadir los tests.
- El backend es CommonJS y el frontend ES modules con Vite.
- Considerar que `errorHandler.js` reasigna `module.exports` al manejar un error.

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-09 | Spec creada | /specify |
| 2026-11-09 | Aprobada | Confirmación del usuario |
| 2026-11-09 | Redacción de CA3 sin cambiar su significado y fuente de la fila del ADR corregida | Validador y /analyze A28 |
| 2026-11-09 | Liberada en v1.1.0 | /release |
