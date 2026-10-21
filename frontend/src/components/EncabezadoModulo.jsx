import "../styles/AdminPanel.css";
import { FaRegHeart, FaPlus, FaArrowLeft } from "react-icons/fa";

function EncabezadoModulo({
  titulo,
  descripcion,
  textoBoton,         
  onBoton,
  acciones,            
  onVolver,            
  textoVolver = "Volver",
}) {
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

        {descripcion && (
          <p className="encabezado-descripcion">{descripcion}</p>
        )}
      </div>

      {textoBoton && (
        <button className="encabezado-btn" onClick={onBoton}>
          <FaPlus />
          {textoBoton}
        </button>
      )}

      {acciones && <div className="encabezado-acciones">{acciones}</div>}
    </div>
  );
}

export default EncabezadoModulo;