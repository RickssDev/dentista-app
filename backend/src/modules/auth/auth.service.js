const bcrypt = require('bcrypt');
const JWTFactory = require('../../utils/JWTFactory');
const repo = require('./auth.repository');

const SALT_ROUNDS = 10;
const ROL_PACIENTE = 3; 
const jwtFactory = new JWTFactory();

exports.register = async ({
  nombre_usuario,
  apellido,
  correo,
  contrasena,
  confirmar_contrasena
}) => {

    if (!nombre_usuario || !apellido || !correo || !contrasena || !confirmar_contrasena) {
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

  const token = jwtFactory.createToken({
    id: user.id,
    rol: user.rol
  });

  return {
    token,
    user: {
      id: user.id,
      nombre_usuario: user.nombre_usuario,
      correo: user.correo,
      rol: user.rol
    }
  };
};