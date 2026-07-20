import { useNavigate } from "react-router-dom";
import "../styles/home.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">

      <div className="hero">

        <h2 className="title">Consultorio Dental "Dentissa"</h2>

        <div className="hero-content">

          <div className="text">
            <h1>
              La sonrisa es tu <br />
              mejor carta <br />
              de presentación
            </h1>

            <p>Empieza a cuidarla hoy.</p>

            <button
              className="btn-agendar"
              onClick={() => navigate("/login")}
            >
              Agenda tu cita
            </button>
          </div>

          <div className="image">
            <img
              src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5"
              alt="dental"
            />
          </div>

        </div>

      </div>

    </div>
  );
}

export default Home;