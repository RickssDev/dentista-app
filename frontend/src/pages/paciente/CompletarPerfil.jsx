import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ModalFormulario from "../../components/ModalFormulario";
import { api } from "../../services/api";
import { hoyClave } from "../../utils/fechas";
import "../../styles/adminpanel.css";
import "../../styles/MisCitas.css";

const FORM_VACIO = {
  telefono: "",
  direccion: "",
  fecha_nacimiento: "",
  genero: "",
};

function CompletarPerfil() {
  const navigate = useNavigate();

  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // Si el teléfono ya existe (por ejemplo, al registrarse), se precarga
  useEffect(() => {
    let cancelado = false;

    api("/pacientes/perfil")
      .then((res) => {
        const perfil = res?.payload || res?.data || res;
        if (!cancelado && perfil?.telefono) {
          setForm((f) => ({ ...f, telefono: perfil.telefono }));
        }
      })
      .catch(() => {});

    return () => {
      cancelado = true;
    };
  }, []);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const completarPerfil = async () => {
    try {
      setGuardando(true);
      setError("");

      await api("/pacientes", "POST", {
        telefono: form.telefono,
        direccion: form.direccion.trim(),
        fecha_nacimiento: form.fecha_nacimiento,
        genero: form.genero,
      });

      navigate("/paciente");
    } catch (err) {
      console.error("Error al crear perfil:", err);
      setError(err.message || "No se pudo completar el perfil.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="completar-fondo">
      <ModalFormulario
        abierto
        titulo="Completa tus datos"
        subtitulo="Los necesitamos para agendar y dar seguimiento a tus citas."
        onCerrar={() => navigate("/paciente")}
        onSubmit={completarPerfil}
        enviando={guardando}
        error={error}
        textoEnviar="Completar perfil"
        textoEnviando="Guardando..."
        textoCancelar="Quizá más tarde"
        ancho={520}
      >
        <div className="mf-grid">
          <label className="mf-campo mf-ancho">
            <span>Teléfono</span>
            <input
              type="tel"
              name="telefono"
              inputMode="numeric"
              placeholder="10 dígitos"
              value={form.telefono}
              onChange={cambiar}
              required
            />
          </label>

          <label className="mf-campo mf-ancho">
            <span>Dirección</span>
            <input
              type="text"
              name="direccion"
              placeholder="Ingresa tu dirección"
              value={form.direccion}
              onChange={cambiar}
              required
            />
          </label>

          <label className="mf-campo">
            <span>Fecha de nacimiento</span>
            <input
              type="date"
              name="fecha_nacimiento"
              max={hoyClave()}
              value={form.fecha_nacimiento}
              onChange={cambiar}
              required
            />
          </label>

          <label className="mf-campo">
            <span>Género</span>
            <select
              name="genero"
              value={form.genero}
              onChange={cambiar}
              required
            >
              <option value="">Selecciona una opción</option>
              <option value="femenino">Femenino</option>
              <option value="masculino">Masculino</option>
              <option value="otro">Otro</option>
            </select>
          </label>
        </div>
      </ModalFormulario>
    </div>
  );
}

export default CompletarPerfil;
