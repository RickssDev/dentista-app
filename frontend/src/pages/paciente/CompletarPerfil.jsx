import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import "../../styles/CompletarPerfil.css";

function CompletarPerfil() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    direccion: "",
    fecha_nacimiento: "",
    genero: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await api("/pacientes", "POST", {
        direccion: form.direccion,
        fecha_nacimiento: form.fecha_nacimiento,
        genero: form.genero,
      });

      // Perfil creado correctamente
      navigate("/paciente");
    } catch (error) {
      console.error("Error al crear perfil:", error);

      setError(
        error.response?.data?.message || "No se pudo completar el perfil",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="completar-perfil-page">
      <div className="completar-perfil-card">
        <h1>Completa tus datos</h1>

        

        {error && <div className="completar-perfil-error">{error}</div>}

        <form className="completar-perfil-form" onSubmit={handleSubmit}>
          <div className="completar-perfil-field">
            <label>Dirección</label>

            <input
              type="text"
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              placeholder="Ingresa tu dirección"
              required
            />
          </div>

          <div className="completar-perfil-field">
            <label>Fecha de nacimiento</label>

            <input
              type="date"
              name="fecha_nacimiento"
              value={form.fecha_nacimiento}
              onChange={handleChange}
              required
            />
          </div>

          <div className="completar-perfil-field">
            <label>Género</label>

            <select
              name="genero"
              value={form.genero}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona una opción</option>
              <option value="femenino">Femenino</option>
              <option value="masculino">Masculino</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <button
            className="completar-perfil-button"
            type="submit"
            disabled={loading}
          > 
            {loading ? "Guardando..." : "Completar perfil"}
          </button>

          <button
            type="button"
            className="completar-perfil-later"
            onClick={() => navigate("/paciente")}
          >
            Quizá más tarde
          </button>
        </form>
      </div>
    </div>
  );
}

export default CompletarPerfil;
