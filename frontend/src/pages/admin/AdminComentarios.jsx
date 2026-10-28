import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import "../../styles/adminpanel.css";
import {
  FaStar,
  FaCheck,
  FaRegCalendarAlt,
  FaRegEyeSlash,
  FaRegCheckCircle,
  FaRegTrashAlt,
} from "react-icons/fa";
import { api } from "../../services/api";
import { normalizar } from "../../api/normalize";
import EncabezadoModulo from "../../components/EncabezadoModulo";
import FiltrosCard from "../../components/FiltrosCard";
import ModalConfirmacion from "../../components/ModalConfirmacion";
import ModalFormulario from "../../components/ModalFormulario";

const ESTADO_LABEL = {
  visible: "Aprobado",
  oculto: "Pendiente",
};

const MESES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const formatFecha = (fecha) => {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (isNaN(d)) return "";
  const dia = String(d.getDate()).padStart(2, "0");
  return `${dia}/${MESES[d.getMonth()]}/${d.getFullYear()}`;
};

function Estrellas({ valor }) {
  const calificacion = Math.round(Number(valor)) || 0;

  return (
    <div className="comentario-estrellas" aria-label={`${calificacion} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <FaStar key={n} className={n <= calificacion ? "llena" : ""} />
      ))}
    </div>
  );
}

function AdminComentarios() {
  const [comentarios, setComentarios] = useState([]);
  const [tab, setTab] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [respuesta, setRespuesta] = useState("");
  const [errorForm, setErrorForm] = useState("");
  const location = useLocation();
  const [filtroEstado, setFiltroEstado] = useState(
    location.state?.filtroEstado || "",
  );
  const [comentarioAEliminar, setComentarioAEliminar] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [guardando, setGuardando] = useState(false);

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

  const contadores = useMemo(
    () => ({
      todos: comentarios.length,
      oculto: comentarios.filter((c) => c.estado === "oculto").length,
      visible: comentarios.filter((c) => c.estado === "visible").length,
    }),
    [comentarios],
  );

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda.trim());

    return comentarios.filter((c) => {
      const coincideEstado = !filtroEstado || c.estado === filtroEstado;
      const texto = normalizar(
        `${c.nombre_usuario} ${c.apellido} ${c.nombre_servicio} ${c.comentario}`,
      );
      return coincideEstado && texto.includes(q);
    });
  }, [comentarios, filtroEstado, busqueda]);

  // Aprobar (oculto -> visible) u ocultar (visible -> oculto)
  const cambiarEstado = async (comentario) => {
    const nuevoEstado = comentario.estado === "visible" ? "oculto" : "visible";

    try {
      await api(`/comentarios/${comentario.id_comentario}/estado`, "PATCH", {
        estado: nuevoEstado,
      });
      obtenerComentarios();
    } catch (error) {
      console.error(error);
      setAviso({
        titulo: "No se pudo cambiar el estado",
        mensaje:
          "Ocurrió un error al actualizar el comentario. Intenta de nuevo.",
      });
    }
  };

  const confirmarEliminar = async () => {
    const id = comentarioAEliminar.id_comentario;
    setComentarioAEliminar(null);

    try {
      await api(`/comentarios/${id}`, "DELETE");
      obtenerComentarios();
    } catch (error) {
      console.error(error);
      setAviso({
        titulo: "No se pudo eliminar",
        mensaje:
          "Ocurrió un error al eliminar el comentario. Intenta de nuevo.",
      });
    }
  };

  const abrirDetalle = (comentario) => {
    setSeleccionado(comentario);
    setRespuesta(comentario.respuesta_admin || "");
    setErrorForm("");
  };

  const cerrarDetalle = () => {
    setSeleccionado(null);
    setRespuesta("");
    setErrorForm("");
  };

  const guardarRespuesta = async () => {
    setErrorForm("");

    try {
      setGuardando(true);

      await api(
        `/comentarios/${seleccionado.id_comentario}/respuesta`,
        "PATCH",
        {
          respuesta_admin: respuesta,
        },
      );

      obtenerComentarios();
      cerrarDetalle();
    } catch (error) {
      console.error(error);
      setErrorForm(error.message || "No se pudo guardar la respuesta");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="usuarios-container">
      <EncabezadoModulo
        titulo="Comentarios"
        descripcion="Modera las opiniones de los pacientes y responde a ellas."
      />

      <FiltrosCard
        placeholder="Buscar por usuario o comentario..."
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        filtro={filtroEstado}
        onFiltroChange={setFiltroEstado}
        textoTodos={`Todos (${contadores.todos})`}
        opcionesFiltro={[
          { value: "oculto", label: `Pendientes (${contadores.oculto})` },
          { value: "visible", label: `Aprobados (${contadores.visible})` },
        ]}
      />

      {filtrados.length === 0 ? (
        <p className="usuarios-vacio">
          {comentarios.length === 0
            ? "Aún no hay comentarios."
            : "No hay comentarios que coincidan con tu búsqueda en esta sección."}
        </p>
      ) : (
        <div className="comentario-cards">
          {filtrados.map((c) => {
            const aprobado = c.estado === "visible";

            return (
              <article key={c.id_comentario} className="comentario-card">
                <div className="comentario-card-top">
                  <div className="comentario-usuario">
                    <h3 className="comentario-nombre">
                      {c.nombre_usuario} {c.apellido}
                    </h3>
                    {c.nombre_servicio && (
                      <p className="comentario-servicio">{c.nombre_servicio}</p>
                    )}
                  </div>

                  <span
                    className={`comentario-estado ${aprobado ? "aprobado" : "pendiente"}`}
                  >
                    {ESTADO_LABEL[c.estado] || c.estado}
                  </span>
                </div>

                <Estrellas valor={c.calificacion} />

                <p
                  className="comentario-texto"
                  onClick={() => abrirDetalle(c)}
                  title="Ver comentario completo"
                >
                  {c.comentario}
                </p>

                <div className="comentario-meta">
                  <span className="comentario-fecha">
                    <FaRegCalendarAlt />
                    {formatFecha(c.fecha)}
                  </span>

                  {c.respuesta_admin && (
                    <span className="comentario-respondido">
                      <FaCheck />
                      Respondido
                    </span>
                  )}
                </div>

                <div className="comentario-acciones">
                  <button
                    className="btn-card-edit"
                    onClick={() => abrirDetalle(c)}
                  >
                    Ver y responder
                  </button>

                  <button
                    className={`btn-card-icon${aprobado ? "" : " aprobar"}`}
                    title={
                      aprobado ? "Ocultar comentario" : "Aprobar y publicar"
                    }
                    aria-label={
                      aprobado
                        ? "Ocultar comentario"
                        : "Aprobar y publicar comentario"
                    }
                    onClick={() => cambiarEstado(c)}
                  >
                    {aprobado ? <FaRegEyeSlash /> : <FaRegCheckCircle />}
                  </button>

                  <button
                    className="btn-card-delete"
                    title="Eliminar"
                    aria-label="Eliminar comentario"
                    onClick={() => setComentarioAEliminar(c)}
                  >
                    <FaRegTrashAlt />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ModalFormulario
        abierto={!!seleccionado}
        titulo={
          seleccionado
            ? `Comentario de ${seleccionado.nombre_usuario}`
            : "Comentario"
        }
        subtitulo="Consulta la opinión del paciente y responde desde aquí."
        onCerrar={cerrarDetalle}
        onSubmit={guardarRespuesta}
        enviando={guardando}
        error={errorForm}
        textoEnviar="Guardar respuesta"
        textoCancelar="Cerrar"
        ancho={560}
      >
        {seleccionado && (
          <div className="mf-grid">
            <div className="mf-campo mf-ancho">
              <span>Servicio</span>
              <p>{seleccionado.nombre_servicio || "Sin servicio"}</p>
            </div>

            <div className="mf-campo mf-ancho">
              <span>Calificación</span>

              <div className="comentario-modal-linea">
                <Estrellas valor={seleccionado.calificacion} />
                <span>{seleccionado.calificacion} / 5</span>
              </div>
            </div>

            <div className="mf-campo mf-ancho">
              <span>Comentario</span>
              <p className="comentario-completo">{seleccionado.comentario}</p>
            </div>

            <label className="mf-campo mf-ancho">
              <span>Respuesta del administrador</span>
              <textarea
                value={respuesta}
                placeholder="Escribe una respuesta"
                rows={4}
                onChange={(e) => setRespuesta(e.target.value)}
              />
            </label>
          </div>
        )}
      </ModalFormulario>

      <ModalConfirmacion
        abierto={!!comentarioAEliminar}
        titulo="Eliminar comentario"
        mensaje={
          comentarioAEliminar
            ? `¿Seguro que quieres eliminar el comentario de ${comentarioAEliminar.nombre_usuario}? Esta acción no se puede deshacer.`
            : ""
        }
        textoConfirmar="Eliminar"
        peligro
        onConfirmar={confirmarEliminar}
        onCancelar={() => setComentarioAEliminar(null)}
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

export default AdminComentarios;
