import { useEffect, useState } from "react";
import SidebarPaciente from "../../components/SidebarPaciente";
import { api } from "../../services/api";
import "../../styles/InicioPaciente.css";

function InicioPaciente() {
  const [proximaCita, setProximaCita] = useState(null);
  const [loading, setLoading] = useState(true);

  const [mostrarReprogramar, setMostrarReprogramar] = useState(false);
  const [mostrarCancelar, setMostrarCancelar] = useState(false);

  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [motivo, setMotivo] = useState("");
  const [motivoCancelar, setMotivoCancelar] = useState("");
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [historialCitas, setHistorialCitas] = useState([]);

  useEffect(() => {
    cargarProximaCita();
    cargarHistorialCitas();
  }, []);

  useEffect(() => {
  if (fecha && proximaCita?.id_servicio) {
    cargarHorariosDisponibles(fecha);
  }
}, [fecha, proximaCita?.id_servicio]);
  const cargarProximaCita = async () => {
    try {
      setLoading(true);
      const res = await api("/citas/proximacita");
      setProximaCita(res.data || null);
    } catch (error) {
      console.error(error);
      setProximaCita(null);
    } finally {
      setLoading(false);
    }
  };

  const cargarHorariosDisponibles = async (nuevaFecha) => {
  if (!nuevaFecha || !proximaCita?.id_servicio) {
    setHorariosDisponibles([]);
    return;
  }

  try {
    const res = await api(
      `/citas/horarios-disponibles?fecha=${nuevaFecha}&id_servicio=${proximaCita.id_servicio}`
    );

    console.log("Fecha consultada:", nuevaFecha);
    console.log("ID servicio:", proximaCita.id_servicio);
    console.log("Horarios recibidos:", res.data);

    setHorariosDisponibles(res.data || []);
  } catch (error) {
    console.error(error);
    setHorariosDisponibles([]);
  }
};

  const cargarHistorialCitas = async () => {
  try {
    const res = await api("/citas/miscitas");

    const citas = Array.isArray(res.payload)
      ? res.payload
      : [];

    setHistorialCitas(citas);
  } catch (error) {
    console.error("ERROR MIS CITAS:", error);
    setHistorialCitas([]);
  }
};

  const abrirReprogramar = () => {
  if (!proximaCita) return;

  const fechaInicial = proximaCita.fecha_agendada
    ? proximaCita.fecha_agendada.split("T")[0]
    : "";

  setFecha(fechaInicial);
  setHora("");
  setMotivo("");
  setHorariosDisponibles([]);
  setMostrarReprogramar(true);
};

  const reprogramarCita = async () => {
    if (!fecha || !hora) {
    alert("Selecciona una fecha y un horario");
    return;
  }
    try {
      await api(
        `/citas/${proximaCita.id_cita}`,
        "PUT",
        {
          fecha_agendada: fecha,
          hora,
          motivo,
        }
      );

      alert("Cita reprogramada correctamente");
      setMostrarReprogramar(false);
      cargarProximaCita();
      cargarHistorialCitas();
    } catch (error) {
      alert(error.message);
    }
  };

  const cancelarCita = async () => {
    try {
      await api(
        `/citas/${proximaCita.id_cita}/cancelar`,
        "PATCH",
        {
          motivo: motivoCancelar,
        }
      );

      alert("Cita cancelada correctamente");
      setMostrarCancelar(false);
      setMotivoCancelar("");
      cargarProximaCita();
      cargarHistorialCitas();
    } catch (error) {
      alert(error.message);
    }
  };

  const obtenerFechaHoy = () => {
  const hoy = new Date();

  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, "0");
  const day = String(hoy.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

   const formatearFecha = (fechaISO) => {
  if (!fechaISO) return "";

  const fecha = fechaISO.substring(0, 10);

  const [year, month, day] = fecha.split("-");

  return `${day}/${month}/${year}`;
};


  return (
    <>
      <SidebarPaciente />

      <div className="inicio-container">
        <h1>Bienvenido, paciente</h1>

        <div className="card">
          <h2>Próxima cita</h2>
          <p className="subtitulo">
            Detalles de tu siguiente visita a la clínica
          </p>

          {loading ? (
            <p>Cargando...</p>
          ) : proximaCita ? (
            <>
              <div className="cita-info">
                <div>
                  <strong>Fecha:</strong>
                  <p>{formatearFecha(proximaCita.fecha_agendada)}</p>
                </div>

                <div>
                  <strong>Hora:</strong>
                  <p>{proximaCita.hora.substring(0, 5)}</p>
                </div>

                <div>
                  <strong>Servicio:</strong>
                  <p>{proximaCita.nombre_servicio}</p>
                </div>
              </div>

              <div className="botones">
                <button
                  className="btn btn-reprogramar"
                  onClick={abrirReprogramar}
                >
                  Reprogramar
                </button>

                <button
                  className="btn btn-cancelar"
                  onClick={() => setMostrarCancelar(true)}
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <p>No tienes una próxima cita programada.</p>
          )}
        </div>

       <div className="card">
  <h2>Historial de Citas Recientes</h2>

  <div className="historial-header">
    <span>FECHA</span>
    <span>TRATAMIENTO</span>
    <span>ESTADO</span>
    <span>ESPECIALISTA</span>
  </div>

  {historialCitas.length === 0 ? (
    <p>No tienes citas registradas.</p>
  ) : (
    historialCitas.slice(0, 5).map((cita) => (
      <div className="historial-row" key={cita.id}>
        <span>
          {formatearFecha(cita.fecha_agendada)}
        </span>

        <span>
          {cita.nombre_servicio}
        </span>

        <span>
          <span className={`estado estado-${cita.estado}`}>
            {cita.estado}
          </span>
        </span>

        <span>
          Por asignar
        </span>
      </div>
    ))
  )}
</div>

        <div className="card">
  <h2>Recordatorio</h2>

  {proximaCita ? (
    <>
      <p className="recordatorio-titulo">
        No olvides tu próxima cita
      </p>

      <p>
        No olvides tu cita de{" "}
        <strong>{proximaCita.nombre_servicio}</strong>{" "}
        el{" "}
        <strong>
          {formatearFecha(proximaCita.fecha_agendada)}
        </strong>{" "}
        a las{" "}
        <strong>
          {proximaCita.hora.substring(0, 5)}
        </strong>.
      </p>
    </>
  ) : (
    <p>No tienes próximas citas.</p>
  )}
</div>
      </div>

      {mostrarReprogramar && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Reprogramar cita</h2>

            <label>Fecha</label>
            <input
            type="date"
            min={obtenerFechaHoy()}
            value={fecha}
            onChange={(e) => {
              const nuevaFecha = e.target.value;
              setFecha(nuevaFecha);
              setHora("");
            }}
          />

            <label>Hora</label>
            <select
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            >
              <option value="">Selecciona un horario</option>

              {horariosDisponibles.map((horario) => (
                <option key={horario} value={horario}>
                  {horario}
                </option>
              ))}
            </select>

            <label>Motivo</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Escribe el motivo"
            />

            <div className="modal-botones">
              <button
                className="btn btn-cancelar"
                onClick={() => setMostrarReprogramar(false)}
              >
                Cerrar
              </button>

              <button
                className="btn btn-reprogramar"
                onClick={reprogramarCita}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarCancelar && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Cancelar cita</h2>

            <label>Motivo de cancelación</label>
            <textarea
              value={motivoCancelar}
              onChange={(e) => setMotivoCancelar(e.target.value)}
              placeholder="Escribe el motivo"
            />

            <div className="modal-botones">
              <button
                className="btn btn-cancelar"
                onClick={() => setMostrarCancelar(false)}
              >
                Cerrar
              </button>

              <button
                className="btn btn-reprogramar"
                onClick={cancelarCita}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default InicioPaciente;