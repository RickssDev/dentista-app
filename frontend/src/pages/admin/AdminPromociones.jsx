import { useEffect, useMemo, useState } from "react";
import "../../styles/adminpanel.css";
import {
  FaTooth,
  FaRegCalendarAlt,
  FaRegImage,
  FaRegTrashAlt,
  FaRegEye,
  FaRegEyeSlash,
} from "react-icons/fa";
import { api, getImageUrl } from "../../services/api";
import { normalizar } from "../../api/normalize";
import EncabezadoModulo from "../../components/EncabezadoModulo";
import FiltrosCard from "../../components/FiltrosCard";
import ModalConfirmacion from "../../components/ModalConfirmacion";
import ModalFormulario from "../../components/ModalFormulario";

const FORM_INICIAL = {
  nombre_promocion: "",
  descripcion: "",
  id_servicio: "",
  fecha_inicio: "",
  fecha_fin: "",
  estado: "activo",
  imagen: null,
};

// "2026-10-20T00:00:00.000Z" → "20/10/2026" (sin pasar por zona horaria)
const formatFecha = (fecha) =>
  fecha ? fecha.slice(0, 10).split("-").reverse().join("/") : "";

const obtenerFechaHoy = () => {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, "0");
  const day = String(hoy.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Estado que se muestra: "vencida" si la fecha de fin ya pasó
const estadoEfectivo = (promo, hoy) => {
  const fin = promo.fecha_fin?.slice(0, 10);
  if (fin && fin < hoy) return "vencida";
  return promo.estado;
};

/* Imagen de la promoción; si no hay (o falla la carga) muestra un icono */
function PromoImagen({ promo }) {
  const [falloImagen, setFalloImagen] = useState(false);

  return (
    <div className="promo-img-wrap">
      {promo.imagen && !falloImagen ? (
        <img
          src={getImageUrl(promo.imagen)}
          alt={promo.nombre_promocion}
          onError={() => setFalloImagen(true)}
        />
      ) : (
        <FaRegImage />
      )}
    </div>
  );
}

function AdminPromociones() {
  const [promociones, setPromociones] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editando, setEditando] = useState(false);
  const [promoId, setPromoId] = useState(null);
  const [promoAEliminar, setPromoAEliminar] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [errorForm, setErrorForm] = useState("");
  const hoy = obtenerFechaHoy();
  const [guardando, setGuardando] = useState(false);
  const [vistaPrevia, setVistaPrevia] = useState(null);

  const obtenerPromociones = async () => {
    try {
      const data = await api("/promociones");
      setPromociones(data.payload);
    } catch (error) {
      console.error(error);
    }
  };

  const obtenerServicios = async () => {
    try {
      const data = await api("/servicios");
      setServicios(data.payload);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    obtenerPromociones();
    obtenerServicios();
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

  const promocionesFiltradas = useMemo(() => {
    const q = normalizar(busqueda.trim());

    return promociones.filter((p) => {
      const coincideEstado =
        !filtroEstado || estadoEfectivo(p, hoy) === filtroEstado;
      const texto = normalizar(`${p.nombre_promocion} ${p.nombre_servicio}`);
      return coincideEstado && texto.includes(q);
    });
  }, [promociones, busqueda, filtroEstado, hoy]);

  // Solo servicios activos (más el que ya tenga la promoción que se edita)
  const serviciosDisponibles = servicios.filter(
    (s) => s.estado === "activo" || String(s.id) === form.id_servicio,
  );

  const abrirModalNuevo = () => {
    setForm({ ...FORM_INICIAL });
    setEditando(false);
    setPromoId(null);
    setErrorForm("");
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setForm({ ...FORM_INICIAL });
    setEditando(false);
    setPromoId(null);
    setErrorForm("");
    setMostrarModal(false);
  };

  // Solo envía campos con valor; la imagen solo si es un archivo nuevo
  const construirFormData = () => {
    const formData = new FormData();
    Object.keys(form).forEach((key) => {
      const valor = form[key];
      if (!valor) return;
      if (key === "imagen" && typeof valor === "string") return;
      formData.append(key, valor);
    });
    return formData;
  };

  const validar = () => {
    if (
      !editando &&
      (!form.nombre_promocion ||
        !form.descripcion ||
        !form.id_servicio ||
        !form.fecha_inicio ||
        !form.fecha_fin)
    ) {
      return "Completa todos los campos";
    }
    if (
      form.fecha_inicio &&
      form.fecha_fin &&
      form.fecha_fin < form.fecha_inicio
    ) {
      return "La fecha de fin no puede ser anterior a la de inicio";
    }
    return "";
  };

  const guardarPromocion = async () => {
    const mensajeError = validar();
    if (mensajeError) {
      setErrorForm(mensajeError);
      return;
    }

    setErrorForm("");

    try {
      setGuardando(true);

      if (editando) {
        await api(`/promociones/${promoId}`, "PUT", construirFormData(), true);
      } else {
        await api("/promociones", "POST", construirFormData(), true);
      }

      obtenerPromociones();
      cerrarModal();
    } catch (error) {
      console.error(error);
      setErrorForm(error.message || "No se pudo guardar la promoción");
    } finally {
      setGuardando(false);
    }
  };

  const obtenerPromocionPorId = async (id) => {
    try {
      const data = await api(`/promociones/${id}`);
      const p = data.payload;

      setForm({
        nombre_promocion: p.nombre_promocion || "",
        descripcion: p.descripcion || "",
        id_servicio: String(p.id_servicio || ""),
        fecha_inicio: p.fecha_inicio?.slice(0, 10) || "",
        fecha_fin: p.fecha_fin?.slice(0, 10) || "",
        estado: p.estado || "activo",
        imagen: p.imagen || null,
      });

      setPromoId(id);
      setEditando(true);
      setErrorForm("");
      setMostrarModal(true);
    } catch (error) {
      console.error(error);
    }
  };

  const confirmarEliminar = async () => {
    const id = promoAEliminar.id_promocion;
    setPromoAEliminar(null);

    try {
      await api(`/promociones/${id}`, "DELETE");
      obtenerPromociones();
    } catch (error) {
      console.error(error);
      setAviso({
        titulo: "No se pudo eliminar",
        mensaje: "Ocurrió un error al eliminar la promoción. Intenta de nuevo.",
      });
    }
  };

  const cambiarEstado = async (promo) => {
    const formData = new FormData();
    formData.append(
      "estado",
      promo.estado === "activo" ? "inactivo" : "activo",
    );

    try {
      await api(`/promociones/${promo.id_promocion}`, "PUT", formData, true);
      obtenerPromociones();
    } catch (error) {
      console.error(error);
      setAviso({
        titulo: "No se pudo cambiar el estado",
        mensaje:
          "Ocurrió un error al actualizar la promoción. Intenta de nuevo.",
      });
    }
  };

  const cambiarCampo = (campo) => (e) =>
    setForm({ ...form, [campo]: e.target.value });

  return (
    <div className="usuarios-container">
      <EncabezadoModulo
        titulo="Promociones"
        descripcion="Administra las promociones y ofertas de los servicios de la clínica."
        textoBoton="Nueva promoción"
        onBoton={abrirModalNuevo}
      />

      <FiltrosCard
        placeholder="Buscar por título o servicio..."
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        filtro={filtroEstado}
        onFiltroChange={setFiltroEstado}
        opcionesFiltro={[
          { value: "activo", label: "Activo" },
          { value: "inactivo", label: "Inactivo" },
          { value: "vencida", label: "Vencida" },
        ]}
      />

      {promocionesFiltradas.length === 0 ? (
        <p className="usuarios-vacio">
          {promociones.length === 0
            ? "No hay promociones registradas."
            : "No se encontraron promociones con esos filtros."}
        </p>
      ) : (
        <div className="promo-cards">
          {promocionesFiltradas.map((promo) => {
            const estado = estadoEfectivo(promo, hoy);
            const esVencida = estado === "vencida";
            const guardadaActiva = promo.estado === "activo";

            return (
              <article
                key={promo.id_promocion}
                className={`promo-card${estado === "activo" ? "" : " atenuada"}`}
              >
                <PromoImagen promo={promo} />

                <div className="promo-card-top">
                  <h3 className="promo-nombre">{promo.nombre_promocion}</h3>
                  <span className={`promo-estado ${estado}`}>{estado}</span>
                </div>

                <p className="promo-descripcion">{promo.descripcion}</p>

                <div className="promo-datos">
                  <div className="promo-dato">
                    <FaTooth />
                    <span title={promo.nombre_servicio}>
                      {promo.nombre_servicio}
                    </span>
                  </div>
                  <div className="promo-dato">
                    <FaRegCalendarAlt />
                    <span>
                      {promo.fecha_inicio && promo.fecha_fin
                        ? `${formatFecha(promo.fecha_inicio)} – ${formatFecha(promo.fecha_fin)}`
                        : "Sin vigencia definida"}
                    </span>
                  </div>
                </div>

                <div className="promo-acciones">
                  <button
                    className="btn-card-edit"
                    onClick={() => obtenerPromocionPorId(promo.id_promocion)}
                  >
                    Editar
                  </button>

                  <button
                    className="btn-card-icon"
                    disabled={esVencida}
                    title={
                      esVencida
                        ? "Vencida: cambia la fecha de fin para reactivarla"
                        : guardadaActiva
                          ? "Desactivar"
                          : "Activar"
                    }
                    aria-label={
                      guardadaActiva
                        ? "Desactivar promoción"
                        : "Activar promoción"
                    }
                    onClick={() => cambiarEstado(promo)}
                  >
                    {guardadaActiva ? <FaRegEyeSlash /> : <FaRegEye />}
                  </button>

                  <button
                    className="btn-card-delete"
                    aria-label="Eliminar promoción"
                    onClick={() => setPromoAEliminar(promo)}
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
        titulo={editando ? "Editar promoción" : "Nueva promoción"}
        subtitulo={
          editando
            ? "Actualiza los datos de la promoción."
            : "Crea una oferta para uno de tus servicios."
        }
        onCerrar={cerrarModal}
        onSubmit={guardarPromocion}
        enviando={guardando}
        error={errorForm}
        textoEnviar={editando ? "Guardar cambios" : "Crear promoción"}
        ancho={560}
      >
        <div className="mf-grid">
          <label className="mf-campo mf-ancho">
            <span>Título</span>
            <input
              value={form.nombre_promocion}
              onChange={cambiarCampo("nombre_promocion")}
              required={!editando}
            />
          </label>

          <label className="mf-campo mf-ancho">
            <span>Descripción</span>
            <textarea
              rows={3}
              value={form.descripcion}
              onChange={cambiarCampo("descripcion")}
              required={!editando}
            />
          </label>

          <label className="mf-campo">
            <span>Servicio</span>
            <select
              value={form.id_servicio}
              onChange={cambiarCampo("id_servicio")}
              required={!editando}
            >
              <option value="">Selecciona servicio</option>
              {serviciosDisponibles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="mf-campo">
            <span>Estado</span>
            <select value={form.estado} onChange={cambiarCampo("estado")}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </label>

          <label className="mf-campo">
            <span>Fecha de inicio</span>
            <input
              type="date"
              value={form.fecha_inicio}
              onChange={cambiarCampo("fecha_inicio")}
              required={!editando}
            />
          </label>

          <label className="mf-campo">
            <span>Fecha de fin</span>
            <input
              type="date"
              min={form.fecha_inicio || undefined}
              value={form.fecha_fin}
              onChange={cambiarCampo("fecha_fin")}
              required={!editando}
            />
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
              <span>Imagen </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setForm({ ...form, imagen: e.target.files[0] || form.imagen })
                }
              />
            </label>
          </div>
        </div>
      </ModalFormulario>

      <ModalConfirmacion
        abierto={!!promoAEliminar}
        titulo="Eliminar promoción"
        mensaje={
          promoAEliminar
            ? `¿Seguro que quieres eliminar "${promoAEliminar.nombre_promocion}"? Esta acción no se puede deshacer.`
            : ""
        }
        textoConfirmar="Eliminar"
        peligro
        onConfirmar={confirmarEliminar}
        onCancelar={() => setPromoAEliminar(null)}
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

export default AdminPromociones;
