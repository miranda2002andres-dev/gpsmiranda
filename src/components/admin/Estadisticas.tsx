import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";

const Estadisticas: React.FC = () => {
  const [domis, setDomis] = useState<any[]>([]);
  const [domiSeleccionado, setDomiSeleccionado] = useState("");
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const cargarDomis = async () => {
      const usuarios = await db.obtenerUsuarios();
      const domisFiltrados = usuarios.filter(
        (u: any) => u.role === "domi" || u.rol === "domi"
      );
      setDomis(domisFiltrados);
    };
    cargarDomis();
  }, []);

  const cargarEstadisticas = async () => {
    if (!domiSeleccionado) return;
    setCargando(true);
    const stats = await db.getEstadisticas(domiSeleccionado);
    setEstadisticas(stats);
    setCargando(false);
  };

  useEffect(() => {
    cargarEstadisticas();
  }, [domiSeleccionado]);

  const domiNombre = domis.find((d) => d.id === domiSeleccionado)?.nombre;

  return (
    <div style={styles.container}>
      <div style={styles.filtros}>
        <select
          value={domiSeleccionado}
          onChange={(e) => setDomiSeleccionado(e.target.value)}
          style={styles.select}
        >
          <option value="">-- Seleccionar domi --</option>
          {domis.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
      </div>

      {cargando && <p style={styles.cargando}>Cargando estadísticas...</p>}

      {estadisticas && (
        <div style={styles.statsContainer}>
          <div style={styles.statsHeader}>
            <h3 style={styles.titulo}>📊 Estadísticas de {domiNombre}</h3>
          </div>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{estadisticas.totalKm}</div>
              <div style={styles.statLabel}>Kilómetros recorridos</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{estadisticas.totalTiempo}</div>
              <div style={styles.statLabel}>Minutos en ruta</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{estadisticas.totalRecorridos}</div>
              <div style={styles.statLabel}>Recorridos completados</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>
                {estadisticas.recorridos?.length || 0}
              </div>
              <div style={styles.statLabel}>Viajes registrados</div>
            </div>
          </div>
        </div>
      )}

      {estadisticas &&
        estadisticas.recorridos &&
        estadisticas.recorridos.length > 0 && (
          <div style={styles.recorridosList}>
            <h4 style={{ color: "#FF8C42", marginBottom: "12px" }}>
              📋 Últimos recorridos
            </h4>
            {estadisticas.recorridos.slice(0, 10).map((r: any) => (
              <div key={r.id} style={styles.recorridoItem}>
                <div style={styles.recorridoFecha}>
                  <strong>📅 {new Date(r.fecha).toLocaleDateString()}</strong>
                  <span>{new Date(r.fecha).toLocaleTimeString()}</span>
                </div>
                <div style={styles.recorridoInfo}>
                  📏 {(r.distancia / 1000).toFixed(2)} km • ⏱️{" "}
                  {Math.floor(r.duracion / 60)} min
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "20px",
    maxWidth: "800px",
    margin: "0 auto",
    height: "100%",
    overflowY: "auto" as const,
  },
  filtros: { marginBottom: "20px" },
  select: {
    padding: "10px",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#fff",
    width: "100%",
  },
  cargando: { textAlign: "center" as const, color: "#94a3b8", padding: "40px" },
  statsContainer: {
    background: "#1e293b",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "20px",
  },
  statsHeader: { marginBottom: "20px", textAlign: "center" as const },
  titulo: { color: "#FF8C42", margin: 0 },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "16px",
  },
  statCard: {
    background: "#0f172a",
    padding: "20px",
    borderRadius: "12px",
    textAlign: "center" as const,
  },
  statValue: { fontSize: "32px", fontWeight: "bold", color: "#FF8C42" },
  statLabel: { fontSize: "12px", color: "#94a3b8", marginTop: "8px" },
  recorridosList: {
    background: "#1e293b",
    borderRadius: "16px",
    padding: "20px",
  },
  recorridoItem: { padding: "12px", borderBottom: "1px solid #334155" },
  recorridoFecha: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
    fontSize: "12px",
    color: "#fff",
  },
  recorridoInfo: { fontSize: "11px", color: "#94a3b8" },
};

export default Estadisticas;
