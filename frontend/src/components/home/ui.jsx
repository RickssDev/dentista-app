import { Link } from "react-router-dom";
import Icon from "./Icon";

export function SectionHeader({ eyebrow, title, text, align = "center" }) {
  return (
    <div className={`section-header section-header--${align}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

export function PageHero({ eyebrow, title, text }) {
  return (
    <section className="page-hero">
      <div className="dt-container page-hero__inner">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
    </section>
  );
}

export function EmptyState({ icon = "tooth", title, text, onRetry }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Icon name={icon} size={26} />
      </span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {onRetry && (
        <button
          type="button"
          className="dt-btn dt-btn--ghost dt-btn--sm"
          onClick={onRetry}
        >
          <Icon name="refresh" size={16} /> Reintentar
        </button>
      )}
    </div>
  );
}

export function Stars({ value = 5 }) {
  return (
    <div className="stars" aria-label={`${value} de 5 estrellas`} role="img">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          size={16}
          className={n <= value ? "is-on" : ""}
        />
      ))}
    </div>
  );
}

export function CtaBand() {
  return (
    <section className="section">
      <div className="dt-container">
        <div className="cta-band">
          <div>
            <h2>¿Listo para cuidar tu sonrisa?</h2>
            <p>
              Agenda tu cita en minutos y recibe atención personalizada desde la
              primera visita.
            </p>
          </div>
          <div className="cta-band__actions">
            <Link to="/login" className="dt-btn dt-btn--light">
              Agendar Cita
            </Link>
            <Link to="/contacto" className="dt-btn dt-btn--outline-light">
              Contáctanos
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
