import { useEffect, useState } from "react";
import "../../styles/AdminPanel.css";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import { api, apiDescargar } from "../../services/api";
import EncabezadoModulo from "../../components/EncabezadoModulo";

const MAX_DIAS = 366;

// "en-CA" devuelve YYYY-MM-DD en hora local
const formatoISO = (fecha) => fecha.toLocaleDateString("en-CA");
const hoy = () => formatoISO(new Date());

const formatearFecha = (fecha) =>
  fecha ? fecha.slice(0, 10).split("-").reverse().join("/") : "";

// Cada rango devuelve [fechaInicio, fechaFin]
const RANGOS = [
  { id: "hoy", label: "Hoy", calcular: () => [hoy(), hoy()] },
  {
    id: "7dias",
    label: "Últimos 7 días",
    calcular: () => {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      return [formatoISO(d), hoy()];
    },
  },
  {
    id: "mes",
    label: "Este mes",
    calcular: () => {
      const d = new Date();
      return [formatoISO(new Date(d.getFullYear(), d.getMonth(), 1)), hoy()];
    },
  },
  {
    id: "anio",
    label: "Este año",
    calcular: () => [
      formatoISO(new Date(new Date().getFullYear(), 0, 1)),
      hoy(),
    ],
  },
];

// Para agregar un tipo de reporte nuevo, basta con añadir una entrada aquí
const TIPOS = {
  citas: {
    nombre: "Reporte de citas",
    descripcion: "Estadísticas de las citas de la clínica en el periodo seleccionado.",
    tarjetas: [
      { key: "total", label: "Total de citas" },
      { key: "completadas", label: "Completadas" },
      { key: "pendientes", label: "Pendientes" },
      { key: "canceladas", label: "Canceladas" },
    ],
  },
  pacientes: {
    nombre: "Reporte de pacientes nuevos",
    descripcion: "Pacientes nuevos registrados en el periodo seleccionado.",
    tarjetas: [{ key: "total", label: "Total de pacientes nuevos" }],
  },
};

const EXTENSIONES = { excel: "xlsx", pdf: "pdf" };

const validarFechas = (inicio, fin) => {
  if (!inicio || !fin) return "Selecciona la fecha inicial y la fecha final";
  if (inicio > fin) return "La fecha inicial no puede ser mayor a la fecha final";

  const dias = (new Date(fin) - new Date(inicio)) / 86400000;
  if (dias > MAX_DIAS) return "El rango máximo es de un año (366 días)";

  return "";
};

function AdminReportes() {
  const [tipo, setTipo] = useState("citas");
  const [fechaInicio, setFechaInicio] = useState(() => RANGOS[2].calcular()[0]);
  const [fechaFin, setFechaFin] = useState(() => RANGOS[2].calcular()[1]);
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [descargando, setDescargando] = useState("");
  const [error, setError] = useState("");

  const errorFechas = validarFechas(fechaInicio, fechaFin);
  const mensajeError = errorFechas || error;

  // Rango rápido seleccionado (si las fechas coinciden con alguno)
  const rangoActivo = RANGOS.find((r) => {
    const [inicio, fin] = r.calcular();
    return inicio === fechaInicio && fin === fechaFin;
  })?.id;

  // Genera el reporte solo, al abrir y cada vez que cambia el tipo o las fechas
  useEffect(() => {
    if (errorFechas) return;

    let cancelado = false;

    const generar = async () => {
      setCargando(true);
      setError("");

      try {
        const data = await api(
          `/reportes/${tipo}?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`
        );
        if (!cancelado) setReporte({ ...data.payload, tipo });
      } catch (err) {
        if (cancelado) return;
        console.error(err);
        setReporte(null);
        setError(err.message || "No se pudo generar el reporte");
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    generar();

    // Si cambian los filtros antes de terminar, se ignora la respuesta vieja
    return () => {
      cancelado = true;
    };
  }, [tipo, fechaInicio, fechaFin, errorFechas]);

  const aplicarRango = (rango) => {
    const [inicio, fin] = rango.calcular();
    setFechaInicio(inicio);
    setFechaFin(fin);
  };

  const descargar = async (formato) => {
    if (errorFechas) return;

    setError("");
    setDescargando(formato);

    try {
      const blob = await apiDescargar(
        `/reportes/${tipo}/exportar/${formato}?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`
      );

      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");

      enlace.href = url;
      enlace.download = `reporte-${tipo}_${fechaInicio}_${fechaFin}.${EXTENSIONES[formato]}`;

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

  const deshabilitarDescarga = descargando !== "" || !!errorFechas;

  return (
    <div className="usuarios-container">
      <EncabezadoModulo
        titulo="Reportes"
        descripcion={TIPOS[tipo].descripcion}
        acciones={
          <>
            <button
              className="encabezado-btn"
              onClick={() => descargar("excel")}
              disabled={deshabilitarDescarga}
            >
              <FaFileExcel />
              {descargando === "excel" ? "Descargando..." : "Descargar Excel"}
            </button>

            <button
              className="encabezado-btn"
              onClick={() => descargar("pdf")}
              disabled={deshabilitarDescarga}
            >
              <FaFilePdf />
              {descargando === "pdf" ? "Descargando..." : "Descargar PDF"}
            </button>
          </>
        }
      />

      <div className="filtros-card reporte-filtros">
        <div className="reporte-campo">
          <label htmlFor="tipoReporte">Tipo de reporte</label>
          <select
            id="tipoReporte"
            className="filtros-card-select"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            {Object.entries(TIPOS).map(([clave, t]) => (
              <option key={clave} value={clave}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="reporte-campo">
          <label htmlFor="fechaInicio">Desde</label>
          <input
            id="fechaInicio"
            type="date"
            className="filtros-card-select"
            value={fechaInicio}
            max={fechaFin || undefined}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>

        <div className="reporte-campo">
          <label htmlFor="fechaFin">Hasta</label>
          <input
            id="fechaFin"
            type="date"
            className="filtros-card-select"
            value={fechaFin}
            min={fechaInicio || undefined}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>

        <div className="reporte-rangos">
          {RANGOS.map((rango) => (
            <button
              key={rango.id}
              type="button"
              className={`reporte-rango${rangoActivo === rango.id ? " activo" : ""}`}
              onClick={() => aplicarRango(rango)}
            >
              {rango.label}
            </button>
          ))}
        </div>
      </div>

      {mensajeError && <p className="mensaje-error">{mensajeError}</p>}

      {!reporte && cargando && (
        <p className="usuarios-vacio">Generando reporte...</p>
      )}

      {reporte && (
        <section className={`reporte-resultado${cargando ? " cargando" : ""}`}>
          <p className="reporte-periodo">
            <strong>{reporte.clinica}</strong> · Periodo:{" "}
            {formatearFecha(reporte.periodo?.fechaInicio)} al{" "}
            {formatearFecha(reporte.periodo?.fechaFin)}
          </p>

          <div className="reporte-tarjetas">
            {TIPOS[reporte.tipo].tarjetas.map((tarjeta) => (
              <div key={tarjeta.key} className={`reporte-card ${tarjeta.key}`}>
                <p className="reporte-numero">
                  {reporte.estadisticas[tarjeta.key]}
                </p>
                <p className="reporte-etiqueta">{tarjeta.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default AdminReportes;