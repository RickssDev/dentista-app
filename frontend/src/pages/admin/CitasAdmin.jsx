  import { useEffect, useMemo, useState, useRef } from "react";
  import { useLocation } from "react-router-dom";
  import "../../styles/CitasAdmin.css";
  import { api } from "../../services/api";
  import FiltrosCard from "../../components/FiltrosCard";
  import ModalConfirmacion from "../../components/ModalConfirmacion";
  import EncabezadoModulo from "../../components/EncabezadoModulo";
  import ModalFormulario from "../../components/ModalFormulario";
  import {
    FaCalendarAlt,
    FaTimesCircle,
    FaCheckCircle,
    FaRegCalendarAlt,
    FaRegClock,
    FaTooth,
    FaListUl, 
    FaPlus,
  } from "react-icons/fa";
  import CalendarioMes from "../../components/CalendarioMes";
  import { hoyClave, fechaLarga } from "../../utils/fechas";

  const normalizar = (texto = "") =>
  texto
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const FORM_CITA_VACIO = {
  id_paciente: "",
  fecha_agendada: "",
  hora: "",
  id_servicio: "",
  estado: "pendiente",
  };

const ACCIONES = {
  reprogramar: { titulo: "Reprogramar cita", enviar: "Reprogramar" },
  cancelar: { titulo: "Cancelar cita", enviar: "Cancelar cita" },
  finalizar: { titulo: "Finalizar cita", enviar: "Finalizar cita" },
};

  const formatearFecha = (fecha = "") =>
    fecha.split("T")[0].split("-").reverse().join("/");

    function CitasAdmin({
    modoModal = false,
    solicitudAbrirModal = 0,
    onCerrarModalDashboard,
  }) {

const fechaMinima = hoyClave();


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
    const [vista, setVista] = useState(location.state?.vista === "calendario" ? "calendario" : "lista");
    const [diaSeleccionado, setDiaSeleccionado] = useState(fechaMinima);
    const mostrarAviso = (titulo, mensaje) => setAviso({ titulo, mensaje });
    const [guardando, setGuardando] = useState(false);

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

const abrirModalCrear = (fecha = "") => {
  setForm({ ...FORM_CITA_VACIO, fecha_agendada: fecha });
  setBusquedaPaciente("");
  setPacienteSeleccionado(null);
  setMostrarModal(true);
};

const citasFiltradas = useMemo(() => {
  const q = normalizar(busqueda.trim());

  return citas.filter((cita) => {
    const coincidePaciente = normalizar(cita.nombre_paciente).includes(q);
    const coincideEstado = estado === "" || cita.estado === estado;
    return coincidePaciente && coincideEstado;
  });
}, [citas, busqueda, estado]);

// Citas del día seleccionado en el calendario, ordenadas por hora
const citasDelDia = useMemo(
  () =>
    citasFiltradas
      .filter((cita) => cita.fecha_agendada?.slice(0, 10) === diaSeleccionado)
      .sort((a, b) => (a.hora || "").localeCompare(b.hora || "")),
  [citasFiltradas, diaSeleccionado]
);

  const guardarCita = async () => {
  if (!form.id_paciente) {
    mostrarAviso("Falta el paciente", "Busca y selecciona un paciente de la lista.");
    return;
  }

  try {
    setGuardando(true);
    await api("/citas", "POST", form);

    cerrarModalCrear();
    obtenerCitas();
    mostrarAviso("Cita creada", "La cita se creó correctamente.");
  } catch (error) {
    console.error(error);
    mostrarAviso("No se pudo crear la cita", error.message || "Intenta de nuevo.");
  } finally {
    setGuardando(false);
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

const confirmarAccion = async () => {
  setGuardando(true);
  try {
    if (modalAccion === "reprogramar") await reprogramarCita();
    if (modalAccion === "cancelar") await cancelarCita();
    if (modalAccion === "finalizar") await finalizarCita();
  } finally {
    setGuardando(false);
  }
};
const accion = ACCIONES[modalAccion];
    return (

      <div className="citas-container">
        {!modoModal && (
  <>
    <EncabezadoModulo
      titulo="Citas"
      descripcion="Consulta, reprograma y da seguimiento a las citas de la clínica."
      textoBoton="Nueva cita"
      onBoton={() =>
        abrirModalCrear(
          vista === "calendario" && diaSeleccionado >= fechaMinima
            ? diaSeleccionado
            : ""
        )
      }
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
    >
      <div className="vista-toggle" role="group" aria-label="Tipo de vista">
        <button
          type="button"
          className={vista === "lista" ? "activo" : ""}
          aria-pressed={vista === "lista"}
          onClick={() => setVista("lista")}
        >
          <FaListUl /> Lista
        </button>
        <button
          type="button"
          className={vista === "calendario" ? "activo" : ""}
          aria-pressed={vista === "calendario"}
          onClick={() => setVista("calendario")}
        >
          <FaRegCalendarAlt /> Calendario
        </button>
      </div>
    </FiltrosCard>

    {vista === "calendario" ? (
      <div className="cal-layout">
        <CalendarioMes
          citas={citasFiltradas}
          diaSeleccionado={diaSeleccionado}
          onSeleccionarDia={setDiaSeleccionado}
          hoy={fechaMinima}
        />

        <section className="cal-panel">
          <div className="cal-panel-cabecera">
            <h2 className="cal-panel-titulo">{fechaLarga(diaSeleccionado)}</h2>
            <span className="cal-panel-total">
              {citasDelDia.length} {citasDelDia.length === 1 ? "cita" : "citas"}
            </span>
          </div>

          {citasDelDia.length === 0 ? (
            <p className="citas-vacio">No hay citas este día.</p>
          ) : (
            <ul className="cal-citas">
              {citasDelDia.map((cita) => (
                <li key={cita.id} className="cal-cita">
                  <div className="cal-cita-cabecera">
                    <span className="agenda-hora">{cita.hora?.slice(0, 5)}</span>
                    <span className={`cita-estado ${cita.estado}`}>{cita.estado}</span>
                  </div>

                  <p className="cal-cita-paciente">{cita.nombre_paciente}</p>
                  <p className="cal-cita-servicio">{cita.nombre_servicio}</p>

                  <div className="cal-cita-acciones">
                    <button
                      type="button"
                      className="agenda-btn reprogramar"
                      title="Reprogramar"
                      aria-label="Reprogramar cita"
                      onClick={() => abrirModalAccion("reprogramar", cita)}
                    >
                      <FaCalendarAlt />
                    </button>
                    <button
                      type="button"
                      className="agenda-btn cancelar"
                      title="Cancelar"
                      aria-label="Cancelar cita"
                      onClick={() => abrirModalAccion("cancelar", cita)}
                    >
                      <FaTimesCircle />
                    </button>
                    <button
                      type="button"
                      className="agenda-btn finalizar"
                      title="Finalizar"
                      aria-label="Finalizar cita"
                      onClick={() => abrirModalAccion("finalizar", cita)}
                    >
                      <FaCheckCircle />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {diaSeleccionado >= fechaMinima && (
            <button
              type="button"
              className="btn-card-edit cal-nueva"
              onClick={() => abrirModalCrear(diaSeleccionado)}
            >
              <FaPlus /> Nueva cita este día
            </button>
          )}
        </section>
      </div>
    ) : citasFiltradas.length === 0 ? (
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
              <span className={`cita-estado ${cita.estado}`}>{cita.estado}</span>
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
      {/* Nueva cita */}
<ModalFormulario
  abierto={mostrarModal}
  titulo="Nueva cita"
  subtitulo="Agenda una cita para un paciente registrado."
  onCerrar={cerrarModalCrear}
  onSubmit={guardarCita}
  enviando={guardando}
  textoEnviar="Guardar cita"
  ancho={560}
>
  <div className="mf-grid">
    <div className="mf-campo mf-ancho">
      <span>Paciente</span>
      <input
        type="text"
        placeholder="Escribe para buscar..."
        aria-label="Buscar paciente"
        autoComplete="off"
        value={busquedaPaciente}
        onChange={(e) => {
          setBusquedaPaciente(e.target.value);
          setPacienteSeleccionado(null);
          setForm({ ...form, id_paciente: "" });
        }}
        required
      />

      {busquedaPaciente && !pacienteSeleccionado && (
        <ul className="mf-resultados">
          {pacientes.length > 0 ? (
            pacientes.map((paciente) => (
              <li key={paciente.id_paciente}>
                <button
                  type="button"
                  className="mf-resultado"
                  onClick={() => {
                    setPacienteSeleccionado(paciente);
                    setForm({ ...form, id_paciente: paciente.id_paciente });
                    setBusquedaPaciente(paciente.nombre);
                  }}
                >
                  {paciente.nombre}
                </button>
              </li>
            ))
          ) : (
            <li className="mf-sin-resultados">No se encontraron pacientes</li>
          )}
        </ul>
      )}
    </div>

    <label className="mf-campo mf-ancho">
      <span>Servicio</span>
      <select
        value={form.id_servicio}
        onChange={(e) => setForm({ ...form, id_servicio: e.target.value })}
        required
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
    </label>

    <label className="mf-campo">
      <span>Fecha</span>
      <input
        type="date"
        min={fechaMinima}
        value={form.fecha_agendada}
        onChange={(e) =>
          setForm({ ...form, fecha_agendada: e.target.value, hora: "" })
        }
        required
      />
    </label>

    <label className="mf-campo">
      <span>Hora</span>
      <select
        value={form.hora}
        onChange={(e) => setForm({ ...form, hora: e.target.value })}
        disabled={!form.fecha_agendada || !form.id_servicio}
        required
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
    </label>
  </div>
</ModalFormulario>

{/* Reprogramar / cancelar / finalizar */}
<ModalFormulario
  abierto={!!modalAccion}
  titulo={accion?.titulo || ""}
  subtitulo={
    citaSeleccionada
      ? `${citaSeleccionada.nombre_paciente} · ${formatearFecha(
          citaSeleccionada.fecha_agendada
        )} · ${citaSeleccionada.hora?.slice(0, 5)}`
      : ""
  }
  onCerrar={cerrarModalAccion}
  onSubmit={confirmarAccion}
  enviando={guardando}
  textoEnviar={accion?.enviar || "Confirmar"}
  textoCancelar={modalAccion === "cancelar" ? "Volver" : "Cancelar"}
  peligro={modalAccion === "cancelar"}
  ancho={500}
>
  {modalAccion === "reprogramar" && (
    <div className="mf-grid">
      <label className="mf-campo">
        <span>Nueva fecha</span>
        <input
          type="date"
          min={fechaMinima}
          value={nuevaFecha}
          onChange={(e) => setNuevaFecha(e.target.value)}
          required
        />
      </label>

      <label className="mf-campo">
        <span>Nueva hora</span>
        <select
          value={nuevaHora}
          onChange={(e) => setNuevaHora(e.target.value)}
          disabled={!nuevaFecha}
          required
        >
          <option value="">
            {!nuevaFecha ? "Primero selecciona una fecha" : "Selecciona un horario"}
          </option>
          {horariosReprogramacion.map((horario) => (
            <option key={horario} value={horario}>
              {horario}
            </option>
          ))}
        </select>
      </label>

      <label className="mf-campo mf-ancho">
        <span>Motivo</span>
        <textarea
          rows={3}
          placeholder="Motivo de la reprogramación"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
      </label>
    </div>
  )}

  {modalAccion === "cancelar" && (
    <label className="mf-campo">
      <span>Motivo</span>
      <textarea
        rows={3}
        placeholder="Motivo de la cancelación"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
      />
    </label>
  )}

  {modalAccion === "finalizar" && (
    <>
      <label className="mf-campo">
        <span>Diagnóstico</span>
        <textarea
          rows={3}
          value={diagnostico}
          onChange={(e) => setDiagnostico(e.target.value)}
          required
        />
      </label>

      <label className="mf-campo">
        <span>Observaciones (opcional)</span>
        <textarea
          rows={2}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
        />
      </label>

      <p className="mf-mensaje">
        Se guardará en el historial clínico del paciente.
      </p>
    </>
  )}
</ModalFormulario>
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