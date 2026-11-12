---
id: 021
slug: proteccion-cuentas-admin
status: approved
created: 2026-11-11
extends: [004]
---

# 021 · Protección de las cuentas del personal

## Problema
El Administrador gestiona las cuentas desde el panel, pero el sistema acepta datos que no
debería: un rol o un estado que no existen, un correo repetido o mal escrito, una contraseña más
débil que la exigida en el registro. Hoy esos casos terminan en un error del servidor o en una
cuenta guardada con datos incorrectos. Además, nada impide eliminar, desactivar o quitar el rol al
único Administrador activo, y la clínica se quedaría sin nadie que pueda gestionar el sistema.
Atiende el riesgo RS1 **parcialmente**: solo sus correcciones pendientes (RS1.b y RS1.c); RS1.a y
RS1.d ya se mitigaron en v1.1.0. Cierra el objetivo 2 del roadmap.

## Historias de usuario
- H1 · Como Administrador, quiero que el alta y la edición de cuentas solo acepten datos válidos,
  para no crear cuentas rotas ni recibir errores sin explicación.
- H2 · Como Administrador, quiero que el sistema no me deje eliminar, desactivar o quitar el rol
  al último Administrador activo, para que la clínica nunca pierda el acceso a la gestión.

## Criterios de aceptación
**Datos de las cuentas (H1)**
- [x] CA1 · Dado un alta o una edición con campos que no son de la cuenta (por ejemplo, fecha de
  registro, identificador de Google o identificador de la cuenta), cuando se guarda, entonces esos
  campos se ignoran y no cambian en la cuenta.
- [x] CA2 · Dado un alta sin nombre, apellido, correo, contraseña o rol, cuando se guarda,
  entonces se rechaza con un aviso que nombra lo que falta y no se crea la cuenta.
- [x] CA3 · Dada una contraseña que no cumple las reglas del registro (001 CA3: al menos 8
  caracteres en producción y no más de 72 bytes), en un alta o al cambiarla en una edición,
  entonces se rechaza con el aviso de esas reglas y la cuenta no cambia.
- [x] CA4 · Dado un correo con formato inválido, o que ya usa otra cuenta, en un alta o al
  cambiar el correo en una edición, entonces se rechaza con un aviso claro y la cuenta no cambia.
  Editar otros datos de una cuenta cuyo correo guardado no cumple el formato se permite.
- [x] CA5 · Dado un rol que no es Administrador, Asistente ni Paciente, o un estado que no es
  activo ni inactivo, entonces se rechaza con un aviso claro y la cuenta no cambia.
- [x] CA6 · (abuso) Dado un dato que no es texto donde se espera texto, o más largo de lo que la
  cuenta admite, entonces se rechaza con un aviso claro, nunca con un error del servidor.

**Último Administrador (H2)**
- [x] CA7 · Dada una sola cuenta de Administrador activa, cuando se intenta eliminarla,
  desactivarla o cambiarle el rol, incluso si lo hace ese mismo Administrador sobre su cuenta,
  entonces se rechaza con el aviso "Debe quedar al menos un Administrador activo" y la cuenta no
  cambia, tampoco se desactiva en lugar de eliminarse. Reemplaza 004 CA8 y modifica 004 CA5 para
  el último Administrador activo.
- [x] CA8 · Dados dos o más Administradores activos, cuando uno elimina, desactiva o cambia el rol
  de otro Administrador o el suyo, entonces se permite como hoy.
- [x] CA9 · Dado el único Administrador activo, cuando se edita su nombre, apellido, correo,
  teléfono, imagen o contraseña sin cambiar su rol ni su estado, entonces se permite; y reactivar
  a un Administrador inactivo siempre se permite.
- [x] CA10 · (abuso) Dados dos Administradores activos que, al mismo tiempo, se quitan el rol o
  se desactivan entre sí, entonces al terminar queda al menos un Administrador activo: una de las
  dos acciones se rechaza con el aviso de CA7.

**Panel (H1, H2)**
- [x] CA11 · Dado un rechazo de CA2 a CA7, cuando el Administrador guarda o elimina desde el
  panel, entonces ve el motivo en un aviso que también se anuncia a lectores de pantalla, el
  formulario conserva lo escrito y la lista de cuentas no cambia.

## Fuera de alcance
- Registro de auditoría de altas, bajas y cambios de rol: lo crea el objetivo 3 del roadmap
  (OB1.e), para todos los eventos a la vez.
- Recuperar el acceso si el único Administrador olvida su contraseña o pierde su cuenta (sigue
  siendo la recuperación por correo de 003).
- Cambiar quién puede gestionar cuentas: sigue siendo solo el Administrador (004 CA7).
- Normalizar el correo (espacios, mayúsculas) en el registro público: deuda aparte del roadmap.
- Rediseñar la pantalla de usuarios.

## Seguridad y privacidad
- Datos sensibles involucrados: nombre, correo, teléfono, contraseña y rol del personal y de los
  pacientes (datos personales, `docs/security.md`).
- Quién puede hacer qué: solo el Administrador crea, edita, desactiva y elimina cuentas; nadie,
  ni él mismo, puede dejar la clínica sin un Administrador activo.
- Casos de abuso:
  - Como Administrador malintencionado o con la sesión robada, intento dejar la clínica sin
    Administradores (eliminando, desactivando o degradando al último) → se rechaza (CA7, CA10).
  - Como cliente que llama directamente al sistema, intento colar campos que no son de la cuenta
    o valores fuera de lo permitido → se ignoran o se rechazan sin error del servidor (CA1, CA5,
    CA6).

## Cobertura de riesgos
| Corrección | Alcance | Criterios / motivo y destino |
|---|---|---|
| RS1.a — Restringir las rutas de `/usuarios` al rol Administrador | fuera | Ya mitigada en v1.1.0 (ficha 2026-11-09-fix-permisos-asistente) |
| RS1.b — Limitar con lista de campos permitidos lo que aceptan alta y edición | dentro | CA1, CA2, CA3, CA4, CA5, CA6, CA11 |
| RS1.c — Impedir que se elimine o degrade al último Administrador | dentro | CA7, CA8, CA9, CA10, CA11 |
| RS1.d — Cubrir con tests de autorización cada rol y ruta | fuera | Ya mitigada en v1.1.0 (spec 018 y ficha 2026-11-09-fix-permisos-asistente) |
| OB1.a — Crear la tabla de auditoría de solo anexado con retención de 5 años | fuera | Decisión del usuario: la auditoría se hace completa en un solo paso → objetivo 3 del roadmap |
| OB1.b — Auditar logins y accesos denegados | fuera | No es de esta spec → objetivo 3 del roadmap |
| OB1.c — Auditar lecturas de historial clínico y datos de paciente | fuera | No es de esta spec → objetivo 3 del roadmap |
| OB1.d — Auditar altas y cambios de pacientes e historial clínico | fuera | No es de esta spec → objetivo 3 del roadmap |
| OB1.e — Auditar cambios de roles, acciones administrativas y exportaciones | fuera | Depende de la tabla de auditoría; decisión del usuario → objetivo 3 del roadmap |
| OB1.f — Exponer la consulta solo al Administrador y auditar cada lectura | fuera | Depende de la tabla de auditoría → objetivo 3 del roadmap |

## Auditoría
No aplica en esta spec: el registro de auditoría todavía no existe. El evento obligatorio "Cambio
de permisos o roles" (`docs/observability.md`) lo implementa el objetivo 3 del roadmap (OB1.e),
por decisión del usuario.

## Diseño
No aplica: sin cambios visuales. El Administrador sigue usando la pantalla de usuarios del panel;
los rechazos se muestran con el aviso que ya tiene el formulario y con el aviso que ya tiene el
diálogo de eliminar ([docs/design/system.md](../../design/system.md)). CA11 se comprueba con
pruebas, sin ciclo de diseño.

## Requisitos no funcionales
- Accesibilidad: el aviso de rechazo se anuncia a lectores de pantalla y cumple el contraste de la
  constitución (WCAG AA).
- Ningún aviso revela datos de otra cuenta más allá de que el correo ya está en uso.

## Preguntas abiertas
Ninguna.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-11 | brecha | ¿Qué acciones se bloquean sobre el último Administrador? | Eliminar, desactivar y cambiar rol, aunque lo haga él mismo; con otro Administrador activo, todo se permite como hoy | usuario |
| 2026-11-11 | contradicción | `docs/observability.md` exige auditar los cambios de rol, pero el registro de auditoría no existe | Fuera de esta spec; lo implementa el objetivo 3 (OB1.e) | usuario |
| 2026-11-11 | implícita | Reglas de la contraseña en el alta | Las mismas del registro (001 CA3) | `docs/specs/001-auth-registro-login/spec.md` CA3 |
| 2026-11-11 | implícita | Solo el Administrador gestiona cuentas | Sin cambios | `docs/specs/004-gestion-usuarios/spec.md` CA7, `docs/security.md` RS1 |
| 2026-11-11 | brecha | Al editar, ¿se valida el formato de los datos que no cambian (cuentas antiguas)? | Solo se valida lo que cambia; una cuenta antigua se puede editar (CA4) | usuario (/analyze A8) |
| 2026-11-11 | cierre | CA7 también cambia 004 CA5 (eliminar al último Administrador con información asociada ya no lo desactiva) | Declarado en CA7 | /analyze A6 |
| 2026-11-11 | cierre | El aviso de eliminar aparece en otro diálogo, no en el propio | CA11 dice "en un aviso" que se anuncia a lectores de pantalla | /analyze A9 |
| 2026-11-11 | supuesto | ¿Qué cuenta como "último"? | El único Administrador con cuenta activa; los inactivos no cuentan | /specify |
| 2026-11-11 | supuesto | ¿El Administrador puede seguir creando cuentas de Paciente desde el panel? | Sí: los tres roles existentes son válidos | /specify |
| 2026-11-11 | brecha | ¿Una spec o dos (datos válidos y último Administrador)? | Una sola: ambas cierran el objetivo 2 y tocan la misma pantalla | usuario (al aprobar) |
| 2026-11-11 | diseño | ¿Hace falta /design-spec si no hay cambios visuales? | No: Diseño "No aplica"; se reutilizan los avisos existentes del formulario y del diálogo | usuario |

## Notas para /plan
- El repositorio ya filtra con un mapa de campos al editar (`user.repository.js` → `updateUsuario`);
  el alta desestructura campos. Falta validar los valores.
- Correo repetido: hoy choca con la restricción única y responde 500 (`errno 1062`).
- Reutilizar la validación de contraseña del registro (`auth.service.js` → `validarContrasena`).
- El conteo de Administradores activos y el cambio deben ser atómicos (CA10): transacción con
  bloqueo de filas.
- El formulario envía `FormData` con imagen (`AdminUsuarios.jsx`), y `AdminPanel` monta
  `AdminUsuarios` en un modal.

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-11 | Spec creada en borrador | /specify, objetivo 2 del roadmap |
| 2026-11-11 | Aprobada | usuario |
| 2026-11-11 | Diseño pasa a "No aplica" (sin cambios visuales); se quitan los criterios de diseño | /specify --edit, decisión del usuario |
| 2026-11-11 | CA4 (solo se valida el correo que cambia), CA7 (modifica 004 CA5) y CA11 (aviso anunciado); vuelve a draft | /analyze A6, A8, A9 |
| 2026-11-11 | Aprobada de nuevo | usuario |
| 2026-11-11 | Implementada: CA1–CA11 con sus pruebas en verde | /implement |
| 2026-11-12 | Vuelve a approved: /review ronda 1 pide correcciones (R1–R7) | /review |
