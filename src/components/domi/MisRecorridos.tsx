import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import MapaBase from "../common/MapaBase";
import FiltroFechas from "../common/FiltroFechas";

interface MisRecorridosProps {
  domiId: string;
  domiNombre: string;
}

const MisRecorridos: React.FC<MisRecorridosProps> = ({
  domiId,
  domiNombre,
}) => {
  const [recorridos, setRecorridos] = useState<any[]>([]);
  const [recorridoSeleccionado, setRecorridoSeleccionado] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  useEffect(() => {
    const cargarRecorridos = async () => {
      const stats = await db.getEstadisticas(domiId);
      setRecorridos(stats.recorridos || []);
      setLoading(false);
    };
    cargarRecorridos();
  }, [domiId]);

  const recorridosFiltrados = recorridos.filter((r) => {
    if (fechaInicio && new Date(r.fecha) < new Date(fechaInicio)) return false;
    if (fechaFin && new Date(r.fecha) > new Date(fechaFin)) return false;
    return true;
  });

  if (loading) return <div style={styles.cargando}>Cargando recorridos...</div>;

  return (
    <div style={styles.container}>
      <h3 style={styles.titulo}>📜 Mis Recorridos - {domiNombre}</h3>

      <FiltroFechas
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        onCambioFechas={(inicio, fin) => {
          setFechaInicio(inicio);
          setFechaFin(fin);
        }}
        onLimpiar={() => {
          setFechaInicio("");
          setFechaFin("");
        }}
      />

      <div style={styles.contenido}>
        <div style={styles.lista}>
          {recorridosFiltrados.length === 0 ? (
            <p style={styles.vacio}>No hay recorridos</p>
          ) : (
            recorridosFiltrados.map((r) => (
              <div
                key={r.id}
                onClick={() => setRecorridoSeleccionado(r)}
                style={{
                  ...styles.recorridoItem,
                  background:
                    recorridoSeleccionado?.id === r.id
                      ? "#FF8C4220"
                      : "#0f172a",
                }}
              >
                <div style={styles.recorridoFecha}>
                  <strong>📅 {new Date(r.fecha).toLocaleDateString()}</strong>
                  <span>{new Date(r.fecha).toLocaleTimeString()}</span>
                </div>
                <div style={styles.recorridoInfo}>
                  📏 {(r.distancia / 1000).toFixed(2)} km • ⏱️{" "}
                  {Math.floor(r.duracion / 60)} min
                </div>
              </div>
            ))
          )}
        </div>
        <div style={styles.mapa}>
          {recorridoSeleccionado ? (
            <MapaBase historial={recorridoSeleccionado.puntos || []} />
          ) : (
            <div style={styles.mapaPlaceholder}>
              <span>🗺️</span>
              <p>Selecciona un recorrido para ver la ruta</p>
            </div>
          )}
        </div>
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
  titulo: { color: "#FF8C42", margin: 0 },
  contenido: {
    flex: 1,
    display: "flex",
    gap: "16px",
    overflow: "hidden",
    minHeight: 0,
  },
  lista: {
    width: "340px",
    overflowY: "auto" as const,
    background: "#1e293b",
    borderRadius: "12px",
    padding: "12px",
  },
  recorridoItem: {
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer",
    marginBottom: "8px",
    transition: "all 0.2s",
  },
  recorridoFecha: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
    fontSize: "12px",
    color: "#fff",
  },
  recorridoInfo: { fontSize: "11px", color: "#94a3b8" },
  mapa: {
    flex: 1,
    background: "#0f172a",
    borderRadius: "12px",
    overflow: "hidden",
  },
  mapaPlaceholder: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#94a3b8",
    gap: "10px",
  },
  cargando: { textAlign: "center" as const, color: "#94a3b8", padding: "40px" },
  vacio: { textAlign: "center" as const, color: "#94a3b8", padding: "20px" },
};

export default MisRecorridos;
