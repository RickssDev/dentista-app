
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../services/api";
import logoBlanco from "../../assets/logo-melissa-blanco.png";
import "../../styles/restablecerContrasena.css";

function IconoOjo({ visible }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-7 10-7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {visible && <path d="M4 4l16 16" />}
    </svg>
  );
}

function CampoContrasena({
  id,
  etiqueta,
  valor,
  onChange,
  disabled
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="reset-campo">
      <label htmlFor={id}>{etiqueta}</label>

      <div className="reset-input-pass">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={valor}
          onChange={onChange}
          disabled={disabled}
          autoComplete="new-password"
          minLength={8}
          required
        />

        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={
            visible
              ? "Ocultar contraseña"
              : "Mostrar contraseña"
          }
          aria-pressed={visible}
        >
          <IconoOjo visible={visible} />
        </button>
      </div>
    </div>
  );
}

function RestablecerContrasena() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const tokenFormatoValido =
    typeof token === "string" &&
    /^[a-f0-9]{64}$/i.test(token);

  // Evitar que el navegador conserve el token en la URL
  // una vez que el componente lo ha leído.
  useEffect(() => {
    if (!token) return;

    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname
    );
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!tokenFormatoValido) {
      setError(
        "El enlace de recuperación es inválido."
      );
      return;
    }

    if (contrasena !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (contrasena.length < 8) {
      setError(
        "La contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    if (
      new TextEncoder().encode(contrasena).length > 72
    ) {
      setError(
        "La contraseña es demasiado larga. Utiliza un máximo de 72 bytes."
      );
      return;
    }

    setEnviando(true);

    try {
      await api(
        "/auth/restablecer-contrasena",
        "POST",
        {
          token,
          nueva_contrasena: contrasena,
          confirmar_contrasena: confirmar
        }
      );

      setContrasena("");
      setConfirmar("");
      setExito(true);

    } catch (err) {
      // El servidor valida si el token existe,
      // expiró o ya fue utilizado.
      const mensaje = err?.message || "";

      if (
        /token|enlace|expirad|inválid|invalid/i.test(mensaje)
      ) {
        setError(
          "Este enlace es inválido, ha expirado o ya fue utilizado. Solicita uno nuevo."
        );
      } else {
        setError(
          mensaje ||
          "No se pudo restablecer la contraseña. Inténtalo nuevamente."
        );
      }

    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="reset-page">
      <section className="reset-card">

        <div className="reset-marca">
          <img
            src={logoBlanco}
            alt="Melissa López N. Odontología Integral"
          />
        </div>

        <div className="reset-contenido">

          {exito ? (
            <div className="reset-resultado" role="status">
              <div className="reset-icono exito">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </div>

              <h1>¡Contraseña actualizada!</h1>

              <p>
                Tu contraseña se restableció
                correctamente. Ya puedes iniciar
                sesión con tu nueva contraseña.
              </p>

              <p className="reset-nota">
                También intentamos enviarte un
                correo de confirmación por seguridad.
              </p>

              <Link
                to="/login"
                className="reset-btn"
              >
                Ir a iniciar sesión
              </Link>
            </div>

          ) : !tokenFormatoValido ? (
            <div className="reset-resultado">
              <div className="reset-icono error">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v6M12 17h.01" />
                </svg>
              </div>

              <h1>Enlace inválido</h1>

              <p>
                El enlace de recuperación está
                incompleto o no es válido.
              </p>

              <Link
                to="/login"
                className="reset-btn"
              >
                Volver a iniciar sesión
              </Link>

              <p className="reset-nota">
                Desde el login puedes solicitar
                un nuevo enlace.
              </p>
            </div>

          ) : (
            <>
              <div className="reset-encabezado">
                <div className="reset-icono">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect
                      x="5"
                      y="10"
                      width="14"
                      height="11"
                      rx="2"
                    />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </div>

                <h1>Nueva contraseña</h1>

                <p>
                  Crea una contraseña segura para
                  volver a acceder a tu cuenta.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <CampoContrasena
                  id="nueva-contrasena"
                  etiqueta="Nueva contraseña"
                  valor={contrasena}
                  onChange={(e) =>
                    setContrasena(e.target.value)
                  }
                  disabled={enviando}
                />

                <CampoContrasena
                  id="confirmar-contrasena"
                  etiqueta="Confirmar contraseña"
                  valor={confirmar}
                  onChange={(e) =>
                    setConfirmar(e.target.value)
                  }
                  disabled={enviando}
                />

                <p className="reset-ayuda">
                  Mínimo 8 caracteres.
                </p>

                {error && (
                  <div
                    className="reset-error"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="reset-btn"
                  disabled={enviando}
                >
                  {enviando
                    ? "Guardando..."
                    : "Guardar nueva contraseña"}
                </button>
              </form>

              <Link
                to="/login"
                className="reset-volver"
              >
                Volver a iniciar sesión
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default RestablecerContrasena;
