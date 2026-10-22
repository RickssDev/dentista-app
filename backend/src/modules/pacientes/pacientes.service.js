const repo = require('./pacientes.repository');
const AppError = require('../../utils/AppError');

exports.getPacienteByUserId = async (idUsuario) => {
  const paciente = await repo.findByUserId(idUsuario);

  return {
    tienePerfilPaciente: !!paciente,
    paciente: paciente || null
  };
};

exports.createPaciente = async (
  { direccion, fecha_nacimiento, genero, telefono },
  idUsuario
) => {
  const telefonoLimpio = String(telefono ?? '').replace(/\D/g, '');

  if (telefonoLimpio.length !== 10) {
    throw new AppError('El teléfono debe tener 10 dígitos', 400);
  }

  const pacienteExistente = await repo.findByUserId(idUsuario);

  if (pacienteExistente) {
    throw new AppError('El paciente ya tiene perfil registrado', 400);
  }

  await repo.updateTelefono(idUsuario, telefonoLimpio);

  const nuevoPaciente = await repo.create({
    direccion,
    fecha_nacimiento,
    genero,
    id_usuario: idUsuario
  });

  return nuevoPaciente;
};
exports.getPerfil = async (idUsuario) => {
  const perfil = await repo.findPerfilByUserId(idUsuario);

  if (!perfil) {
    throw new AppError('Perfil no encontrado', 404);
  }

  return perfil;
};

exports.updatePerfil = async (
  idUsuario,
  {
    telefono,
    direccion,
    genero
  }
) => {
  const perfil = await repo.findPerfilByUserId(idUsuario);

  if (!perfil) {
    throw new AppError('Perfil no encontrado', 404);
  }

  await repo.updatePerfilByUserId(
    idUsuario,
    {
      telefono,
      direccion,
      genero
    }
  );

  return await repo.findPerfilByUserId(idUsuario);
};

exports.getPacientesSelect = async (busqueda) => {
    return await repo.getPacientesSelect(busqueda);
};
