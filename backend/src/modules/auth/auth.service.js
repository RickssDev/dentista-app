const bcrypt = require('bcrypt');
const JWTFactory = require('../../utils/JWTFactory');
const repo = require('./auth.repository');
const paciente = require('../pacientes/pacientes.repository');

const SALT_ROUNDS = 10;
const ROL_PACIENTE = 3; 
const jwtFactory = new JWTFactory();

exports.register = async ({
  nombre_usuario,
  telefono,
  apellido,
  correo,
  contrasena,
  confirmar_contrasena
}) => {

    if (!nombre_usuario || !telefono || !apellido || !correo || !contrasena || !confirmar_contrasena) {
    const error = new Error('Todos los campos son obligatorios');
    error.statusCode = 400;
    throw error;
  }

  if (contrasena !== confirmar_contrasena) {
    const error = new Error('Las contraseñas no coinciden');
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await repo.findUserByEmail(correo);

  if (existingUser) {
    const error = new Error('El correo ya está registrado');
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(contrasena, SALT_ROUNDS);

  return await repo.createUser({
    nombre_usuario,
    telefono,
    apellido,
    correo,
    contrasena: hashedPassword,
    id_rol: ROL_PACIENTE
  });
};

exports.login = async ({ correo, contrasena }) => {
  const user = await repo.findUserByEmail(correo);

  if (!user) {
    const error = new Error('Credenciales inválidas');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(contrasena, user.contrasena);

  if (!isMatch) {
    const error = new Error('Credenciales inválidas');
    error.statusCode = 401;
    throw error;
  }
 let tienePerfilPaciente = null;

  if (user.rol === 'Paciente') {
    const perfilPaciente =
      await paciente.findByUserId(user.id_usuario);

    tienePerfilPaciente = !!perfilPaciente;
  }

  const token = jwtFactory.createToken({
    id: user.id_usuario,
    rol: user.rol
  });

  return {
    token,
    user: {
      id: user.id_usuario,
      nombre_usuario: user.nombre_usuario,
      correo: user.correo,
      rol: user.rol
    },
    tienePerfilPaciente
  };
};
exports.cambiarContrasena = async (
  idUsuario,
  {
    contrasena_actual,
    nueva_contrasena,
    confirmar_contrasena
  }
) => {
  const user = await repo.findUserById(idUsuario);

  if (!user) {
    const error = new Error('Usuario no encontrado');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await bcrypt.compare(
    contrasena_actual,
    user.contrasena
  );

  if (!isMatch) {
    const error = new Error(
      'La contraseña actual es incorrecta'
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    nueva_contrasena !==
    confirmar_contrasena
  ) {
    const error = new Error(
      'Las contraseñas no coinciden'
    );
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword =
    await bcrypt.hash(
      nueva_contrasena,
      SALT_ROUNDS
    );

  await repo.updatePassword(
    idUsuario,
    hashedPassword
  );

  return {
    message:
      'Contraseña actualizada correctamente'
  };
};