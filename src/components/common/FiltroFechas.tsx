import React from "react";

interface FiltroFechasProps {
  fechaInicio: string;
  fechaFin: string;
  onCambioFechas: (inicio: string, fin: string) => void;
  onLimpiar: () => void;
}

const FiltroFechas: React.FC<FiltroFechasProps> = ({
  fechaInicio,
  fechaFin,
  onCambioFechas,
  onLimpiar,
}) => {
  return (
    <div style={styles.container}>
      <div style={styles.filtros}>
        <div style={styles.campo}>
          <label style={styles.label}>📅 Desde:</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => onCambioFechas(e.target.value, fechaFin)}
            style={styles.input}
          />
        </div>
        <div style={styles.campo}>
          <label style={styles.label}>📅 Hasta:</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => onCambioFechas(fechaInicio, e.target.value)}
            style={styles.input}
          />
        </div>
        <button onClick={onLimpiar} style={styles.botonLimpiar}>
          🗑️ Limpiar
        </button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    background: "#1e293b",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "12px",
  },
  filtros: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
    flexWrap: "wrap" as const,
  },
  campo: { display: "flex", flexDirection: "column" as const, gap: "4px" },
  label: { fontSize: "11px", color: "#94a3b8" },
  input: {
    padding: "8px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "12px",
  },
  botonLimpiar: {
    padding: "8px 16px",
    background: "#334155",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
};

export default FiltroFechas;
