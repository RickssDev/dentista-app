import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { api } from "../../services/api";
import { TITULO_LOGIN } from "../../seo/rutas";
import logoBlanco from "../../assets/logo-melissa-blanco.png";
import "../../styles/login.css";

/* Piezas pequeñas: van fuera de Login para que los inputs no pierdan el foco al escribir */

function IconoOjo({ tachado }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {tachado && <path d="M4 4l16 16" />}
    </svg>
  );
}

function IconoAviso({ tipo }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {tipo === "exito" ? (
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      ) : (
        <>
          <path d="M12 7v6" />
          <circle cx="12" cy="17" r=".6" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

function Campo({ id, etiqueta, ...props }) {
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <input id={id} {...props} />
    </div>
  );
}

function CampoPass({ id, etiqueta, visible, onAlternar, ...props }) {
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <div className="campo-pass">
        <input id={id} type={visible ? "text" : "password"} {...props} />
        <button
          type="button"
          className="ver-pass"
          onClick={onAlternar}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
        >
          <IconoOjo tachado={visible} />
        </button>
      </div>
    </div>
  );
}

// El botón de Google necesita un ancho en px: lo medimos del contenedor.
// Solo se monta el botón del formulario visible (activo): Google usa la última
// instancia inicializada para todos los botones, y con dos montados a la vez el
// clic de "Crear cuenta" podía terminar ejecutando el manejador de "Iniciar sesión".
// Importante: onSuccess y onError deben ser funciones ESTABLES (useCallback);
// si cambian en cada render, GoogleLogin vuelve a inicializar Google cada vez.
// Google se carga cuando la página ya está pintada y el navegador queda libre (spec 023): su script,
// su marco y su fuente no compiten con lo primero que ve el usuario. Como mucho, 2 s tras cargar.
function useGoogleTrasPintar() {
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let id;
    const marcar = () => setListo(true);
    const programar = () => {
      id = window.requestIdleCallback
        ? window.requestIdleCallback(marcar, { timeout: 2000 })
        : window.setTimeout(marcar, 200);
    };
    if (document.readyState === "complete") programar();
    else window.addEventListener("load", programar, { once: true });
    return () => {
      window.removeEventListener("load", programar);
      if (window.cancelIdleCallback) window.cancelIdleCallback(id);
      window.clearTimeout(id);
    };
  }, []);

  return listo;
}

function GoogleBoton({ onSuccess, onError, texto, activo }) {
  const ref = useRef(null);
  const [ancho, setAncho] = useState(null);
  const googleListo = useGoogleTrasPintar();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () =>
      setAncho(Math.min(400, Math.max(200, Math.round(el.clientWidth))));
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="google-btn" ref={ref}>
      {/* El proveedor solo envuelve al botón: el resto del sitio no carga el script de Google */}
      {ancho && activo && googleListo && (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <GoogleLogin
            onSuccess={onSuccess}
            onError={onError}
            text={texto}
            locale="es"
            theme="outline"
            size="large"
            shape="pill"
            width={String(ancho)}
          />
        </GoogleOAuthProvider>
      )}
    </div>
  );
}

function PanelMarca() {
  return (
    <div className="panel-marca">
      <span className="panel-aro" aria-hidden="true" />
      <img
        className="panel-logo"
        src={logoBlanco}
        alt="Melissa López N. Odontología Integral"
        decoding="async"
      />
    </div>
  );
}

/* ---------------------------------- Login ---------------------------------- */

function Login() {
  const navigate = useNavigate();
  const [active, setActive] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPass, setVerPass] = useState(false);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [emailReg, setEmailReg] = useState("");
  const [passwordReg, setPasswordReg] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [verPassReg, setVerPassReg] = useState(false);

  const [aviso, setAviso] = useState(null); 
  const [modalRecuperacion, setModalRecuperacion] = useState(false);
  const [correoRecuperacion, setCorreoRecuperacion] = useState("");
  const [enviandoRecuperacion, setEnviandoRecuperacion] = useState(false);

  const mostrarAviso = (titulo, mensaje, tipo = "error") =>
    setAviso({ titulo, mensaje, tipo });

  const cambiarModo = (registro) => {
    setActive(registro);
    window.scrollTo?.({ top: 0 });
  };

  // Título propio, también al llegar navegando desde el sitio (spec 023)
  useEffect(() => {
    document.title = TITULO_LOGIN;
  }, []);

  // Escape cierra el aviso
  useEffect(() => {
    if (!aviso) return;
    const cerrar = (e) => e.key === "Escape" && setAviso(null);
    window.addEventListener("keydown", cerrar);
    return () => window.removeEventListener("keydown", cerrar);
  }, [aviso]);

  // Guarda la sesión y redirige (login normal y Google)
  const iniciarSesion = (res) => {
    const token =
      res?.token ||
      res?.payload?.token ||
      res?.accessToken ||
      res?.payload?.accessToken;

    if (!token) {
      mostrarAviso("Error", "Login correcto pero el servidor no envió token");
      return;
    }

    const usuario = res?.user || res?.payload?.user || {};
    const tienePerfilPaciente =
      res?.tienePerfilPaciente ?? res?.payload?.tienePerfilPaciente ?? false;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(usuario));
    localStorage.setItem("rol", usuario.rol.toLowerCase());
    localStorage.setItem("tienePerfilPaciente", JSON.stringify(tienePerfilPaciente));

    if (usuario.rol === "Administrador" || usuario.rol === "Asistente") {
      navigate("/admin", { replace: true });
    } else if (tienePerfilPaciente) {
      navigate("/paciente", { replace: true });
    } else {
      navigate("/paciente/completar-perfil", { replace: true });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      mostrarAviso("Campos obligatorios", "Correo y contraseña son obligatorios");
      return;
    }

    try {
      const res = await api("/auth/login", "POST", {
        correo: email,
        contrasena: password,
      });
      iniciarSesion(res);
    } catch (error) {
      console.error("ERROR LOGIN:", error);
      mostrarAviso("No se pudo iniciar sesión", error?.message || "Error al iniciar sesión");
    }
  };

  // ---------- RECUPERAR CONTRASEÑA ----------

const abrirRecuperacion = () => {
  setCorreoRecuperacion(email);
  setModalRecuperacion(true);
};

const cerrarRecuperacion = () => {
  if (enviandoRecuperacion) return;

  setModalRecuperacion(false);
  setCorreoRecuperacion("");
};

const handleRecuperacion = async (e) => {
  e.preventDefault();

  const correo = correoRecuperacion.trim().toLowerCase();

  if (!correo) {
    mostrarAviso(
      "Correo obligatorio",
      "Ingresa tu correo electrónico para recuperar tu contraseña."
    );
    return;
  }

  setEnviandoRecuperacion(true);

  try {
    await api("/auth/olvide-contrasena", "POST", {
      correo
    });

    setModalRecuperacion(false);
    setCorreoRecuperacion("");

    mostrarAviso(
      "Solicitud recibida",
      "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa también tu carpeta de spam.",
      "exito"
    );

  } catch (error) {
    mostrarAviso(
      "No se pudo procesar la solicitud",
      error?.message ||
        "Ocurrió un error. Inténtalo nuevamente."
    );

  } finally {
    setEnviandoRecuperacion(false);
  }
};

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!nombre || !apellido || !emailReg || !passwordReg || !confirmarPassword) {
      mostrarAviso("Campos obligatorios", "Todos los campos son obligatorios");
      return;
    }

    if (passwordReg !== confirmarPassword) {
      mostrarAviso("Contraseñas distintas", "Las contraseñas no coinciden");
      return;
    }

    try {
      const res = await api("/auth/register", "POST", {
        nombre_usuario: nombre,
        apellido,
        correo: emailReg,
        contrasena: passwordReg,
        confirmar_contrasena: confirmarPassword,
      });

      mostrarAviso("Cuenta creada", res?.message || "Usuario registrado correctamente", "exito");
      cambiarModo(false);

      setNombre("");
      setApellido("");
      setEmailReg("");
      setPasswordReg("");
      setConfirmarPassword("");
    } catch (error) {
      console.error("ERROR REGISTER:", error);
      mostrarAviso("No se pudo registrar", error?.message || "Error al registrar");
    }
  };



  // ---------- GOOGLE ----------
  const handleGoogleLogin = async ({ credential }) => {
    try {
      const res = await api("/auth/google/login", "POST", { credential });
      iniciarSesion(res);
    } catch (error) {
      mostrarAviso(
        "No se pudo iniciar sesión",
        error?.message || "Error al iniciar sesión con Google"
      );
    }
  };

  const handleGoogleRegister = async ({ credential }) => {
    try {
      await api("/auth/google/register", "POST", { credential });
      cambiarModo(false);
      mostrarAviso(
        "Cuenta creada",
        "Tu cuenta se creó con Google. Ahora inicia sesión con Google.",
        "exito"
      );
    } catch (error) {
      mostrarAviso(
        "No se pudo registrar",
        error?.message || "Error al registrar con Google"
      );
    }
  };

  const errorGoogle = () => mostrarAviso("Error", "No se pudo conectar con Google");

  // La ref siempre apunta a los manejadores de ESTE render (con el estado al día),
  // y los callbacks de abajo nunca cambian de identidad: así GoogleLogin no
  // reinicializa Google en cada render (el aviso "initialize() is called multiple times").
  const manejadoresGoogle = useRef({});
  manejadoresGoogle.current = {
    login: handleGoogleLogin,
    register: handleGoogleRegister,
    error: errorGoogle,
  };

  const onGoogleLogin = useCallback((r) => manejadoresGoogle.current.login(r), []);
  const onGoogleRegister = useCallback((r) => manejadoresGoogle.current.register(r), []);
  const onGoogleError = useCallback(() => manejadoresGoogle.current.error(), []);

  return (
    <div className="login-page">
      <div className={`container ${active ? "active" : ""}`}>

        {/* CREAR CUENTA */}
        <div className="form-container sign-up">
          <form onSubmit={handleRegister}>
            <div className="form-encabezado">
              <h1>Crea tu cuenta</h1>
              <p>Es rápido: el resto de tus datos los completas después.</p>
            </div>

            <div className="campo-fila">
              <Campo id="reg-nombre" etiqueta="Nombre" type="text"
                autoComplete="given-name" value={nombre}
                onChange={(e) => setNombre(e.target.value)} />
              <Campo id="reg-apellido" etiqueta="Apellido" type="text"
                autoComplete="family-name" value={apellido}
                onChange={(e) => setApellido(e.target.value)} />
            </div>

            <Campo id="reg-correo" etiqueta="Correo" type="email"
              autoComplete="email" placeholder="tu@correo.com" value={emailReg}
              onChange={(e) => setEmailReg(e.target.value)} />

            <div className="campo-fila">
              <CampoPass id="reg-pass" etiqueta="Contraseña"
                autoComplete="new-password" value={passwordReg}
                visible={verPassReg} onAlternar={() => setVerPassReg((v) => !v)}
                onChange={(e) => setPasswordReg(e.target.value)} />
              <CampoPass id="reg-confirmar" etiqueta="Confirmar contraseña"
                autoComplete="new-password" value={confirmarPassword}
                visible={verPassReg} onAlternar={() => setVerPassReg((v) => !v)}
                onChange={(e) => setConfirmarPassword(e.target.value)} />
            </div>

            <button type="submit" className="btn-principal">Crear cuenta</button>

            <div className="separador"><span>o continúa con</span></div>
            <GoogleBoton
              activo={active}
              onSuccess={onGoogleRegister}
              onError={onGoogleError}
              texto="signup_with"
            />

            <p className="cambiar-modo">
              ¿Ya tienes cuenta?{" "}
              <button type="button" className="enlace" onClick={() => cambiarModo(false)}>
                Iniciar sesión
              </button>
            </p>
          </form>
        </div>

        {/* INICIAR SESIÓN */}
        <div className="form-container sign-in">
          <form onSubmit={handleLogin}>
            <div className="form-encabezado">
              <h1>Inicia sesión</h1>
              <p>Entra para ver y agendar tus citas.</p>
            </div>

            <Campo id="login-correo" etiqueta="Correo" type="email"
              autoComplete="email" placeholder="tu@correo.com" value={email}
              onChange={(e) => setEmail(e.target.value)} />

            <CampoPass
              id="login-pass"
              etiqueta="Contraseña"
              autoComplete="current-password"
              value={password}
              visible={verPass}
              onAlternar={() => setVerPass((v) => !v)}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="olvide-contrasena">
              <button
                type="button"
                className="enlace"
                onClick={abrirRecuperacion}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button type="submit" className="btn-principal">
              Iniciar sesión
            </button>

            <div className="separador"><span>o continúa con</span></div>
            <GoogleBoton
              activo={!active}
              onSuccess={onGoogleLogin}
              onError={onGoogleError}
              texto="signin_with"
            />

            <p className="cambiar-modo">
              ¿No tienes cuenta?{" "}
              <button type="button" className="enlace" onClick={() => cambiarModo(true)}>
                Crear cuenta
              </button>
            </p>
          </form>
        </div>

        {/* PANEL DE MARCA (el que se desliza) */}
        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <PanelMarca />
              <div className="panel-texto">
                <h2>¿Ya tienes cuenta?</h2>
                <p>Inicia sesión para ver tus citas y tu historial.</p>
                <button type="button" className="btn-panel" onClick={() => cambiarModo(false)}>
                  Iniciar sesión
                </button>
              </div>
            </div>

            <div className="toggle-panel toggle-right">
              <PanelMarca />
              <div className="panel-texto">
                <h2>¿Primera vez aquí?</h2>
                <p>Crea tu cuenta y agenda tu primera cita.</p>
                <button type="button" className="btn-panel" onClick={() => cambiarModo(true)}>
                  Crear cuenta
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
{/* MODAL RECUPERAR CONTRASEÑA */}
{modalRecuperacion && (
  <div
    className="mini-modal-overlay"
    onClick={cerrarRecuperacion}
  >
    <div
      className="mini-modal modal-recuperacion"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recuperacion-titulo"
      aria-describedby="recuperacion-descripcion"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="recuperacion-icono">
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
            x="3"
            y="5"
            width="18"
            height="14"
            rx="2"
          />
          <path d="m3 7 9 6 9-6" />
        </svg>
      </div>

      <h3 id="recuperacion-titulo">
        Recuperar contraseña
      </h3>

      <p id="recuperacion-descripcion">
        Ingresa el correo electrónico asociado
        a tu cuenta y te enviaremos un enlace
        para restablecer tu contraseña.
      </p>

      <form
        className="recuperacion-form"
        onSubmit={handleRecuperacion}
      >
        <Campo
          id="recuperacion-correo"
          etiqueta="Correo electrónico"
          type="email"
          placeholder="tu@correo.com"
          autoComplete="email"
          autoFocus
          required
          maxLength={100}
          value={correoRecuperacion}
          onChange={(e) =>
            setCorreoRecuperacion(e.target.value)
          }
          disabled={enviandoRecuperacion}
        />

        <button
          type="submit"
          className="btn-principal"
          disabled={enviandoRecuperacion}
        >
          {enviandoRecuperacion
            ? "Enviando..."
            : "Enviar enlace"}
        </button>

        <button
          type="button"
          className="enlace recuperacion-cancelar"
          onClick={cerrarRecuperacion}
          disabled={enviandoRecuperacion}
        >
          Volver a iniciar sesión
        </button>
      </form>
    </div>
  </div>
)}


      {/* MINI MODAL */}
      {aviso && (
        <div className="mini-modal-overlay" onClick={() => setAviso(null)}>
          <div
            className="mini-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="aviso-titulo"
            aria-describedby="aviso-mensaje"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`mini-modal-icono ${aviso.tipo}`}>
              <IconoAviso tipo={aviso.tipo} />
            </div>
            <h3 id="aviso-titulo">{aviso.titulo}</h3>
            <p id="aviso-mensaje">{aviso.mensaje}</p>
            <button type="button" className="btn-principal" autoFocus onClick={() => setAviso(null)}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;