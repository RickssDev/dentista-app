import { useState } from "react";
import "../../styles/AdminPanel.css";
import { api, apiDescargar } from "../../services/api";

// "en-CA" devuelve YYYY-MM-DD en hora local
const hoy = () => new Date().toLocaleDateString("en-CA");

const primerDiaMes = () => {
  const d = new Date();
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    1,
  ).toLocaleDateString("en-CA");
};

const TARJETAS_CITAS = [
  { key: "total", label: "Total de citas" },
  { key: "completadas", label: "Completadas" },
  { key: "pendientes", label: "Pendientes" },
  { key: "canceladas", label: "Canceladas" },
];

const TARJETAS_PACIENTES = [
  { key: "total", label: "Total de pacientes nuevos" },
];

const EXTENSIONES = { excel: "xlsx", pdf: "pdf" };

function AdminReportes() {
  const [fechaInicio, setFechaInicio] = useState(primerDiaMes());
  const [fechaFin, setFechaFin] = useState(hoy());
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [descargando, setDescargando] = useState("");
  const [error, setError] = useState("");
  const [tipoReporte, setTipoReporte] = useState("citas");

  const validarFechas = () => {
    if (!fechaInicio || !fechaFin) {
      return "Selecciona la fecha inicial y la fecha final";
    }

    if (fechaInicio > fechaFin) {
      return "La fecha inicial no puede ser mayor a la fecha final";
    }

    return "";
  };

  const cambiarFecha = (setter) => (e) => {
    setter(e.target.value);
    setReporte(null);
    setError("");
  };

  const cambiarTipoReporte = (e) => {
    setTipoReporte(e.target.value);
    setReporte(null);
    setError("");
  };

  const generarReporte = async () => {
    const mensaje = validarFechas();

    if (mensaje) {
      setError(mensaje);
      return;
    }

    setError("");
    setCargando(true);

    try {
      const data = await api(
        `/reportes/${tipoReporte}?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      );

      setReporte(data.payload);
    } catch (err) {
      console.error(err);
      setReporte(null);
      setError(err.message || "No se pudo generar el reporte");
    } finally {
      setCargando(false);
    }
  };

  const descargar = async (tipo) => {
    const mensaje = validarFechas();

    if (mensaje) {
      setError(mensaje);
      return;
    }

    setError("");
    setDescargando(tipo);

    try {
      const blob = await apiDescargar(
        `/reportes/${tipoReporte}/exportar/${tipo}?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      );

      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");

      enlace.href = url;
      enlace.download = `reporte-${tipoReporte}_${fechaInicio}_${fechaFin}.${EXTENSIONES[tipo]}`;

      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo descargar el archivo");
    } finally {
      setDescargando("");
    }
  };

  const tarjetas =
    tipoReporte === "citas" ? TARJETAS_CITAS : TARJETAS_PACIENTES;

  return (
    <div className="usuarios-container">
      <div className="usuarios-header">
        <h1>
          {tipoReporte === "citas"
            ? "Reportes de citas"
            : "Reportes de pacientes nuevos"}
        </h1>
      </div>

      {/* Selector del tipo de reporte */}
      <div className="reportes-filtros">
        <div className="reportes-campo">
          <label htmlFor="tipoReporte">Tipo de reporte</label>

          <select
            id="tipoReporte"
            value={tipoReporte}
            onChange={cambiarTipoReporte}
          >
            <option value="citas">Reporte de citas</option>
            <option value="pacientes">Reporte de pacientes nuevos</option>
          </select>
        </div>
      </div>

      {/* Filtros y descargas */}
      <div className="reportes-filtros">
        <div className="reportes-campo">
          <label htmlFor="fechaInicio">Fecha inicial</label>

          <input
            id="fechaInicio"
            type="date"
            value={fechaInicio}
            max={fechaFin || undefined}
            onChange={cambiarFecha(setFechaInicio)}
          />
        </div>

        <div className="reportes-campo">
          <label htmlFor="fechaFin">Fecha final</label>

          <input
            id="fechaFin"
            type="date"
            value={fechaFin}
            min={fechaInicio || undefined}
            onChange={cambiarFecha(setFechaFin)}
          />
        </div>

        <button
          className="btn-add"
          onClick={generarReporte}
          disabled={cargando}
        >
          {cargando ? "Generando..." : "Generar reporte"}
        </button>

        <button
          className="btn-add"
          onClick={() => descargar("excel")}
          disabled={descargando !== ""}
        >
          {descargando === "excel" ? "Descargando..." : "Descargar Excel"}
        </button>

        <button
          className="btn-add"
          onClick={() => descargar("pdf")}
          disabled={descargando !== ""}
        >
          {descargando === "pdf" ? "Descargando..." : "Descargar PDF"}
        </button>
      </div>

      {error && <p className="reportes-error">{error}</p>}

      {/* Resultado del reporte */}
      {reporte && (
        <>
          <p>
            <strong>{reporte.clinica}</strong> · Periodo:{" "}
            {reporte.periodo.fechaInicio} al {reporte.periodo.fechaFin}
          </p>

          <div className="reportes-tarjetas">
            {tarjetas.map((tarjeta) => (
              <div
                key={tarjeta.key}
                className={`reportes-card ${tarjeta.key}`}
              >
                <p className="reportes-numero">
                  {reporte.estadisticas[tarjeta.key]}
                </p>

                <p className="reportes-etiqueta">{tarjeta.label}</p>
              </div>
            ))}
          </div>

          
        </>
      )}
    </div>
  );
}

export default AdminReportes;