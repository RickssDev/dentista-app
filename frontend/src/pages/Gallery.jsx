import { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "../components/home/Icon";
import SmartImage from "../components/home/SmartImage";
import { EmptyState, PageHero } from "../components/home/ui";
import { usePublicData } from "../hooks/usePublicData";
import { normalizeImagen } from "../api/normalize";
import "../styles/home/Gallery.css";

const PAGE_SIZE = 12; // se cargan por bloques para no saturar la red

function Lightbox({ items, index, onClose, onNavigate }) {
  const item = items[index];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate(1);
      if (e.key === "ArrowLeft") onNavigate(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, onNavigate]);

  // Precarga la imagen siguiente para que la navegación sea instantánea
  useEffect(() => {
    const next = items[(index + 1) % items.length];
    if (next) {
      const img = new Image();
      img.src = next.url;
    }
  }, [index, items]);

  if (!item) return null;

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Visor de imágenes"
      onClick={onClose}
    >
      <button
        type="button"
        className="lightbox__close"
        aria-label="Cerrar"
        onClick={onClose}
        autoFocus
      >
        <Icon name="close" size={24} />
      </button>
      {items.length > 1 && (
        <>
          <button
            type="button"
            className="lightbox__nav lightbox__nav--prev"
            aria-label="Imagen anterior"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(-1);
            }}
          >
            <Icon name="chevronLeft" size={26} />
          </button>
          <button
            type="button"
            className="lightbox__nav lightbox__nav--next"
            aria-label="Imagen siguiente"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(1);
            }}
          >
            <Icon name="chevronRight" size={26} />
          </button>
        </>
      )}
      <figure className="lightbox__figure" onClick={(e) => e.stopPropagation()}>
        <img
          key={item.url}
          src={item.url}
          alt={item.titulo || "Imagen de la galería"}
          decoding="async"
        />
        {(item.titulo || item.descripcion) && (
          <figcaption>
            {item.titulo && <strong>{item.titulo}</strong>}
            {item.descripcion && <span>{item.descripcion}</span>}
          </figcaption>
        )}
        <small className="lightbox__count">
          {index + 1} / {items.length}
        </small>
      </figure>
    </div>
  );
}

// Huecos del esqueleto mientras carga la galería
const HUECOS = 8;

// Los avisos de error y de galería vacía ocupan el mismo alto que el esqueleto: así la página no
// salta cuando la galería no llega a cargar (spec 023, CLS)
function AvisoConReserva({ children }) {
  return (
    <div className="gallery-estado">
      <div className="gallery-grid gallery-estado__reserva" aria-hidden="true">
        {Array.from({ length: HUECOS }, (_, i) => (
          <div key={i} className="skeleton--tile" />
        ))}
      </div>
      <div className="gallery-estado__aviso">{children}</div>
    </div>
  );
}

export default function Gallery() {
  const { data, loading, error, retry } = usePublicData(
    "imagenes",
    normalizeImagen,
  );
  const [category, setCategory] = useState("Todas");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [active, setActive] = useState(null);

  const categories = useMemo(() => {
    const set = new Set(data.map((i) => i.categoria).filter(Boolean));
    return set.size > 1 ? ["Todas", ...set] : [];
  }, [data]);

  const filtered = useMemo(
    () =>
      category === "Todas"
        ? data
        : data.filter((i) => i.categoria === category),
    [data, category],
  );
  const shown = filtered.slice(0, visible);

  const changeCategory = (c) => {
    setCategory(c);
    setVisible(PAGE_SIZE);
  };

  const navigate = useCallback(
    (step) =>
      setActive((i) =>
        i === null ? i : (i + step + filtered.length) % filtered.length,
      ),
    [filtered.length],
  );
  const close = useCallback(() => setActive(null), []);

  return (
    <>
      <PageHero
        eyebrow="Galería"
        title="Conoce nuestra clínica"
        text="Un vistazo a nuestras instalaciones, equipo y a los resultados que logramos junto a nuestros pacientes."
      />

      <section className="section section--flush-top">
        <div className="dt-container">
          {categories.length > 0 && (
            <div
              className="chips"
              role="tablist"
              aria-label="Filtrar por categoría"
            >
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={category === c}
                  className={`chip ${category === c ? "is-active" : ""}`}
                  onClick={() => changeCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="gallery-grid">
              {Array.from({ length: HUECOS }, (_, i) => (
                <div key={i} className="skeleton skeleton--tile" />
              ))}
            </div>
          ) : error ? (
            <AvisoConReserva>
              <EmptyState
                icon="image"
                title="No pudimos cargar la galería"
                text="Revisa tu conexión e inténtalo de nuevo."
                onRetry={retry}
              />
            </AvisoConReserva>
          ) : filtered.length === 0 ? (
            <AvisoConReserva>
              <EmptyState
                icon="image"
                title="Galería en preparación"
                text="Muy pronto compartiremos nuevas fotos."
              />
            </AvisoConReserva>
          ) : (
            <>
              <ul className="gallery-grid">
                {shown.map((img, i) => (
                  <li key={img.id}>
                    <button
                      type="button"
                      className="gallery-tile"
                      onClick={() => setActive(i)}
                      aria-label={`Ampliar ${img.titulo || `imagen ${i + 1}`}`}
                    >
                      <SmartImage
                        src={img.url}
                        alt={img.titulo || "Imagen de la clínica Dentissa"}
                        ratio="1 / 1"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                      {img.titulo && (
                        <span className="gallery-tile__caption">
                          {img.titulo}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>

              {visible < filtered.length && (
                <div className="gallery-more">
                  <button
                    type="button"
                    className="dt-btn dt-btn--ghost"
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  >
                    Cargar más fotos
                  </button>
                  <small>
                    Mostrando {shown.length} de {filtered.length}
                  </small>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {active !== null && (
        <Lightbox
          items={filtered}
          index={active}
          onClose={close}
          onNavigate={navigate}
        />
      )}
    </>
  );
}
