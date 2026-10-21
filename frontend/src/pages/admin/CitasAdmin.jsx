  import { useEffect, useMemo, useState, useRef } from "react";
  import { useLocation } from "react-router-dom";
  import "../../styles/CitasAdmin.css";
  import { api } from "../../services/api";
  import FiltrosCard from "../../components/FiltrosCard";
  import ModalConfirmacion from "../../components/ModalConfirmacion";
  import EncabezadoModulo from "../../components/EncabezadoModulo";
  import {
    FaCalendarAlt,
    FaTimesCircle,
    FaCheckCircle,
    FaRegCalendarAlt,
    FaRegClock,
    FaTooth,
  } from "react-icons/fa";

  const normalizar = (texto = "") =>
  texto
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const formatearFecha = (fecha = "") =>
  fecha.split("T")[0].split("-").reverse().join("/");

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
    const solicitudProcesada = useRef(0);
    const [aviso, setAviso] = useState(null);
    const location = useLocation();
    const [soloHoy, setSoloHoy] = useState(!!location.state?.soloHoy);
    const mostrarAviso = (titulo, mensaje) => setAviso({ titulo, mensaje });

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
    mostrarAviso(
      "No se pudieron cargar los horarios",
      error.message || "Intenta de nuevo más tarde."
    );
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
    mostrarAviso(
      "No se pudieron cargar los horarios",
      error.message || "Intenta de nuevo más tarde."
    );
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

const abrirModalCrear = () => {
  setMostrarModal(true);
  setBusquedaPaciente("");
  setPacienteSeleccionado(null);
};

const citasFiltradas = useMemo(() => {
  const q = normalizar(busqueda.trim());

  return citas.filter((cita) => {
    const coincidePaciente = normalizar(cita.nombre_paciente).includes(q);
    const coincideEstado = estado === "" || cita.estado === estado;
    const coincideFecha =
      !soloHoy || cita.fecha_agendada?.slice(0, 10) === fechaMinima;
    return coincidePaciente && coincideEstado && coincideFecha;
  });
}, [citas, busqueda, estado, soloHoy, fechaMinima]);

  const guardarCita = async () => {
  try {
    await api("/citas", "POST", form);

    cerrarModalCrear();   
    obtenerCitas();
    mostrarAviso("Cita creada", "La cita se creó correctamente.");
  } catch (error) {
    console.error(error);
    mostrarAviso(
      "No se pudo crear la cita",
      error.message || "Intenta de nuevo."
    );
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
      motivo,
    });

    cerrarModalAccion();
    obtenerCitas();
    mostrarAviso("Cita reprogramada", "La cita se reprogramó correctamente.");
  } catch (error) {
    console.error(error);
    mostrarAviso(
      "No se pudo reprogramar",
      error.message || "Intenta de nuevo."
    );
  }
};

const cancelarCita = async () => {
  if (!citaSeleccionada) return;

  try {
    await api(`/citas/${citaSeleccionada.id}/cancelar`, "PATCH", { motivo });

    cerrarModalAccion();
    obtenerCitas();
    mostrarAviso("Cita cancelada", "La cita se canceló correctamente.");
  } catch (error) {
    console.error(error);
    mostrarAviso(
      "No se pudo cancelar",
      error.message || "Intenta de nuevo."
    );
  }
};

const finalizarCita = async () => {
  if (!citaSeleccionada) return;

  try {
    await api(`/historial/finalizar-cita/${citaSeleccionada.id}`, "POST", {
      diagnostico,
      observaciones,
    });

    cerrarModalAccion();
    obtenerCitas();
    mostrarAviso("Cita finalizada", "La cita se finalizó correctamente.");
  } catch (error) {
    console.error(error);
    mostrarAviso(
      "No se pudo finalizar",
      error.message || "Intenta de nuevo."
    );
  }
};

    return (

      <div className="citas-container">
      {!modoModal && (
  <>
      <EncabezadoModulo
      titulo="Citas"
      descripcion="Consulta, reprograma y da seguimiento a las citas de la clínica."
      textoBoton="Nueva cita"
      onBoton={abrirModalCrear}
    />

    <FiltrosCard
      placeholder="Buscar paciente..."
      busqueda={busqueda}
      onBusquedaChange={setBusqueda}
      filtro={estado}
      onFiltroChange={setEstado}
      opcionesFiltro={[
        { value: "pendiente", label: "Pendiente" },
        { value: "completada", label: "Completada" },
        { value: "cancelada", label: "Cancelada" },
      ]}
    />
      {soloHoy && (
      <div className="filtro-activo">
        <span>Mostrando solo las citas de hoy</span>
        <button type="button" onClick={() => setSoloHoy(false)}>
          Ver todas
        </button>
      </div>
    )}
    {citasFiltradas.length === 0 ? (
      <p className="citas-vacio">
        {citas.length === 0
          ? "No hay citas registradas."
          : "No se encontraron citas con esos filtros."}
      </p>
    ) : (
      <div className="citas-grid">
        {citasFiltradas.map((cita) => (
          <article key={cita.id} className="cita-card">
            <div className="cita-card-top">
              <h3 className="cita-paciente">{cita.nombre_paciente}</h3>
              <span className={`cita-estado ${cita.estado}`}>
                {cita.estado}
              </span>
            </div>

            <div className="cita-datos">
              <div className="cita-dato">
                <FaRegCalendarAlt />
                <span>{formatearFecha(cita.fecha_agendada)}</span>
              </div>
              <div className="cita-dato">
                <FaRegClock />
                <span>{cita.hora?.slice(0, 5)}</span>
              </div>
              <div className="cita-dato">
                <FaTooth />
                <span title={cita.nombre_servicio}>{cita.nombre_servicio}</span>
              </div>
            </div>

            <div className="cita-acciones">
              <button
                className="cita-btn reprogramar"
                title="Reprogramar"
                aria-label="Reprogramar cita"
                onClick={() => abrirModalAccion("reprogramar", cita)}
              >
                <FaCalendarAlt />
              </button>
              <button
                className="cita-btn cancelar"
                title="Cancelar"
                aria-label="Cancelar cita"
                onClick={() => abrirModalAccion("cancelar", cita)}
              >
                <FaTimesCircle />
              </button>
              <button
                className="cita-btn finalizar"
                title="Finalizar"
                aria-label="Finalizar cita"
                onClick={() => abrirModalAccion("finalizar", cita)}
              >
                <FaCheckCircle />
              </button>
            </div>
          </article>
        ))}
      </div>
    )}
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

    {servicios
    .filter((servicio) => servicio.estado === "activo")
    .map((servicio) => (
      <option key={servicio.id} value={servicio.id}>
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
<ModalConfirmacion
  abierto={!!aviso}
  titulo={aviso?.titulo}
  mensaje={aviso?.mensaje}
  textoCancelar={null}
  textoConfirmar="Aceptar"
  onConfirmar={() => setAviso(null)}
/>
      </div>

    );

  }


  export default CitasAdmin;