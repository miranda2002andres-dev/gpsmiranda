import React, { useState, useEffect } from "react";
import MapaBase from "../common/MapaBase";
import { db } from "../../lib/firebase";

const GestionUbicaciones: React.FC = () => {
  const [domisEnVivo, setDomisEnVivo] = useState<any[]>([]);
  const [domis, setDomis] = useState<any[]>([]);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  useEffect(() => {
    const cargarDomis = async () => {
      const usuarios = await db.obtenerUsuarios();
      const domisFiltrados = usuarios.filter(
        (u: any) => u.role === "domi" || u.rol === "domi"
      );
      setDomis(domisFiltrados);
    };
    cargarDomis();

    db.onUbicacionesChange((ubicaciones) => {
      const formateados = Object.entries(ubicaciones)
        .filter(([id, data]: [string, any]) => data.activo === true)
        .map(([id, data]: [string, any]) => {
          const domi = domis.find((d) => d.codigo === id);
          return {
            id,
            nombre: domi?.nombre || data.nombre || "Desconocido",
            codigo: domi?.codigo || "",
            telefono: domi?.telefono || "",
            color: domi?.color || "#FF8C42",
            lat: data.lat,
            lng: data.lng,
            timestamp: data.timestamp,
          };
        });
      setDomisEnVivo(formateados);
    });
  }, []);

  const domisAMostrar = mostrarTodos ? domis : domisEnVivo;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.titulo}>📍 Gestión de Ubicaciones</h3>
        <button
          onClick={() => setMostrarTodos(!mostrarTodos)}
          style={styles.botonToggle}
        >
          {mostrarTodos ? "🟢 Ver solo activos" : "👥 Ver todos los domis"}
        </button>
      </div>

      <div style={styles.mapaWrapper}>
        <MapaBase
          otrosRepartidores={domisAMostrar.map((d) => ({
            ...d,
            timestamp: d.timestamp || Date.now(),
          }))}
        />
      </div>

      <div style={styles.lista}>
        <h4>📍 Domis ({domisAMostrar.length})</h4>
        {domisAMostrar.map((d) => (
          <div key={d.id} style={styles.domiItem}>
            <div style={styles.domiInfo}>
              <strong>{d.nombre}</strong>
              <span style={styles.domiCodigo}>#{d.codigo}</span>
            </div>
            {d.lat && d.lng ? (
              <div style={styles.domiUbicacion}>
                📍 {d.lat.toFixed(5)}, {d.lng.toFixed(5)}
                <span style={styles.domiHora}>
                  🕒 {new Date(d.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ) : (
              <div style={styles.domiInactivo}>⚫ Sin ubicación activa</div>
            )}
          </div>
        ))}
        {domisAMostrar.length === 0 && (
          <p style={styles.vacio}>No hay domis registrados</p>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "16px",
    gap: "16px",
    backgroundColor: "#0f172a",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap" as const,
    gap: "10px",
  },
  titulo: { color: "#FF8C42", margin: 0 },
  botonToggle: {
    padding: "8px 16px",
    background: "#334155",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  mapaWrapper: {
    height: "400px",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#1e293b",
  },
  lista: {
    flex: 1,
    overflowY: "auto" as const,
    background: "#1e293b",
    borderRadius: "12px",
    padding: "16px",
  },
  domiItem: { padding: "12px", borderBottom: "1px solid #334155" },
  domiInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  domiCodigo: { fontSize: "11px", color: "#FF8C42" },
  domiUbicacion: {
    fontSize: "12px",
    color: "#94a3b8",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  domiHora: { fontSize: "10px", color: "#64748b" },
  domiInactivo: { fontSize: "12px", color: "#64748b", fontStyle: "italic" },
  vacio: { textAlign: "center" as const, color: "#94a3b8", padding: "40px" },
};

export default GestionUbicaciones;
