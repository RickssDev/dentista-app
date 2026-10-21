import { Link } from "react-router-dom";
import { CLINIC, HOURS, NAV_LINKS, whatsappLink } from "../../data/site";
import Icon from "./Icon";
import logo from "../../assets/logo_textual.jpeg";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="dt-container footer__grid">
        <div className="footer__brand">
          <Link to="/" className="logo logo--light">
            <img src={logo} alt="Melissa López N. Odontología Integral, ir al inicio" className="logo__img logo__img--footer" />
          </Link>
          <p>{CLINIC.tagline}</p>
          <div className="social">
            <a href={CLINIC.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <Icon name="facebook" size={18} />
            </a>
            <a href={CLINIC.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Icon name="instagram" size={18} />
            </a>
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              <Icon name="whatsapp" size={18} />
            </a>
          </div>
        </div>

        <div>
          <h3 className="footer__title">Navegación</h3>
          <ul className="footer__list">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to}>{l.footer}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="footer__title">Contacto</h3>
          <ul className="footer__list footer__list--icons">
            <li>
              <Icon name="pin" size={18} />
              <span>{CLINIC.address}</span>
            </li>
            <li>
              <Icon name="phone" size={18} />
              <a href={CLINIC.phoneHref}>{CLINIC.phone}</a>
            </li>
            <li>
              <Icon name="mail" size={18} />
              <a href={`mailto:${CLINIC.email}`}>{CLINIC.email}</a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="footer__title">Horarios</h3>
          <ul className="footer__hours">
            {HOURS.map((h) => (
              <li key={h.day} className={h.closed ? "is-closed" : ""}>
                <span>{h.day}:</span>
                <span>{h.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="dt-container footer__bottom">
        <p>© {new Date().getFullYear()} Dentissa. Todos los derechos reservados.</p>
        <div className="footer__legal">
          <Link to="/aviso-de-privacidad">Aviso de Privacidad</Link>
          <Link to="/terminos-de-servicio">Términos de Servicio</Link>
        </div>
      </div>
    </footer>
  );
}
