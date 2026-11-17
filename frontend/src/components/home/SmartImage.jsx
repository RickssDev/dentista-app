import { useCallback, useState } from "react";
import Icon from "./Icon";

/**
 * Imagen optimizada:
 *  - lazy loading nativo + decoding async (no bloquea el render)
 *  - reserva espacio con aspect-ratio (sin saltos de layout / CLS)
 *  - skeleton animado mientras carga y fade-in al terminar
 *  - fallback elegante si la URL falla
 *  - priority=true para la imagen principal (LCP): se pinta desde el primer render, sin ocultarla
 *    a la espera de la app ni esqueleto (spec 023, CA3)
 */
export default function SmartImage({ src, alt = "", ratio, priority = false, className = "", sizes, srcSet, onClick }) {
  const inicial = !src ? "error" : priority ? "loaded" : "loading";
  const [status, setStatus] = useState(inicial);
  const [srcAnterior, setSrcAnterior] = useState(src);

  // Al cambiar la imagen se reinicia el estado durante el render (sin efecto en cascada)
  if (src !== srcAnterior) {
    setSrcAnterior(src);
    setStatus(inicial);
  }

  // Si la imagen ya estaba en caché, onLoad puede no dispararse a tiempo: se revisa al montarla y
  // cada vez que cambia src (la función nueva hace que React vuelva a llamar al ref)
  const revisarCache = useCallback(
    (img) => {
      if (img && img.complete && img.naturalWidth > 0) setStatus("loaded");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- src debe renovar el ref callback
    [src],
  );

  return (
    <div
      className={`smart-img is-${status}${priority ? " is-priority" : ""} ${className}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
      onClick={onClick}
    >
      {status !== "error" ? (
        <img
          ref={revisarCache}
          src={src}
          alt={alt}
          srcSet={srcSet}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      ) : (
        <div className="smart-img__fallback" role="img" aria-label={alt || "Imagen no disponible"}>
          <Icon name="tooth" size={34} />
        </div>
      )}
    </div>
  );
}
