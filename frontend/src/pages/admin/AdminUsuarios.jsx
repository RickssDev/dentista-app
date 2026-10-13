import { useEffect, useState, useRef } from "react";
import "../../styles/AdminPanel.css";
import { FaEdit, FaTrash } from "react-icons/fa";
import { api, getImageUrl } from "../../services/api";

function AdminUsuarios({
  modoModal = false,
  solicitudAbrirModal = 0,
  onCerrarModalDashboard,
}) {
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    password: "",
    telefono: "",
    estado: "activo",
    id_rol: "",
    imagen: null
  });

  const [editando, setEditando] = useState(false);
  const [usuarioId, setUsuarioId] = useState(null);
  const solicitudProcesada = useRef(0);

  const obtenerUsuarios = async () => {
    try {
      const data = await api("/usuarios");
      setUsuarios(data.payload);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
  if (!modoModal) {
    obtenerUsuarios();
  }
}, [modoModal]);


useEffect(() => {
  if (
    solicitudAbrirModal > 0 &&
    solicitudAbrirModal !== solicitudProcesada.current
  ) {
    solicitudProcesada.current = solicitudAbrirModal;

    setForm({
      nombre: "",
      apellido: "",
      correo: "",
      password: "",
      telefono: "",
      estado: "activo",
      id_rol: "",
      imagen: null,
    });

    setEditando(false);
    setUsuarioId(null);
    setMostrarModal(true);
  }
}, [solicitudAbrirModal]);


  // ➕ CREAR
  const crearUsuario = async () => {
    if (!form.id_rol) {
      alert("Selecciona un rol");
      return;
    }

    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      if (form[key]) formData.append(key, form[key]);
    });

    try {
      await api("/usuarios", "POST", formData, true);
      obtenerUsuarios();
      resetForm();
    } catch (error) {
      console.error(error);
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
        imagen: u.imagen || null
      });

      setUsuarioId(id);
      setEditando(true);
      setMostrarModal(true);

    } catch (error) {
      console.error(error);
    }
  };

  const editarUsuario = async () => {
    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      if (form[key]) formData.append(key, form[key]);
    });

    try {
      await api(`/usuarios/${usuarioId}`, "PUT", formData, true);
      obtenerUsuarios();
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  const eliminarUsuario = async (id) => {
    if (!confirm("¿Eliminar usuario?")) return;

    try {
      await api(`/usuarios/${id}`, "DELETE");
      obtenerUsuarios();
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setForm({
      nombre: "",
      apellido: "",
      correo: "",
      password: "",
      telefono: "",
      estado: "activo",
      id_rol: "",
      imagen: null
    });
  setEditando(false);
  setUsuarioId(null);
  setMostrarModal(false);

  if (avisarCierre) {
    onCerrarModalDashboard?.();
  }
};

  return (
    <div className="usuarios-container">
{!modoModal && (
  <>
      <div className="usuarios-header">
        <h1>Gestión de usuarios</h1>

        <button
          className="btn-add"
          onClick={() => {
            resetForm(true);
            setMostrarModal(true);
          }}
        >
          + Registrar usuarios
        </button>
      </div>

      {/* TABLA */}
      <div className="usuarios-table">
        <div className="table-header">
          <span>Foto</span>
          <span>Nombre</span>
          <span>Rol</span>
          <span>Email</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {usuarios.map((user) => (
          <div key={user.id} className="table-row">

            <img
            src={getImageUrl(user.imagen, "https://via.placeholder.com/40")}
            alt="avatar"
            className="avatar"
            />

            <span>{user.nombre} {user.apellido}</span>
            <span>{user.rol?.nombre}</span>
            <span>{user.email}</span>

            <span className={`estado ${user.estado}`}>
              {user.estado}
            </span>

            <div className="acciones">
              <FaEdit onClick={() => obtenerUsuarioPorId(user.id)} />
              <FaTrash onClick={() => eliminarUsuario(user.id)} />
            </div>
          </div>
        ))}
      </div>
      </>
)}
      {mostrarModal && (
        <div className="modal-overlay" onClick={() => resetForm(true)}>
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
                  className="preview-img"
                />
              )}

              <input value={form.nombre} placeholder="Nombre"
                onChange={(e)=>setForm({...form,nombre:e.target.value})}/>

              <input value={form.apellido} placeholder="Apellido"
                onChange={(e)=>setForm({...form,apellido:e.target.value})}/>

              <input value={form.correo} placeholder="Correo"
                onChange={(e)=>setForm({...form,correo:e.target.value})}/>

              <input value={form.password} type="password" placeholder="Password"
                onChange={(e)=>setForm({...form,password:e.target.value})}/>

              <input value={form.telefono} placeholder="Teléfono"
                onChange={(e)=>setForm({...form,telefono:e.target.value})}/>

              <select
                value={form.id_rol}
                onChange={(e)=>setForm({...form,id_rol:e.target.value})}
              >
                <option value="">Selecciona un rol</option>
                <option value="1">Administrador</option>
                <option value="2">Asistente</option>
                <option value="3">Paciente</option>
              </select>

              <select value={form.estado}
                onChange={(e)=>setForm({...form,estado:e.target.value})}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>

              <input
                type="file"
                onChange={(e)=>setForm({...form,imagen:e.target.files[0]})}
              />

            </div>

            <div className="modal-footer">
              <button
              className="btn-cancel"
              onClick={() => resetForm(true)}
            >
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

    </div>
  );
}

export default AdminUsuarios;