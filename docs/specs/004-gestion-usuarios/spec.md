---
id: 004
slug: gestion-usuarios
status: inferred
confidence: alta
created: 2026-11-08
extends: []
---

# 004 · Gestión de usuarios

## Problema
La clínica necesita administrar las cuentas del personal y de los pacientes. Como spec inferida, atiende los riesgos que cita solo parcialmente: los documenta sin corregirlos.

## Historias de usuario
- Como Administrador, quiero crear, editar y desactivar cuentas para controlar quién accede.

## Criterios de aceptación
<!-- Spec inferida: [x] = cubierto por un test; [ ] = observado en el código, sin test. -->
- [ ] CA1 · Dado personal autenticado, cuando consulta `/usuarios`, entonces obtiene las cuentas con su rol.
- [ ] CA2 · Dado un alta con contraseña, entonces se guarda en bcrypt y la cuenta queda activa.
- [ ] CA3 · Dada una edición, entonces solo cambian los campos con valor; una contraseña nueva se guarda en bcrypt.
- [ ] CA4 · Dada una imagen nueva, entonces la anterior se borra del disco.
- [ ] CA5 · Dada una cuenta con información asociada, cuando se elimina, entonces se desactiva en lugar de borrarse.
- [ ] CA6 · Dado un usuario sin rol de personal, entonces la API rechaza el acceso.
- [x] CA7 · (abuso) Un Asistente no puede crear, editar ni eliminar cuentas, ni asignar roles.
- [ ] CA8 · (abuso) No se puede eliminar o degradar al último Administrador. **HOY NO SE CUMPLE:** no hay comprobación (RS1).

## Fuera de alcance
- Alta de pacientes desde historial (009).

## Seguridad y privacidad
- Datos sensibles involucrados: nombre, correo, teléfono, contraseña, rol.
- Quién puede hacer qué: solo Administrador debe gestionar cuentas y roles (decisión del usuario, 2026-11-08).
- Casos de abuso:
  - Como Asistente malintencionado, intento darme rol de Administrador → debe rechazarse (CA7).

## Cobertura de riesgos
Esta spec documenta el comportamiento actual y no corrige los riesgos citados.

| Corrección | Alcance | Criterios / motivo y destino |
|---|---|---|
| RS1.a — Restringir las rutas de `/usuarios` al rol Administrador | fuera | Spec inferida: describe el estado actual → objetivo 2 del roadmap |
| RS1.b — Limitar con lista de campos permitidos lo que aceptan alta y edición | fuera | Spec inferida: describe el estado actual → objetivo 2 del roadmap |
| RS1.c — Impedir que se elimine o degrade al último Administrador | fuera | Spec inferida: describe el estado actual → objetivo 2 del roadmap |
| RS1.d — Cubrir con tests de autorización cada rol y ruta | fuera | Spec inferida: describe el estado actual → objetivo 2 del roadmap |

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-08 | brecha | ¿Qué puede hacer un Asistente sobre las cuentas? | Solo el Administrador gestiona usuarios y roles | usuario |

## Evidencia (solo si status=inferred)
- Archivos: `backend/src/modules/users/*`, `frontend/src/pages/admin/AdminUsuarios.jsx`
- Tests: sin tests

## Observaciones (solo si status=inferred)
- `AdminPanel` monta `AdminUsuarios` en un modal del dashboard; restringir `/usuarios` puede afectar lo que usa el Asistente (revisar en `/plan`).
- El alta no valida campos ni longitud de contraseña, a diferencia del registro.

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-08 | Spec inferida del código | /init |
| 2026-11-09 | CA7 cumplido: solo el Administrador accede a las rutas de usuarios | Ficha fix-permisos-asistente |
