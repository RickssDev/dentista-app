import { useEffect, useState } from "react";
import SidebarPaciente from "../../components/SidebarPaciente";
import { api } from "../../services/api";
import "../../styles/PerfilPaciente.css"; // Crearemos este archivo para los inputs

function PerfilPaciente() {
  // Asumiendo que obtienes el id_usuario del token/contexto
  const idUsuario = 4; 

  const [loading, setLoading] = useState(true);

  // Estado para Datos Personales
  const [datosPersonales, setDatosPersonales] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    direccion: "",
    genero: "",
    fecha_nacimiento: "",
    correo: ""
  });

  // Estado para Datos Privados (Contraseña)
  const [datosPassword, setDatosPassword] = useState({
    contrasena_actual: "",
    nueva_contrasena: "",
    confirmar_contrasena: ""
  });

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      // Suponiendo que tienes un endpoint GET para traer los datos actuales del paciente
      const res = await api(`/pacientes/perfil/${idUsuario}`);
      const data = res.data ? res.data : res;
      
      setDatosPersonales({
        nombre: data.nombre || "Indira", // Valores por defecto de prueba basados en tu Figma
        apellido: data.apellido || "Laurel",
        telefono: data.telefono || "7551209900",
        direccion: data.direccion || "",
        genero: data.genero || "",
        fecha_nacimiento: data.fecha_nacimiento ? data.fecha_nacimiento.split("T")[0] : "2005-08-15",
        correo: data.correo || "indira@ejemplo.com"
      });
    } catch (error) {
      console.error("Error al cargar perfil:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const actualizarDatosPersonales = async (e) => {
    e.preventDefault();
    try {
      await api(
        `/pacientes/perfil/${idUsuario}`,
        "PUT",
        {
          telefono: datosPersonales.telefono,
          direccion: datosPersonales.direccion,
          genero: datosPersonales.genero
        }
      );
      alert("Datos personales actualizados con éxito");
    } catch (error) {
      alert(error.message || "Error al actualizar perfil");
    }
  };

  const actualizarContrasena = async (e) => {
    e.preventDefault();
    if (datosPassword.nueva_contrasena !== datosPassword.confirmar_contrasena) {
      return alert("Las contraseñas nuevas no coinciden");
    }

    try {
      await api(
        `/pacientes/cambiarContrasena/${idUsuario}`,
        "PUT",
        {
          contrasena_actual: datosPassword.contrasena_actual,
          nueva_contrasena: datosPassword.nueva_contrasena,
          confirmar_contrasena: datosPassword.confirmar_contrasena
        }
      );
      alert("Contraseña actualizada con éxito");
      setDatosPassword({ contrasena_actual: "", nueva_contrasena: "", confirmar_contrasena: "" });
    } catch (error) {
      alert(error.message || "Error al actualizar contraseña");
    }
  };

  return (
    <>
      <SidebarPaciente />

      <div className="inicio-container">
        <h1 style={{ marginBottom: '30px' }}>Editar Perfil</h1>

        {loading ? (
          <p>Cargando información del perfil...</p>
        ) : (
          <div className="perfil-grid">
            
            {/* SECCIÓN 1: DATOS PERSONALES */}
            <div className="card perfil-card">
              <h2>Datos Personales</h2>
              <p className="subtitulo">Actualiza tu información de contacto.</p>
              
              <form onSubmit={actualizarDatosPersonales}>
                <div className="form-row">
                  <div className="input-group">
                    <label>Nombre</label>
                    <div className="input-with-icon">
                      <input type="text" value={datosPersonales.nombre} disabled className="input-disabled" />
                      <span className="lock-icon">🔒</span>
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Apellido</label>
                    <div className="input-with-icon">
                      <input type="text" value={datosPersonales.apellido} disabled className="input-disabled" />
                      <span className="lock-icon">🔒</span>
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <label>Fecha de Nacimiento</label>
                  <div className="input-with-icon">
                    <input type="date" value={datosPersonales.fecha_nacimiento} disabled className="input-disabled" />
                    <span className="lock-icon">🔒</span>
                  </div>
                </div>

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

                <div className="input-group">
                  <label>Dirección</label>
                  <input 
                    type="text" 
                    name="direccion"
                    value={datosPersonales.direccion} 
                    onChange={handlePersonalesChange}
                    placeholder="Ej. Tecpan, Guerrero"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Género</label>
                  <select 
                    name="genero" 
                    value={datosPersonales.genero} 
                    onChange={handlePersonalesChange}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div className="botones botones-derecha">
                  <button type="button" className="btn btn-cancelar" onClick={() => cargarPerfil()}>Cancelar</button>
                  <button type="submit" className="btn btn-reprogramar">Guardar Cambios</button>
                </div>
              </form>
            </div>

            {/* SECCIÓN 2: DATOS PRIVADOS (CONTRASEÑA) */}
            <div className="card perfil-card">
              <h2>Privacidad y Seguridad</h2>
              <p className="subtitulo">Cambia tu contraseña de acceso.</p>
              
              <form onSubmit={actualizarContrasena}>
                <div className="input-group">
                  <label>Contraseña Actual</label>
                  <input 
                    type="password" 
                    name="contrasena_actual"
                    value={datosPassword.contrasena_actual}
                    onChange={handlePasswordChange}
                    placeholder="********"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Nueva Contraseña</label>
                  <input 
                    type="password" 
                    name="nueva_contrasena"
                    value={datosPassword.nueva_contrasena}
                    onChange={handlePasswordChange}
                    placeholder="Mínimo 8 caracteres"
                    required
                    minLength="8"
                  />
                </div>

                <div className="input-group">
                  <label>Confirmar Nueva Contraseña</label>
                  <input 
                    type="password" 
                    name="confirmar_contrasena"
                    value={datosPassword.confirmar_contrasena}
                    onChange={handlePasswordChange}
                    placeholder="Repite tu nueva contraseña"
                    required
                    minLength="8"
                  />
                </div>

                <div className="botones botones-derecha">
                  <button type="button" className="btn btn-cancelar" onClick={() => setDatosPassword({ contrasena_actual: "", nueva_contrasena: "", confirmar_contrasena: "" })}>Limpiar</button>
                  <button type="submit" className="btn btn-reprogramar">Actualizar Contraseña</button>
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