import { useEffect, useMemo, useState } from "react";
import "../../styles/CitasAdmin.css";
import { api } from "../../services/api";
import {
  FaCalendarAlt,
  FaTimesCircle,
  FaCheckCircle
} from "react-icons/fa";

function CitasAdmin() {

  const [citas, setCitas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");

  const [mostrarModal, setMostrarModal] = useState(false);

  const [form, setForm] = useState({
    id_paciente: "",
    fecha_agendada: "",
    hora: "",
    id_servicio: "",
    estado: "pendiente"
  });

  const obtenerCitas = async () => {

    try {

      const data = await api("/citas");

      setCitas(data.payload || data);

    } catch (error) {

      console.error(error);

    }

  };

useEffect(() => {

  obtenerCitas();

}, []);

const guardarCita = async () => {

  try {

    await api("/citas", "POST", form);

    alert("Cita creada correctamente");

    setMostrarModal(false);

    setForm({
      id_paciente: "",
      fecha_agendada: "",
      hora: "",
      id_servicio: "",
      estado: "pendiente"
    });

    obtenerCitas();

  } catch (error) {

    console.error(error);

    alert(error.message);

  }

};

  const citasFiltradas = useMemo(() => {

    return citas.filter((cita) => {

      const paciente = (cita.nombre_paciente || "").toLowerCase();

      const coincidePaciente =
        paciente.includes(busqueda.toLowerCase());

      const coincideEstado =
        estado === "" || cita.estado === estado;

      return coincidePaciente && coincideEstado;

    });

  }, [citas, busqueda, estado]);

  return (

    <div className="citas-container">

      <h1>Gestión de citas</h1>

      <div className="citas-card">

        <div className="citas-filtros">

          <div className="filtros-left">

            <input
              type="text"
              placeholder="Buscar paciente..."
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
            />

            <select
              value={estado}
              onChange={(e) =>
                setEstado(e.target.value)
              }
            >

              <option value="">
                Todos
              </option>

              <option value="pendiente">
                Pendiente
              </option>

              <option value="completada">
                Completada
              </option>

              <option value="cancelada">
                Cancelada
              </option>

            </select>

          </div>

         <button
    className="btn-crear"
    onClick={() => setMostrarModal(true)}
>

    + Crear cita

</button>

        </div>

      </div>

      <div className="tabla">

        <table>

          <thead>

            <tr>

              <th>Paciente</th>

              <th>Fecha</th>

              <th>Hora</th>

              <th>Servicio</th>

              <th>Estado</th>

              <th>Acciones</th>

            </tr>

          </thead>

          <tbody>

            {citasFiltradas.length === 0 ? (

              <tr>

                <td colSpan="5">

                  No hay citas.

                </td>

              </tr>

            ) : (

              citasFiltradas.map((cita) => (

                <tr key={cita.id}>

                  <td>

                    {cita.nombre_paciente}

                  </td>

                  <td>

                    {new Date(
                      cita.fecha_agendada
                    ).toLocaleDateString()}

                  </td>

                  <td>

                    {cita.hora}

                  </td>

                  <td>

                    {cita.nombre_servicio}

                  </td>

                  <td>

                    <span
                      className={`estado ${cita.estado}`}
                    >

                      {cita.estado}

                    </span>

                  </td>

                  <td>

  <div
    style={{
      display: "flex",
      gap: "15px",
      justifyContent: "center",
      fontSize: "20px"
    }}
  >

    <FaCalendarAlt
      color="#3b82f6"
      style={{ cursor: "pointer" }}
      title="Reprogramar"
      onClick={() =>
        alert("Reprogramar cita " + cita.id)
      }
    />

    <FaTimesCircle
      color="#ef4444"
      style={{ cursor: "pointer" }}
      title="Cancelar"
      onClick={() =>
        alert("Cancelar cita " + cita.id)
      }
    />

    <FaCheckCircle
      color="#22c55e"
      style={{ cursor: "pointer" }}
      title="Finalizar"
      onClick={() =>
        alert("Finalizar cita " + cita.id)
      }
    />

  </div>

</td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>
{mostrarModal && (

<div
className="modal-overlay"
onClick={() => setMostrarModal(false)}
>

<div
className="modal-box"
onClick={(e) => e.stopPropagation()}
>

<div className="modal-header">

<h2>Nueva cita</h2>

</div>

<div className="modal-body">

<input
type="number"
placeholder="ID Paciente"
value={form.id_paciente}
onChange={(e)=>setForm({...form,id_paciente:e.target.value})}
/>

<input
type="number"
placeholder="ID Servicio"
value={form.id_servicio}
onChange={(e)=>setForm({...form,id_servicio:e.target.value})}
/>

<input
type="date"
value={form.fecha_agendada}
onChange={(e)=>setForm({...form,fecha_agendada:e.target.value})}
/>

<input
type="time"
value={form.hora}
onChange={(e)=>setForm({...form,hora:e.target.value})}
/>

</div>

<div className="modal-footer">

<button
className="btn-cancel"
onClick={()=>setMostrarModal(false)}
>

Cancelar

</button>

<button
className="btn-save"
onClick={guardarCita}
>

Guardar

</button>

</div>

</div>

</div>

)}
    </div>

  );

}


export default CitasAdmin;