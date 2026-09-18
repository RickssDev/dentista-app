import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import "../../styles/login.css";

function Login() {
  const [active, setActive] = useState(false);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [emailReg, setEmailReg] = useState("");
  const [passwordReg, setPasswordReg] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [telefono, setTelefono] = useState("");

  
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Correo y contraseña son obligatorios");
      return;
    }

    try {
      const res = await api("/auth/login", "POST", {
        correo: email,
        contrasena: password
      });

      console.log("LOGIN RESPONSE:", res);

      const token =
        res?.token ||
        res?.payload?.token ||
        res?.accessToken ||
        res?.payload?.accessToken;

      if (!token) {
        alert("Login correcto pero el servidor no envió token");
        return;
      }

      const usuario =
        res?.user ||
        res?.payload?.user ||
        {};

      const tienePerfilPaciente =
        res?.tienePerfilPaciente ??
        res?.payload?.tienePerfilPaciente ??
        false;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(usuario));
      localStorage.setItem("rol", usuario.rol.toLowerCase()); // 🔥 CLAVE
      localStorage.setItem(
        "tienePerfilPaciente",
        JSON.stringify(tienePerfilPaciente)
      );

     if (usuario.rol === "Administrador" || usuario.rol === "Asistente") {
  navigate("/admin", { replace: true });
} else {
  if (tienePerfilPaciente) {
    navigate("/paciente", { replace: true });
  } else {
    navigate("/paciente/completar-perfil", { replace: true });
  }
}
    } catch (error) {
      console.error("ERROR LOGIN:", error);

      alert(
        error?.message ||
        error?.response?.data?.message ||
        "Error al iniciar sesión"
      );
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (
      !nombre ||
      !apellido ||
      !emailReg ||
      !passwordReg ||
      !confirmarPassword ||
      !telefono
    ) {
      alert("Todos los campos son obligatorios");
      return;
    }

    if (passwordReg !== confirmarPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    try {
      const res = await api("/auth/register", "POST", {
        nombre_usuario: nombre,
        apellido,
        correo: emailReg,
        telefono,
        contrasena: passwordReg,
        confirmar_contrasena: confirmarPassword
      });

      console.log("REGISTER RESPONSE:", res);

      alert(res?.message || "Usuario registrado correctamente");

      setActive(false);

      // limpiar
      setNombre("");
      setApellido("");
      setEmailReg("");
      setPasswordReg("");
      setConfirmarPassword("");
      setTelefono("");

    } catch (error) {
      console.error("ERROR REGISTER:", error);

      alert(
        error?.message ||
        error?.response?.data?.message ||
        "Error al registrar"
      );
    }
  };

  return (
    <div className="login-page">
      <div className={`container ${active ? "active" : ""}`}>

        {/* REGISTER */}
        <div className="form-container sign-up">
          <form onSubmit={handleRegister}>
            <h1>Crear Cuenta</h1>

            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />

            <input
              type="text"
              placeholder="Apellido"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
            />

            <input
              type="email"
              placeholder="Correo"
              value={emailReg}
              onChange={(e) => setEmailReg(e.target.value)}
            />

            <input
              type="text"
              placeholder="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={passwordReg}
              onChange={(e) => setPasswordReg(e.target.value)}
            />

            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
            />

            <button type="submit">Registrarse</button>
          </form>
        </div>

        {/* LOGIN */}
        <div className="form-container sign-in">
          <form onSubmit={handleLogin}>
            <h1>Iniciar Sesión</h1>

            <input
              type="email"
              placeholder="Correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit">Iniciar Sesión</button>
          </form>
        </div>

        {/* PANEL */}
        <div className="toggle-container">
          <div className="toggle">

            <div className="toggle-panel toggle-left">
              <button type="button" onClick={() => setActive(false)}>
                Iniciar Sesión
              </button>
            </div>

          <div className="toggle-panel toggle-right">
  <p className="toggle-text">¿No tienes cuenta?</p>

  <button type="button" onClick={() => setActive(true)}>
    Registrarse
  </button>
</div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;