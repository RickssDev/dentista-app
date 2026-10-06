import { useEffect, useState } from "react";
import "../../styles/AdminPanel.css";
import { FaEdit, FaTrash, FaEye, FaEyeSlash } from "react-icons/fa";
import { api } from "../../services/api";

const BASE_IMG_URL = "http://10.0.5.102:3000";

// 5 columnas: Foto | Título | Fecha | Estado | Acciones
// (si tu .table-header/.table-row no usan grid, ajusta esto o muévelo a tu CSS)
const COLUMNAS = { gridTemplateColumns: "0.7fr 2fr 1fr 1fr 1fr" };

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const formatFecha = (fecha) => {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (isNaN(d)) return "";
  const dia = String(d.getDate()).padStart(2, "0");
  return `${dia}/${MESES[d.getMonth()]}/${d.getFullYear()}`;
};

// visible va como "1" / "0" para que MySQL lo reciba como tinyint
const FORM_VACIO = { titulo: "", visible: "1", imagen: null };

function AdminImagenes() {
  const [imagenes, setImagenes] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [editando, setEditando] = useState(false);
  const [imagenId, setImagenId] = useState(null);

  const getImageUrl = (img) => {
    if (!img) return "https://via.placeholder.com/60";
    if (img.startsWith("http")) return img;
    return `${BASE_IMG_URL}/${img.replace(/^\/+/, "")}`;
  };

  const obtenerImagenes = async () => {
    try {
      const data = await api("/imagenes");
      setImagenes(data.payload);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    obtenerImagenes();
  }, []);

  const resetForm = () => {
    setForm(FORM_VACIO);
    setEditando(false);
    setImagenId(null);
    setMostrarModal(false);
  };

  const abrirNueva = () => {
    resetForm();
    setMostrarModal(true);
  };

  // GET /imagenes ya trae todos los campos, no hace falta pedir por id
  const abrirEditar = (img) => {
    setForm({
      titulo: img.titulo || "",
      visible: Number(img.visible) === 1 ? "1" : "0",
      imagen: img.imagen || null
    });
    setImagenId(img.id_imagen);
    setEditando(true);
    setMostrarModal(true);
  };

  const guardarImagen = async () => {
    const hayArchivoNuevo = form.imagen instanceof File;

    if (!form.titulo.trim()) {
      alert("El título es obligatorio");
      return;
    }

    if (!editando && !hayArchivoNuevo) {
      alert("Selecciona una imagen");
      return;
    }

    const formData = new FormData();
    formData.append("titulo", form.titulo);
    formData.append("visible", form.visible);
    // Solo se manda el archivo si el usuario eligió uno nuevo
    if (hayArchivoNuevo) formData.append("imagen", form.imagen);

    try {
      if (editando) {
        await api(`/imagenes/${imagenId}`, "PUT", formData, true);
      } else {
        await api("/imagenes", "POST", formData, true);
      }
      obtenerImagenes();
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  // Mostrar u ocultar desde la tabla sin abrir el modal
  const cambiarVisibilidad = async (img) => {
    const formData = new FormData();
    formData.append("visible", Number(img.visible) === 1 ? "0" : "1");

    try {
      await api(`/imagenes/${img.id_imagen}`, "PUT", formData, true);
      obtenerImagenes();
    } catch (error) {
      console.error(error);
    }
  };

  const eliminarImagen = async (id) => {
    if (!confirm("¿Eliminar imagen?")) return;

    try {
      await api(`/imagenes/${id}`, "DELETE");
      obtenerImagenes();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="usuarios-container">

      <div className="usuarios-header">
        <h1>Gestión de imágenes</h1>

        <button className="btn-add" onClick={abrirNueva}>
          + Registrar imagen
        </button>
      </div>

      <div className="usuarios-table">
        <div className="table-header" style={COLUMNAS}>
          <span>Foto</span>
          <span>Título</span>
          <span>Fecha</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {imagenes.map((img) => {
          const esVisible = Number(img.visible) === 1;

          return (
            <div key={img.id_imagen} className="table-row" style={COLUMNAS}>

              <img
                src={getImageUrl(img.imagen)}
                alt={img.titulo}
                className="avatar"
              />

              <span>{img.titulo}</span>
              <span>{formatFecha(img.fecha_publicada)}</span>

              <span className={`estado ${esVisible ? "activo" : "inactivo"}`}>
                {esVisible ? "Visible" : "Oculta"}
              </span>

              <div className="acciones">
                {esVisible ? (
                  <FaEye title="Ocultar" onClick={() => cambiarVisibilidad(img)} />
                ) : (
                  <FaEyeSlash title="Mostrar" onClick={() => cambiarVisibilidad(img)} />
                )}
                <FaEdit title="Editar" onClick={() => abrirEditar(img)} />
                <FaTrash title="Eliminar" onClick={() => eliminarImagen(img.id_imagen)} />
              </div>
            </div>
          );
        })}
      </div>

      {mostrarModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <h2>{editando ? "Editar imagen" : "Nueva imagen"}</h2>
              
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

              <input
                value={form.titulo}
                placeholder="Título"
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              />

              <select
                value={form.visible}
                onChange={(e) => setForm({ ...form, visible: e.target.value })}
              >
                <option value="1">Visible</option>
                <option value="0">Oculta</option>
              </select>

              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setForm({ ...form, imagen: e.target.files[0] || form.imagen })
                }
              />

            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={resetForm}>
                Cancelar
              </button>

              <button className="btn-save" onClick={guardarImagen}>
                {editando ? "Actualizar" : "Crear"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default AdminImagenes;