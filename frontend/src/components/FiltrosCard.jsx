import "../styles/adminpanel.css";

function FiltrosCard({
  placeholder = "Buscar...",
  busqueda,
  onBusquedaChange,
  filtro,
  onFiltroChange,
  opcionesFiltro = [],
  textoTodos = "Todos",
  children,
}) {
  return (
    <div className="filtros-card">
      <input
        type="text"
        className="filtros-card-input"
        placeholder={placeholder}
        value={busqueda}
        onChange={(e) => onBusquedaChange(e.target.value)}
      />

      {opcionesFiltro.length > 0 && (
        <select
          className="filtros-card-select"
          value={filtro}
          onChange={(e) => onFiltroChange(e.target.value)}
        >
          <option value="">{textoTodos}</option>
          {opcionesFiltro.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      )}

      {children}
    </div>
  );
}

export default FiltrosCard;
