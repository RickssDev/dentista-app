import { useEffect, useState } from "react";
import "../../styles/AdminPanel.css";
import { FaEdit, FaTrash } from "react-icons/fa";
import { api } from "../../services/api";

// 3 columnas: Pregunta | Respuesta | Acciones
// (si tu .table-header/.table-row no usan grid, ajusta esto o muévelo a tu CSS)
const COLUMNAS = { gridTemplateColumns: "1.5fr 3fr 0.6fr" };

const RESPUESTA_RECORTADA = {
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis"
};

const FORM_VACIO = { pregunta: "", respuesta: "" };

function AdminFaqs() {
  const [faqs, setFaqs] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [editando, setEditando] = useState(false);
  const [faqId, setFaqId] = useState(null);

  const obtenerFaqs = async () => {
    try {
      const data = await api("/faqs");
      setFaqs(data.payload);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    obtenerFaqs();
  }, []);

  const resetForm = () => {
    setForm(FORM_VACIO);
    setEditando(false);
    setFaqId(null);
    setMostrarModal(false);
  };

  const abrirNuevo = () => {
    resetForm();
    setMostrarModal(true);
  };

  // GET /faqs ya trae pregunta y respuesta, no hace falta pedir por id
  const abrirEditar = (faq) => {
    setForm({
      pregunta: faq.pregunta || "",
      respuesta: faq.respuesta || ""
    });
    setFaqId(faq.id_pregunta);
    setEditando(true);
    setMostrarModal(true);
  };

  const guardarFaq = async () => {
    if (!form.pregunta.trim() || !form.respuesta.trim()) {
      alert("Pregunta y respuesta son obligatorias");
      return;
    }

    try {
      if (editando) {
        await api(`/faqs/${faqId}`, "PUT", form);
      } else {
        await api("/faqs", "POST", form);
      }
      obtenerFaqs();
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  const eliminarFaq = async (id) => {
    if (!confirm("¿Eliminar pregunta?")) return;

    try {
      await api(`/faqs/${id}`, "DELETE");
      obtenerFaqs();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="usuarios-container">

      <div className="usuarios-header">
        <h1>Preguntas frecuentes</h1>

        <button className="btn-add" onClick={abrirNuevo}>
          + Registrar pregunta
        </button>
      </div>

      <div className="usuarios-table">
        <div className="table-header" style={COLUMNAS}>
          <span>Pregunta</span>
          <span>Respuesta</span>
          <span>Acciones</span>
        </div>

        {faqs.map((faq) => (
          <div key={faq.id_pregunta} className="table-row" style={COLUMNAS}>
            <span>{faq.pregunta}</span>
            <span style={RESPUESTA_RECORTADA} title={faq.respuesta}>
              {faq.respuesta}
            </span>

            <div className="acciones">
              <FaEdit onClick={() => abrirEditar(faq)} />
              <FaTrash onClick={() => eliminarFaq(faq.id_pregunta)} />
            </div>
          </div>
        ))}
      </div>

      {mostrarModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <h2>{editando ? "Editar pregunta" : "Nueva pregunta"}</h2>
              <span className="close" onClick={resetForm}>✖</span>
            </div>

            <div className="modal-body">
              <input
                value={form.pregunta}
                placeholder="Pregunta"
                onChange={(e) => setForm({ ...form, pregunta: e.target.value })}
              />

              <textarea
                value={form.respuesta}
                placeholder="Respuesta"
                rows={5}
                onChange={(e) => setForm({ ...form, respuesta: e.target.value })}
              />
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={resetForm}>
                Cancelar
              </button>

              <button className="btn-save" onClick={guardarFaq}>
                {editando ? "Actualizar" : "Crear"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default AdminFaqs;