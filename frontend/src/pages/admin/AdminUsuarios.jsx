import { useEffect, useState, useRef, useMemo } from "react";
import "../../styles/adminpanel.css";
import { FaRegEnvelope, FaRegTrashAlt } from "react-icons/fa";
import { api, getImageUrl } from "../../services/api";
import FiltrosCard from "../../components/FiltrosCard";
import ModalConfirmacion from "../../components/ModalConfirmacion";
import ModalFormulario from "../../components/ModalFormulario";
import EncabezadoModulo from "../../components/EncabezadoModulo";

const FORM_INICIAL = {
  nombre: "",
  apellido: "",
  correo: "",
  password: "",
  telefono: "",
  estado: "activo",
  id_rol: "",
  imagen: null,
};

const normalizar = (texto = "") =>
  texto
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/* Foto del usuario; si no hay (o falla la carga) muestra la inicial */
function UsuarioAvatar({ user }) {
  const [falloImagen, setFalloImagen] = useState(false);
  const inicial = (user.nombre || "?").charAt(0).toUpperCase();

  return (
    <div className={`usuario-avatar rol-${user.rol?.id || 1}`}>
      {user.imagen && !falloImagen ? (
        <img
          src={getImageUrl(user.imagen)}
          alt={user.nombre}
          onError={() => setFalloImagen(true)}
        />
      ) : (
        inicial
      )}
    </div>
  );
}

function AdminUsuarios({
  modoModal = false,
  solicitudAbrirModal = 0,
  onCerrarModalDashboard,
}) {
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editando, setEditando] = useState(false);
  const [usuarioId, setUsuarioId] = useState(null);
  const solicitudProcesada = useRef(0);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [errorForm, setErrorForm] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [vistaPrevia, setVistaPrevia] = useState(null);

  const obtenerUsuarios = async () => {
    try {
      const data = await api("/usuarios");
      setUsuarios(data.payload);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!modoModal) obtenerUsuarios();
  }, [modoModal]);

  // Apertura del modal desde el dashboard
  useEffect(() => {
    if (
      solicitudAbrirModal > 0 &&
      solicitudAbrirModal !== solicitudProcesada.current
    ) {
      solicitudProcesada.current = solicitudAbrirModal;
      abrirModalNuevo();
    }
  }, [solicitudAbrirModal]);

  // Vista previa de la imagen: URL del servidor o archivo recién elegido.
  // El objeto temporal se libera al cambiar de imagen o cerrar.
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

  const abrirModalNuevo = () => {
    setForm({ ...FORM_INICIAL });
    setEditando(false);
    setUsuarioId(null);
    setErrorForm("");
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setForm({ ...FORM_INICIAL });
    setEditando(false);
    setUsuarioId(null);
    setErrorForm("");
    setMostrarModal(false);
    if (modoModal) onCerrarModalDashboard?.();
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

  const obtenerUsuarioPorId = async (id) => {
    try {
      const data = await api(`/usuarios/${id}`);
      const u = data.payload;

      setForm({
        nombre: u.nombre || "",
        apellido: u.apellido || "",
        correo: u.email || "",
        password: "",
        telefono: u.telefono || "",
        estado: u.estado || "activo",
        id_rol: String(u.rol?.id || ""),
        imagen: u.imagen || null,
      });

      setUsuarioId(id);
      setEditando(true);
      setErrorForm("");
      setMostrarModal(true);
    } catch (error) {
      console.error(error);
    }
  };

  // Crear y editar comparten el mismo envío
  const guardar = async () => {
    setErrorForm("");

    if (!editando && !form.id_rol) {
      setErrorForm("Selecciona un rol");
      return;
    }

    try {
      setGuardando(true);

      if (editando) {
        await api(`/usuarios/${usuarioId}`, "PUT", construirFormData(), true);
      } else {
        await api("/usuarios", "POST", construirFormData(), true);
      }

      obtenerUsuarios();
      cerrarModal();
    } catch (error) {
      console.error(error);
      setErrorForm(
        error.message ||
          (editando
            ? "No se pudo actualizar el usuario"
            : "No se pudo crear el usuario"),
      );
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    const id = usuarioAEliminar.id;
    setUsuarioAEliminar(null);

    try {
      const respuesta = await api(`/usuarios/${id}`, "DELETE");
      obtenerUsuarios();

      if (respuesta?.payload?.desactivado) {
        setAviso({
          titulo: "Usuario desactivado",
          mensaje:
            "Tenía información asociada (perfil de paciente, citas o historial), así que se desactivó en lugar de eliminarse.",
        });
      }
    } catch (error) {
      console.error(error);
      setAviso({
        titulo: "No se pudo eliminar",
        mensaje: "Ocurrió un error al eliminar el usuario. Intenta de nuevo.",
      });
    }
  };

  const cambiarCampo = (campo) => (e) =>
    setForm({ ...form, [campo]: e.target.value });

  const usuariosFiltrados = useMemo(() => {
    const q = normalizar(busqueda.trim());

    return usuarios.filter((u) => {
      const coincideEstado = !filtroEstado || u.estado === filtroEstado;
      const texto = normalizar(
        `${u.nombre} ${u.apellido} ${u.email} ${u.rol?.nombre || ""}`,
      );
      return coincideEstado && texto.includes(q);
    });
  }, [usuarios, busqueda, filtroEstado]);

  return (
    <div className="usuarios-container">
      {!modoModal && (
        <>
          <EncabezadoModulo
            titulo="Usuarios"
            descripcion="Administra las cuentas de acceso y los roles del sistema."
            textoBoton="Nuevo usuario"
            onBoton={abrirModalNuevo}
          />

          <FiltrosCard
            placeholder="Buscar usuario..."
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            filtro={filtroEstado}
            onFiltroChange={setFiltroEstado}
            opcionesFiltro={[
              { value: "activo", label: "Activo" },
              { value: "inactivo", label: "Inactivo" },
            ]}
          />

          {usuariosFiltrados.length === 0 ? (
            <p className="usuarios-vacio">
              {usuarios.length === 0
                ? "No hay usuarios registrados."
                : "No se encontraron usuarios con esos filtros."}
            </p>
          ) : (
            <div className="usuarios-grid">
              {usuariosFiltrados.map((user) => (
                <article key={user.id} className="usuario-card">
                  <div className="usuario-card-top">
                    <UsuarioAvatar user={user} />

                    <div className="usuario-info">
                      <h3 className="usuario-nombre">
                        {user.nombre} {user.apellido}
                      </h3>
                      <p className="usuario-rol">{user.rol?.nombre}</p>
                    </div>

                    <span className={`usuario-estado ${user.estado}`}>
                      {user.estado}
                    </span>
                  </div>

                  <div className="usuario-email">
                    <FaRegEnvelope />
                    <span title={user.email}>{user.email}</span>
                  </div>

                  <div className="usuario-card-actions">
                    <button
                      className="btn-card-edit"
                      onClick={() => obtenerUsuarioPorId(user.id)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn-card-delete"
                      aria-label="Eliminar usuario"
                      onClick={() => setUsuarioAEliminar(user)}
                    >
                      <FaRegTrashAlt />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* Crear / editar */}
      <ModalFormulario
        abierto={mostrarModal}
        titulo={editando ? "Editar usuario" : "Nuevo usuario"}
        subtitulo={
          editando
            ? "Actualiza los datos de la cuenta."
            : "Crea una cuenta de acceso al sistema."
        }
        onCerrar={cerrarModal}
        onSubmit={guardar}
        enviando={guardando}
        error={errorForm}
        textoEnviar={editando ? "Guardar cambios" : "Crear usuario"}
        ancho={560}
      >
        <div className="mf-grid">
          <label className="mf-campo">
            <span>Nombre</span>
            <input
              value={form.nombre}
              onChange={cambiarCampo("nombre")}
              required
            />
          </label>

          <label className="mf-campo">
            <span>Apellido</span>
            <input
              value={form.apellido}
              onChange={cambiarCampo("apellido")}
              required
            />
          </label>

          <label className="mf-campo">
            <span>Correo</span>
            <input
              type="email"
              value={form.correo}
              onChange={cambiarCampo("correo")}
              required
            />
          </label>

          <label className="mf-campo">
            <span>
              {editando ? "Nueva contraseña (opcional)" : "Contraseña"}
            </span>
            <input
              type="password"
              value={form.password}
              onChange={cambiarCampo("password")}
              required={!editando}
              autoComplete="new-password"
            />
          </label>

          <label className="mf-campo">
            <span>Teléfono</span>
            <input
              type="tel"
              value={form.telefono}
              onChange={cambiarCampo("telefono")}
            />
          </label>

          <label className="mf-campo">
            <span>Rol</span>
            <select
              value={form.id_rol}
              onChange={cambiarCampo("id_rol")}
              required={!editando}
            >
              <option value="">Selecciona un rol</option>
              <option value="1">Administrador</option>
              <option value="2">Asistente</option>
              <option value="3">Paciente</option>
            </select>
          </label>

          <label className="mf-campo">
            <span>Estado</span>
            <select value={form.estado} onChange={cambiarCampo("estado")}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
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
              <span>Imagen (opcional)</span>
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
        abierto={!!usuarioAEliminar}
        titulo="Eliminar usuario"
        mensaje={
          usuarioAEliminar
            ? `¿Seguro que quieres eliminar a ${usuarioAEliminar.nombre} ${usuarioAEliminar.apellido}? Esta acción no se puede deshacer.`
            : ""
        }
        textoConfirmar="Eliminar"
        peligro
        onConfirmar={confirmarEliminar}
        onCancelar={() => setUsuarioAEliminar(null)}
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

export default AdminUsuarios;
