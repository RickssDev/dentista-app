import "../../styles/AdminPanel.css";
import { FaEdit, FaTrash } from "react-icons/fa";

function AdminUsuarios() {

  const usuarios = [
    {
      id: 1,
      nombre: "Carlos Lopez",
      rol: "Administrador",
      email: "carlos.lopez@gmail.com",
      estado: "Activo"
    },
    {
      id: 2,
      nombre: "Ana Perez",
      rol: "Recepcionista",
      email: "ana.perez@gmail.com",
      estado: "Activo"
    },
    {
      id: 3,
      nombre: "Maria Garcia",
      rol: "Odontologa",
      email: "mariagarcia@example.com",
      estado: "Inactivo"
    },
    {
      id: 4,
      nombre: "Luis Martinez",
      rol: "Odontologo",
      email: "luis.martinez@example.com",
      estado: "Activo"
    }
  ];

  return (
    <div className="usuarios-container">

      {/* HEADER */}
      <div className="usuarios-header">
        <h1>Gestión de usuarios</h1>

        <button className="btn-add">
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

            {/* FOTO */}
            <div className="avatar"></div>

            <span>{user.nombre}</span>
            <span>{user.rol}</span>
            <span>{user.email}</span>

            {/* ESTADO */}
            <span className={`estado ${user.estado === "Activo" ? "activo" : "inactivo"}`}>
              {user.estado}
            </span>

            {/* ACCIONES */}
            <div className="acciones">
              <FaEdit className="edit" />
              <FaTrash className="delete" />
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

export default AdminUsuarios;