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

  useEffect(() => {
    cargarProximaCita();
  }, []);

  const cargarProximaCita = async () => {
    try {
      setLoading(true);
      const res = await api("/citas/miproximacita");
      setProximaCita(res.data || null);
    } catch (error) {
      console.error(error);
      setProximaCita(null);
    } finally {
      setLoading(false);
    }
  };

  const abrirReprogramar = () => {
    if (!proximaCita) return;

    const fechaInicial = proximaCita.fecha_agendada
      ? proximaCita.fecha_agendada.split("T")[0]
      : "";

    const horaInicial = proximaCita.hora
      ? proximaCita.hora.substring(0, 5)
      : "";

    setFecha(fechaInicial);
    setHora(horaInicial);
    setMotivo("");
    setMostrarReprogramar(true);
  };

  const reprogramarCita = async () => {
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
    } catch (error) {
      alert(error.message);
    }
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "";
    return new Date(fechaISO).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
          <h2>Pendiente</h2>
        </div>

        <div className="card">
          <h2>Pendiente</h2>
        </div>
      </div>

      {mostrarReprogramar && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Reprogramar cita</h2>

            <label>Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />

            <label>Hora</label>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />

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