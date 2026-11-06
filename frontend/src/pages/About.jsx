import Icon from "../components/home/Icon";
import SmartImage from "../components/home/SmartImage";
import { CtaBand, EmptyState, PageHero, SectionHeader } from "../components/home/ui";
import { usePublicData } from "../hooks/usePublicData";

import { IMAGES, STATS, TEAM, VALUES } from "../data/site";
import "../styles/home/About.css";

const initials = (name) =>
  name
    .replace(/^(Dra?\.)\s*/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();



export default function About() {
  return (
    <>
      <PageHero
        eyebrow="Nosotros"
        title="Un concepto diferente de ir al dentista"
        text="Somos una clínica dental enfocada en tu bienestar, con un equipo cercano y tecnología que hace cada visita más cómoda."
      />

      <section id="quienes-somos" className="section">
        <div className="dt-container about">
          <div className="about__media">
            <SmartImage src={IMAGES.about} alt="Instalaciones de la clínica Dentissa" ratio="4 / 3" />
          </div>
          <div className="about__text">
            <span className="eyebrow">Quiénes somos</span>
            <h2>Cuidamos tu salud bucal con calidez y precisión</h2>
            <p>
              Contamos con instalaciones modernas, tecnología de última generación y especialistas comprometidos con
              tu bienestar.
            </p>
            <p>Nuestro objetivo es que cada visita sea cómoda, segura y agradable, para ti y para toda tu familia.</p>
            <dl className="dt-stats">
              {STATS.map((s) => (
                <div key={s.label}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section id="valores" className="section section--tint">
        <div className="dt-container">
          <SectionHeader eyebrow="Nuestros valores" title="Lo que nos distingue" />
          <div className="values-grid">
            {VALUES.map((v) => (
              <article key={v.title} className="value-card">
                <span className="value-card__icon">
                  <Icon name={v.icon} size={22} />
                </span>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="equipo" className="section">
        <div className="dt-container">
          <SectionHeader
            eyebrow="Nuestro equipo"
            title="Especialistas que te acompañan"
            text="Profesionales con vocación de servicio y formación continua."
          />
          <div className="team-grid">
            {TEAM.map((m) => (
              <article key={m.name} className="team-card">
                {m.foto ? (
                  <SmartImage src={m.foto} alt={m.name} ratio="1 / 1" className="team-card__photo" />
                ) : (
                  <div className="team-card__avatar" aria-hidden="true">
                    {initials(m.name)}
                  </div>
                )}
                <h3>{m.name}</h3>
                <p>{m.role}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
