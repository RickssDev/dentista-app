import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { NAV_LINKS } from "../../data/site";
import Icon from "./Icon";
import logo from "../../assets/logo_pequeno.jpeg";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cierra el menú al navegar
  useEffect(() => setOpen(false), [pathname]);

  // Bloquea el scroll del body y permite cerrar con Escape
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onResize = () => window.innerWidth > 960 && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <header
      className={`nav ${scrolled ? "is-scrolled" : ""} ${open ? "is-open" : ""}`}
    >
      <div className="dt-container nav__inner">
        <Link to="/" className="logo">
          <img src={logo} alt="Melissa López N. Odontología Integral, ir al inicio" className="logo__img logo__img--nav" />
          <span className="logo__text">Dentissa</span>
        </Link>

        <nav className="nav__links" aria-label="Principal">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className="nav__link"
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav__actions">
          <Link to="/login" className="dt-btn dt-btn--primary nav__cta">
            Agendar Cita
          </Link>
          <button
            type="button"
            className="nav__toggle"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "close" : "menu"} size={24} />
          </button>
        </div>
      </div>

      <div id="mobile-menu" className="nav__mobile" hidden={!open}>
        <nav aria-label="Móvil">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className="nav__mobile-link"
            >
              {l.label}
              <Icon name="chevronRight" size={18} />
            </NavLink>
          ))}
        </nav>
        <Link to="/login" className="dt-btn dt-btn--primary dt-btn--block">
          Agendar Cita
        </Link>
      </div>
      {open && (
        <div
          className="nav__backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
}
