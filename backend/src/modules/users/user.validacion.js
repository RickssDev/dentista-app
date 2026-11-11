// Validación de los datos de una cuenta del panel (spec 021, RS1.b).
// Solo se aceptan los campos de la lista blanca; el resto del cuerpo se ignora.
const AppError = require('../../utils/AppError');
const { validarContrasena } = require('../auth/auth.service');

// Largos de las columnas de `usuarios` (backend/db/schema.sql)
const MAXIMOS = { nombre: 55, apellido: 55, correo: 100, telefono: 20 };
const ESTADOS = ['activo', 'inactivo'];
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ETIQUETAS = {
  nombre: 'nombre',
  apellido: 'apellido',
  correo: 'correo',
  telefono: 'teléfono',
  password: 'contraseña',
  id_rol: 'rol',
  estado: 'estado',
};

const OBLIGATORIOS_ALTA = ['nombre', 'apellido', 'correo', 'password', 'id_rol'];

const vacio = (valor) => valor === undefined || valor === null || valor === '';

const exigirTexto = (campo, valor) => {
  if (typeof valor !== 'string') {
    throw new AppError(`El campo ${ETIQUETAS[campo]} debe ser texto`, 400);
  }
};

const validarLargo = (campo, valor) => {
  if (valor.length > MAXIMOS[campo]) {
    throw new AppError(`El ${ETIQUETAS[campo]} admite como máximo ${MAXIMOS[campo]} caracteres`, 400);
  }
};

const validarCorreo = (correo) => {
  validarLargo('correo', correo);
  if (!FORMATO_CORREO.test(correo)) {
    throw new AppError('El correo no es válido', 400);
  }
};

// El panel envía FormData: el rol llega como texto ("1")
const normalizarRol = (valor) => {
  const esNumero = typeof valor === 'number' && Number.isInteger(valor);
  const esTextoNumerico = typeof valor === 'string' && /^\d+$/.test(valor);

  if ((!esNumero && !esTextoNumerico) || Number(valor) < 1) {
    throw new AppError('El rol no es válido', 400);
  }

  return Number(valor);
};

const validarEstado = (estado) => {
  if (!ESTADOS.includes(estado)) {
    throw new AppError('El estado no es válido', 400);
  }
};

// El correo llega como `correo` o con su alias `email`
const leerCampos = (body = {}) => ({
  nombre: body.nombre,
  apellido: body.apellido,
  correo: vacio(body.correo) ? body.email : body.correo,
  telefono: body.telefono,
  password: body.password,
  id_rol: body.id_rol,
  estado: body.estado,
});

exports.limpiarAlta = (body) => {
  const campos = leerCampos(body);

  const faltan = OBLIGATORIOS_ALTA.filter((campo) => vacio(campos[campo]));
  if (faltan.length > 0) {
    throw new AppError(
      `Faltan campos obligatorios: ${faltan.map((campo) => ETIQUETAS[campo]).join(', ')}`,
      400,
    );
  }

  for (const campo of ['nombre', 'apellido', 'correo', 'password']) {
    exigirTexto(campo, campos[campo]);
  }
  validarLargo('nombre', campos.nombre);
  validarLargo('apellido', campos.apellido);
  validarCorreo(campos.correo);
  validarContrasena(campos.password);

  const datos = {
    nombre: campos.nombre,
    apellido: campos.apellido,
    correo: campos.correo,
    password: campos.password,
    id_rol: normalizarRol(campos.id_rol),
  };

  if (!vacio(campos.telefono)) {
    exigirTexto('telefono', campos.telefono);
    validarLargo('telefono', campos.telefono);
    datos.telefono = campos.telefono;
  }

  return datos;
};

// Devuelve solo los campos que cambian respecto a la cuenta guardada. Los tipos se rechazan
// siempre; el formato solo se valida en lo que cambia, para que una cuenta antigua con un dato
// fuera de las reglas se pueda seguir editando (spec 021 CA4).
exports.limpiarEdicion = (body, guardada) => {
  const campos = leerCampos(body);
  const recibidos = Object.keys(campos).filter((campo) => !vacio(campos[campo]));
  const cambios = {};

  const actuales = {
    nombre: guardada.nombre_usuario,
    apellido: guardada.apellido,
    correo: guardada.correo,
    telefono: guardada.telefono,
    estado: guardada.estado,
  };

  for (const campo of ['nombre', 'apellido', 'correo', 'telefono', 'estado']) {
    if (vacio(campos[campo])) continue;
    exigirTexto(campo, campos[campo]);
    if (campos[campo] === actuales[campo]) continue;

    if (campo === 'correo') validarCorreo(campos.correo);
    else if (campo === 'estado') validarEstado(campos.estado);
    else validarLargo(campo, campos[campo]);

    cambios[campo] = campos[campo];
  }

  if (!vacio(campos.password)) {
    validarContrasena(campos.password);
    cambios.password = campos.password;
  }

  if (!vacio(campos.id_rol)) {
    const idRol = normalizarRol(campos.id_rol);
    if (idRol !== Number(guardada.rol_id)) cambios.id_rol = idRol;
  }

  return { cambios, recibidos: recibidos.length };
};
