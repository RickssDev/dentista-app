const repo = require("./servicios.repository");
const AppError = require("../../utils/AppError");
const borrarArchivo = require("../../utils/borrarArchivo");

exports.getServicios = async () => {
  const servicios = await repo.getServicios();

  return servicios.map((s) => ({
    id: s.id_servicio,
    nombre: s.nombre_servicio,
    descripcion: s.descripcion,
    duracion: s.duracion,
    estado: s.estado,
    imagen: s.imagen,
  }));
};

exports.getServicioById = async (id) => {
  const s = await repo.getServicioById(id);

  if (!s) {
    throw new AppError("Servicio no encontrado", 404);
  }

  return {
    id: s.id_servicio,
    nombre: s.nombre_servicio,
    descripcion: s.descripcion,
    duracion: s.duracion,
    estado: s.estado,
    imagen: s.imagen,
  };
};

exports.createServicio = async (data) => {
  if (!data || Object.keys(data).length === 0) {
    throw new AppError("No se recibieron datos", 400);
  }

  const { nombre, descripcion, duracion } = data;

  if (!nombre || !descripcion || !duracion) {
    throw new AppError("Faltan campos obligatorios", 400);
  }

  const existingServicio = await repo.getServicioByName(nombre);
  if (existingServicio) {
    throw new AppError(`El servicio con nombre "${nombre}" ya existe`, 400);
  }

  const id = await repo.createServicio(data);

  return { id };
};

exports.updateServicio = async (id, data) => {
  const exists = await repo.getServicioById(id);
  
    if (!exists) {
      throw new AppError('Servicio no encontrado', 404);
    }
  const cleanedData = {};

  for (const key in data) {
    if (data[key] !== "" && data[key] !== undefined && data[key] !== null) {
      cleanedData[key] = data[key];
    }
  }

  if (cleanedData.nombre) {
    const existingServicio = await repo.getServicioByName(cleanedData.nombre);
    if (existingServicio && existingServicio.id_servicio != id) {
      throw new AppError(
        `Ya existe un servicio con nombre "${cleanedData.nombre}"`,
        400,
      );
    }
  }

  if (Object.keys(cleanedData).length === 0) {
    throw new AppError("No hay campos para actualizar", 400);
  }

  await repo.updateServicio (id, cleanedData);
    if (cleanedData.imagen && cleanedData.imagen !== exists.imagen) {
      await borrarArchivo(exists.imagen);
    }
    
  return await repo.getServicioById(id);
};

exports.deleteServicio = async (id) => {
  const exists = await repo.getServicioById(id);

  if (!exists) {
    throw new AppError('Servicio no encontrado', 404);
  }
  await repo.deleteServicio(id);
  await borrarArchivo(exists.imagen);

  return { message: "Servicio eliminado correctamente" };
};

exports.getServiciosPublicos = async () => {
  const servicios = await repo.getServiciosPublicos();

  return servicios.map((s) => ({
    id: s.id_servicio,
    nombre: s.nombre_servicio,
    descripcion: s.descripcion,
    duracion: s.duracion,
    imagen: s.imagen,
  }));
};
