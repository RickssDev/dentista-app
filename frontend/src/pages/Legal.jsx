import { Link } from "react-router-dom";
import { PageHero } from "../components/home/ui";
import { CLINIC } from "../data/site";

const CONTENT = {
  privacidad: {
    title: "Aviso de Privacidad",
    sections: [
      {
        h: "Responsable de tus datos",
        p: `Dentissa Clínica Dental, con domicilio en ${CLINIC.address}, es responsable del tratamiento de tus datos personales.`,
      },
      {
        h: "Finalidad",
        p: "Utilizamos tus datos para agendar citas, integrar tu expediente clínico, darte seguimiento y contactarte sobre tus tratamientos.",
      },
      {
        h: "Derechos ARCO",
        p: `Puedes ejercer tus derechos de acceso, rectificación, cancelación u oposición escribiendo a ${CLINIC.email}.`,
      },
    ],
  },
  terminos: {
    title: "Términos de Servicio",
    sections: [
      {
        h: "Citas",
        p: "Las citas agendadas en línea están sujetas a confirmación. Te pedimos avisar con al menos 24 horas de anticipación si necesitas cancelar o reprogramar.",
      },
      {
        h: "Información del sitio",
        p: "El contenido de este sitio es informativo y no sustituye una valoración clínica presencial.",
      },
      {
        h: "Precios y promociones",
        p: "Los precios y promociones pueden cambiar sin previo aviso y están sujetos a su vigencia y disponibilidad.",
      },
    ],
  },
};

export default function Legal({ type }) {
  const page = CONTENT[type];
  return (
    <>
      <PageHero eyebrow="Legal" title={page.title} />
      <section className="section section--flush-top">
        <div className="dt-container legal">
          {page.sections.map((s) => (
            <div key={s.h}>
              <h2>{s.h}</h2>
              <p>{s.p}</p>
            </div>
          ))}
          <Link to="/" className="dt-btn dt-btn--ghost">
            Volver al inicio
          </Link>
        </div>
      </section>
    </>
  );
}

export function NotFound() {
  return (
    <>
      <PageHero
        eyebrow="Error 404"
        title="Página no encontrada"
        text="La página que buscas no existe o fue movida."
      />
      <div className="dt-container legal">
        <Link to="/" className="dt-btn dt-btn--primary">
          Volver al inicio
        </Link>
      </div>
    </>
  );
}
