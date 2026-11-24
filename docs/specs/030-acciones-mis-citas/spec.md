---
id: 030
slug: acciones-mis-citas
status: approved
created: 2026-11-23
extends: [005]
---

# 030 · Reprogramar y cancelar desde «Mis citas»

## Problema
En el portal, el paciente solo puede reprogramar o cancelar una cita desde Inicio, en la tarjeta
«Próxima cita». Si tiene varias citas pendientes, solo puede actuar sobre la más cercana. Además,
en «Mis citas», que es donde ve todas, no tiene ninguna acción para hacerlo. Termina llamando a la
clínica o buscando la opción en otra pantalla.

## Historias de usuario
- Como paciente, quiero reprogramar desde «Mis citas» cualquiera de mis citas pendientes que aún
  no han pasado, para cambiarla sin ir a Inicio.
- Como paciente, quiero cancelar desde «Mis citas» cualquiera de mis citas pendientes que aún no
  han pasado, para liberar el horario si no puedo asistir.

## Criterios de aceptación
- [ ] CA1 · Dada una cita propia `pendiente` que aún no empieza (su fecha y hora de inicio son
  posteriores a la hora actual de México), cuando el paciente abre «Mis citas», entonces su
  tarjeta muestra las acciones «Reprogramar» y «Cancelar cita».
- [ ] CA2 · Dada una cita `completada`, `cancelada` o en cualquier otro estado distinto de
  `pendiente`, o una `pendiente` que ya empezó, cuando el paciente abre «Mis
  citas», entonces su tarjeta no muestra esas acciones. Las completadas siguen mostrando «Dejar
  comentario» o «Comentario enviado» como hoy.
- [ ] CA3 · Dada una cita con las acciones, cuando el paciente elige «Reprogramar», entonces ve el
  mismo formulario que en Inicio: nueva fecha, horarios disponibles para el servicio de esa cita
  y motivo obligatorio. Al confirmarlo, esa tarjeta muestra la nueva fecha y hora sin recargar la
  página, y aparece el aviso «Tu cita se reprogramó correctamente.».
- [ ] CA4 · Dada una cita con las acciones, cuando el paciente elige «Cancelar cita», entonces se
  le pide el motivo, como en Inicio. Al confirmarlo, esa tarjeta pasa a `cancelada` sin
  recargar la página y ya no muestra las acciones.
- [ ] CA5 · Dado que el servidor rechaza la reprogramación o la cancelación (por ejemplo, el
  horario se ocupó o la cita ya no está pendiente), cuando el paciente confirma, entonces ve el
  motivo del rechazo en el formulario y la tarjeta conserva sus datos anteriores.
- [ ] CA6 · Dado que el paciente tiene varias citas pendientes, cuando reprograma o cancela una
  desde «Mis citas», entonces solo cambia esa cita, y las demás tarjetas conservan sus datos y
  sus acciones.
- [ ] CA7 · Dado el Inicio del paciente, entonces la tarjeta «Próxima cita» y sus acciones
  funcionan igual que hoy. Tras reprogramar o cancelar desde «Mis citas», Inicio muestra la
  próxima cita actualizada al volver a abrirlo.
- [ ] CA8 · (abuso) Dada una cita de otro paciente, cuando alguien intenta reprogramarla o
  cancelarla aunque no aparezca en su lista, entonces el servidor la rechaza sin revelar que
  existe y la cita no cambia (spec 005 CA10).
- [ ] CA10 · (abuso) Dada una cita propia `pendiente` que ya terminó (su hora de inicio más la
  duración del servicio ya pasaron en la hora de México), cuando alguien intenta reprogramarla o
  cancelarla llamando al servidor directamente, entonces se rechaza con el mensaje «Esta cita ya
  pasó y no se puede modificar.» y la cita no cambia. Una cita en curso, que ya empezó pero no ha
  terminado, se sigue pudiendo modificar desde Inicio, como hoy (CA7).
- [ ] CA9 · Dadas varias tarjetas con acciones, cuando un lector de pantalla recorre «Mis
  citas», entonces cada acción se anuncia con la cita a la que pertenece (servicio y fecha), y
  todas se pueden usar solo con el teclado.

## Fuera de alcance
- Cambiar las reglas de reprogramación o cancelación: quién, qué estados, horarios y el motivo
  obligatorio (spec 005).
- Cambiar la tarjeta «Próxima cita» de Inicio o sus acciones.
- Que el paciente reprograme o cancele una pendiente que ya terminó: la resuelve el personal. El
  servidor lo rechaza (CA10).
- Nuevas acciones (confirmar, ver detalle, descargar).
- Las pantallas de citas del personal (spec 006).

## Seguridad y privacidad
- Datos sensibles involucrados: citas y su motivo, clasificados como confidenciales en `docs/security.md`.
- Quién puede hacer qué: cada paciente, solo sobre sus propias citas `pendiente`. No cambia
  respecto a la spec 005.
- Casos de abuso:
  - Como paciente, intento reprogramar o cancelar la cita de otro paciente enviando su
    identificador → se rechaza sin revelar que existe (CA8).
  - Como paciente, intento reprogramar o cancelar por el servidor una cita propia que ya pasó,
    aunque la pantalla no lo ofrezca → se rechaza (CA10).

## Auditoría
Sin eventos nuevos en esta spec. Reprogramar y cancelar citas ya existen; esta spec solo añade
otro punto de entrada en la interfaz y el rechazo de CA10. La constitución (P13) pide auditar los
cambios en datos de pacientes, pero el registro de auditoría no existe todavía. El usuario extendió
el 2026-11-23 la excepción P13 (aprobada el 2026-11-11 para acciones administrativas) a las
acciones del paciente sobre sus citas, hasta el objetivo 3 del roadmap (specs 027 y 028).

## Diseño
Cambia solo la pantalla «Mis citas» del portal del paciente. Las tarjetas de las citas
pendientes futuras ganan las mismas dos acciones que ya tiene la tarjeta «Próxima cita» de Inicio,
en la misma zona de acciones donde hoy está «Dejar comentario». El resto de la pantalla y las
demás tarjetas no cambian («sin romper diseños», decisión del usuario). Sistema:
[docs/design/system.md](../../design/system.md). Acta de diseño: [design.md](design.md).

- Qué debe lograr: que el paciente vea de un vistazo qué citas puede cambiar y lo haga en dos
  pasos (acción y confirmación).
- Recursos de marca: los del sistema; no hay recursos nuevos.
- Qué debe diseñarse: nada nuevo. Se reutilizan la tarjeta de cita, los botones y el formulario
  de Inicio.

## Criterios de diseño
Modo: operar · umbral 80 · mínimo por punto 3 · presupuesto 3 candidatos.

| ID | Qué se mide | Objetivo | Sale de |
|---|---|---|---|
| K1 | Acciones en las tarjetas pendientes futuras | «Reprogramar» y «Cancelar cita» visibles en la tarjeta a 390 y 1440 px, con los mismos estilos de botón que Inicio, repartiendo el ancho de la tarjeta como su zona de acciones | CA1 |
| K2 | Sin regresión visual | El resto de «Mis citas» y la tarjeta «Próxima cita» de Inicio iguales que hoy a 390 y 1440 px | CA2, CA7 |
| K3 | Accesibilidad de las acciones | Nombre accesible con servicio y fecha; uso por teclado; al cerrar, el foco vuelve a un control con foco visible | CA9, constitución P16 |

Puertas: las de `design-spec/references/criterios.md` §2. Rúbrica: pesos por defecto.

## Requisitos no funcionales
- Accesibilidad WCAG 2.1 AA en las acciones y el formulario (constitución P16).
- Los mensajes, en español y sin detalles internos.
- Las reglas viven en el servidor; la pantalla solo ofrece la acción cuando aplica (constitución P17).

## Preguntas abiertas
_(ninguna)_

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-23 | brecha | ¿Qué citas muestran las acciones en «Mis citas»? | Solo las `pendiente` que aún no empiezan | usuario · /analyze A6 |
| 2026-11-23 | brecha | ¿El servidor debe dejar reprogramar o cancelar una pendiente pasada? | No: la rechaza (CA10). «Pasada» es la que ya terminó, para que la tarjeta «Próxima cita» de Inicio, que muestra la cita en curso, siga igual (CA7) | usuario · /analyze A8 (supuesto del umbral: /analyze) |
| 2026-11-23 | brecha | Las rutas de citas del paciente solo exigen sesión: el personal con perfil de paciente también las usa | Se mantiene: cada cuenta solo ve y cambia sus propias citas; queda probado | usuario · /analyze A2 |
| 2026-11-23 | brecha | ¿Se cambia Inicio? | No: «Próxima cita» y sus acciones quedan igual | usuario (petición inicial) |
| 2026-11-23 | implícita | ¿Qué estados se pueden reprogramar o cancelar? | Solo `pendiente`, de la propia cuenta | `docs/specs/005-portal-paciente-citas/spec.md` CA8, CA9, CA10 |
| 2026-11-23 | contradicción | P13 pide auditar los cambios en citas de pacientes; la excepción del 2026-11-11 solo cubría acciones administrativas | Se extiende la excepción P13 a las acciones del paciente sobre sus citas, hasta el objetivo 3 | usuario · /analyze A1 |
| 2026-11-23 | supuesto | Texto del rechazo de CA10 | «Esta cita ya pasó y no se puede modificar.» | /specify (/analyze A8) |
| 2026-11-23 | supuesto | ¿Mismos formularios, textos y avisos que en Inicio? | Sí, los mismos | usuario («mismas acciones que en Inicio») |
| 2026-11-23 | diseño | ¿Cómo se ven las acciones en «Mis citas»? | Sin diseño nuevo: los botones y el formulario de Inicio en la zona de acciones de la tarjeta | [design.md](design.md) |

## Notas para /plan
- El servidor ya permite reprogramar y cancelar las citas propias `pendiente` (spec 005, CA8 a
  CA11). Se espera un cambio solo de interfaz; si el plan descubre que falta algo en el servidor,
  lo dice.
- Conviene reutilizar el formulario de Inicio en lugar de duplicarlo.
- Que la pendiente «aún no pasó» se calcule con la hora de negocio `America/Mexico_City` (AGENTS.md).

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-23 | Spec creada | Petición del usuario: acciones de cita en «Mis citas» |
| 2026-11-23 | Spec aprobada | Confirmación del usuario |
| 2026-11-23 | CA1 y CA2 hasta que la cita empieza; CA10 nuevo (el servidor rechaza las pasadas); auditoría con la excepción extendida; clasificación de datos; K1 y K3 | /analyze A1, A2, A6, A8, A10, A15 (decisiones del usuario) |
