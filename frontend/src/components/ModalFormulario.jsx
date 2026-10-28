import { useEffect, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import "../styles/adminpanel.css";

/**
 * Marco reutilizable para los modales con formulario.
 * Pone el diseño (fondo, encabezado, scroll, botones fijos); cada módulo
 * solo pasa sus campos como children.
 *
 * Props:
 *  abierto        boolean
 *  titulo         string
 *  subtitulo      string (opcional)
 *  onCerrar       () => void
 *  onSubmit       (e) => void   se llama al enviar; ya hace preventDefault
 *  enviando       boolean       bloquea botones y cambia el texto
 *  error          string        se muestra arriba de los botones
 *  textoEnviar    string        ("Guardar" por defecto)
 *  textoEnviando  string        ("Guardando..." por defecto)
 *  textoCancelar  string        ("Cancelar" por defecto); null oculta el botón
 *  superior       boolean       se dibuja encima de otro modal abierto
 *  peligro        boolean       botón principal en rojo (eliminar, etc.)
 *  ancho          number        ancho máximo en px (640 por defecto)
 */
function ModalFormulario({
  abierto,
  titulo,
  subtitulo,
  onCerrar,
  onSubmit,
  enviando = false,
  error = "",
  textoEnviar = "Guardar",
  textoEnviando = "Guardando...",
  textoCancelar = "Cancelar",
  peligro = false,
  ancho = 640,
  superior = false,
  children,
}) {
  const cuerpoRef = useRef(null);
  const modalRef = useRef(null);

  // Escape cierra (salvo mientras se guarda) y el fondo no se desplaza
  useEffect(() => {
    if (!abierto) return;

    const alPresionar = (e) => {
      if (e.key === "Escape" && !enviando) onCerrar();
    };
    document.addEventListener("keydown", alPresionar);

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", alPresionar);
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto, enviando, onCerrar]);

  // Al abrir, el foco cae en el primer campo; si no hay campos (confirmaciones),
  // en "Cancelar" (lo más seguro) o, si no existe, en el botón principal
  useEffect(() => {
    if (!abierto) return;
    const campo = cuerpoRef.current?.querySelector(
      "input:not([type=hidden]):not([type=file]), select, textarea",
    );
    const raiz = modalRef.current;
    (
      campo ||
      raiz?.querySelector(".mf-btn-sec") ||
      raiz?.querySelector(".mf-btn")
    )?.focus();
  }, [abierto]);

  if (!abierto) return null;

  const enviar = (e) => {
    e.preventDefault();
    if (!enviando) onSubmit?.(e);
  };

  return (
    <div
      className={`mf-fondo${superior ? " mf-fondo-superior" : ""}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !enviando) onCerrar();
      }}
    >
      <div
        className="mf-modal"
        ref={modalRef}
        style={{ maxWidth: ancho }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mf-titulo"
      >
        <div className="mf-header">
          <div>
            <h2 id="mf-titulo" className="mf-titulo">
              {titulo}
            </h2>
            {subtitulo && <p className="mf-subtitulo">{subtitulo}</p>}
          </div>
          <button
            type="button"
            className="mf-cerrar"
            onClick={onCerrar}
            disabled={enviando}
            aria-label="Cerrar"
          >
            <FaTimes />
          </button>
        </div>

        <form className="mf-form" onSubmit={enviar}>
          <div className="mf-cuerpo" ref={cuerpoRef}>
            {children}

            {error && (
              <p className="mf-error" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="mf-acciones">
            {textoCancelar !== null && (
              <button
                type="button"
                className="mf-btn mf-btn-sec"
                onClick={onCerrar}
                disabled={enviando}
              >
                {textoCancelar}
              </button>
            )}
            <button
              type="submit"
              className={`mf-btn ${peligro ? "mf-btn-peligro" : "mf-btn-prin"}`}
              disabled={enviando}
            >
              {enviando ? textoEnviando : textoEnviar}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalFormulario;
