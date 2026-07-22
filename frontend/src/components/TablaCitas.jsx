function TablaCitas({ citas }) {
  return (
    <div className="tabla-citas">

      <table>
        <thead>
          <tr>
            <th>FECHA</th>
            <th>HORA</th>
            <th>TRATAMIENTO</th>
            <th>ESPECIALISTA</th>
            <th>ESTADO</th>
          </tr>
        </thead>

        <tbody>

          {citas.length === 0 ? (

            <tr>
              <td colSpan="5">
                No tienes historial de citas
              </td>
            </tr>

          ) : (

            citas.map((cita) => (
              <tr key={cita.id}>

                <td>
                  {cita.fecha_agendada}
                </td>

                <td>
                  {cita.hora}
                </td>

                <td>
                  {cita.nombre_servicio}
                </td>

                <td>
                  {cita.especialista || "Pendiente"}
                </td>

                <td>
                  {cita.estado}
                </td>

              </tr>
            ))

          )}

        </tbody>
      </table>

    </div>
  );
}

export default TablaCitas;