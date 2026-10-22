import { useState } from "react";
import ModalFormulario from "./ModalFormulario";

/**
 * Confirmaciones y avisos con el mismo diseño que los formularios.
 * Mantiene las props de siempre:
 *  abierto, titulo, mensaje, textoConfirmar, textoCancelar (null = solo un
 *  botón, para avisos), peligro, onConfirmar, onCancelar
 */
function ModalConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = "Aceptar",
  textoCancelar = "Cancelar",
  peligro = false,
  onConfirmar,
  onCancelar,
}) {
  const [procesando, setProcesando] = useState(false);

  // Si onConfirmar es async, los botones se bloquean hasta que termine
  const confirmar = async () => {
    try {
      setProcesando(true);
      await onConfirmar?.();
    } finally {
      setProcesando(false);
    }
  };

  return (
    <ModalFormulario
      abierto={abierto}
      titulo={titulo}
      onCerrar={onCancelar || onConfirmar}
      onSubmit={confirmar}
      enviando={procesando}
      textoEnviar={textoConfirmar}
      textoEnviando={textoConfirmar}
      textoCancelar={textoCancelar}
      peligro={peligro}
      ancho={420}
      superior
    >
      <p className="mf-mensaje">{mensaje}</p>
    </ModalFormulario>
  );
}

export default ModalConfirmacion;