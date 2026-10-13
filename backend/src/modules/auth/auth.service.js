const bcrypt = require('bcrypt');
const JWTFactory = require('../../utils/JWTFactory');
const repo = require('./auth.repository');
const paciente = require('../pacientes/pacientes.repository');
const AppError = require('../../utils/AppError');

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
    throw new AppError('Todos los campos son obligatorios', 400);
  }

  if (contrasena !== confirmar_contrasena) {
    throw new AppError('Las contraseñas no coinciden', 400);
  }

  const existingUser = await repo.findUserByEmail(correo);

  if (existingUser) {
    throw new AppError('El correo ya está registrado', 400);
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
    throw new AppError('Credenciales inválidas', 401);
  }

  const isMatch = await bcrypt.compare(contrasena, user.contrasena);

  if (!isMatch) {
    throw new AppError('Credenciales inválidas', 401);
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
      rol: user.rol,
      imagen: user.imagen
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
    throw new AppError('Usuario no encontrado', 404);
  }

  const isMatch = await bcrypt.compare(
    contrasena_actual,
    user.contrasena
  );

  if (!isMatch) {
    throw new AppError('La contraseña actual es incorrecta', 400);
  }

  if (
    nueva_contrasena !==
    confirmar_contrasena
  ) {
    throw new AppError(
      'Las contraseñas no coinciden',
      400
    );
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