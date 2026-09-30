import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/AdminPanel.css";
import { api } from "../../services/api";

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

  const [abierta, setAbierta] = useState(null);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
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
  }, [idPaciente]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const iniciarEdicion = (c) => {
    setAbierta(c.id_historial);
    setEditando(c.id_historial);
    setForm({
      servicio: c.servicio || "",
      diagnostico: c.diagnostico || "",
      observaciones: c.observaciones || "",
    });
  };

  const guardar = async () => {
  const datos = {
    servicio: (form.servicio || "").trim(),
    diagnostico: (form.diagnostico || "").trim(),
    observaciones: (form.observaciones || "").trim(),
  };

  if (!datos.servicio || !datos.diagnostico) {
    setError("El servicio y el diagnóstico son obligatorios.");
    return;
  }

  try {
    setGuardando(true);
    setError("");
    await api(`/historial/${editando}`, "PATCH", datos);
    setEditando(null);
    await cargar();
  } catch (err) {
    console.error(err);
    setError(err.message || "No se pudo actualizar la consulta.");
  } finally {
    setGuardando(false);
  }
};

  return (
    <div className="servicios-container historial-page">
      <button
        type="button"
        className="btn-back"
        onClick={() => navigate("/admin/historial")}
      >
        ← Regresar
      </button>

      {error && <p className="historial-error">{error}</p>}

      {cargando ? (
        <p>Cargando perfil clínico...</p>
      ) : !paciente ? (
        <p>No se encontró el paciente.</p>
      ) : (
        <>
          <div className="table-container perfil-card">
            <h2>Perfil Clínico</h2>
            <div className="perfil-grid">
              <div className="perfil-item">
                <span className="perfil-label">Paciente</span>
                <span className="perfil-valor">{paciente.nombre_usuario}</span>
              </div>
              <div className="perfil-item">
                <span className="perfil-label">ID de paciente</span>
                <span className="perfil-valor">{paciente.id_paciente}</span>
              </div>
            </div>
          </div>

          <div className="table-container">
            <h2>Historial de consultas</h2>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Servicio</th>
                  <th>Diagnóstico</th>
                  <th>Observaciones</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {consultas.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="historial-empty">
                      Este paciente aún no tiene consultas registradas.
                    </td>
                  </tr>
                ) : (
                  consultas.map((c) => (
                    <FilaConsulta
                      key={c.id_historial}
                      c={c}
                      abierta={abierta === c.id_historial}
                      editando={editando === c.id_historial}
                      form={form}
                      setForm={setForm}
                      guardando={guardando}
                      onDetalles={() =>
                        setAbierta(abierta === c.id_historial ? null : c.id_historial)
                      }
                      onEditar={() => iniciarEdicion(c)}
                      onCancelar={() => setEditando(null)}
                      onGuardar={guardar}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function FilaConsulta({
  c, abierta, editando, form, setForm, guardando,
  onDetalles, onEditar, onCancelar, onGuardar,
}) {
  const campo = (name, label) => (
    <label className="form-campo">
      {label}
      <input
        value={form[name] ?? ""}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
      />
    </label>
  );

  return (
    <>
      <tr>
        <td>{formatearFecha(c.fecha)}</td>
        <td>{c.servicio}</td>
        <td>{c.diagnostico}</td>
        <td>{c.observaciones}</td>
        <td>
          <button type="button" className="btn-link" onClick={onDetalles}>
            Ver detalles
          </button>
          <button type="button" className="btn-link" onClick={onEditar}>
            Editar
          </button>
        </td>
      </tr>

      {abierta && (
        <tr className="detalle-fila">
          <td colSpan="5">
            {editando ? (
              <div>
                {campo("servicio", "Servicio")}
                {campo("diagnostico", "Diagnóstico")}
                {campo("observaciones", "Observaciones")}
                <div className="form-acciones">
                  <button
                    type="button"
                    className="btn-guardar"
                    onClick={onGuardar}
                    disabled={guardando}
                  >
                    {guardando ? "Guardando..." : "Guardar cambios"}
                  </button>
                  <button type="button" className="btn-cancelar" onClick={onCancelar}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="detalle-item"><strong>Servicio:</strong> {c.servicio}</p>
                <p className="detalle-item"><strong>Diagnóstico:</strong> {c.diagnostico}</p>
                <p className="detalle-item"><strong>Observaciones:</strong> {c.observaciones}</p>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default AdminHistorialPaciente;