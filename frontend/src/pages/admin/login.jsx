import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import "../../styles/login.css";

function Login() {
  const [active, setActive] = useState(false);
  const navigate = useNavigate();

  // LOGIN
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // REGISTER
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [emailReg, setEmailReg] = useState("");
  const [passwordReg, setPasswordReg] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  // 🔐 LOGIN
 const handleLogin = (e) => {
  e.preventDefault();

  console.log("LOGIN SIMULADO");

  const fakeUser = {
    nombre: "Admin",
    correo: email
  };

  localStorage.setItem("token", "fake-token");
  localStorage.setItem("user", JSON.stringify(fakeUser));

  navigate("/admin");
};

  // 📝 REGISTER
  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const res = await api("/auth/register", "POST", {
        nombre_usuario: nombre,
        apellido: apellido,
        correo: emailReg,
        contrasena: passwordReg,
        confirmar_contrasena: confirmarPassword
      });

      console.log("REGISTER:", res);

      alert("Usuario registrado correctamente");
      setActive(false);

    } catch (error) {
      console.error(error);
      alert("Error al registrar");
    }
  };

  return (
    <div className="login-page">
      <div className={`container ${active ? "active" : ""}`}>

        {/* REGISTER */}
        <div className="form-container sign-up">
          <form onSubmit={handleRegister}>
            <h1>Crear Cuenta</h1>

            <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <input type="text" placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} />
            <input type="email" placeholder="Correo" value={emailReg} onChange={(e) => setEmailReg(e.target.value)} />
            <input type="password" placeholder="Contraseña" value={passwordReg} onChange={(e) => setPasswordReg(e.target.value)} />
            <input type="password" placeholder="Confirmar contraseña" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} />

            <button type="submit">Registrarse</button>
          </form>
        </div>

        {/* LOGIN */}
        <div className="form-container sign-in">
          <form onSubmit={handleLogin}>
            <h1>Iniciar Sesión</h1>

            <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />

            <button type="submit">Iniciar Sesión</button>
          </form>
        </div>

        {/* PANEL */}
        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <button type="button" onClick={() => setActive(false)}>Iniciar Sesión</button>
            </div>
            <div className="toggle-panel toggle-right">
              <button type="button" onClick={() => setActive(true)}>Registrarse</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;