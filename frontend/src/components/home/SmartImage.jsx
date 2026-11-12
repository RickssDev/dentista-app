import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

/**
 * Imagen optimizada:
 *  - lazy loading nativo + decoding async (no bloquea el render)
 *  - reserva espacio con aspect-ratio (sin saltos de layout / CLS)
 *  - skeleton animado mientras carga y fade-in al terminar
 *  - fallback elegante si la URL falla
 *  - priority=true para la imagen principal (LCP)
 */
export default function SmartImage({ src, alt = "", ratio, priority = false, className = "", sizes, onClick }) {
  const [status, setStatus] = useState(src ? "loading" : "error");
  const imgRef = useRef(null);

  useEffect(() => {
    setStatus(src ? "loading" : "error");
  }, [src]);

  // Si la imagen ya estaba en caché, onLoad puede no dispararse a tiempo
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) setStatus("loaded");
  }, [src]);

  return (
    <div
      className={`smart-img is-${status} ${className}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
      onClick={onClick}
    >
      {status !== "error" ? (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
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
