import { useEffect, useState } from "react";
import "../../styles/AdminPanel.css";
import { FaSearch, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { api } from "../../services/api";

const BASE_IMG_URL = "http://10.0.5.102:3000";

function AdminPromociones() {
  const [promociones, setPromociones] = useState([]);
  const [servicios, setServicios] = useState([]); // 🔥 NUEVO
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);

  const [form, setForm] = useState({
    nombre_promocion: "",
    descripcion: "",
    id_servicio: "",
    fecha_inicio: "",
    fecha_fin: "",
    estado: "activo",
    imagen: null
  });

  const [editando, setEditando] = useState(false);
  const [promoId, setPromoId] = useState(null);

  const getImageUrl = (img) => {
    if (!img) return "https://via.placeholder.com/60";
    if (img.startsWith("http")) return img;
    return `${BASE_IMG_URL}/${img.replace(/^\/+/, "")}`;
  };

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

  const crearPromocion = async () => {
    if (!form.descripcion || !form.id_servicio) {
      alert("Completa todos los campos");
      return;
    }

    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      if (form[key]) formData.append(key, form[key]);
    });

    try {
      await api("/promociones", "POST", formData, true);
      obtenerPromociones();
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  const obtenerPromocionPorId = async (id) => {
    try {
      const data = await api(`/promociones/${id}`);
      const p = data.payload;

      setForm({
        nombre_promocion: p.nombre_promocion || "",
        descripcion: p.descripcion || "",
        id_servicio: String(p.id_servicio || ""), // 🔥 importante
        fecha_inicio: p.fecha_inicio?.slice(0, 10) || "",
        fecha_fin: p.fecha_fin?.slice(0, 10) || "",
        estado: p.estado || "activo",
        imagen: p.imagen || null
      });

      setPromoId(id);
      setEditando(true);
      setMostrarModal(true);

    } catch (error) {
      console.error(error);
    }
  };

  
  const editarPromocion = async () => {
    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      if (form[key]) formData.append(key, form[key]);
    });

    try {
      await api(`/promociones/${promoId}`, "PUT", formData, true);
      obtenerPromociones();
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  const eliminarPromocion = async (id) => {
    if (!confirm("¿Eliminar promoción?")) return;

    try {
      await api(`/promociones/${id}`, "DELETE");
      obtenerPromociones();
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setForm({
      nombre_promocion: "",
      descripcion: "",
      id_servicio: "",
      fecha_inicio: "",
      fecha_fin: "",
      estado: "activo",
      imagen: null
    });
    setEditando(false);
    setPromoId(null);
    setMostrarModal(false);
  };

  const promocionesFiltradas = promociones.filter((p) =>
    (p.nombre_promocion || "")
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  return (
    <div className="servicios-container">

      <div className="topbar">
        <h2>Promociones</h2>

        <button
          className="btn-add"
          onClick={() => {
            resetForm();
            setMostrarModal(true);
          }}
        >
          <FaPlus /> Nueva Promoción
        </button>
      </div>

      <div className="search-bar">
        <FaSearch />
        <input
          type="text"
          placeholder="Buscar por título"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="servicios-table">
        <div className="servicios-grid table-header">
          <span>Foto</span>
          <span>Título</span>
          <span>Descripción</span>
          <span>Servicio</span>
          <span>Vigencia</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {promocionesFiltradas?.map((promo) => (
          <div key={promo.id_promocion} className="servicios-grid table-row">

            <img src={getImageUrl(promo.imagen)} className="servicio-img" />

            <span>{promo.nombre_promocion}</span>
            <span>{promo.descripcion}</span>
            <span>{promo.nombre_servicio}</span>

            <span>
              {new Date(promo.fecha_inicio).toLocaleDateString()} -
              {new Date(promo.fecha_fin).toLocaleDateString()}
            </span>

            <span className={`estado ${promo.estado}`}>
              {promo.estado}
            </span>

            <div className="acciones">
              <FaEdit onClick={() => obtenerPromocionPorId(promo.id_promocion)} />
              <FaTrash onClick={() => eliminarPromocion(promo.id_promocion)} />
            </div>
          </div>
        ))}
      </div>

      {mostrarModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <h2>{editando ? "Editar promoción" : "Nueva promoción"}</h2>
            </div>

            <div className="modal-body">

              <input
                value={form.nombre_promocion}
                placeholder="Título"
                onChange={(e)=>setForm({...form,nombre_promocion:e.target.value})}
              />

              <input
                value={form.descripcion}
                placeholder="Descripción"
                onChange={(e)=>setForm({...form,descripcion:e.target.value})}
              />

              <select
                value={form.id_servicio}
                onChange={(e)=>setForm({...form,id_servicio:e.target.value})}
              >
                <option value="">Selecciona servicio</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={form.fecha_inicio}
                onChange={(e)=>setForm({...form,fecha_inicio:e.target.value})}
              />

              <input
                type="date"
                value={form.fecha_fin}
                onChange={(e)=>setForm({...form,fecha_fin:e.target.value})}
              />

              <select
                value={form.estado}
                onChange={(e)=>setForm({...form,estado:e.target.value})}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>

              <input
                type="file"
                onChange={(e)=>setForm({...form,imagen:e.target.files[0]})}
              />

            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={resetForm}>
                Cancelar
              </button>

              <button
                className="btn-save"
                onClick={editando ? editarPromocion : crearPromocion}
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

export default AdminPromociones;