  import { useEffect, useMemo, useState, useRef } from "react";
  import "../../styles/CitasAdmin.css";
  import { api } from "../../services/api";
  import {
    FaCalendarAlt,
    FaTimesCircle,
    FaCheckCircle
  } from "react-icons/fa";

  function CitasAdmin({
  modoModal = false,
  solicitudAbrirModal = 0,
  onCerrarModalDashboard,
}) {

    const obtenerFechaHoy = () => {
    const hoy = new Date();

    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, "0");
    const day = String(hoy.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

const fechaMinima = obtenerFechaHoy();


    const [citas, setCitas] = useState([]);
    const [pacientes, setPacientes] = useState([]);
    const [servicios, setServicios] = useState([]);
    const [horarios, setHorarios] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [busquedaPaciente, setBusquedaPaciente] = useState("");
    const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
    const [estado, setEstado] = useState("");
    const [mostrarModal, setMostrarModal] = useState(false);
    const [modalAccion, setModalAccion] = useState(null);
    const [citaSeleccionada, setCitaSeleccionada] = useState(null);
    const [nuevaFecha, setNuevaFecha] = useState("");
    const [nuevaHora, setNuevaHora] = useState("");
    const [motivo, setMotivo] = useState("");
    const [horariosReprogramacion, setHorariosReprogramacion] = useState([]);
    const [diagnostico, setDiagnostico] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const solicitudProcesada = useRef(false);

    const [form, setForm] = useState({
      id_paciente: "",
      fecha_agendada: "",
      hora: "",
      id_servicio: "",
      estado: "pendiente"
    });

    const obtenerCitas = async () => {

      try {

        const data = await api("/citas");

        setCitas(data.payload || data);

      } catch (error) {

        console.error(error);

      }

    };

const obtenerPacientes = async (busqueda = "") => {
  try {
    const data = await api(
      `/pacientes?busqueda=${encodeURIComponent(busqueda)}`
    );

    setPacientes(data.payload || data);
  } catch (error) {
    console.error(error);
    setPacientes([]);
  }
};
const obtenerHorariosReprogramacion = async () => {
  if (!nuevaFecha || !citaSeleccionada?.id_servicio) {
    setHorariosReprogramacion([]);
    setNuevaHora("");
    return;
  }

  try {
    const res = await api(
      `/citas/horarios-disponibles?fecha=${nuevaFecha}&id_servicio=${citaSeleccionada.id_servicio}`
    );

    const data = res?.payload ?? res?.data ?? res;

    setHorariosReprogramacion(Array.isArray(data) ? data : []);
    setNuevaHora("");
  } catch (error) {
    console.error("Error al cargar horarios:", error);
    setHorariosReprogramacion([]);
    setNuevaHora("");

    alert(error.message || "No se pudieron cargar los horarios");
  }
};
const obtenerServicios = async () => {
  try {
    const data = await api("/servicios");


    setServicios(data.payload || data);
  } catch (error) {
    console.error(error);
  }
};

const obtenerHorarios = async () => {
  if (!form.fecha_agendada || !form.id_servicio) {
    setHorarios([]);
    return;
  }

  try {
    const res = await api(
      `/citas/horarios-disponibles?fecha=${form.fecha_agendada}&id_servicio=${form.id_servicio}`
    );
  
    const data = res?.payload ?? res?.data ?? res;

    setHorarios(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Error al cargar horarios:", error);
    setHorarios([]);
    alert(error.message || "No se pudieron cargar los horarios");
  }
};

useEffect(() => {
  if (!modoModal) {
    obtenerCitas();
  }

  obtenerServicios();
}, [modoModal]);

useEffect(() => {
  if (!mostrarModal) return;

  const tiempo = setTimeout(() => {
    obtenerPacientes(busquedaPaciente);
  }, 300);

  return () => clearTimeout(tiempo);
}, [busquedaPaciente, mostrarModal]);

useEffect(() => {
  if (!mostrarModal) return;

  obtenerHorarios();
}, [form.fecha_agendada, form.id_servicio, mostrarModal]);

  const cerrarModalCrear = () => {
  setMostrarModal(false);
  setBusquedaPaciente("");
  setPacienteSeleccionado(null);

  setForm({
    id_paciente: "",
    fecha_agendada: "",
    hora: "",
    id_servicio: "",
    estado: "pendiente",
  });

  setHorarios([]);
  onCerrarModalDashboard?.();
};

  const guardarCita = async () => {

    try {

      await api("/citas", "POST", form);

      alert("Cita creada correctamente");

      cerrarModalCrear()

      setForm({
        id_paciente: "",
        fecha_agendada: "",
        hora: "",
        id_servicio: "",
        estado: "pendiente"
      });
      setHorarios([]);
      obtenerCitas();

    } catch (error) {

      console.error(error);

      alert(error.message);

    }

  };
  useEffect(() => {
  if (modalAccion !== "reprogramar") return;

  obtenerHorariosReprogramacion();
}, [nuevaFecha, modalAccion, citaSeleccionada]);

useEffect(() => {
  if (
    solicitudAbrirModal > 0 &&
    solicitudAbrirModal !== solicitudProcesada.current
  ) {
    solicitudProcesada.current = solicitudAbrirModal;

    setForm({
      id_paciente: "",
      fecha_agendada: "",
      hora: "",
      id_servicio: "",
      estado: "pendiente",
    });

    setBusquedaPaciente("");
    setPacienteSeleccionado(null);
    setMostrarModal(true);
  }
}, [solicitudAbrirModal]);

const abrirModalAccion = (accion, cita) => {
  setModalAccion(accion);
  setCitaSeleccionada(cita);

  setMotivo("");
  setDiagnostico("");
  setObservaciones("");
};

const cerrarModalAccion = () => {
  setModalAccion(null);
  setCitaSeleccionada(null);

  setNuevaFecha("");
  setNuevaHora("");
  setMotivo("");
  setDiagnostico("");
  setObservaciones("");
};

const reprogramarCita = async () => {
  if (!citaSeleccionada) return;

  try {
    await api(`/citas/${citaSeleccionada.id}`, "PUT", {
      fecha_agendada: nuevaFecha,
      hora: nuevaHora,
      motivo
    });

    alert("Cita reprogramada correctamente");

    cerrarModalAccion();
    obtenerCitas();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};

const cancelarCita = async () => {
  if (!citaSeleccionada) return;

  try {
    await api(`/citas/${citaSeleccionada.id}/cancelar`, "PATCH", {
      motivo
    });

    alert("Cita cancelada correctamente");

    cerrarModalAccion();
    obtenerCitas();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};

const finalizarCita = async () => {
  if (!citaSeleccionada) return;

  try {
    await api(`/historial/finalizar-cita/${citaSeleccionada.id}`, "POST", {
      diagnostico,
      observaciones
    });

    alert("Cita finalizada correctamente");

    cerrarModalAccion();
    obtenerCitas();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};

    const citasFiltradas = useMemo(() => {

      return citas.filter((cita) => {

        const paciente = (cita.nombre_paciente || "").toLowerCase();

        const coincidePaciente =
          paciente.includes(busqueda.toLowerCase());

        const coincideEstado =
          estado === "" || cita.estado === estado;

        return coincidePaciente && coincideEstado;

      });

    }, [citas, busqueda, estado]);
    return (

      <div className="citas-container">
      {!modoModal && (
  <>

        <h1>Gestión de citas</h1>

        <div className="citas-card">

          <div className="citas-filtros">

            <div className="filtros-left">

              <input
                type="text"
                placeholder="Buscar paciente..."
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(e.target.value)
                }
              />

              <select
                value={estado}
                onChange={(e) =>
                  setEstado(e.target.value)
                }
              >

                <option value="">
                  Todos
                </option>

                <option value="pendiente">
                  Pendiente
                </option>

                <option value="completada">
                  Completada
                </option>

                <option value="cancelada">
                  Cancelada
                </option>

              </select>

            </div>

          <button
      className="btn-crear"
      onClick={() => {
  setMostrarModal(true);
  setBusquedaPaciente("");
  setPacienteSeleccionado(null);
}}
  >

      + Crear cita

  </button>

          </div>

        </div>
        <div className="tabla">

          <table>

            <thead>

              <tr>

                <th>Paciente</th>

                <th>Fecha</th>

                <th>Hora</th>

                <th>Servicio</th>

                <th>Estado</th>

                <th>Acciones</th>

              </tr>

            </thead>

            <tbody>

              {citasFiltradas.length === 0 ? (

                <tr>

                  <td colSpan="6">

                    No hay citas.

                  </td>

                </tr>

              ) : (

                citasFiltradas.map((cita) => (

                  <tr key={cita.id}>

                    <td>

                      {cita.nombre_paciente}

                    </td>

                    <td>

                      {cita.fecha_agendada.split("T")[0].split("-").reverse().join("/")}

                    </td>

                    <td>

                      {cita.hora}

                    </td>

                    <td>

                      {cita.nombre_servicio}

                    </td>

                    <td>

                      <span
                        className={`estado ${cita.estado}`}
                      >

                        {cita.estado}

                      </span>

                    </td>

                    <td>

    <div
      style={{
        display: "flex",
        gap: "15px",
        justifyContent: "center",
        fontSize: "20px"
      }}
    >

      <FaCalendarAlt
        color="#3b82f6"
        style={{ cursor: "pointer" }}
        title="Reprogramar"
        onClick={() => abrirModalAccion("reprogramar", cita)}
      />

      <FaTimesCircle
        color="#ef4444"
        style={{ cursor: "pointer" }}
        title="Cancelar"
        onClick={() => abrirModalAccion("cancelar", cita)}
      />

      <FaCheckCircle
        color="#22c55e"
        style={{ cursor: "pointer" }}
        title="Finalizar"
        onClick={() => abrirModalAccion("finalizar", cita)}
      />

    </div>

  </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>
  </>
    )}
  {mostrarModal && (

  <div
  className="modal-overlay"
  onClick={() => cerrarModalCrear()}
  >

  <div
  className="modal-box"
  onClick={(e) => e.stopPropagation()}
  >

  <div className="modal-header">

  <h2>Nueva cita</h2>
   
  </div>

  <div className="modal-body">

 <input
  type="text"
  placeholder="Buscar paciente..."
  value={busquedaPaciente}
  onChange={(e) => {
    setBusquedaPaciente(e.target.value);
    setPacienteSeleccionado(null);

    setForm({
      ...form,
      id_paciente: ""
    });
  }}
/>

{busquedaPaciente && !pacienteSeleccionado && (
  <div className="resultados-pacientes">
    {pacientes.length > 0 ? (
      pacientes.map((paciente) => (
        <div
          key={paciente.id_paciente}
          className="resultado-paciente"
          onClick={() => {
            setPacienteSeleccionado(paciente);

            setForm({
              ...form,
              id_paciente: paciente.id_paciente
            });

            setBusquedaPaciente(paciente.nombre);
          }}
        >
          {paciente.nombre}
        </div>
      ))
    ) : (
      <div className="sin-resultados">
        No se encontraron pacientes
      </div>
    )}
  </div>
)}
<select
  value={form.id_servicio}
  onChange={(e) =>
    setForm({
      ...form,
      id_servicio: e.target.value
    })
  }
>
  <option value="">Seleccionar servicio</option>

  {servicios.map((servicio) => (
    <option
      key={servicio.id}
      value={servicio.id}
    >
      {servicio.nombre}
    </option>
  ))}
</select>

  <input
  type="date"
  min={fechaMinima}
  value={form.fecha_agendada}
  onChange={(e) =>
    setForm({
      ...form,
      fecha_agendada: e.target.value,
      hora: ""
    })
  }
/>

  <select
  value={form.hora}
  onChange={(e) =>
    setForm({
      ...form,
      hora: e.target.value
    })
  }
  disabled={!form.fecha_agendada || !form.id_servicio}
>
  <option value="">
    {!form.fecha_agendada
      ? "Primero selecciona una fecha"
      : !form.id_servicio
        ? "Primero selecciona un servicio"
        : "Seleccionar horario"}
  </option>

  {horarios.map((horario) => (
    <option key={horario} value={horario}>
      {horario}
    </option>
  ))}
</select>

  </div>

  <div className="modal-footer">

 
<button
  className="btn-cancel"
  onClick={cerrarModalCrear}
>
  Cancelar
</button>


  <button
  className="btn-save"
  onClick={guardarCita}
  >

  Guardar

  </button>

  </div>

  </div>

  </div>

  )}
   {modalAccion && (
  <div
    className="modal-overlay"
    onClick={cerrarModalAccion}
  >
    <div
      className="modal-box"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-header">
        <h2>
          {modalAccion === "reprogramar" && "Reprogramar cita"}
          {modalAccion === "cancelar" && "Cancelar cita"}
          {modalAccion === "finalizar" && "Finalizar cita"}
        </h2>
      </div>

      <div className="modal-body">

        {modalAccion === "reprogramar" && (
          <>
            <label>Nueva fecha</label>

            <input
              type="date"
              min={fechaMinima}
              value={nuevaFecha}
              onChange={(e) => setNuevaFecha(e.target.value)}
            />

            <label>Nueva hora</label>

            <select
              value={nuevaHora}
              onChange={(e) => setNuevaHora(e.target.value)}
              disabled={!nuevaFecha}
            >
              <option value="">
                {!nuevaFecha
                  ? "Primero selecciona una fecha"
                  : "Selecciona un horario"}
              </option>

              {horariosReprogramacion.map((horario) => (
                <option key={horario} value={horario}>
                  {horario}
                </option>
              ))}
            </select>

            <label>Motivo</label>

            <textarea
              placeholder="Motivo de la reprogramación"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </>
        )}

        {modalAccion === "cancelar" && (
          <>
            <label>Motivo</label>

            <textarea
              placeholder="Motivo de la cancelación"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </>
        )}

        {modalAccion === "finalizar" && (
          <>
            <label>Diagnóstico</label>

            <textarea
              placeholder="Diagnóstico"
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
            />

            <label>Observaciones</label>

            <textarea
              placeholder="Observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </>
        )}

      </div>

      <div className="modal-footer">

        <button
          className="btn-cancel"
          onClick={cerrarModalAccion}
        >
          Cancelar
        </button>

        <button
          className="btn-save"
          onClick={() => {
            if (modalAccion === "reprogramar") {
              reprogramarCita();
            }

            if (modalAccion === "cancelar") {
              cancelarCita();
            }

            if (modalAccion === "finalizar") {
              finalizarCita();
            }
          }}
        >
          Confirmar
        </button>

      </div>
    </div>
  </div>
)}
      </div>

    );

  }


  export default CitasAdmin;