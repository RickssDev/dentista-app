import { useEffect, useState } from "react";
import { FaLock } from "react-icons/fa";
import Sidebar from "../../components/sidebar";
import EncabezadoModulo from "../../components/EncabezadoModulo";
import ModalConfirmacion from "../../components/ModalConfirmacion";
import { api } from "../../services/api";
import "../../styles/AdminPanel.css";
import "../../styles/MisCitas.css";

const DATOS_VACIOS = {
  nombre: "",
  apellido: "",
  telefono: "",
  direccion: "",
  genero: "",
  fecha_nacimiento: "",
  correo: "",
};

const PASSWORD_VACIO = {
  contrasena_actual: "",
  nueva_contrasena: "",
  confirmar_contrasena: "",
};

function PerfilPaciente() {
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [aviso, setAviso] = useState(null);

  const [datos, setDatos] = useState(DATOS_VACIOS);
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [errorDatos, setErrorDatos] = useState("");

  const [password, setPassword] = useState(PASSWORD_VACIO);
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [errorPassword, setErrorPassword] = useState("");

  const cargarPerfil = async (mostrarCarga = true) => {
    try {
      if (mostrarCarga) setCargando(true);
      setErrorCarga("");
      setErrorDatos("");

      const res = await api("/pacientes/perfil");
      const data = res?.payload ?? res?.data ?? res;

      setDatos({
        nombre: data.nombre_usuario || "",
        apellido: data.apellido || "",
        telefono: data.telefono || "",
        direccion: data.direccion || "",
        genero: data.genero || "",
        fecha_nacimiento: data.fecha_nacimiento
          ? data.fecha_nacimiento.split("T")[0]
          : "",
        correo: data.correo || "",
      });
    } catch (error) {
      console.error("ERROR AL CARGAR PERFIL:", error);
      setErrorCarga(error.message || "No se pudo cargar tu perfil.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cambiarDatos = (e) =>
    setDatos({ ...datos, [e.target.name]: e.target.value });

  const cambiarPassword = (e) =>
    setPassword({ ...password, [e.target.name]: e.target.value });

  const actualizarDatos = async (e) => {
    e.preventDefault();

    const telefono = datos.telefono.replace(/\D/g, "");
    if (telefono.length !== 10) {
      setErrorDatos("El teléfono debe tener 10 dígitos.");
      return;
    }

    try {
      setGuardandoDatos(true);
      setErrorDatos("");

      await api("/pacientes/perfil", "PUT", {
        telefono,
        direccion: datos.direccion.trim(),
        genero: datos.genero,
      });

      await cargarPerfil(false);
      setAviso({
        titulo: "Datos actualizados",
        mensaje: "Tus datos personales se guardaron correctamente.",
      });
    } catch (error) {
      console.error("ERROR AL ACTUALIZAR PERFIL:", error);
      setErrorDatos(error.message || "No se pudo actualizar tu perfil.");
    } finally {
      setGuardandoDatos(false);
    }
  };

  const actualizarContrasena = async (e) => {
    e.preventDefault();

    if (password.nueva_contrasena !== password.confirmar_contrasena) {
      setErrorPassword("Las contraseñas nuevas no coinciden.");
      return;
    }

    try {
      setGuardandoPassword(true);
      setErrorPassword("");

      await api("/auth/cambiarContrasena", "PUT", {
        contrasena_actual: password.contrasena_actual,
        nueva_contrasena: password.nueva_contrasena,
        confirmar_contrasena: password.confirmar_contrasena,
      });

      setPassword(PASSWORD_VACIO);
      setAviso({
        titulo: "Contraseña actualizada",
        mensaje: "Tu contraseña se cambió correctamente.",
      });
    } catch (error) {
      console.error("ERROR AL ACTUALIZAR CONTRASEÑA:", error);
      setErrorPassword(error.message || "No se pudo actualizar la contraseña.");
    } finally {
      setGuardandoPassword(false);
    }
  };

  return (
    <div className="admin-container">
      <Sidebar tipo="paciente" />

      <div className="admin-content">
        <div className="usuarios-container">
          <EncabezadoModulo
            titulo="Mi perfil"
            descripcion="Actualiza tus datos de contacto y la seguridad de tu cuenta."
          />

          {errorCarga && <p className="mensaje-error">{errorCarga}</p>}

          {cargando ? (
            <p className="usuarios-vacio">Cargando perfil...</p>
          ) : (
            <div className="perfil-grid">
              {/* Datos personales */}
              <section className="clinico-card">
                <h2 className="clinico-titulo">Datos personales</h2>
                <p className="perfil-subtitulo">
                  Los datos con candado solo pueden cambiarse en la clínica.
                </p>

                <form className="perfil-form" onSubmit={actualizarDatos}>
                  <div className="mf-grid">
                    <label className="mf-campo">
                      <span>
                        Nombre 
                      </span>
                      <input type="text" value={datos.nombre} disabled />
                    </label>

                    <label className="mf-campo">
                      <span>
                        Apellido 
                      </span>
                      <input type="text" value={datos.apellido} disabled />
                    </label>

                    <label className="mf-campo mf-ancho">
                      <span>
                        Correo electrónico 
                      </span>
                      <input type="email" value={datos.correo} disabled />
                    </label>

                    <label className="mf-campo">
                      <span>
                        Fecha de nacimiento 
                      </span>
                      <input type="date" value={datos.fecha_nacimiento} disabled />
                    </label>

                    <label className="mf-campo">
                      <span>Género</span>
                      <select
                        name="genero"
                        value={datos.genero}
                        onChange={cambiarDatos}
                        required
                      >
                        <option value="">Seleccionar...</option>
                        <option value="femenino">Femenino</option>
                        <option value="masculino">Masculino</option>
                        <option value="otro">Otro</option>
                      </select>
                    </label>

                    <label className="mf-campo mf-ancho">
                      <span>Teléfono</span>
                      <input
                        type="tel"
                        name="telefono"
                        inputMode="numeric"
                        placeholder="10 dígitos"
                        value={datos.telefono}
                        onChange={cambiarDatos}
                        required
                      />
                    </label>

                    <label className="mf-campo mf-ancho">
                      <span>Dirección</span>
                      <input
                        type="text"
                        name="direccion"
                        value={datos.direccion}
                        onChange={cambiarDatos}
                        required
                      />
                    </label>
                  </div>

                  {errorDatos && (
                    <p className="mf-error" role="alert">
                      {errorDatos}
                    </p>
                  )}

                  <div className="perfil-acciones">
                    <button
                      type="button"
                      className="mf-btn mf-btn-sec"
                      onClick={() => cargarPerfil(false)}
                      disabled={guardandoDatos}
                    >
                      Restablecer
                    </button>
                    <button
                      type="submit"
                      className="mf-btn mf-btn-prin"
                      disabled={guardandoDatos}
                    >
                      {guardandoDatos ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </div>
                </form>
              </section>

              {/* Privacidad y seguridad */}
              <section className="clinico-card">
                <h2 className="clinico-titulo">Privacidad y seguridad</h2>
                <p className="perfil-subtitulo">Cambia tu contraseña de acceso.</p>

                <form className="perfil-form" onSubmit={actualizarContrasena}>
                  <label className="mf-campo">
                    <span>Contraseña actual</span>
                    <input
                      type="password"
                      name="contrasena_actual"
                      autoComplete="current-password"
                      placeholder="Contraseña"
                      value={password.contrasena_actual}
                      onChange={cambiarPassword}
                      required
                    />
                  </label>

                  <label className="mf-campo">
                    <span>Nueva contraseña</span>
                    <input
                      type="password"
                      name="nueva_contrasena"
                      autoComplete="new-password"
                      placeholder="Nueva contraseña"
                      value={password.nueva_contrasena}
                      onChange={cambiarPassword}
                      required
                    />
                  </label>

                  <label className="mf-campo">
                    <span>Confirmar nueva contraseña</span>
                    <input
                      type="password"
                      name="confirmar_contrasena"
                      autoComplete="new-password"
                      placeholder="Repite tu nueva contraseña"
                      value={password.confirmar_contrasena}
                      onChange={cambiarPassword}
                      required
                    />
                  </label>

                  {errorPassword && (
                    <p className="mf-error" role="alert">
                      {errorPassword}
                    </p>
                  )}

                  <div className="perfil-acciones">
                    <button
                      type="button"
                      className="mf-btn mf-btn-sec"
                      onClick={() => {
                        setPassword(PASSWORD_VACIO);
                        setErrorPassword("");
                      }}
                      disabled={guardandoPassword}
                    >
                      Limpiar
                    </button>
                    <button
                      type="submit"
                      className="mf-btn mf-btn-prin"
                      disabled={guardandoPassword}
                    >
                      {guardandoPassword ? "Guardando..." : "Actualizar contraseña"}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}
        </div>
      </div>

      <ModalConfirmacion
        abierto={!!aviso}
        titulo={aviso?.titulo}
        mensaje={aviso?.mensaje}
        textoCancelar={null}
        textoConfirmar="Aceptar"
        onConfirmar={() => setAviso(null)}
      />
    </div>
  );
}

export default PerfilPaciente;