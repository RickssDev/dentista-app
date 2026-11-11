const repo = require('./pacientes.repository');
const AppError = require('../../utils/AppError');

// Valores que acepta la columna `paciente.genero` (enum) y largo de `paciente.direccion`
const GENEROS = ['masculino', 'femenino', 'otro'];
const MAXIMO_DIRECCION = 400;

// Lo que no cumple el tipo o el formato llegaría a MySQL y respondería 500: se rechaza antes
const limpiarTelefono = (telefono) => {
  const valido = typeof telefono === 'string' || typeof telefono === 'number';
  const telefonoLimpio = valido ? String(telefono).replace(/\D/g, '') : '';

  if (telefonoLimpio.length !== 10) {
    throw new AppError('El teléfono debe tener 10 dígitos', 400);
  }

  return telefonoLimpio;
};

const validarDireccion = (direccion) => {
  if (direccion === undefined || direccion === null) return null;

  if (typeof direccion !== 'string' || direccion.length > MAXIMO_DIRECCION) {
    throw new AppError(`La dirección debe ser texto de hasta ${MAXIMO_DIRECCION} caracteres`, 400);
  }

  return direccion;
};

// Vacío ("Seleccionar...") equivale a sin género
const validarGenero = (genero) => {
  if (genero === undefined || genero === null || genero === '') return null;

  if (!GENEROS.includes(genero)) {
    throw new AppError('El género no es válido', 400);
  }

  return genero;
};

const validarFechaNacimiento = (fecha) => {
  if (fecha === undefined || fecha === null) return null;

  const dia = new Date(`${fecha}T00:00:00Z`);
  const esValida =
    typeof fecha === 'string' &&
    !Number.isNaN(dia.getTime()) &&
    dia.toISOString().slice(0, 10) === fecha;

  if (!esValida) {
    throw new AppError('La fecha de nacimiento no es válida', 400);
  }

  return fecha;
};

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
  const telefonoLimpio = limpiarTelefono(telefono);
  const datos = {
    direccion: validarDireccion(direccion),
    fecha_nacimiento: validarFechaNacimiento(fecha_nacimiento),
    genero: validarGenero(genero),
  };

  const pacienteExistente = await repo.findByUserId(idUsuario);

  if (pacienteExistente) {
    throw new AppError('El paciente ya tiene perfil registrado', 400);
  }

  await repo.updateTelefono(idUsuario, telefonoLimpio);

  const nuevoPaciente = await repo.create({
    ...datos,
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
      telefono: limpiarTelefono(telefono),
      direccion: validarDireccion(direccion),
      genero: validarGenero(genero)
    }
  );

  return await repo.findPerfilByUserId(idUsuario);
};

exports.getPacientesSelect = async (busqueda) => {
    return await repo.getPacientesSelect(busqueda);
};
