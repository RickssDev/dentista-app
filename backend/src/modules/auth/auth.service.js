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

const crypto = require('crypto');
const {
  enviarCorreoRestablecer,
  enviarCorreoCuentaGoogle,
  enviarCorreoContrasenaActualizada
} = require('../../services/email.service');

const MINUTOS_RECUPERACION = 15;

exports.solicitarRecuperacion = async ({ correo }) => {
  if (typeof correo !== 'string' || !correo.trim()) {
    throw new AppError('Ingresa un correo válido', 400);
  }

  const correoNormalizado = correo.trim().toLowerCase();

  if (
    correoNormalizado.length > 100 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoNormalizado)
  ) {
    throw new AppError('Ingresa un correo válido', 400);
  }

  const mensaje = {
    message: 'Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña.'
  };

  const usuario = await repo.findUserByEmail(correoNormalizado);

  // No revelar si el correo existe.
  if (!usuario || usuario.estado !== 'activo') {
    return mensaje;
  }

  // Cuenta creada únicamente con Google.
  if (!usuario.contrasena) {
    try {
      await enviarCorreoCuentaGoogle({
        para: usuario.correo,
        nombre: usuario.nombre_usuario
      });
    } catch (error) {
      console.error('Error enviando correo de Google:', error.message);
    }

    return mensaje;
  }

  // Token aleatorio de 32 bytes.
  const token = crypto.randomBytes(32).toString('hex');

  // Guardar únicamente el hash del token.
  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  await repo.createPasswordResetToken(
    usuario.id_usuario,
    tokenHash
  );

  try {
    await enviarCorreoRestablecer({
      para: usuario.correo,
      nombre: usuario.nombre_usuario,
      token,
      minutos: MINUTOS_RECUPERACION
    });

  } catch (error) {
    // Si el envío falla, el token no debe quedar activo.
    await repo.deletePasswordResetToken(tokenHash);

    console.error(
      'Error enviando correo de recuperación:',
      error.message
    );
  }

  return mensaje;
};


exports.restablecerContrasena = async ({
  token,
  nueva_contrasena,
  confirmar_contrasena
}) => {
  if (
    !token ||
    !nueva_contrasena ||
    !confirmar_contrasena
  ) {
    throw new AppError(
      'Todos los campos son obligatorios',
      400
    );
  }

  if (
    typeof token !== 'string' ||
    !/^[a-f0-9]{64}$/i.test(token)
  ) {
    throw new AppError(
      'El enlace de recuperación es inválido o ha expirado',
      400
    );
  }

  if (nueva_contrasena !== confirmar_contrasena) {
    throw new AppError(
      'Las contraseñas no coinciden',
      400
    );
  }

  // Reutilizamos tu validación existente.
  validarContrasena(nueva_contrasena);

  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const hashedPassword = await bcrypt.hash(
    nueva_contrasena,
    SALT_ROUNDS
  );

  
const resultado = await repo.resetPasswordWithToken(
  tokenHash,
  nueva_contrasena,
  hashedPassword
);

if (resultado.estado === 'token_invalido') {
  throw new AppError(
    'El enlace de recuperación es inválido o ha expirado',
    400
  );
}

if (resultado.estado === 'misma_contrasena') {
  throw new AppError(
    'La nueva contraseña debe ser diferente a la contraseña actual',
    400
  );
}

// La contraseña ya fue actualizada.
// Enviar notificación de seguridad.
try {
  await enviarCorreoContrasenaActualizada({
    para: resultado.correo,
    nombre: resultado.nombre_usuario
  });

} catch (error) {
  console.error(
    '[SEGURIDAD] No se pudo enviar el aviso de contraseña actualizada:',
    error.message
  );
}

return {
  message: 'Tu contraseña se restableció correctamente'
};

};

const verifyGoogleToken = async (credential) => {
  if (!credential || typeof credential !== "string") {
    throw new AppError("Credencial de Google requerida", 400);
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new AppError("Google OAuth no está configurado", 500);
  }

  let ticket;

  try {
    ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (error) {
  if (process.env.NODE_ENV !== "production") {
    console.error(
      "[GOOGLE AUTH] Error verificando token:",
      error.message
    );
  }

  throw new AppError(
    "No se pudo verificar tu cuenta de Google",
    401
  );
}

  const payload = ticket.getPayload();

  if (
    !payload?.sub ||
    !payload?.email ||
    payload.email_verified !== true
  ) {
    throw new AppError("La cuenta de Google no está verificada", 401);
  }

  return payload;
};

const buildSession = async (user) => {
  if (user.estado === "inactivo") {
    throw new AppError(
      "Tu cuenta está desactivada. Contacta a la clínica.",
      403
    );
  }

  let tienePerfilPaciente = null;

  if (user.rol === "Paciente") {
    const perfilPaciente = await paciente.findByUserId(
      user.id_usuario
    );

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

const MINIMO_PRODUCCION = 8;
const MAXIMO_BYTES_BCRYPT = 72; // bcrypt ignora lo que pase de 72 bytes
 
const minimoConfigurado = Number(process.env.PASSWORD_MIN_LENGTH) || MINIMO_PRODUCCION;
 
// En producción el mínimo nunca baja de 8, aunque el .env diga otra cosa
const LONGITUD_MINIMA_CONTRASENA =
  process.env.NODE_ENV === 'production'
    ? Math.max(minimoConfigurado, MINIMO_PRODUCCION)
    : minimoConfigurado;
 
// Solo se usa al crear o cambiar una contraseña, nunca al iniciar sesión:
// las cuentas con contraseñas cortas de antes siguen pudiendo entrar.
const validarContrasena = (contrasena) => {
  if (typeof contrasena !== 'string' || contrasena.length < LONGITUD_MINIMA_CONTRASENA) {
    throw new AppError(
      `La contraseña debe tener al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres`,
      400
    );
  }
 
  if (Buffer.byteLength(contrasena, 'utf8') > MAXIMO_BYTES_BCRYPT) {
    throw new AppError('La contraseña es demasiado larga (máximo 72 caracteres)', 400);
  }
};

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
 
  validarContrasena(contrasena);
 
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
  if (typeof correo !== 'string' || typeof contrasena !== 'string') {
    throw new AppError("Credenciales inválidas", 401);
  }

  const user = await repo.findUserByEmail(correo);

  if (!user) {
    throw new AppError("Credenciales inválidas", 401);
  }

  if (!user.contrasena) {
    throw new AppError(
      "Esta cuenta usa Google. Inicia sesión con Google.",
      400
    );
  }

  const isMatch = await bcrypt.compare(
    contrasena,
    user.contrasena
  );

  if (!isMatch) {
    throw new AppError("Credenciales inválidas", 401);
  }

  return buildSession(user);
};
exports.cambiarContrasena = async (
  idUsuario,
  {
    contrasena_actual,
    nueva_contrasena,
    confirmar_contrasena
  }
) => {
  if (!contrasena_actual || !nueva_contrasena || !confirmar_contrasena) {
    throw new AppError('Todos los campos son obligatorios', 400);
  }

  // bcrypt.compare lanza un error (500) si recibe algo que no es texto.
  if (typeof contrasena_actual !== 'string') {
    throw new AppError('La contraseña actual es incorrecta', 400);
  }

  const user = await repo.findUserById(idUsuario);
 
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }
 
  if (!user.contrasena) {
    throw new AppError('Tu cuenta usa Google y no tiene contraseña', 400);
  }
 
  const isMatch = await bcrypt.compare(
    contrasena_actual,
    user.contrasena
  );
 
  if (!isMatch) {
    throw new AppError('La contraseña actual es incorrecta', 400);
  }
 
  if (nueva_contrasena !== confirmar_contrasena) {
    throw new AppError('Las contraseñas no coinciden', 400);
  }
 
  validarContrasena(nueva_contrasena);

  const esMismaContrasena = await bcrypt.compare(
  nueva_contrasena,
  user.contrasena
  );

  if (esMismaContrasena) {
    throw new AppError(
      'La nueva contraseña debe ser diferente a la contraseña actual',
      400
    );
  }
 
  const hashedPassword = await bcrypt.hash(
    nueva_contrasena,
    SALT_ROUNDS
  );
 
  await repo.updatePassword(
    idUsuario,
    hashedPassword
  );
 
  return {
    message: 'Contraseña actualizada correctamente'
  };
};

exports.googleLogin = async ({ credential }) => {
  const payload = await verifyGoogleToken(credential);

  const user = await repo.findUserByEmail(payload.email);

  if (!user) {
    throw new AppError(
      "No existe una cuenta con este correo. Regístrate primero con Google.",
      404
    );
  }

  if (user.estado === "inactivo") {
    throw new AppError(
      "Tu cuenta está desactivada. Contacta a la clínica.",
      403
    );
  }

  if (!user.google_id) {
    await repo.linkGoogleId(user.id_usuario, payload.sub);
  } else if (user.google_id !== payload.sub) {
    throw new AppError("Credenciales inválidas", 401);
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