import { Link } from "react-router-dom";
import "../styles/Home.css";
function Home() {
  return (
    <>
      <header className="navbar">
        <div className="logo">
          Dentissa<span className="dot">.</span>
        </div>

        <nav className="nav-links">
          <a href="#servicios">Servicios</a>
          <a href="#horarios">Horarios</a>
          <a href="#nosotros">Nosotros</a>
        </nav>

       <Link to="/login" className="btn-primary">
  Agendar Cita
</Link>
      </header>

      <main className="hero">
        <div className="hero-container">
          <div className="hero-text">
            <span className="badge">
              Tu sonrisa en las mejores manos
            </span>

            <h1>Diseñamos la sonrisa sana que te mereces</h1>

            <p>
              En <strong>Dentissa</strong> combinamos tecnología avanzada con
              un trato cálido para brindarte la mejor experiencia.
            </p>

            <div className="hero-cta">
              <a href="#servicios" className="btn-secondary">
                Ver Especialidades
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <img
              className="hero-image"
              src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=900"
              alt="Dentista"
            />

            <div className="floating-badge">
              <div>
                <h4>100% Seguro</h4>
                <p>Especialistas Certificados</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <section id="servicios" className="section-padding">
        <div className="section-header">
          <h2>Nuestros Servicios</h2>
          <p>Tratamientos personalizados para toda la familia.</p>
        </div>

        <div className="services-grid">
          <div className="card">
            <img
              src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=800"
              alt="Odontología General"
            />
            <h3>Odontología General</h3>
            <p>
              Limpiezas, resinas y prevención para mantener una sonrisa
              saludable.
            </p>
          </div>

          <div className="card">
            <img
              src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800"
              alt="Ortodoncia"
            />
            <h3>Ortodoncia Moderna</h3>
            <p>Brackets estéticos y alineadores invisibles.</p>
          </div>

          <div className="card">
            <img
              src="https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800"
              alt="Estética Dental"
            />
            <h3>Estética Dental</h3>
            <p>Blanqueamientos y carillas para una sonrisa radiante.</p>
          </div>
        </div>
      </section>

      <section id="horarios" className="schedule-section section-padding">
        <div className="schedule-container">
          <div className="schedule-info">
            <h2>Horario de Atención</h2>
            <p>
              Agenda tu cita en el horario que mejor se adapte a ti.
            </p>

            <div className="emergency-box">
              <div>
                <h4>¿Urgencia Dental?</h4>
                <p>Llámanos y te atenderemos con prioridad.</p>
              </div>
            </div>
          </div>

          <div className="schedule-table">
            <div className="time-row">
              <span>Lunes a Viernes</span>
              <span>09:00 - 19:00</span>
            </div>

            <div className="time-row">
              <span>Sábado</span>
              <span>09:00 - 14:00</span>
            </div>

            <div className="time-row closed">
              <span>Domingo</span>
              <span>Cerrado</span>
            </div>
          </div>

          <div className="schedule-image">
            <img
              src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=700"
              alt="Consultorio"
            />
          </div>
        </div>
      </section>

      <section id="nosotros" className="about-section section-padding">
        <div className="about-container">
          <div className="about-image">
            <img
              src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=900"
              alt="Clínica Dental"
            />

            <div className="about-stats">
              <h3>+10</h3>
              <p>Años de experiencia</p>
            </div>
          </div>

          <div className="about-text">
            <h2>Acerca de Nosotros</h2>
            <h3>Un concepto diferente de ir al dentista</h3>

            <p>
              Contamos con instalaciones modernas, tecnología de última
              generación y especialistas comprometidos con tu bienestar.
            </p>

            <p>
              Nuestro objetivo es que cada visita sea cómoda, segura y
              agradable.
            </p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>© 2026 Dentissa Clínica Dental. Todos los derechos reservados.</p>
      </footer>
    </>
  );
}

export default Home;