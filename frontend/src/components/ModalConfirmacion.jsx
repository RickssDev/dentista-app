import "../styles/AdminPanel.css";

function ModalConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",   // null → modo aviso (solo un botón)
  peligro = false,
  onConfirmar,
  onCancelar,
}) {
  if (!abierto) return null;

  return (
    <div
    className="modal-overlay modal-overlay-superior"
    onClick={textoCancelar ? onCancelar : onConfirmar}
    >
      <div
        className="modal-box modal-confirmacion"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{titulo}</h2>
        </div>

        <p className="modal-mensaje">{mensaje}</p>

        <div className="modal-footer">
          {textoCancelar && (
            <button className="btn-cancel" onClick={onCancelar}>
              {textoCancelar}
            </button>
          )}
          <button
            className={peligro ? "btn-save btn-peligro" : "btn-save"}
            onClick={onConfirmar}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalConfirmacion;