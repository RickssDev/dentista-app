import { useEffect, useState } from "react";
import SidebarPaciente from "../../components/SidebarPaciente";
import { api } from "../../services/api";
import "../../styles/PerfilPaciente.css";

function PerfilPaciente() {
  const [loading, setLoading] = useState(true);

  // Datos personales
  const [datosPersonales, setDatosPersonales] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    direccion: "",
    genero: "",
    fecha_nacimiento: "",
    correo: ""
  });

  // Datos de contraseña
  const [datosPassword, setDatosPassword] = useState({
    contrasena_actual: "",
    nueva_contrasena: "",
    confirmar_contrasena: ""
  });

  useEffect(() => {
    cargarPerfil();
  }, []);

  // =========================
  // CARGAR PERFIL
  // =========================
  const cargarPerfil = async () => {
    try {
      setLoading(true);

      const res = await api("/pacientes/perfil");

      const data = res.payload;

      setDatosPersonales({
        nombre: data.nombre_usuario || "",
        apellido: data.apellido || "",
        telefono: data.telefono || "",
        direccion: data.direccion || "",
        genero: data.genero || "",
        fecha_nacimiento: data.fecha_nacimiento
          ? data.fecha_nacimiento.split("T")[0]
          : "",
        correo: data.correo || ""
      });
    } catch (error) {
      console.error("ERROR AL CARGAR PERFIL:", error);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // CAMBIOS DATOS PERSONALES
  // =========================
  const handlePersonalesChange = (e) => {
    setDatosPersonales({
      ...datosPersonales,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setDatosPassword({
      ...datosPassword,
      [e.target.name]: e.target.value
    });
  };

  // =========================
  // ACTUALIZAR DATOS PERSONALES
  // =========================
  const actualizarDatosPersonales = async (e) => {
    e.preventDefault();

    try {
      await api(
        "/pacientes/perfil",
        "PUT",
        {
          telefono: datosPersonales.telefono,
          direccion: datosPersonales.direccion,
          genero: datosPersonales.genero
        }
      );

      alert("Datos personales actualizados con éxito");

      // Volvemos a cargar los datos desde el backend
      await cargarPerfil();
    } catch (error) {
      console.error("ERROR AL ACTUALIZAR PERFIL:", error);

      alert(
        error.message || "Error al actualizar perfil"
      );
    }
  };

  // =========================
  // ACTUALIZAR CONTRASEÑA
  // =========================
  const actualizarContrasena = async (e) => {
    e.preventDefault();

    if (
      datosPassword.nueva_contrasena !==
      datosPassword.confirmar_contrasena
    ) {
      return alert("Las contraseñas nuevas no coinciden");
    }

    try {
      await api(
        `/auth/cambiarContrasena`,
        "PUT",
        {
          contrasena_actual: datosPassword.contrasena_actual,
          nueva_contrasena: datosPassword.nueva_contrasena,
          confirmar_contrasena:
            datosPassword.confirmar_contrasena
        }
      );

      alert("Contraseña actualizada con éxito");

      setDatosPassword({
        contrasena_actual: "",
        nueva_contrasena: "",
        confirmar_contrasena: ""
      });
    } catch (error) {
      console.error(
        "ERROR AL ACTUALIZAR CONTRASEÑA:",
        error
      );

      alert(
        error.message || "Error al actualizar contraseña"
      );
    }
  };

  return (
    <>
      <SidebarPaciente />

      <div className="inicio-container">
        <h1 style={{ marginBottom: "30px" }}>
          Editar Perfil
        </h1>

        {loading ? (
          <p>Cargando información del perfil...</p>
        ) : (
          <div className="perfil-grid">

            {/* =========================
                DATOS PERSONALES
            ========================== */}
            <div className="card perfil-card">

              <h2>Datos Personales</h2>

              <p className="subtitulo">
                Actualiza tu información de contacto.
              </p>

              <form onSubmit={actualizarDatosPersonales}>

                {/* Nombre y apellido */}
                <div className="form-row">

                  <div className="input-group">
                    <label>Nombre</label>

                    <div className="input-with-icon">
                      <input
                        type="text"
                        value={datosPersonales.nombre}
                        disabled
                        className="input-disabled"
                      />

                      <span className="lock-icon"> 
                      </span>
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Apellido</label>

                    <div className="input-with-icon">
                      <input
                        type="text"
                        value={datosPersonales.apellido}
                        disabled
                        className="input-disabled"
                      />

                      <span className="lock-icon">
                      </span>
                    </div>
                  </div>

                </div>

                {/* Correo */}
                <div className="input-group">
                  <label>Correo electrónico</label>

                  <div className="input-with-icon">
                    <input
                      type="email"
                      value={datosPersonales.correo}
                      disabled
                      className="input-disabled"
                    />

                    <span className="lock-icon">
                    </span>
                  </div>
                </div>

                {/* Fecha de nacimiento */}
                <div className="input-group">
                  <label>Fecha de Nacimiento</label>

                  <div className="input-with-icon">
                    <input
                      type="date"
                      value={
                        datosPersonales.fecha_nacimiento
                      }
                      disabled
                      className="input-disabled"
                    />

                    <span className="lock-icon">
                    </span>
                  </div>
                </div>

                {/* Teléfono */}
                <div className="input-group">
                  <label>Teléfono</label>

                  <input
                    type="text"
                    name="telefono"
                    value={datosPersonales.telefono}
                    onChange={handlePersonalesChange}
                    required
                  />
                </div>

                {/* Dirección */}
                <div className="input-group">
                  <label>Dirección</label>

                  <input
                    type="text"
                    name="direccion"
                    value={datosPersonales.direccion}
                    onChange={handlePersonalesChange}
                    
                    required
                  />
                </div>

                {/* Género */}
                <div className="input-group">
                  <label>Género</label>

                  <select
                    name="genero"
                    value={datosPersonales.genero}
                    onChange={handlePersonalesChange}
                    required
                  >
                    <option value="">
                      Seleccionar...
                    </option>

                    <option value="femenino">
                      Femenino
                    </option>

                    <option value="masculino">
                      Masculino
                    </option>

                    <option value="otro">
                      Otro
                    </option>
                  </select>
                </div>

                {/* Botones */}
                <div className="botones botones-derecha">

                  <button
                    type="button"
                    className="btn btn-cancelar"
                    onClick={cargarPerfil}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="btn btn-reprogramar"
                  >
                    Guardar Cambios
                  </button>

                </div>

              </form>
            </div>

            {/* =========================
                PRIVACIDAD Y SEGURIDAD
            ========================== */}
            <div className="card perfil-card">

              <h2>Privacidad y Seguridad</h2>

              <p className="subtitulo">
                Cambia tu contraseña de acceso.
              </p>

              <form onSubmit={actualizarContrasena}>

                {/* Contraseña actual */}
                <div className="input-group">
                  <label>Contraseña Actual</label>

                  <input
                    type="password"
                    name="contrasena_actual"
                    value={
                      datosPassword.contrasena_actual
                    }
                    onChange={handlePasswordChange}
                    placeholder="Contraseña"
                    required
                  />
                </div>

                {/* Nueva contraseña */}
                <div className="input-group">
                  <label>Nueva Contraseña</label>

                  <input
                    type="password"
                    name="nueva_contrasena"
                    value={
                      datosPassword.nueva_contrasena
                    }
                    onChange={handlePasswordChange}
                    placeholder="Nueva contraseña"
                    required
                    
                  />
                </div>

                {/* Confirmar contraseña */}
                <div className="input-group">
                  <label>
                    Confirmar Nueva Contraseña
                  </label>

                  <input
                    type="password"
                    name="confirmar_contrasena"
                    value={
                      datosPassword.confirmar_contrasena
                    }
                    onChange={handlePasswordChange}
                    placeholder="Repite tu nueva contraseña"
                    required
                    
                  />
                </div>

                {/* Botones */}
                <div className="botones botones-derecha">

                  <button
                    type="button"
                    className="btn btn-cancelar"
                    onClick={() =>
                      setDatosPassword({
                        contrasena_actual: "",
                        nueva_contrasena: "",
                        confirmar_contrasena: ""
                      })
                    }
                  >
                    Limpiar
                  </button>

                  <button
                    type="submit"
                    className="btn btn-reprogramar"
                  >
                    Actualizar Contraseña
                  </button>

                </div>

              </form>
            </div>

          </div>
        )}
      </div>
    </>
  );
}

export default PerfilPaciente;