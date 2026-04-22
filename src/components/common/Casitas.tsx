import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { db } from "../../lib/firebase";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const CAPAS_MAPA = {
  calle: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap",
    nombre: "🗺️ Calles",
  },
  satelite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "© Esri",
    nombre: "🛰️ Satélite",
  },
  oscuro: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "© CartoDB",
    nombre: "🌙 Oscuro",
  },
  relieve: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "© OpenTopoMap",
    nombre: "⛰️ Relieve",
  },
};

interface Casita {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  direccion: string;
  fechaCreacion: string;
}

function MapaClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const Casitas: React.FC = () => {
  const [casitas, setCasitas] = useState<Casita[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [puntoSeleccionado, setPuntoSeleccionado] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [nuevaCasita, setNuevaCasita] = useState({ nombre: "", direccion: "" });
  const [casitaAEliminar, setCasitaAEliminar] = useState<Casita | null>(null);
  const [capaActual, setCapaActual] = useState("satelite");
  const [mostrarTematicas, setMostrarTematicas] = useState(false);

  const CARTAGENA_CENTER: [number, number] = [10.391, -75.479];

  useEffect(() => {
    const cargarCasitas = async () => {
      const data = await db.obtenerCasitas();
      setCasitas(data);
      setLoading(false);
    };
    cargarCasitas();
    db.onCasitasChange((data) => {
      setCasitas(data);
    });
  }, []);

  const handleClickEnMapa = (lat: number, lng: number) => {
    if (!modoSeleccion) return;
    setPuntoSeleccionado({ lat, lng });
  };

  const activarModoSeleccion = () => {
    setModoSeleccion(true);
    setMostrarFormulario(true);
    setPuntoSeleccionado(null);
  };

  const cancelarCreacion = () => {
    setMostrarFormulario(false);
    setModoSeleccion(false);
    setPuntoSeleccionado(null);
    setNuevaCasita({ nombre: "", direccion: "" });
  };

  const agregarCasita = async () => {
    if (!nuevaCasita.nombre) {
      alert("Ingresa un nombre para la casita");
      return;
    }
    if (!puntoSeleccionado) {
      alert("Selecciona una ubicación en el mapa");
      return;
    }

    const casita: Casita = {
      id: Date.now().toString(),
      nombre: nuevaCasita.nombre,
      lat: puntoSeleccionado.lat,
      lng: puntoSeleccionado.lng,
      direccion: nuevaCasita.direccion,
      fechaCreacion: new Date().toISOString(),
    };

    await db.guardarCasita(casita);
    setNuevaCasita({ nombre: "", direccion: "" });
    setPuntoSeleccionado(null);
    setModoSeleccion(false);
    setMostrarFormulario(false);
    alert("✅ Casita agregada exitosamente");
  };

  const eliminarCasita = async (id: string) => {
    await db.eliminarCasita(id);
    setCasitaAEliminar(null);
  };

  if (loading) return <div style={styles.cargando}>Cargando casitas...</div>;

  return (
    <div style={styles.container}>
      {/* Modal de confirmación para eliminar */}
      {casitaAEliminar && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗑️</div>
            <h3 style={{ color: "#FF8C42", marginBottom: "8px" }}>
              Eliminar casita
            </h3>
            <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
              ¿Estás seguro de eliminar "{casitaAEliminar.nombre}"?
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => eliminarCasita(casitaAEliminar.id)}
                style={styles.btnEliminar}
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setCasitaAEliminar(null)}
                style={styles.btnCancelar}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.header}>
        <h3 style={styles.titulo}>
          🛰️ SATELITE - Casitas Registradas ({casitas.length})
        </h3>
        <div style={styles.headerButtons}>
          <button
            onClick={() => setMostrarTematicas(!mostrarTematicas)}
            style={styles.botonTematicas}
          >
            🗺️ Temáticas
          </button>
          <button onClick={activarModoSeleccion} style={styles.botonAgregar}>
            + Agregar Casita
          </button>
        </div>
      </div>

      {/* Panel de Temáticas */}
      {mostrarTematicas && (
        <div style={styles.panelTematicas}>
          {Object.entries(CAPAS_MAPA).map(([key, capa]) => (
            <button
              key={key}
              onClick={() => {
                setCapaActual(key);
                setMostrarTematicas(false);
              }}
              style={
                capaActual === key
                  ? styles.tematicaActiva
                  : styles.tematicaInactiva
              }
            >
              {capa.nombre}
            </button>
          ))}
        </div>
      )}

      <div style={styles.contenido}>
        {/* Panel lateral con lista de casitas */}
        <div style={styles.listaCasitas}>
          {casitas.length === 0 ? (
            <p style={styles.vacio}>No hay casitas registradas</p>
          ) : (
            casitas.map((casita) => (
              <div key={casita.id} style={styles.casitaItem}>
                <div style={styles.casitaInfo}>
                  <strong>🏠 {casita.nombre}</strong>
                  <p style={styles.casitaDireccion}>
                    {casita.direccion || "Sin dirección"}
                  </p>
                  <p style={styles.casitaCoords}>
                    📍 {casita.lat.toFixed(5)}, {casita.lng.toFixed(5)}
                  </p>
                </div>
                <button
                  onClick={() => setCasitaAEliminar(casita)}
                  style={styles.botonEliminar}
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>

        {/* Mapa para seleccionar ubicación */}
        <div style={styles.mapaContainer}>
          <MapContainer
            center={CARTAGENA_CENTER}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url={CAPAS_MAPA[capaActual].url}
              attribution={CAPAS_MAPA[capaActual].attribution}
            />
            <MapaClickHandler onMapClick={handleClickEnMapa} />

            {/* Mostrar todas las casitas en el mapa */}
            {casitas.map((casita) => (
              <Marker key={casita.id} position={[casita.lat, casita.lng]}>
                <Popup>
                  <strong>🏠 {casita.nombre}</strong>
                  <br />
                  {casita.direccion || "Sin dirección"}
                </Popup>
              </Marker>
            ))}

            {/* Mostrar punto temporal seleccionado */}
            {puntoSeleccionado && (
              <Marker position={[puntoSeleccionado.lat, puntoSeleccionado.lng]}>
                <Popup>📍 Ubicación seleccionada para nueva casita</Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Indicador de modo selección */}
          {modoSeleccion && (
            <div style={styles.modoActivo}>
              <div style={{ fontSize: "20px", marginBottom: "4px" }}>📍👆</div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#FF8C42",
                  fontWeight: "bold",
                }}
              >
                MODO SELECCIÓN ACTIVO
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                Toca el mapa para seleccionar la ubicación
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Formulario flotante para agregar casita */}
      {mostrarFormulario && (
        <div style={styles.formularioFlotante}>
          <div style={styles.formHeader}>
            <h3 style={{ color: "#FF8C42", margin: 0 }}>📍 Nueva Casita</h3>
            <button onClick={cancelarCreacion} style={styles.btnCerrar}>
              ✕
            </button>
          </div>
          <div style={styles.coordenadas}>
            {puntoSeleccionado ? (
              <span style={{ color: "#22c55e" }}>
                ✓ Ubicación seleccionada: {puntoSeleccionado.lat.toFixed(5)},{" "}
                {puntoSeleccionado.lng.toFixed(5)}
              </span>
            ) : (
              <span style={{ color: "#94a3b8" }}>
                📍 Toca el mapa para seleccionar la ubicación
              </span>
            )}
          </div>
          <input
            type="text"
            placeholder="Nombre de la casita *"
            value={nuevaCasita.nombre}
            onChange={(e) =>
              setNuevaCasita({ ...nuevaCasita, nombre: e.target.value })
            }
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Dirección (opcional)"
            value={nuevaCasita.direccion}
            onChange={(e) =>
              setNuevaCasita({ ...nuevaCasita, direccion: e.target.value })
            }
            style={styles.input}
          />
          <div style={styles.botonesForm}>
            <button
              onClick={agregarCasita}
              disabled={!puntoSeleccionado}
              style={{
                ...styles.botonGuardar,
                opacity: !puntoSeleccionado ? 0.5 : 1,
              }}
            >
              Guardar Casita
            </button>
            <button onClick={cancelarCreacion} style={styles.botonCancelar}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#0f172a",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    borderBottom: "1px solid #334155",
    flexWrap: "wrap" as const,
    gap: "10px",
  },
  titulo: { color: "#FF8C42", margin: 0, fontSize: "18px" },
  headerButtons: { display: "flex", gap: "10px" },
  botonTematicas: {
    padding: "8px 16px",
    background: "#334155",
    color: "#FF8C42",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  botonAgregar: {
    padding: "8px 16px",
    background: "#FF8C42",
    color: "#0f172a",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  panelTematicas: {
    display: "flex",
    gap: "8px",
    padding: "12px",
    background: "#1e293b",
    borderBottom: "1px solid #334155",
    flexWrap: "wrap" as const,
  },
  tematicaActiva: {
    padding: "6px 12px",
    background: "#FF8C42",
    color: "#0f172a",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "bold",
  },
  tematicaInactiva: {
    padding: "6px 12px",
    background: "#0f172a",
    color: "#94a3b8",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "11px",
  },
  contenido: { flex: 1, display: "flex", overflow: "hidden" },
  listaCasitas: {
    width: "300px",
    overflowY: "auto" as const,
    padding: "16px",
    borderRight: "1px solid #334155",
  },
  casitaItem: {
    background: "#1e293b",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeft: "4px solid #FF8C42",
  },
  casitaInfo: { flex: 1 },
  casitaDireccion: { fontSize: "12px", color: "#94a3b8", marginTop: "4px" },
  casitaCoords: { fontSize: "10px", color: "#64748b", marginTop: "2px" },
  botonEliminar: {
    background: "transparent",
    border: "none",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: "18px",
    padding: "8px",
  },
  mapaContainer: { flex: 1, position: "relative" as const },
  modoActivo: {
    position: "absolute" as const,
    top: "10px",
    left: "10px",
    background: "#1e293b",
    padding: "8px 16px",
    borderRadius: "20px",
    zIndex: 1000,
    textAlign: "center" as const,
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
  },
  formularioFlotante: {
    position: "absolute" as const,
    bottom: "20px",
    right: "20px",
    width: "320px",
    background: "#1e293b",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    zIndex: 2000,
  },
  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  btnCerrar: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "18px",
  },
  coordenadas: {
    background: "#0f172a",
    padding: "8px",
    borderRadius: "6px",
    marginBottom: "12px",
    fontSize: "11px",
    textAlign: "center" as const,
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "6px",
    color: "#fff",
  },
  botonesForm: { display: "flex", gap: "10px", marginTop: "10px" },
  botonGuardar: {
    flex: 1,
    padding: "10px",
    background: "#22c55e",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  botonCancelar: {
    flex: 1,
    padding: "10px",
    background: "#64748b",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  vacio: { textAlign: "center" as const, color: "#94a3b8", padding: "40px" },
  cargando: { textAlign: "center" as const, color: "#94a3b8", padding: "40px" },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.7)",
    zIndex: 2000,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    background: "#1e293b",
    padding: "24px",
    borderRadius: "16px",
    maxWidth: "320px",
    textAlign: "center" as const,
  },
  btnEliminar: {
    flex: 1,
    padding: "10px",
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  btnCancelar: {
    flex: 1,
    padding: "10px",
    background: "#334155",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default Casitas;
