import { useEffect, useRef, useState } from "react";
import Icon from "../components/home/Icon";
import { PageHero, SectionHeader } from "../components/home/ui";
import {
  CLINIC,
  HOURS,
  mapEmbedSrc,
  mapLink,
  whatsappLink,
} from "../data/site";
import "../styles/home/Contact.css";

const REASONS = [
  {
    icon: "calendar",
    title: "Agenda tu cita",
    text: "Te ayudamos a encontrar el horario ideal para ti.",
  },
  {
    icon: "chat",
    title: "Resuelve tus dudas",
    text: "Pregúntanos sobre tratamientos, costos o formas de pago.",
  },
  {
    icon: "phone",
    title: "Urgencias",
    text: "Si tienes dolor o una emergencia, te atendemos con prioridad.",
  },
];

function WhatsappForm() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    const text = `Hola, soy ${name.trim()}. ${message.trim()}`;
    window.open(whatsappLink(text), "_blank", "noopener,noreferrer");
  };

  return (
    <form className="wa-form" onSubmit={onSubmit}>
      <h3>Escríbenos por WhatsApp</h3>
      <p>Llena tus datos y te abriremos el chat con el mensaje listo.</p>
      <label>
        <span>Nombre</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          autoComplete="name"
          required
          maxLength={80}
        />
      </label>
      <label>
        <span>Mensaje</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="¿En qué podemos ayudarte?"
          rows={4}
          required
          maxLength={500}
        />
      </label>
      <button type="submit" className="dt-btn dt-btn--whatsapp dt-btn--block">
        <Icon name="whatsapp" size={18} /> Enviar por WhatsApp
      </button>
    </form>
  );
}

/**
 * Mapa bajo demanda (spec 023, CA6): al entrar solo se ve la dirección; el mapa de Google se carga
 * en el mismo espacio al pulsar "Ver mapa", que sin JavaScript es un enlace a Google Maps.
 */
function MapaContacto() {
  const [activo, setActivo] = useState(false);
  const mapa = useRef(null);

  // Al cargar el mapa, el foco pasa a él para no perderse con el teclado
  useEffect(() => {
    if (activo) mapa.current?.focus();
  }, [activo]);

  const verMapa = (e) => {
    e.preventDefault();
    setActivo(true);
  };

  const comoLlegar = (extra = "") => (
    <a
      className={`map__llegar dt-btn dt-btn--ghost ${extra}`}
      href={mapLink}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icon name="pin" size={16} /> Cómo llegar
    </a>
  );

  return (
    <div className={`map ${activo ? "is-activo" : ""}`}>
      {activo ? (
        <>
          <iframe
            ref={mapa}
            title="Ubicación de Dentissa en Google Maps"
            src={mapEmbedSrc}
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          {comoLlegar("map__open")}
        </>
      ) : (
        <div className="map__vista">
          <span className="map__pin" aria-hidden="true">
            <Icon name="pin" size={22} />
          </span>
          <p className="map__etiqueta">Ubicación</p>
          <p className="map__direccion">{CLINIC.address}</p>
          <div className="map__acciones">
            <a className="map__ver dt-btn" href={mapLink} onClick={verMapa}>
              Ver mapa
            </a>
            {comoLlegar()}
          </div>
          <p className="map__nota">El mapa se carga desde Google Maps al pulsar «Ver mapa».</p>
        </div>
      )}
    </div>
  );
}

export default function Contact() {
  return (
    <>
      <PageHero
        eyebrow="Contacto y Ubicación"
        title="Estamos para escucharte"
        text="Escríbenos, llámanos o visítanos. Responder tus dudas es el primer paso para cuidar tu sonrisa."
      />

      <section className="section section--flush-top">
        <div className="dt-container">
          <div className="reasons">
            {REASONS.map((r) => (
              <article key={r.title} className="reason">
                <span className="reason__icon">
                  <Icon name={r.icon} size={20} />
                </span>
                <div>
                  <h3>{r.title}</h3>
                  <p>{r.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tint">
        <div className="dt-container contact-grid">
          <div className="contact-info">
            <SectionHeader
              align="left"
              eyebrow="Información"
              title="Visítanos en Dentissa"
            />

            <ul className="info-list">
              <li>
                <span className="info-list__icon">
                  <Icon name="pin" size={20} />
                </span>
                <div>
                  <small>Dirección</small>
                  <a href={mapLink} target="_blank" rel="noopener noreferrer">
                    {CLINIC.address}
                  </a>
                </div>
              </li>
              <li>
                <span className="info-list__icon">
                  <Icon name="phone" size={20} />
                </span>
                <div>
                  <small>Teléfono</small>
                  <a href={CLINIC.phoneHref}>{CLINIC.phone}</a>
                </div>
              </li>
              <li>
                <span className="info-list__icon">
                  <Icon name="mail" size={20} />
                </span>
                <div>
                  <small>Correo</small>
                  <a href={`mailto:${CLINIC.email}`}>{CLINIC.email}</a>
                </div>
              </li>
              <li>
                <span className="info-list__icon">
                  <Icon name="clock" size={20} />
                </span>
                <div>
                  <small>Horario</small>
                  {HOURS.map((h) => (
                    <span
                      key={h.day}
                      className={`info-list__hour ${h.closed ? "is-closed" : ""}`}
                    >
                      {h.day}: {h.time}
                    </span>
                  ))}
                </div>
              </li>
            </ul>

            <div className="social-buttons">
              <a
                className="social-btn social-btn--wa"
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="whatsapp" size={20} /> WhatsApp
              </a>
              <a
                className="social-btn social-btn--fb"
                href={CLINIC.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="facebook" size={20} /> Facebook
              </a>
              <a
                className="social-btn social-btn--ig"
                href={CLINIC.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="instagram" size={20} /> Instagram
              </a>
            </div>
          </div>

          <WhatsappForm />
        </div>
      </section>

      <section className="section">
        <div className="dt-container">
          <MapaContacto />
        </div>
      </section>
    </>
  );
}
