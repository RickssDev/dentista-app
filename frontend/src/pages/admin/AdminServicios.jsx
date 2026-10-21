import { useEffect, useState } from "react";
import "../../styles/AdminPanel.css";
import {
  FaTooth,
  FaRegClock,
  FaRegTrashAlt,
  FaRegEye,
  FaRegEyeSlash,
} from "react-icons/fa";
import { api, getImageUrl } from "../../services/api";
import ModalConfirmacion from "../../components/ModalConfirmacion";
import EncabezadoModulo from "../../components/EncabezadoModulo";

const FORM_INICIAL = {
  nombre: "",
  descripcion: "",
  duracion: "",
  estado: "activo",
  imagen: null,
};

/* Foto del servicio; si no hay (o falla la carga) muestra un icono */
function ServicioImagen({ servicio }) {
  const [falloImagen, setFalloImagen] = useState(false);

  return (
    <div className="servicio-img-wrap">
      {servicio.imagen && !falloImagen ? (
        <img
          src={getImageUrl(servicio.imagen)}
          alt={servicio.nombre}
          onError={() => setFalloImagen(true)}
        />
      ) : (
        <FaTooth />
      )}
    </div>
  );
}

function AdminServicios() {
  const [servicios, setServicios] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editando, setEditando] = useState(false);
  const [servicioId, setServicioId] = useState(null);
  const [servicioAEliminar, setServicioAEliminar] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [errorForm, setErrorForm] = useState("");

  const obtenerServicios = async () => {
    try {
      const data = await api("/servicios");
      setServicios(data.payload);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    obtenerServicios();
  }, []);

  const abrirModalNuevo = () => {
    setForm({ ...FORM_INICIAL });
    setEditando(false);
    setServicioId(null);
    setErrorForm("");
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setForm({ ...FORM_INICIAL });
    setEditando(false);
    setServicioId(null);
    setErrorForm("");
    setMostrarModal(false);
  };

  // Solo envía campos con valor; la imagen solo si es un archivo nuevo
  const construirFormData = () => {
    const formData = new FormData();
    Object.keys(form).forEach((key) => {
      const valor = form[key];
      if (!valor) return;
      if (key === "imagen" && typeof valor === "string") return;
      formData.append(key, valor);
    });
    return formData;
  };

  const crearServicio = async () => {
    try {
      await api("/servicios", "POST", construirFormData(), true);
      obtenerServicios();
      cerrarModal();
    } catch (error) {
      console.error(error);
      setErrorForm(error.message || "No se pudo crear el servicio");
    }
  };

  const obtenerServicioPorId = async (id) => {
    try {
      const data = await api(`/servicios/${id}`);
      const s = data.payload;

      setForm({
        nombre: s.nombre || "",
        descripcion: s.descripcion || "",
        duracion: s.duracion || "",
        estado: s.estado || "activo",
        imagen: s.imagen || null,
      });

      setServicioId(id);
      setEditando(true);
      setErrorForm("");
      setMostrarModal(true);
    } catch (error) {
      console.error(error);
    }
  };

  const editarServicio = async () => {
    try {
      await api(`/servicios/${servicioId}`, "PUT", construirFormData(), true);
      obtenerServicios();
      cerrarModal();
    } catch (error) {
      console.error(error);
      setErrorForm(error.message || "No se pudo actualizar el servicio");
    }
  };

  const confirmarEliminar = async () => {
  const id = servicioAEliminar.id;
  setServicioAEliminar(null);

  try {
    const respuesta = await api(`/servicios/${id}`, "DELETE");
    obtenerServicios();

    if (respuesta?.payload?.desactivado) {
      setAviso({
        titulo: "Servicio desactivado",
        mensaje:
          "Tiene citas asociadas, así que se desactivó en lugar de eliminarse. Ya no aparecerá en el sitio público ni al crear nuevas citas.",
      });
    }
  } catch (error) {
    console.error(error);
    setAviso({
      titulo: "No se pudo eliminar",
      mensaje: "Ocurrió un error al eliminar el servicio. Intenta de nuevo.",
    });
  }
};

  const cambiarCampo = (campo) => (e) =>
    setForm({ ...form, [campo]: e.target.value });

  const cambiarEstadoServicio = async (servicio) => {
  const nuevoEstado =
    servicio.estado === "activo" ? "inactivo" : "activo";

  try {
    const formData = new FormData();

    formData.append("nombre", servicio.nombre);
    formData.append("descripcion", servicio.descripcion || "");
    formData.append("duracion", servicio.duracion);
    formData.append("estado", nuevoEstado);

    await api(`/servicios/${servicio.id}`, "PUT", formData, true);

    await obtenerServicios();
  } catch (error) {
    console.error(error);
    setAviso({
      titulo: "No se pudo cambiar el estado",
      mensaje: "Ocurrió un error al actualizar el servicio.",
    });
  }
};

  return (
    <div className="usuarios-container">
      <EncabezadoModulo
        titulo="Servicios"
        descripcion="Administra el catálogo de servicios de la clínica."
        textoBoton="Nuevo servicio"
        onBoton={abrirModalNuevo}
      />

      {servicios.length === 0 ? (
        <p className="usuarios-vacio">No hay servicios registrados.</p>
      ) : (
        <div className="servicio-cards">
          {servicios.map((servicio) => (
              <article
    key={servicio.id}
    className={`servicio-card${
      servicio.estado !== "activo" ? " oculta" : ""
    }`}
  >
              <ServicioImagen servicio={servicio} />

              <div className="servicio-card-top">
                <h3 className="servicio-nombre">{servicio.nombre}</h3>
                <span className={`servicio-estado ${servicio.estado}`}>
                  {servicio.estado}
                </span>
              </div>

              <p className="servicio-descripcion">{servicio.descripcion}</p>

              <div className="servicio-duracion">
                <FaRegClock />
                <span>{servicio.duracion}</span>
              </div>

            
              <div className="servicio-acciones">
                <button
                  className="btn-card-edit"
                  onClick={() => obtenerServicioPorId(servicio.id)}
                >
                  Editar
                </button>

                <button
                  className="btn-card-icon"
                  title={servicio.estado === "activo" ? "Desactivar" : "Activar"}
                  aria-label={
                    servicio.estado === "activo"
                      ? "Desactivar servicio"
                      : "Activar servicio"
                  }
                  onClick={() => cambiarEstadoServicio(servicio)}
                >
                  {servicio.estado === "activo" ? (
                    <FaRegEyeSlash />
                  ) : (
                    <FaRegEye />
                  )}
                </button>

                <button
                  className="btn-card-delete"
                  aria-label="Eliminar servicio"
                  onClick={() => setServicioAEliminar(servicio)}
                >
                  <FaRegTrashAlt />
                </button>
              </div>

            </article>
          ))}
        </div>
      )}

      {mostrarModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editando ? "Editar servicio" : "Nuevo servicio"}</h2>
            </div>

            <div className="modal-body">
              {form.imagen && (
                <img
                  src={
                    typeof form.imagen === "string"
                      ? getImageUrl(form.imagen)
                      : URL.createObjectURL(form.imagen)
                  }
                  alt="Vista previa"
                  className="preview-img"
                />
              )}

              <input value={form.nombre} placeholder="Nombre" onChange={cambiarCampo("nombre")} />
              <input value={form.descripcion} placeholder="Descripción" onChange={cambiarCampo("descripcion")} />
              <input value={form.duracion} placeholder="Duración" onChange={cambiarCampo("duracion")} />

              <select value={form.estado} onChange={cambiarCampo("estado")}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>

              <input
                type="file"
                onChange={(e) => setForm({ ...form, imagen: e.target.files[0] })}
              />

              {errorForm && <p className="modal-error">{errorForm}</p>}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={cerrarModal}>
                Cancelar
              </button>

              <button
                className="btn-save"
                onClick={editando ? editarServicio : crearServicio}
              >
                {editando ? "Actualizar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalConfirmacion
        abierto={!!servicioAEliminar}
        titulo="Eliminar servicio"
        mensaje={
        servicioAEliminar
          ? `¿Seguro que quieres eliminar "${servicioAEliminar.nombre}"? Si tiene citas asociadas, se desactivará en lugar de eliminarse.`
          : ""
      }
        textoConfirmar="Eliminar"
        peligro
        onConfirmar={confirmarEliminar}
        onCancelar={() => setServicioAEliminar(null)}
      />

      <ModalConfirmacion
        abierto={!!aviso}
        titulo={aviso?.titulo}
        mensaje={aviso?.mensaje}
        textoCancelar={null}
        textoConfirmar="Entendido"
        onConfirmar={() => setAviso(null)}
      />
    </div>
  );
}

export default AdminServicios;