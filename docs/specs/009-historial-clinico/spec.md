---
id: 009
slug: historial-clinico
status: inferred
confidence: alta
created: 2026-11-08
extends: []
---

# 009 · Historial clínico

## Problema
La clínica debe registrar y consultar lo atendido en cada consulta de sus pacientes. Como spec inferida, atiende los riesgos que cita solo parcialmente: los documenta sin corregirlos.

## Historias de usuario
- Como personal, quiero finalizar una cita registrando el diagnóstico.
- Como personal, quiero dar de alta a un paciente con su primera consulta.
- Como personal, quiero consultar y corregir el historial de un paciente.

## Criterios de aceptación
<!-- Spec inferida: [x] = cubierto por un test; [ ] = observado en el código, sin test. -->
- [ ] CA1 · Dada una cita `pendiente` y un diagnóstico, cuando se finaliza, entonces se crea el historial y la cita pasa a `completada` en una sola transacción.
- [ ] CA2 · Dada una finalización sin diagnóstico, entonces responde 400.
- [ ] CA3 · Dada una cita ya procesada, entonces responde 400.
- [ ] CA4 · Dado un alta de paciente con datos válidos, entonces se crean usuario y paciente, y su consulta si se envía, en una transacción.
- [ ] CA5 · Dado un correo ya registrado, entonces responde 409.
- [ ] CA6 · Dados nombre, correo, teléfono, género o fechas inválidos, entonces responde 400.
- [ ] CA7 · Dado un historial existente, cuando se edita, entonces servicio y diagnóstico no pueden quedar vacíos.
- [ ] CA8 · Dado un paciente, entonces se consulta su perfil con sus consultas.
- [ ] CA9 · (abuso) Solo Administrador y Asistente acceden; un paciente recibe rechazo.
- [ ] CA10 · (abuso) Toda lectura o cambio de un historial queda auditado. **HOY NO SE CUMPLE:** no hay auditoría (OB1).

## Fuera de alcance
- Consulta del historial por el propio paciente: no existe.

## Seguridad y privacidad
- Datos sensibles involucrados: diagnóstico, observaciones, servicio, datos del paciente (salud).
- Quién puede hacer qué: solo Administrador y Asistente.
- Casos de abuso:
  - Como paciente, intento leer un historial → se rechaza (CA9).
  - Como personal, consulto un expediente sin motivo → debe quedar registrado (CA10).

## Cobertura de riesgos
Esta spec documenta el comportamiento actual y no corrige los riesgos citados.

| Corrección | Alcance | Criterios / motivo y destino |
|---|---|---|
| OB1.a — Crear la tabla de auditoría de solo anexado con retención de 5 años | fuera | Spec inferida: describe el estado actual → objetivo 3 del roadmap |
| OB1.b — Auditar logins y accesos denegados | fuera | Spec inferida: describe el estado actual → objetivo 3 del roadmap |
| OB1.c — Auditar lecturas de historial clínico y datos de paciente | fuera | Spec inferida: describe el estado actual → objetivo 3 del roadmap |
| OB1.d — Auditar altas y cambios de pacientes e historial clínico | fuera | Spec inferida: describe el estado actual → objetivo 3 del roadmap |
| OB1.e — Auditar cambios de roles, acciones administrativas y exportaciones | fuera | Spec inferida: describe el estado actual → objetivo 3 del roadmap |
| OB1.f — Exponer la consulta solo al Administrador y auditar cada lectura | fuera | Spec inferida: describe el estado actual → objetivo 3 del roadmap |

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|

## Evidencia (solo si status=inferred)
- Archivos: `backend/src/modules/historial/*`, `frontend/src/pages/admin/AdminHistorial.jsx`, `AdminHPaciente.jsx`, `frontend/src/components/ModalRegistrarPaciente.jsx`
- Tests: sin tests

## Observaciones (solo si status=inferred)
- Los pacientes dados de alta aquí reciben una contraseña aleatoria; entran con la recuperación de contraseña.
- Editar un historial no conserva la versión anterior; revisar con la NOM-004.
- Los datos clínicos no se cifran a nivel de aplicación.

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-08 | Spec inferida del código | /init |
