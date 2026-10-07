import { useEffect, useState } from "react";
import "../../styles/AdminPanel.css";
import { FaEye, FaEyeSlash, FaCheckCircle, FaTrash } from "react-icons/fa";
import { api } from "../../services/api";

// Backend: "visible" / "oculto"  ->  Diseño: "Aprobado" / "Pendiente"
const TABS = [
  { key: "todos", label: "Todos" },
  { key: "oculto", label: "Pendientes" },
  { key: "visible", label: "Aprobados" }
];

const ESTADO_LABEL = {
  visible: "Aprobado",
  oculto: "Pendiente"
};

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const formatFecha = (fecha) => {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (isNaN(d)) return "";
  const dia = String(d.getDate()).padStart(2, "0");
  return `${dia}/${MESES[d.getMonth()]}/${d.getFullYear()}`;
};

function AdminComentarios() {
  const [comentarios, setComentarios] = useState([]);
  const [tab, setTab] = useState("todos");

  const [seleccionado, setSeleccionado] = useState(null);
  const [respuesta, setRespuesta] = useState("");

  const obtenerComentarios = async () => {
    try {
      const data = await api("/comentarios");
      setComentarios(data.payload);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    obtenerComentarios();
  }, []);

  // Aprobar (oculto -> visible) u ocultar (visible -> oculto)
  const cambiarEstado = async (comentario) => {
    const nuevoEstado = comentario.estado === "visible" ? "oculto" : "visible";

    try {
      await api(`/comentarios/${comentario.id_comentario}/estado`, "PATCH", {
        estado: nuevoEstado
      });
      obtenerComentarios();
    } catch (error) {
      console.error(error);
    }
  };

  const eliminarComentario = async (id) => {
    if (!confirm("¿Eliminar comentario?")) return;

    try {
      await api(`/comentarios/${id}`, "DELETE");
      obtenerComentarios();
    } catch (error) {
      console.error(error);
    }
  };

  const abrirDetalle = (comentario) => {
    setSeleccionado(comentario);
    setRespuesta(comentario.respuesta_admin || "");
  };

  const cerrarDetalle = () => {
    setSeleccionado(null);
    setRespuesta("");
  };

  const guardarRespuesta = async () => {
    try {
      await api(`/comentarios/${seleccionado.id_comentario}/respuesta`, "PATCH", {
        respuesta_admin: respuesta
      });
      obtenerComentarios();
      cerrarDetalle();
    } catch (error) {
      console.error(error);
    }
  };

  const filtrados =
    tab === "todos"
      ? comentarios
      : comentarios.filter((c) => c.estado === tab);

  return (
    <div className="usuarios-container">

      <div className="usuarios-header">
        <h1>Sección de Comentarios</h1>
      </div>

      <div className="comentarios-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? "active" : ""}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="usuarios-table comentarios-table">
        <div className="table-header">
          <span>Usuario</span>
          <span>Comentario (Previe W)</span>
          <span>Fecha de envío</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {filtrados.length === 0 && (
          <p className="comentarios-vacio">No hay comentarios en esta sección.</p>
        )}

        {filtrados.map((c) => (
          <div key={c.id_comentario} className="table-row">

            <span>{c.nombre_usuario} {c.apellido}</span>

            <span
              className="comentario-preview"
              onClick={() => abrirDetalle(c)}
              title="Ver comentario completo"
            >
              {c.comentario}
            </span>

            <span>{formatFecha(c.fecha)}</span>

            <span>
              <span className={`estado-badge ${c.estado === "visible" ? "aprobado" : "pendiente"}`}>
                {ESTADO_LABEL[c.estado] || c.estado}
              </span>
            </span>

            <div className="acciones">
              {c.estado === "visible" ? (
                <>
                  <FaEye title="Ocultar comentario" onClick={() => cambiarEstado(c)} />
                  <FaCheckCircle title="Aprobado" />
                </>
              ) : (
                <FaEyeSlash title="Aprobar y publicar" onClick={() => cambiarEstado(c)} />
              )}
              <FaTrash
                className="icono-eliminar"
                title="Eliminar"
                onClick={() => eliminarComentario(c.id_comentario)}
              />
            </div>
          </div>
        ))}
      </div>

      {seleccionado && (
        <div className="modal-overlay" onClick={cerrarDetalle}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <h2>Comentario de {seleccionado.nombre_usuario}</h2>
            </div>

            <div className="modal-body">
              <p><strong>Servicio:</strong> {seleccionado.nombre_servicio}</p>
              <p><strong>Calificación:</strong> {seleccionado.calificacion} / 5</p>
              <p>{seleccionado.comentario}</p>

              <textarea
                value={respuesta}
                placeholder="Respuesta del administrador"
                rows={4}
                onChange={(e) => setRespuesta(e.target.value)}
              />
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={cerrarDetalle}>
                Cerrar
              </button>
              <button className="btn-save" onClick={guardarRespuesta}>
                Guardar respuesta
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default AdminComentarios;