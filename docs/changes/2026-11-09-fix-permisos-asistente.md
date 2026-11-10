---
lane: fix
status: done
base: 49cf01a
relates: [004]
covers: [CA7]
escalated_to: null
---

# Fix: el Asistente puede administrar cuentas y roles

## Problema
Las rutas de usuarios admiten al Asistente, que puede crear Administradores, cambiar roles y restablecer contraseñas (RS1).

## Reproducción
`backend/tests/usuarios/permisos.test.js`, `004 CA7`: antes del arreglo, `Expected: 403` en las cinco rutas.

## Causa raíz
Las rutas de `/usuarios` autorizan a Administrador y Asistente, y el servicio acepta `id_rol` y `password` del cuerpo. El menú ya ocultaba Usuarios al Asistente, pero la API no lo aplicaba.

## Cambio
Las cinco rutas de `/usuarios` quedan solo para Administrador. En el panel, el Asistente no ve el acceso rápido "Agregar paciente" y la ruta de usuarios lo devuelve al inicio.

## Escalado
`lane-check` marca seguridad. Se mantiene en el carril por decisión del usuario. Atiende RS1.a y RS1.d; RS1.b y RS1.c quedan pendientes.

## Verificación
Las pruebas de backend y frontend fallan sin el arreglo y pasan con él. Suite completa, lint y build correctos. Revisión ligera sin bloqueantes: el Asistente sigue registrando pacientes desde Historial.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-09 | supuesto | ¿Escalar por tocar permisos? | Vía ligera para todas las correcciones | usuario |
| 2026-11-09 | brecha | ¿El Asistente da de alta pacientes desde usuarios? | No: nada de usuarios | usuario |
