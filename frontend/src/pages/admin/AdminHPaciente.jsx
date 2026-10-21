import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/AdminPanel.css";
import { FaRegCalendarAlt } from "react-icons/fa";
import { api } from "../../services/api";
import EncabezadoModulo from "../../components/EncabezadoModulo";

const formatearFecha = (fecha) => {
  if (!fecha) return "Sin fecha";
  const f = new Date(fecha);
  if (Number.isNaN(f.getTime())) return "Fecha no válida";
  return f.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
};

function AdminHistorialPaciente() {
  const { idPaciente } = useParams();
  const navigate = useNavigate();

  const [paciente, setPaciente] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [consultaEditando, setConsultaEditando] = useState(null);
  const [form, setForm] = useState({
    servicio: "",
    diagnostico: "",
    observaciones: "",
  });
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  // mostrarCarga=false recarga en segundo plano, sin reemplazar la pantalla
  const cargar = useCallback(
    async (mostrarCarga = true) => {
      try {
        if (mostrarCarga) setCargando(true);
        setError("");
        const data = await api(`/historial/paciente/${idPaciente}`);
        setPaciente(data.payload?.paciente || null);
        setConsultas(data.payload?.consultas || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudo cargar el perfil clínico.");
      } finally {
        setCargando(false);
      }
    },
    [idPaciente]
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  const abrirEdicion = (c) => {
    setConsultaEditando(c);
    setForm({
      servicio: c.servicio || "",
      diagnostico: c.diagnostico || "",
      observaciones: c.observaciones || "",
    });
    setErrorForm("");
  };

  const cerrarEdicion = () => {
    setConsultaEditando(null);
    setErrorForm("");
  };

  const guardar = async () => {
    const datos = {
      servicio: (form.servicio || "").trim(),
      diagnostico: (form.diagnostico || "").trim(),
      observaciones: (form.observaciones || "").trim(),
    };

    if (!datos.servicio || !datos.diagnostico) {
      setErrorForm("El servicio y el diagnóstico son obligatorios.");
      return;
    }

    try {
      setGuardando(true);
      setErrorForm("");
      await api(`/historial/${consultaEditando.id_historial}`, "PATCH", datos);
      cerrarEdicion();
      await cargar(false);
    } catch (err) {
      console.error(err);
      setErrorForm(err.message || "No se pudo actualizar la consulta.");
    } finally {
      setGuardando(false);
    }
  };

  const cambiarCampo = (campo) => (e) =>
    setForm({ ...form, [campo]: e.target.value });

  return (
    <div className="usuarios-container">
      <EncabezadoModulo
        titulo="Perfil clínico"
        descripcion="Consulta y edita el historial de consultas del paciente."
        onVolver={() => navigate("/admin/historial")}
        textoVolver="Volver al historial"
      />

      {error && <p className="mensaje-error">{error}</p>}

      {cargando ? (
        <p className="usuarios-vacio">Cargando perfil clínico...</p>
      ) : !paciente ? (
        <p className="usuarios-vacio">No se encontró el paciente.</p>
      ) : (
        <>
          <section className="clinico-card">
            <h2 className="clinico-titulo">Datos del paciente</h2>

            <div className="clinico-grid">
              <div className="clinico-item">
                <span className="clinico-label">Paciente</span>
                <span className="clinico-valor">{paciente.nombre_usuario} {paciente.apellido}</span>
              </div>
              <div className="clinico-item">
                <span className="clinico-label">ID de paciente</span>
                <span className="clinico-valor">{paciente.id_paciente}</span>
              </div>
            </div>
          </section>

          <h2 className="clinico-seccion">Historial de consultas</h2>

          {consultas.length === 0 ? (
            <p className="usuarios-vacio">
              Este paciente aún no tiene consultas registradas.
            </p>
          ) : (
            <div className="consulta-lista">
              {consultas.map((c) => (
                <article key={c.id_historial} className="consulta-card">
                  <div className="consulta-card-top">
                    <div className="consulta-fecha">
                      <FaRegCalendarAlt />
                      <span>{formatearFecha(c.fecha)}</span>
                    </div>
                    <span className="consulta-servicio">{c.servicio}</span>
                  </div>

                  <div className="consulta-campo">
                    <span className="consulta-label">Diagnóstico</span>
                    <p className="consulta-texto">{c.diagnostico}</p>
                  </div>

                  <div className="consulta-campo">
                    <span className="consulta-label">Observaciones</span>
                    <p className="consulta-texto">
                      {c.observaciones || "Sin observaciones"}
                    </p>
                  </div>

                  <div className="consulta-acciones">
                    <button
                      type="button"
                      className="btn-card-edit"
                      onClick={() => abrirEdicion(c)}
                    >
                      Editar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {consultaEditando && (
        <div className="modal-overlay" onClick={cerrarEdicion}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar consulta</h2>
            </div>

            <div className="modal-body">
              <label className="modal-label">Servicio</label>
              <input
                value={form.servicio}
                placeholder="Servicio"
                onChange={cambiarCampo("servicio")}
              />

              <label className="modal-label">Diagnóstico</label>
              <textarea
                value={form.diagnostico}
                placeholder="Diagnóstico"
                rows={3}
                onChange={cambiarCampo("diagnostico")}
              />

              <label className="modal-label">Observaciones</label>
              <textarea
                value={form.observaciones}
                placeholder="Observaciones"
                rows={3}
                onChange={cambiarCampo("observaciones")}
              />

              {errorForm && <p className="modal-error">{errorForm}</p>}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={cerrarEdicion}>
                Cancelar
              </button>
              <button
                className="btn-save"
                onClick={guardar}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminHistorialPaciente;