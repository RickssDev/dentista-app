import { useEffect, useState } from "react";
import "../../styles/AdminPanel.css";
import { FaEdit, FaTrash } from "react-icons/fa";
import { api, getImageUrl } from "../../services/api";

function AdminServicios() {
  const [servicios, setServicios] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    duracion: "",
    estado: "activo",
    imagen: null
  });

  const [editando, setEditando] = useState(false);
  const [servicioId, setServicioId] = useState(null);

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

  const crearServicio = async () => {
    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      if (form[key]) formData.append(key, form[key]);
    });

    try {
      await api("/servicios", "POST", formData, true);
      obtenerServicios();
      resetForm();
    } catch (error) {
      console.error(error);
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
        imagen: s.imagen || null
      });

      setServicioId(id);
      setEditando(true);
      setMostrarModal(true);

    } catch (error) {
      console.error(error);
    }
  };

  const editarServicio = async () => {
    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      if (form[key]) formData.append(key, form[key]);
    });

    try {
      await api(`/servicios/${servicioId}`, "PUT", formData, true);
      obtenerServicios();
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  const eliminarServicio = async (id) => {
    if (!confirm("¿Eliminar servicio?")) return;

    try {
      await api(`/servicios/${id}`, "DELETE");
      obtenerServicios();
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setForm({
      nombre: "",
      descripcion: "",
      duracion: "",
      estado: "activo",
      imagen: null
    });
    setEditando(false);
    setServicioId(null);
    setMostrarModal(false);
  };

  return (
    <div className="usuarios-container">

      <div className="usuarios-header">
        <h1>Gestión de servicios</h1>

        <button
          className="btn-add"
          onClick={() => {
            resetForm();
            setMostrarModal(true);
          }}
        >
          + Registrar servicio
        </button>
      </div>

      <div className="usuarios-table">
        <div className="table-header">
          <span>Foto</span>
          <span>Nombre</span>
          <span>Descripción</span>
          <span>Duración</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {servicios.map((servicio) => (
          <div key={servicio.id} className="table-row">

            <img
              src={getImageUrl(servicio.imagen)}
              alt="servicio"
              className="avatar"
            />

            <span>{servicio.nombre}</span>
            <span>{servicio.descripcion}</span>
            <span>{servicio.duracion}</span>

            <span className={`estado ${servicio.estado}`}>
              {servicio.estado}
            </span>

            <div className="acciones">
              <FaEdit onClick={() => obtenerServicioPorId(servicio.id)} />
              <FaTrash onClick={() => eliminarServicio(servicio.id)} />
            </div>
          </div>
        ))}
      </div>

      {mostrarModal && (
        <div className="modal-overlay" onClick={resetForm}>
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
                  alt="preview"
                  className="preview-img"
                />
              )}

              <input value={form.nombre} placeholder="Nombre"
                onChange={(e)=>setForm({...form,nombre:e.target.value})}/>

              <input value={form.descripcion} placeholder="Descripción"
                onChange={(e)=>setForm({...form,descripcion:e.target.value})}/>

              <input value={form.duracion} placeholder="Duración"
                onChange={(e)=>setForm({...form,duracion:e.target.value})}/>

              <select value={form.estado}
                onChange={(e)=>setForm({...form,estado:e.target.value})}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>

              <input
                type="file"
                onChange={(e)=>setForm({...form,imagen:e.target.files[0]})}
              />

            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={resetForm}>
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

    </div>
  );
}

export default AdminServicios;