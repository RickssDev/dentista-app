const repo = require('./pacientes.repository');
const AppError = require('../../utils/AppError');

exports.getPacienteByUserId = async (idUsuario) => {
  const paciente = await repo.findByUserId(idUsuario);

  return {
    tienePerfilPaciente: !!paciente,
    paciente: paciente || null
  };
};

exports.createPaciente = async ({
  direccion,
  fecha_nacimiento,
  genero,
  id_usuario
}) => {

  const pacienteExistente = await repo.findByUserId(id_usuario);

  if (pacienteExistente) {
    throw new AppError('El paciente ya tiene perfil registrado', 400);
  }

  const nuevoPaciente = await repo.create({
    direccion,
    fecha_nacimiento,
    genero,
    id_usuario
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