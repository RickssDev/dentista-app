import { memo, useEffect, useMemo, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "../styles/AdminPanel.css";
import { aClave, mesDe, MESES } from "../utils/fechas";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const ESTADOS = ["pendiente", "completada", "cancelada"];

// Semanas completas del mes, empezando en lunes
const celdasDelMes = (anio, mes) => {
  const desfase = (new Date(anio, mes, 1).getDay() + 6) % 7;
  const diasDelMes = new Date(anio, mes + 1, 0).getDate();
  const total = Math.ceil((desfase + diasDelMes) / 7) * 7;

  return Array.from({ length: total }, (_, i) => {
    const fecha = new Date(anio, mes, 1 - desfase + i);
    return {
      clave: aClave(fecha),
      dia: fecha.getDate(),
      etiqueta: `${fecha.getDate()} de ${MESES[fecha.getMonth()]}`,
      delMes: fecha.getMonth() === mes,
    };
  });
};

function CalendarioMes({ citas, diaSeleccionado, onSeleccionarDia, hoy }) {
  const [vistaMes, setVistaMes] = useState(() => mesDe(diaSeleccionado || hoy));

  // Si el día seleccionado cambia de mes (por ejemplo, un día gris), el calendario lo sigue
  useEffect(() => {
    if (diaSeleccionado) setVistaMes(mesDe(diaSeleccionado));
  }, [diaSeleccionado]);

  // Citas agrupadas por día: { "2026-10-20": { pendiente: 2, completada: 1 } }
  const citasPorDia = useMemo(() => {
    const mapa = new Map();

    for (const cita of citas) {
      const dia = cita.fecha_agendada?.slice(0, 10);
      if (!dia) continue;

      const conteo = mapa.get(dia) || {};
      conteo[cita.estado] = (conteo[cita.estado] || 0) + 1;
      mapa.set(dia, conteo);
    }

    return mapa;
  }, [citas]);

  const celdas = useMemo(
    () => celdasDelMes(vistaMes.anio, vistaMes.mes),
    [vistaMes]
  );

  const moverMes = (delta) =>
    setVistaMes(({ anio, mes }) => {
      const fecha = new Date(anio, mes + delta, 1);
      return { anio: fecha.getFullYear(), mes: fecha.getMonth() };
    });

  const irAHoy = () => {
    setVistaMes(mesDe(hoy));
    onSeleccionarDia(hoy);
  };

  return (
    <section className="cal-card" aria-label="Calendario de citas">
      <div className="cal-cabecera">
        <h2 className="cal-titulo">
          {MESES[vistaMes.mes]} de {vistaMes.anio}
        </h2>

        <div className="cal-nav">
          <button type="button" className="cal-hoy" onClick={irAHoy}>
            Hoy
          </button>
          <button
            type="button"
            className="cal-flecha"
            aria-label="Mes anterior"
            onClick={() => moverMes(-1)}
          >
            <FaChevronLeft />
          </button>
          <button
            type="button"
            className="cal-flecha"
            aria-label="Mes siguiente"
            onClick={() => moverMes(1)}
          >
            <FaChevronRight />
          </button>
        </div>
      </div>

      <div className="cal-semana" aria-hidden="true">
        {DIAS_SEMANA.map((dia) => (
          <span key={dia}>{dia}</span>
        ))}
      </div>

      <div className="cal-rejilla">
        {celdas.map(({ clave, dia, etiqueta, delMes }) => {
          const conteo = citasPorDia.get(clave);
          const total = conteo
            ? ESTADOS.reduce((suma, e) => suma + (conteo[e] || 0), 0)
            : 0;

          const clases = ["cal-dia"];
          if (!delMes) clases.push("fuera");
          if (clave === hoy) clases.push("hoy");
          if (clave === diaSeleccionado) clases.push("seleccionado");

          return (
            <button
              key={clave}
              type="button"
              className={clases.join(" ")}
              aria-pressed={clave === diaSeleccionado}
              aria-label={
                total > 0
                  ? `${etiqueta}, ${total} ${total === 1 ? "cita" : "citas"}`
                  : etiqueta
              }
              onClick={() => onSeleccionarDia(clave)}
            >
              <span className="cal-numero">{dia}</span>

              {total > 0 && (
                <>
                  <span className="cal-total">{total}</span>
                  <span className="cal-puntos">
                    {ESTADOS.map(
                      (e) => conteo[e] > 0 && <i key={e} className={`cal-punto ${e}`} />
                    )}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <ul className="cal-leyenda">
        {ESTADOS.map((e) => (
          <li key={e}>
            <i className={`cal-punto ${e}`} />
            {e === "pendiente" ? "Pendiente" : e === "completada" ? "Completada" : "Cancelada"}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default memo(CalendarioMes);