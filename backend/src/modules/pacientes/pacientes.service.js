const repo = require('./pacientes.repository');

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
    throw new Error('El paciente ya tiene perfil registrado');
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
    const error = new Error('Perfil no encontrado');
    error.statusCode = 404;
    throw error;
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
    const error = new Error('Perfil no encontrado');
    error.statusCode = 404;
    throw error;
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