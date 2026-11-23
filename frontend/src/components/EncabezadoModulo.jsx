import "../styles/adminpanel.css";
import { FaRegHeart, FaPlus, FaArrowLeft } from "react-icons/fa";

// `detalle`: línea bajo la descripción (p. ej. «3 de 15 imágenes», spec 029).
// `botonNoDisponible`: el botón sigue enfocable y se anuncia como no disponible con
// `aria-disabled`; `idDescripcionBoton` apunta al texto que explica el motivo. No se usa
// `disabled` nativo porque saca el botón del foco y el lector no anuncia el motivo.
function EncabezadoModulo({
  titulo,
  descripcion,
  detalle,
  textoBoton,
  onBoton,
  botonNoDisponible = false,
  idDescripcionBoton,
  acciones,
  onVolver,
  textoVolver = "Volver",
}) {
  const pulsarBoton = (e) => {
    if (botonNoDisponible) {
      e.preventDefault();
      return;
    }
    onBoton?.(e);
  };

  return (
    <div className="encabezado-modulo">
      <div className="encabezado-texto">
        {onVolver && (
          <button
            type="button"
            className="encabezado-volver"
            onClick={onVolver}
          >
            <FaArrowLeft />
            {textoVolver}
          </button>
        )}

        <h1 className="encabezado-titulo">{titulo}</h1>

        {descripcion && <p className="encabezado-descripcion">{descripcion}</p>}

        {detalle && <p className="encabezado-detalle">{detalle}</p>}
      </div>

      {textoBoton && (
        <button
          className="encabezado-btn"
          onClick={pulsarBoton}
          aria-disabled={botonNoDisponible ? "true" : undefined}
          aria-describedby={botonNoDisponible ? idDescripcionBoton : undefined}
        >
          <FaPlus />
          {textoBoton}
        </button>
      )}

      {acciones && <div className="encabezado-acciones">{acciones}</div>}
    </div>
  );
}

export default EncabezadoModulo;
