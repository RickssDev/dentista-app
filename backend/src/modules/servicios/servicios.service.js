const repo = require('./servicios.repository');

exports.getServicios = async () => {
  const servicios = await repo.getServicios();

  return servicios.map(s => ({
    id: s.id_servicio,
    nombre: s.nombre_servicio,
    descripcion: s.descripcion,
    duracion: s.duracion,
    estado: s.estado,
    imagen: s.imagen
  }));
};

exports.getServicioById = async (id) => {
  const s = await repo.getServicioById(id);

  if (!s) {
    throw new Error('Servicio no encontrado');
  }

  return {
    id: s.id_servicio,
    nombre: s.nombre_servicio,
    descripcion: s.descripcion,
    duracion: s.duracion,
    estado: s.estado,
    imagen: s.imagen
  };
};

exports.createServicio = async (data) => {
  if (!data || Object.keys(data).length === 0) {
    throw new Error('No se recibieron datos');
  }

  const { nombre, descripcion, duracion } = data;

  if (!nombre || !descripcion || !duracion) {
    throw new Error('Faltan campos obligatorios');
  }

  const existingServicio = await repo.getServicioByName(nombre);
  if (existingServicio) {
    throw new Error(`El servicio con nombre "${nombre}" ya existe`);
  }

  const id = await repo.createServicio(data);

  return { id };
};

exports.updateServicio = async (id, data) => {
  const cleanedData = {};

  for (const key in data) {
    if (
      data[key] !== '' &&
      data[key] !== undefined &&
      data[key] !== null
    ) {
      cleanedData[key] = data[key];
    }
  }

  if (cleanedData.nombre) {
    const existingServicio = await repo.getServicioByName(cleanedData.nombre);
    if (existingServicio && existingServicio.id_servicio != id) {
      throw new Error(`Ya existe un servicio con nombre "${cleanedData.nombre}"`);
    }
  }

  if (Object.keys(cleanedData).length === 0) {
    throw new Error('No hay campos para actualizar');
  }

  await repo.updateServicio(id, cleanedData);

  return { message: 'Servicio actualizado correctamente' };
};

exports.deleteServicio = async (id) => {
  await repo.deleteServicio(id);

  return { message: 'Servicio eliminado correctamente' };
};