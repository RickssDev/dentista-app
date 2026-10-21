import { useEffect, useState, useRef, useMemo } from "react";
import "../../styles/AdminPanel.css";
import { FaRegEnvelope, FaRegTrashAlt } from "react-icons/fa";
import { api, getImageUrl } from "../../services/api";
import FiltrosCard from "../../components/FiltrosCard";
import ModalConfirmacion from "../../components/ModalConfirmacion";
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

  const abrirModalNuevo = () => {
    setForm({ ...FORM_INICIAL });
    setEditando(false);
    setUsuarioId(null);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setForm({ ...FORM_INICIAL });
    setEditando(false);
    setUsuarioId(null);
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

  const crearUsuario = async () => {
  if (!form.id_rol) {
    setErrorForm("Selecciona un rol");
    return;
  }
  try {
    await api("/usuarios", "POST", construirFormData(), true);
    obtenerUsuarios();
    cerrarModal();
  } catch (error) {
    console.error(error);
    setErrorForm(error.message || "No se pudo crear el usuario");
  }
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
      setMostrarModal(true);
    } catch (error) {
      console.error(error);
    }
  };

  const editarUsuario = async () => {
  try {
    await api(`/usuarios/${usuarioId}`, "PUT", construirFormData(), true);
    obtenerUsuarios();
    cerrarModal();
  } catch (error) {
    console.error(error);
    setErrorForm(error.message || "No se pudo actualizar el usuario");
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
      `${u.nombre} ${u.apellido} ${u.email} ${u.rol?.nombre || ""}`
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

      {mostrarModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editando ? "Editar usuario" : "Nuevo usuario"}</h2>
            </div>

            <div className="modal-body">
              {form.imagen && (
                <img
                  src={
                    typeof form.imagen === "string"
                      ? getImageUrl(form.imagen)
                      : URL.createObjectURL(form.imagen)
                  }
                  alt="Vista previa"
                  className="preview-img"
                />
              )}

              <input value={form.nombre} placeholder="Nombre" onChange={cambiarCampo("nombre")} />
              <input value={form.apellido} placeholder="Apellido" onChange={cambiarCampo("apellido")} />
              <input value={form.correo} placeholder="Correo" onChange={cambiarCampo("correo")} />
              <input value={form.password} type="password" placeholder="Password" onChange={cambiarCampo("password")} />
              <input value={form.telefono} placeholder="Teléfono" onChange={cambiarCampo("telefono")} />

              <select value={form.id_rol} onChange={cambiarCampo("id_rol")}>
                <option value="">Selecciona un rol</option>
                <option value="1">Administrador</option>
                <option value="2">Asistente</option>
                <option value="3">Paciente</option>
              </select>

              <select value={form.estado} onChange={cambiarCampo("estado")}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>

              <input
                type="file"
                onChange={(e) => setForm({ ...form, imagen: e.target.files[0] })}
              />
            </div>
                {errorForm && <p className="modal-error">{errorForm}</p>}
            <div className="modal-footer">
              <button className="btn-cancel" onClick={cerrarModal}>
                Cancelar
              </button>
              <button
                className="btn-save"
                onClick={editando ? editarUsuario : crearUsuario}
              >
                {editando ? "Actualizar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
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