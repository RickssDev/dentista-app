import { useId, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/home/Icon";
import SmartImage from "../components/home/SmartImage";
import {
  CtaBand,
  EmptyState,
  SectionHeader,
  Stars,
} from "../components/home/ui";
import { usePublicData } from "../hooks/usePublicData";
import {
  formatDate,
  formatPrice,
  normalizeComentario,
  normalizeFaq,
  normalizePromocion,
  normalizeServicio,
} from "../api/normalize";
import { CLINIC, HOURS, IMAGES } from "../data/site";
import "../styles/home/Home.css";

const MAX_SERVICES = 6;
const MAX_TESTIMONIALS = 6;
const MAX_FAQS = 6;

/* ───────────────────────────── Hero ───────────────────────────── */
function Hero() {
  return (
    <section className="hero">
      <div className="dt-container hero__grid">
        <div className="hero__text">
          <span className="badge">
            <Icon name="sparkle" size={14} /> Tu sonrisa en las mejores manos
          </span>
          <h1>
            Diseñamos la sonrisa sana{" "}
            <span className="text-accent">que te mereces</span>
          </h1>
          <p className="hero__lead">
            En <strong>Dentissa</strong> combinamos tecnología avanzada con un
            trato cálido para brindarte la mejor experiencia.
          </p>
          <div className="hero__cta">
            <Link to="/login" className="dt-btn dt-btn--primary dt-btn--lg">
              Agendar Cita <Icon name="arrow" size={18} />
            </Link>
            <a href="#servicios" className="dt-btn dt-btn--ghost dt-btn--lg">
              Ver Especialidades
            </a>
          </div>
          <ul className="hero__trust">
            <li>
              <Icon name="check" size={16} /> Especialistas certificados
            </li>
            <li>
              <Icon name="check" size={16} /> Atención para toda la familia
            </li>
          </ul>
        </div>

        <div className="hero__visual">
          <SmartImage
            src={IMAGES.hero}
            alt="Dentista atendiendo a una paciente en Dentissa"
            ratio="4 / 5"
            priority
            className="hero__image"
          />
          <div className="float-card float-card--top">
            <span className="float-card__icon">
              <Icon name="shield" size={20} />
            </span>
            <div>
              <strong>Atención programada</strong>
              <small>Horarios flexibles</small>
            </div>
          </div>
          <div className="float-card float-card--bottom">
            <span className="float-card__icon float-card__icon--warm">
              <Icon name="star" size={18} />
            </span>
            <div>
              <strong>Atención personalizada</strong>
              <small>Cuidamos de ti</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Servicios ─────────────────────────── */
function ServiceSkeleton() {
  return (
    <div className="service-card is-skeleton" aria-hidden="true">
      <div className="skeleton skeleton--media" />
      <div className="service-card__body">
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--line short" />
      </div>
    </div>
  );
}

function Services() {
  const { data, loading, error, retry } = usePublicData(
    "servicios",
    normalizeServicio,
  );
  const items = data.slice(0, MAX_SERVICES);

  return (
    <section id="servicios" className="section section--tint">
      <div className="dt-container">
        <SectionHeader
          eyebrow="Especialidades"
          title="Nuestros Servicios"
          text="Tratamientos personalizados para toda la familia."
        />

        {loading ? (
          <div className="services-grid">
            {Array.from({ length: 3 }, (_, i) => (
              <ServiceSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title="No pudimos cargar los servicios"
            text="Revisa tu conexión e inténtalo de nuevo."
            onRetry={retry}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Muy pronto"
            text="Estamos actualizando nuestro catálogo de servicios."
          />
        ) : (
          <div className="services-grid">
            {items.map((s) => {
              const price = formatPrice(s.precio);
              return (
                <article key={s.id} className="service-card">
                  {s.imagen ? (
                    <SmartImage
                      src={s.imagen}
                      alt={s.nombre}
                      ratio="16 / 10"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="service-card__icon">
                      <Icon name="tooth" size={28} />
                    </div>
                  )}
                  <div className="service-card__body">
                    <h3>{s.nombre}</h3>
                    {s.descripcion && (
                      <p className="clamp-3">{s.descripcion}</p>
                    )}
                    {(price || s.duracion) && (
                      <div className="service-card__meta">
                        {price && <span>Desde {price}</span>}
                        {s.duracion && (
                          <span>
                            <Icon name="clock" size={14} /> {s.duracion}
                            {/^\d+$/.test(String(s.duracion)) ? " min" : ""}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/* ────────────────────────── Promociones ────────────────────────── */
function Promotions() {
  const { data, loading } = usePublicData("promociones", normalizePromocion);
  // Si no hay promociones activas, la sección no se muestra (landing limpia)
  if (loading || data.length === 0) return null;

  return (
    <section id="promociones" className="section">
      <div className="dt-container">
        <SectionHeader
          eyebrow="Por tiempo limitado"
          title="Promociones del mes"
        />
        <div className="promo-track" role="list">
          {data.map((p) => {
            const price = formatPrice(p.precio);
            const until = formatDate(p.vigencia);
            const discount =
              p.descuento != null && p.descuento !== ""
                ? String(p.descuento).replace("%", "")
                : null;
            return (
              <article key={p.id} className="promo-card" role="listitem">
                {p.imagen && (
                  <SmartImage
                    src={p.imagen}
                    alt={p.titulo}
                    ratio="16 / 9"
                    className="promo-card__media"
                  />
                )}
                <div className="promo-card__body">
                  <div className="promo-card__top">
                    <span className="promo-card__tag">
                      <Icon name="tag" size={14} /> Promoción
                    </span>
                    {discount && (
                      <span className="promo-card__discount">-{discount}%</span>
                    )}
                  </div>
                  <h3>{p.titulo}</h3>
                  {p.descripcion && <p className="clamp-3">{p.descripcion}</p>}
                  <div className="promo-card__footer">
                    {price && (
                      <strong className="promo-card__price">{price}</strong>
                    )}
                    {until && (
                      <small>
                        <Icon name="calendar" size={14} /> Válido hasta {until}
                      </small>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Horario compacto ───────────────────────── */
function ScheduleStrip() {
  return (
    <section className="section section--tight">
      <div className="dt-container">
        <div className="schedule">
          <div className="schedule__intro">
            <span className="schedule__icon">
              <Icon name="clock" size={22} />
            </span>
            <div>
              <h2>Horario de Atención</h2>
              <p>Agenda tu cita en el horario que mejor se adapte a ti.</p>
            </div>
          </div>
          <ul className="schedule__list">
            {HOURS.map((h) => (
              <li key={h.day} className={h.closed ? "is-closed" : ""}>
                <span>{h.day}</span>
                <strong>{h.time}</strong>
              </li>
            ))}
          </ul>
          <a href={CLINIC.phoneHref} className="schedule__urgent">
            <Icon name="phone" size={18} />
            <span>
              <strong>¿Urgencia dental?</strong>
              <small>Llámanos y te atenderemos con prioridad</small>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────── Testimonios ────────────────────────── */
function Testimonials() {
  const { data, loading } = usePublicData("comentarios", normalizeComentario);
  if (!loading && data.length === 0) return null;
  const items = data.slice(0, MAX_TESTIMONIALS);

  return (
    <section id="testimonios" className="section section--tint">
      <div className="dt-container">
        <SectionHeader
          eyebrow="Comentarios"
          title="Lo que dicen nuestros pacientes"
          text="La confianza de nuestros pacientes es nuestra mejor carta de presentación."
        />
        <div className="testimonials" role="list">
          {loading
            ? Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className="testimonial is-skeleton"
                  aria-hidden="true"
                >
                  <div className="skeleton skeleton--line" />
                  <div className="skeleton skeleton--line" />
                  <div className="skeleton skeleton--line short" />
                </div>
              ))
            : items.map((c) => (
                <figure key={c.id} className="testimonial" role="listitem">
                  <Stars value={c.rating} />
                  <blockquote className="clamp-5">“{c.texto}”</blockquote>
                  <figcaption>
                    <span className="dt-avatar" aria-hidden="true">
                      {c.autor.trim().charAt(0).toUpperCase()}
                    </span>
                    <span>
                      <strong>{c.autor}</strong>
                      {formatDate(c.fecha) && (
                        <small>{formatDate(c.fecha)}</small>
                      )}
                    </span>
                  </figcaption>
                </figure>
              ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── FAQ ─────────────────────────────── */
function FaqItem({ faq, open, onToggle }) {
  const uid = useId();
  return (
    <div className={`faq ${open ? "is-open" : ""}`}>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={uid}
          onClick={onToggle}
        >
          <span>{faq.pregunta}</span>
          <Icon name="plus" size={20} className="faq__icon" />
        </button>
      </h3>
      <div id={uid} className="faq__panel" role="region">
        <div>
          <p>{faq.respuesta}</p>
        </div>
      </div>
    </div>
  );
}

function Faqs() {
  const { data, loading } = usePublicData("faqs", normalizeFaq);
  const [openId, setOpenId] = useState(null);
  if (!loading && data.length === 0) return null;
  const items = data.slice(0, MAX_FAQS);

  return (
    <section id="faq" className="section">
      <div className="dt-container faq-layout">
        <div className="faq-layout__intro">
          <SectionHeader
            align="left"
            eyebrow="Preguntas frecuentes"
            title="Resolvemos tus dudas"
            text="Si no encuentras lo que buscas, escríbenos y con gusto te ayudamos."
          />
          <Link to="/contacto" className="dt-btn dt-btn--ghost">
            Ir a contacto <Icon name="arrow" size={18} />
          </Link>
        </div>
        <div className="faq-list">
          {loading
            ? Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="skeleton skeleton--faq" />
              ))
            : items.map((f) => (
                <FaqItem
                  key={f.id}
                  faq={f}
                  open={openId === f.id}
                  onToggle={() =>
                    setOpenId((cur) => (cur === f.id ? null : f.id))
                  }
                />
              ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Services />
      <Promotions />
      <ScheduleStrip />
      <Testimonials />
      <Faqs />
      <CtaBand />
    </>
  );
}
