import { useState } from "react";
import "../../styles/login.css";

function Login() {

  const [active, setActive] = useState(false);

  return (
    <div className="login-page">

      <div className={`container ${active ? "active" : ""}`} id="container">

        {/* SIGN UP */}
        <div className="form-container sign-up">
          <form>
            <h1>Crear Cuenta</h1>

          

            <input type="text" placeholder="Name" />
            <input type="email" placeholder="Email" />
            <input type="password" placeholder="Password" />
            <input type="password" placeholder="Confirm Password" />


            <button>Registrarse</button>
          </form>
        </div>

        {/* SIGN IN */}
        <div className="form-container sign-in">
          <form>
            <h1>Iniciar Sesión</h1>
            <input type="email" placeholder="Email" />
            <input type="password" placeholder="Password" />

            <a href="#">Olvidaste tu contraseña?</a>

            <button>Iniciar Sesión</button>
          </form>
        </div>

        {/* PANEL */}
        <div className="toggle-container">
          <div className="toggle">

            <div className="toggle-panel toggle-left">
              <h1>Tienes cuenta?</h1>
              <p>Ingresa </p>

              <button
                className="hidden"
                onClick={() => setActive(false)}
              >
                Iniciar Sesión
              </button>

            </div>

            <div className="toggle-panel toggle-right">
              <h1>No tienes cuenta?</h1>
              <p>Regístrate</p>

              <button
                className="hidden"
                onClick={() => setActive(true)}
              >
                Registrar
              </button>

            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

export default Login;