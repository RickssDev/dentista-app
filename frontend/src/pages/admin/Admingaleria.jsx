import { useEffect, useMemo, useState } from "react";
import "../../styles/adminpanel.css";
import {
  FaRegEye,
  FaRegEyeSlash,
  FaRegTrashAlt,
  FaRegImage,
  FaRegCalendarAlt,
} from "react-icons/fa";
import { api, getImageUrl } from "../../services/api";
import { normalizar } from "../../api/normalize";
import EncabezadoModulo from "../../components/EncabezadoModulo";
import FiltrosCard from "../../components/FiltrosCard";
import ModalConfirmacion from "../../components/ModalConfirmacion";
import ModalFormulario from "../../components/ModalFormulario";
import { validarImagen } from "../../utils/validarImagen";
import { MAX_IMAGENES_GALERIA } from "../../utils/limitesGaleria";

// Aviso de galería llena (spec 029, CA6); el botón «Nueva imagen» lo usa como descripción
const ID_AVISO_LLENA = "aviso-galeria-llena";
const AVISO_LLENA = `Llegaste al máximo de ${MAX_IMAGENES_GALERIA} imágenes. Elimina una para agregar otra.`;

const MESES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const formatFecha = (fecha) => {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (isNaN(d)) return "";
  const dia = String(d.getDate()).padStart(2, "0");
  return `${dia}/${MESES[d.getMonth()]}/${d.getFullYear()}`;
};

// visible va como "1" / "0" para que MySQL lo reciba como tinyint
const FORM_VACIO = { titulo: "", visible: "1", imagen: null };

/* Miniatura; si no hay imagen (o falla la carga) muestra un icono */
function ImagenMiniatura({ img }) {
  const [falloImagen, setFalloImagen] = useState(false);

  return (
    <div className="imagen-wrap">
      {img.imagen && !falloImagen ? (
        <img
          src={getImageUrl(img.imagen)}
          alt={img.titulo}
          onError={() => setFalloImagen(true)}
        />
      ) : (
        <FaRegImage />
      )}
    </div>
  );
}

function AdminImagenes() {
  const [imagenes, setImagenes] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [editando, setEditando] = useState(false);
  const [imagenId, setImagenId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroVisible, setFiltroVisible] = useState("");
  const [imagenAEliminar, setImagenAEliminar] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [errorForm, setErrorForm] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  // Sin lista cargada no se muestran contador ni aviso: el servidor sigue limitando (spec 029, A16)
  const [listaCargada, setListaCargada] = useState(false);
  const obtenerImagenes = async () => {
    try {
      const data = await api("/imagenes");
      setImagenes(data.payload);
      setListaCargada(true);
    } catch (error) {
      console.error(error);
      setListaCargada(false);
    }
  };

  // El límite lo aplica el servidor; el panel solo lo refleja (spec 029, P17)
  const galeriaLlena = listaCargada && imagenes.length >= MAX_IMAGENES_GALERIA;

  useEffect(() => {
    obtenerImagenes();
  }, []);
  useEffect(() => {
    if (!form.imagen) {
      setVistaPrevia(null);
      return;
    }

    if (typeof form.imagen === "string") {
      setVistaPrevia(getImageUrl(form.imagen));
      return;
    }

    const url = URL.createObjectURL(form.imagen);
    setVistaPrevia(url);

    return () => URL.revokeObjectURL(url);
  }, [form.imagen]);

  const imagenesFiltradas = useMemo(() => {
    const q = normalizar(busqueda.trim());

    return imagenes.filter((img) => {
      const visible = Number(img.visible) === 1 ? "1" : "0";
      const coincideEstado = !filtroVisible || visible === filtroVisible;
      return coincideEstado && normalizar(img.titulo).includes(q);
    });
  }, [imagenes, busqueda, filtroVisible]);

  const cerrarModal = () => {
    setForm({ ...FORM_VACIO });
    setEditando(false);
    setImagenId(null);
    setErrorForm("");
    setMostrarModal(false);
  };

  const abrirNueva = () => {
    if (galeriaLlena) return;
    setForm({ ...FORM_VACIO });
    setEditando(false);
    setImagenId(null);
    setErrorForm("");
    setMostrarModal(true);
  };

  // GET /imagenes ya trae todos los campos, no hace falta pedir por id
  const abrirEditar = (img) => {
    setForm({
      titulo: img.titulo || "",
      visible: Number(img.visible) === 1 ? "1" : "0",
      imagen: img.imagen || null,
    });
    setImagenId(img.id_imagen);
    setEditando(true);
    setErrorForm("");
    setMostrarModal(true);
  };

  const guardarImagen = async () => {
    const hayArchivoNuevo = form.imagen instanceof File;

    const errorImagen = validarImagen(hayArchivoNuevo ? form.imagen : null);

    if (errorImagen) {
      setErrorForm(errorImagen);
      return;
    }

    if (!form.titulo.trim()) {
      setErrorForm("El título es obligatorio");
      return;
    }

    if (!editando && !hayArchivoNuevo) {
      setErrorForm("Selecciona una imagen");
      return;
    }

    setErrorForm("");

    const formData = new FormData();
    formData.append("titulo", form.titulo);
    formData.append("visible", form.visible);

    if (hayArchivoNuevo) {
      formData.append("imagen", form.imagen);
    }

    try {
      setGuardando(true);

      if (editando) {
        await api(`/imagenes/${imagenId}`, "PUT", formData, true);
      } else {
        await api("/imagenes", "POST", formData, true);
      }

      obtenerImagenes();
      cerrarModal();
    } catch (error) {
      console.error(error);
      setErrorForm(error.message || "No se pudo guardar la imagen");
      // Otra persona pudo llenar la galería: se corrige el contador (spec 029)
      obtenerImagenes();
    } finally {
      setGuardando(false);
    }
  };

  

  // Mostrar u ocultar desde la card sin abrir el modal
  const cambiarVisibilidad = async (img) => {
    const formData = new FormData();
    formData.append("visible", Number(img.visible) === 1 ? "0" : "1");

    try {
      await api(`/imagenes/${img.id_imagen}`, "PUT", formData, true);
      obtenerImagenes();
    } catch (error) {
      console.error(error);
      setAviso({
        titulo: "No se pudo cambiar la visibilidad",
        mensaje: "Ocurrió un error al actualizar la imagen. Intenta de nuevo.",
      });
    }
  };

  const confirmarEliminar = async () => {
    const id = imagenAEliminar.id_imagen;
    setImagenAEliminar(null);

    try {
      await api(`/imagenes/${id}`, "DELETE");
      obtenerImagenes();
    } catch (error) {
      console.error(error);
      setAviso({
        titulo: "No se pudo eliminar",
        mensaje: "Ocurrió un error al eliminar la imagen. Intenta de nuevo.",
      });
    }
  };

  return (
    <div className="usuarios-container">
      <EncabezadoModulo
        titulo="Galería"
        descripcion="Administra las imágenes que se muestran en el sitio público de la clínica."
        detalle={
          listaCargada
            ? `${imagenes.length} de ${MAX_IMAGENES_GALERIA} imágenes`
            : undefined
        }
        textoBoton="Nueva imagen"
        onBoton={abrirNueva}
        botonNoDisponible={galeriaLlena}
        idDescripcionBoton={ID_AVISO_LLENA}
      />

      <div role="status" id={ID_AVISO_LLENA}>
        {galeriaLlena && <p className="aviso-panel">{AVISO_LLENA}</p>}
      </div>

      <FiltrosCard
        placeholder="Buscar por título..."
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        filtro={filtroVisible}
        onFiltroChange={setFiltroVisible}
        opcionesFiltro={[
          { value: "1", label: "Visible" },
          { value: "0", label: "Oculta" },
        ]}
      />

      {imagenesFiltradas.length === 0 ? (
        <p className="usuarios-vacio">
          {imagenes.length === 0
            ? "No hay imágenes registradas."
            : "No se encontraron imágenes con esos filtros."}
        </p>
      ) : (
        <div className="imagen-cards">
          {imagenesFiltradas.map((img) => {
            const esVisible = Number(img.visible) === 1;

            return (
              <article
                key={img.id_imagen}
                className={`imagen-card${esVisible ? "" : " oculta"}`}
              >
                <ImagenMiniatura img={img} />

                <div className="imagen-card-top">
                  <h3 className="imagen-titulo">{img.titulo}</h3>
                  <span
                    className={`imagen-estado ${esVisible ? "visible" : "oculta"}`}
                  >
                    {esVisible ? "Visible" : "Oculta"}
                  </span>
                </div>

                <div className="imagen-fecha">
                  <FaRegCalendarAlt />
                  <span>{formatFecha(img.fecha_publicada)}</span>
                </div>

                <div className="imagen-acciones">
                  <button
                    className="btn-card-edit"
                    onClick={() => abrirEditar(img)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-card-icon"
                    title={esVisible ? "Ocultar" : "Mostrar"}
                    aria-label={esVisible ? "Ocultar imagen" : "Mostrar imagen"}
                    onClick={() => cambiarVisibilidad(img)}
                  >
                    {esVisible ? <FaRegEyeSlash /> : <FaRegEye />}
                  </button>
                  <button
                    className="btn-card-delete"
                    aria-label="Eliminar imagen"
                    onClick={() => setImagenAEliminar(img)}
                  >
                    <FaRegTrashAlt />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ModalFormulario
        abierto={mostrarModal}
        titulo={editando ? "Editar imagen" : "Nueva imagen"}
        subtitulo={
          editando
            ? "Actualiza los datos de la imagen."
            : "Agrega una imagen para la galería de la clínica."
        }
        onCerrar={cerrarModal}
        onSubmit={guardarImagen}
        enviando={guardando}
        error={errorForm}
        textoEnviar={editando ? "Guardar cambios" : "Crear imagen"}
        ancho={560}
      >
        <div className="mf-grid">
          <label className="mf-campo mf-ancho">
            <span>Título</span>
            <input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required={!editando}
            />
          </label>

          <label className="mf-campo">
            <span>Estado</span>
            <select
              value={form.visible}
              onChange={(e) => setForm({ ...form, visible: e.target.value })}
            >
              <option value="1">Visible</option>
              <option value="0">Oculta</option>
            </select>
          </label>

          <div className="mf-archivo mf-ancho">
            {vistaPrevia && (
              <img
                className="mf-preview"
                src={vistaPrevia}
                alt="Vista previa"
              />
            )}

            <label className="mf-campo">
              <span>Imagen {editando ? "(opcional)" : ""}</span>
              <input
              type="file"
              accept="image/*"
              onChange={(e) => {
              const archivo = e.target.files[0];

              if (!archivo) return;

              const error = validarImagen(archivo);

              if (error) {
                setErrorForm(error);
                e.target.value = "";
                return;
              }

              setErrorForm("");

              setForm({
                ...form,
                imagen: archivo,
              });
            }}
            />
            </label>
          </div>
        </div>
      </ModalFormulario>

      <ModalConfirmacion
        abierto={!!imagenAEliminar}
        titulo="Eliminar imagen"
        mensaje={
          imagenAEliminar
            ? `¿Seguro que quieres eliminar "${imagenAEliminar.titulo}"? Esta acción no se puede deshacer.`
            : ""
        }
        textoConfirmar="Eliminar"
        peligro
        onConfirmar={confirmarEliminar}
        onCancelar={() => setImagenAEliminar(null)}
      />

      <ModalConfirmacion
        abierto={!!aviso}
        titulo={aviso?.titulo}
        mensaje={aviso?.mensaje}
        textoCancelar={null}
        textoConfirmar="Entendido"
        onConfirmar={() => setAviso(null)}
      />
    </div>
  );
}

export default AdminImagenes;
