import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { api } from "../services/api";
import "../styles/adminpanel.css";

// Fecha de hoy en hora local (YYYY-MM-DD), sin saltos por zona horaria
const hoy = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const PACIENTE_VACIO = {
  nombre: "",
  apellido: "",
  correo: "",
  telefono: "",
  fecha_nacimiento: "",
  genero: "",
  direccion: "",
};

const consultaVacia = () => ({
  fecha: hoy(),
  servicio: "",
  diagnostico: "",
  observaciones: "",
});

function ModalRegistrarPaciente({ abierto, onCerrar, onRegistrado }) {
  const [form, setForm] = useState(PACIENTE_VACIO);
  const [incluirConsulta, setIncluirConsulta] = useState(false);
  const [consulta, setConsulta] = useState(consultaVacia);
  const [servicios, setServicios] = useState([]);
  const [cargandoServicios, setCargandoServicios] = useState(false);
  const [errorServicios, setErrorServicios] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  // Cada vez que se abre, el formulario empieza limpio
  useEffect(() => {
    if (!abierto) return;
    setForm(PACIENTE_VACIO);
    setConsulta(consultaVacia());
    setIncluirConsulta(false);
    setError("");
  }, [abierto]);

  // Servicios válidos para el select (se guarda el nombre, igual que en h_clinico)
  useEffect(() => {
    if (!abierto) return;
    let activo = true;
    setCargandoServicios(true);
    setErrorServicios(false);

    api("/historial/servicios")
      .then((res) => {
        if (!activo) return;
        const nombres = (res?.payload || [])
          .map((s) => s.nombre_servicio)
          .filter(Boolean);
        setServicios([...new Set(nombres)]);
      })
      .catch((err) => {
        console.error("No se pudieron cargar los servicios:", err);
        if (!activo) return;
        setServicios([]);
        setErrorServicios(true);
      })
      .finally(() => {
        if (activo) setCargandoServicios(false);
      });

    return () => {
      activo = false;
    };
  }, [abierto]);

  // Escape cierra (salvo mientras se guarda)
  useEffect(() => {
    if (!abierto) return;
    const alPresionar = (e) => {
      if (e.key === "Escape" && !enviando) onCerrar();
    };
    document.addEventListener("keydown", alPresionar);
    return () => document.removeEventListener("keydown", alPresionar);
  }, [abierto, enviando, onCerrar]);

  if (!abierto) return null;

  const cambiar = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const cambiarConsulta = (e) =>
    setConsulta((c) => ({ ...c, [e.target.name]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    if (enviando) return;

    const payload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      correo: form.correo.trim(),
      telefono: form.telefono.trim() || null,
      fecha_nacimiento: form.fecha_nacimiento || null,
      genero: form.genero || null,
      direccion: form.direccion.trim() || null,
      consulta: incluirConsulta
        ? {
            fecha: consulta.fecha,
            servicio: consulta.servicio.trim(),
            diagnostico: consulta.diagnostico.trim(),
            observaciones: consulta.observaciones.trim() || null,
          }
        : null,
    };

    try {
      setEnviando(true);
      setError("");

      const res = await api("/historial/registrar-paciente", "POST", payload);

      onRegistrado?.(res?.payload);
      onCerrar();
    } catch (err) {
      setError(err?.message || "No se pudo registrar al paciente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="rp-fondo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !enviando) onCerrar();
      }}
    >
      <div
        className="rp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rp-titulo"
      >
        <div className="rp-header">
          <div>
            <h2 id="rp-titulo" className="rp-titulo">
              Registrar paciente
            </h2>
            <p className="rp-subtitulo">
              Para pacientes que llegan directo a la clínica.
            </p>
          </div>
          <button
            type="button"
            className="rp-cerrar"
            onClick={onCerrar}
            disabled={enviando}
            aria-label="Cerrar"
          >
            <FaTimes />
          </button>
        </div>

        <form className="rp-form" onSubmit={enviar}>
          <div className="rp-cuerpo">
          <div className="rp-grid">
            <label className="rp-campo">
              <span>Nombre</span>
              <input
                name="nombre"
                value={form.nombre}
                onChange={cambiar}
                maxLength={55}
                required
                autoFocus
              />
            </label>

            <label className="rp-campo">
              <span>Apellido</span>
              <input
                name="apellido"
                value={form.apellido}
                onChange={cambiar}
                maxLength={55}
                required
              />
            </label>

            <label className="rp-campo">
              <span>Correo</span>
              <input
                type="email"
                name="correo"
                value={form.correo}
                onChange={cambiar}
                maxLength={100}
                required
              />
            </label>

            <label className="rp-campo">
              <span>Teléfono</span>
              <input
                type="tel"
                name="telefono"
                value={form.telefono}
                onChange={cambiar}
                maxLength={20}
              />
            </label>

            <label className="rp-campo">
              <span>Fecha de nacimiento</span>
              <input
                type="date"
                name="fecha_nacimiento"
                value={form.fecha_nacimiento}
                onChange={cambiar}
                max={hoy()}
              />
            </label>

            <label className="rp-campo">
              <span>Género</span>
              <select name="genero" value={form.genero} onChange={cambiar}>
                <option value="">Sin especificar</option>
                <option value="femenino">Femenino</option>
                <option value="masculino">Masculino</option>
                <option value="otro">Otro</option>
              </select>
            </label>

            <label className="rp-campo rp-ancho">
              <span>Dirección</span>
              <input
                name="direccion"
                value={form.direccion}
                onChange={cambiar}
                maxLength={400}
              />
            </label>
          </div>

          <label className="rp-toggle">
            <input
              type="checkbox"
              checked={incluirConsulta}
              onChange={(e) => setIncluirConsulta(e.target.checked)}
            />
            <span>
              <strong>Registrar también su consulta</strong>
              <small>
                Actívalo si ya fue atendido. Si no, quedará sin consultas y su
                historial se irá llenando al finalizar sus citas.
              </small>
            </span>
          </label>

          {incluirConsulta && (
            <div className="rp-grid rp-consulta">
              <label className="rp-campo">
                <span>Fecha de la consulta</span>
                <input
                  type="date"
                  name="fecha"
                  value={consulta.fecha}
                  onChange={cambiarConsulta}
                  max={hoy()}
                  required
                />
              </label>

              <label className="rp-campo">
                <span>Servicio realizado</span>
                <select
                  name="servicio"
                  value={consulta.servicio}
                  onChange={cambiarConsulta}
                  disabled={cargandoServicios || servicios.length === 0}
                  required
                >
                  <option value="">
                    {cargandoServicios
                      ? "Cargando servicios..."
                      : errorServicios
                        ? "No se pudieron cargar los servicios"
                        : servicios.length === 0
                          ? "No hay servicios registrados"
                          : "Selecciona un servicio"}
                  </option>
                  {servicios.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="rp-campo rp-ancho">
                <span>Diagnóstico</span>
                <textarea
                  name="diagnostico"
                  value={consulta.diagnostico}
                  onChange={cambiarConsulta}
                  rows={3}
                  required
                />
              </label>

              <label className="rp-campo rp-ancho">
                <span>Observaciones (opcional)</span>
                <textarea
                  name="observaciones"
                  value={consulta.observaciones}
                  onChange={cambiarConsulta}
                  rows={2}
                />
              </label>
            </div>
          )}

          {error && (
            <p className="rp-error" role="alert">
              {error}
            </p>
          )}
          </div>

          <div className="rp-acciones">
            <button
              type="button"
              className="rp-btn rp-btn-sec"
              onClick={onCerrar}
              disabled={enviando}
            >
              Cancelar
            </button>
            <button type="submit" className="rp-btn rp-btn-prin" disabled={enviando}>
              {enviando ? "Guardando..." : "Registrar paciente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalRegistrarPaciente;