import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/AdminPanel.css";
import { FaRegCalendarAlt } from "react-icons/fa";
import { api } from "../../services/api";
import { normalizar } from "../../api/normalize";
import EncabezadoModulo from "../../components/EncabezadoModulo";
import FiltrosCard from "../../components/FiltrosCard";
import ModalRegistrarPaciente from "../../components/ModalRegistrarPaciente";

const formatearFecha = (fecha) => {
  if (!fecha) return "Sin fecha";

  const f = new Date(fecha);

  if (Number.isNaN(f.getTime())) {
    return "Fecha no válida";
  }

  return f.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
};

function AdminHistorial() {
  const [historial, setHistorial] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [aviso, setAviso] = useState("");

  const navigate = useNavigate();

  const obtenerHistorial = async () => {
    try {
      setCargando(true);
      setError("");

      const data = await api("/historial");
      setHistorial(data.payload || []);
    } catch (error) {
      console.error(error);
      setError("No se pudo cargar el historial clínico.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerHistorial();
  }, []);

  // El aviso de éxito se oculta solo
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(""), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  const historialFiltrado = useMemo(() => {
  const q = normalizar(busqueda.trim());

  return historial.filter((item) => {
    const nombreCompleto = normalizar(
      `${item.nombre_usuario || ""} ${item.apellido || ""}`
    );

    return nombreCompleto.includes(q);
  });
}, [historial, busqueda]);

  const verHistorial = (idPaciente) => {
    navigate(`/admin/historial/${idPaciente}`);
  };

  const alRegistrar = (resultado) => {
    setBusqueda("");
    setAviso(
      resultado?.id_historial
        ? "Paciente registrado con su consulta."
        : "Paciente registrado correctamente."
    );
    obtenerHistorial();
  };

  return (
    <div className="usuarios-container">
      <EncabezadoModulo
        titulo="Historial clínico"
        descripcion="Consulta el historial de consultas de cada paciente."
        textoBoton="Nuevo registro"
        onBoton={() => setModalAbierto(true)}
      />

      <FiltrosCard
        placeholder="Buscar paciente..."
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
      />

      {aviso && (
        <p className="rp-aviso" role="status">
          {aviso}
        </p>
      )}

      {error && <p className="mensaje-error">{error}</p>}

      {cargando ? (
        <p className="usuarios-vacio">Cargando historiales...</p>
      ) : historialFiltrado.length === 0 ? (
        <p className="usuarios-vacio">
          {busqueda
            ? "No se encontraron pacientes."
            : "Todavía no hay pacientes registrados."}
        </p>
      ) : (
        <div className="paciente-cards">
          {historialFiltrado.map((item) => (
            <article key={item.id_paciente} className="paciente-card">
              <div className="paciente-card-top">
                <div className="paciente-avatar">
                  {(item.nombre_usuario || "?").charAt(0).toUpperCase()}
                </div>

                <div className="paciente-info">
                <h3 className="paciente-nombre">
                  {item.nombre_usuario} {item.apellido}
                </h3>

                <p className="paciente-rol">Paciente</p>
              </div>
              </div>

              <div className="paciente-dato">
                <FaRegCalendarAlt />
                <span>
                  {item.ultima_consulta
                    ? `Última consulta: ${formatearFecha(item.ultima_consulta)}`
                    : "Sin consultas todavía"}
                </span>
              </div>

              <div className="paciente-acciones">
                <button
                  type="button"
                  className="btn-card-edit"
                  onClick={() => verHistorial(item.id_paciente)}
                >
                  Ver historial
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ModalRegistrarPaciente
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onRegistrado={alRegistrar}
      />
    </div>
  );
}

export default AdminHistorial;