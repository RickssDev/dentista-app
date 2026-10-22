import { useEffect, useMemo, useState } from "react";
import "../../styles/AdminPanel.css";
import { FaRegTrashAlt } from "react-icons/fa";
import { api } from "../../services/api";
import { normalizar } from "../../api/normalize";
import EncabezadoModulo from "../../components/EncabezadoModulo";
import FiltrosCard from "../../components/FiltrosCard";
import ModalConfirmacion from "../../components/ModalConfirmacion";
import ModalFormulario from "../../components/ModalFormulario";

const FORM_VACIO = { pregunta: "", respuesta: "" };

function AdminFaqs() {
  const [faqs, setFaqs] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [editando, setEditando] = useState(false);
  const [faqId, setFaqId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [faqAEliminar, setFaqAEliminar] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [errorForm, setErrorForm] = useState("");
  const [guardando, setGuardando] = useState(false);

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

  const faqsFiltradas = useMemo(() => {
    const q = normalizar(busqueda.trim());

    return faqs.filter((faq) =>
      normalizar(`${faq.pregunta} ${faq.respuesta}`).includes(q)
    );
  }, [faqs, busqueda]);

  const cerrarModal = () => {
    setForm({ ...FORM_VACIO });
    setEditando(false);
    setFaqId(null);
    setErrorForm("");
    setMostrarModal(false);
  };

  const abrirNuevo = () => {
    setForm({ ...FORM_VACIO });
    setEditando(false);
    setFaqId(null);
    setErrorForm("");
    setMostrarModal(true);
  };

  // GET /faqs ya trae pregunta y respuesta, no hace falta pedir por id
  const abrirEditar = (faq) => {
    setForm({
      pregunta: faq.pregunta || "",
      respuesta: faq.respuesta || "",
    });
    setFaqId(faq.id_pregunta);
    setEditando(true);
    setErrorForm("");
    setMostrarModal(true);
  };

  const guardarFaq = async () => {
  if (!form.pregunta.trim() || !form.respuesta.trim()) {
    setErrorForm("Pregunta y respuesta son obligatorias");
    return;
  }

  setErrorForm("");

  try {
    setGuardando(true);

    if (editando) {
      await api(`/faqs/${faqId}`, "PUT", form);
    } else {
      await api("/faqs", "POST", form);
    }

    obtenerFaqs();
    cerrarModal();
  } catch (error) {
    console.error(error);
    setErrorForm(error.message || "No se pudo guardar la pregunta");
  } finally {
    setGuardando(false);
  }
};

  const confirmarEliminar = async () => {
    const id = faqAEliminar.id_pregunta;
    setFaqAEliminar(null);

    try {
      await api(`/faqs/${id}`, "DELETE");
      obtenerFaqs();
    } catch (error) {
      console.error(error);
      setAviso({
        titulo: "No se pudo eliminar",
        mensaje: "Ocurrió un error al eliminar la pregunta. Intenta de nuevo.",
      });
    }
  };

  return (
    <div className="usuarios-container">
      <EncabezadoModulo
        titulo="Preguntas frecuentes"
        descripcion="Administra las preguntas y respuestas que se muestran a los pacientes."
        textoBoton="Nueva pregunta"
        onBoton={abrirNuevo}
      />


      {faqsFiltradas.length === 0 ? (
        <p className="usuarios-vacio">
          {faqs.length === 0
            ? "No hay preguntas registradas."
            : "No se encontraron preguntas con esa búsqueda."}
        </p>
      ) : (
        <div className="faq-cards">
          {faqsFiltradas.map((faq) => (
            <article key={faq.id_pregunta} className="faq-card">
              <h3 className="faq-pregunta">{faq.pregunta}</h3>
              <p className="faq-respuesta">{faq.respuesta}</p>

              <div className="faq-acciones">
                <button
                  className="btn-card-edit"
                  onClick={() => abrirEditar(faq)}
                >
                  Editar
                </button>
                <button
                  className="btn-card-delete"
                  aria-label="Eliminar pregunta"
                  onClick={() => setFaqAEliminar(faq)}
                >
                  <FaRegTrashAlt />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ModalFormulario
      abierto={mostrarModal}
      titulo={editando ? "Editar pregunta" : "Nueva pregunta"}
      subtitulo={
        editando
          ? "Actualiza la pregunta y su respuesta."
          : "Agrega una pregunta frecuente para los pacientes."
      }
      onCerrar={cerrarModal}
      onSubmit={guardarFaq}
      enviando={guardando}
      error={errorForm}
      textoEnviar={editando ? "Guardar cambios" : "Crear pregunta"}
      ancho={560}
    >
      <div className="mf-grid">
        <label className="mf-campo mf-ancho">
          <span>Pregunta</span>
          <input
            value={form.pregunta}
            onChange={(e) =>
              setForm({ ...form, pregunta: e.target.value })
            }
            required
          />
        </label>

        <label className="mf-campo mf-ancho">
          <span>Respuesta</span>
          <textarea
            rows={5}
            value={form.respuesta}
            onChange={(e) =>
              setForm({ ...form, respuesta: e.target.value })
            }
            required
          />
        </label>
      </div>
    </ModalFormulario>

      <ModalConfirmacion
        abierto={!!faqAEliminar}
        titulo="Eliminar pregunta"
        mensaje={
          faqAEliminar
            ? `¿Seguro que quieres eliminar la pregunta "${faqAEliminar.pregunta}"? Esta acción no se puede deshacer.`
            : ""
        }
        textoConfirmar="Eliminar"
        peligro
        onConfirmar={confirmarEliminar}
        onCancelar={() => setFaqAEliminar(null)}
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

export default AdminFaqs;