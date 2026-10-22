const bcrypt = require('bcrypt');
const JWTFactory = require('../../utils/JWTFactory');
const repo = require('./auth.repository');
const paciente = require('../pacientes/pacientes.repository');
const AppError = require('../../utils/AppError');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
  if (!user.contrasena) {
    throw new AppError('Esta cuenta usa Google. Inicia sesión con Google.', 400);
  }

    const isMatch = await bcrypt.compare(contrasena, user.contrasena);

    if (!isMatch) {
      throw new AppError('Credenciales inválidas', 401);
    }

    if (user.estado === 'inactivo') {
      throw new AppError(
        'Tu cuenta está desactivada. Contacta a la clínica.',
        403
      );
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

  if (!user.contrasena) {
  throw new AppError('Tu cuenta usa Google y no tiene contraseña', 400);
  }

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

const buildSession = async (user) => {
  if (user.estado === 'inactivo') {
    throw new AppError('Tu cuenta está desactivada. Contacta a la clínica.', 403);
  }

  let tienePerfilPaciente = null;
  if (user.rol === 'Paciente') {
    const perfilPaciente = await paciente.findByUserId(user.id_usuario);
    tienePerfilPaciente = !!perfilPaciente;
  }

  const token = jwtFactory.createToken({ id: user.id_usuario, rol: user.rol });

  return {
    token,
    user: {
      id: user.id_usuario,
      nombre_usuario: user.nombre_usuario,
      correo: user.correo,
      rol: user.rol,
      imagen: user.imagen,
    },
    tienePerfilPaciente,
  };
};

const verifyGoogleToken = async (credential) => {
  if (!credential) throw new AppError('Credencial de Google requerida', 400);

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw new AppError('Token de Google inválido', 401);
  }

  if (!payload?.email_verified) {
    throw new AppError('El correo de Google no está verificado', 401);
  }
  return payload;
};

exports.googleLogin = async ({ credential }) => {
  const payload = await verifyGoogleToken(credential);
  const user = await repo.findUserByEmail(payload.email);

  if (!user) {
    throw new AppError(
      'No existe una cuenta con este correo. Regístrate primero con Google.',
      404,
    );
  }

  if (!user.google_id) {
    // cuenta creada con contraseña: Google ya verificó el correo, la vinculamos
    await repo.linkGoogleId(user.id_usuario, payload.sub);
  } else if (user.google_id !== payload.sub) {
    throw new AppError('Credenciales inválidas', 401);
  }

  return buildSession(user);
};

exports.googleRegister = async ({ credential }) => {
  const payload = await verifyGoogleToken(credential);

  const existing = await repo.findUserByEmail(payload.email);
  if (existing) {
    throw new AppError(
      'Ya existe una cuenta con este correo. Inicia sesión con Google.',
      400,
    );
  }

  return repo.createGoogleUser({
    nombre_usuario: payload.given_name || payload.name,
    apellido: payload.family_name || '',
    correo: payload.email,
    google_id: payload.sub,
    id_rol: ROL_PACIENTE,
  });
};