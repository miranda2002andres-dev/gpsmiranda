import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
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

const AsignarZonas: React.FC = () => {
  const [zonas, setZonas] = useState<any[]>([]);
  const [domis, setDomis] = useState<any[]>([]);
  const [zonaSeleccionada, setZonaSeleccionada] = useState<any | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalAsignacion, setMostrarModalAsignacion] = useState(false);
  const [nuevaZona, setNuevaZona] = useState({
    nombre: "",
    color: "#FF8C42",
    radio: 300,
    centro_lat: 10.391,
    centro_lng: -75.479,
    domisAsignados: [] as string[],
  });
  const [modoCreacionActivo, setModoCreacionActivo] = useState(false);
  const [puntoSeleccionado, setPuntoSeleccionado] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [zonaAEliminar, setZonaAEliminar] = useState<any>(null);
  const [zonaAsignacion, setZonaAsignacion] = useState<any>(null);
  const [capaActual, setCapaActual] = useState("calle");
  const [mostrarTematicas, setMostrarTematicas] = useState(false);

  const CARTAGENA_CENTER: [number, number] = [10.391, -75.479];
  const colores = [
    "#FF8C42",
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E2",
  ];

  useEffect(() => {
    const cargarDatos = async () => {
      const zonasData = await db.obtenerZonas();
      const usuarios = await db.obtenerUsuarios();
      const domisFiltrados = usuarios.filter(
        (u: any) => u.role === "domi" || u.rol === "domi"
      );
      setZonas(zonasData);
      setDomis(domisFiltrados);
    };
    cargarDatos();
    db.onZonasChange(setZonas);
    db.onUsuariosChange((usuarios) => {
      const domisFiltrados = usuarios.filter(
        (u: any) => u.role === "domi" || u.rol === "domi"
      );
      setDomis(domisFiltrados);
    });
  }, []);

  const handleClickEnMapa = (lat: number, lng: number) => {
    if (!modoCreacionActivo) return;
    setPuntoSeleccionado({ lat, lng });
    setNuevaZona({ ...nuevaZona, centro_lat: lat, centro_lng: lng });
    setMostrarModal(true);
  };

  const handleGuardar = async () => {
    if (!nuevaZona.nombre) {
      alert("El nombre de la zona es requerido");
      return;
    }
    if (!puntoSeleccionado) {
      alert("Selecciona una ubicación en el mapa");
      return;
    }
    const zona = {
      id: Date.now().toString(),
      nombre: nuevaZona.nombre,
      color: nuevaZona.color,
      centro_lat: nuevaZona.centro_lat,
      centro_lng: nuevaZona.centro_lng,
      radio_metros: nuevaZona.radio,
      domisAsignados: nuevaZona.domisAsignados,
      creadaPor: "admin",
      fechaCreacion: new Date().toISOString(),
    };
    await db.guardarZona(zona);
    setMostrarModal(false);
    setModoCreacionActivo(false);
    setPuntoSeleccionado(null);
    setNuevaZona({
      nombre: "",
      color: "#FF8C42",
      radio: 300,
      centro_lat: 10.391,
      centro_lng: -75.479,
      domisAsignados: [],
    });
    alert("✅ Zona guardada");
  };

  const eliminarZona = async (id: string) => {
    await db.eliminarZona(id);
    setZonaAEliminar(null);
    if (zonaSeleccionada?.id === id) setZonaSeleccionada(null);
  };

  const toggleAsignarDomi = async (zonaId: string, domiId: string) => {
    const zona = zonas.find((z) => z.id === zonaId);
    if (!zona) return;

    const asignados = zona.domisAsignados || [];
    const nuevosAsignados = asignados.includes(domiId)
      ? asignados.filter((id: string) => id !== domiId)
      : [...asignados, domiId];

    const zonaActualizada = { ...zona, domisAsignados: nuevosAsignados };
    await db.guardarZona(zonaActualizada);
    setZonas(zonas.map((z) => (z.id === zonaId ? zonaActualizada : z)));
    if (zonaSeleccionada?.id === zonaId) setZonaSeleccionada(zonaActualizada);
  };

  const abrirAsignacion = (zona: any) => {
    setZonaAsignacion(zona);
    setMostrarModalAsignacion(true);
  };

  const domisAsignadosCount = (zona: any) => {
    return zona.domisAsignados?.length || 0;
  };

  return (
    <div style={styles.container}>
      {/* Modal de confirmación para eliminar */}
      {zonaAEliminar && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗑️</div>
            <h3 style={{ color: "#FF8C42", marginBottom: "8px" }}>
              Eliminar zona
            </h3>
            <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
              ¿Estás seguro de eliminar "{zonaAEliminar.nombre}"?
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => eliminarZona(zonaAEliminar.id)}
                style={styles.btnEliminar}
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setZonaAEliminar(null)}
                style={styles.btnCancelar}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de asignación de domis */}
      {mostrarModalAsignacion && zonaAsignacion && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContentAsignacion}>
            <div style={styles.modalHeader}>
              <h3 style={{ color: "#FF8C42", margin: 0 }}>
                👥 Asignar domis a "{zonaAsignacion.nombre}"
              </h3>
              <button
                onClick={() => setMostrarModalAsignacion(false)}
                style={styles.btnCerrar}
              >
                ✕
              </button>
            </div>
            <div style={styles.listaDomis}>
              {domis.length === 0 ? (
                <p
                  style={{
                    color: "#94a3b8",
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  No hay domis registrados
                </p>
              ) : (
                domis.map((domi) => {
                  const isAssigned = zonaAsignacion.domisAsignados?.includes(
                    domi.id
                  );
                  return (
                    <div
                      key={domi.id}
                      style={{
                        ...styles.domiItem,
                        background: isAssigned ? "#1e293b" : "#0f172a",
                        borderLeft: isAssigned
                          ? `4px solid #22c55e`
                          : `4px solid #334155`,
                      }}
                    >
                      <div style={styles.domiInfo}>
                        <div style={styles.domiNombre}>
                          {domi.nombre}
                          <span style={styles.domiCodigo}>#{domi.codigo}</span>
                        </div>
                        <div style={styles.domiDetalle}>
                          🚗 {domi.vehiculo || "No asignado"} | 📱{" "}
                          {domi.telefono || "N/A"}
                        </div>
                        {isAssigned && (
                          <div style={styles.asignadoBadge}>✅ Asignado</div>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          toggleAsignarDomi(zonaAsignacion.id, domi.id)
                        }
                        style={
                          isAssigned
                            ? styles.botonDesasignar
                            : styles.botonAsignar
                        }
                      >
                        {isAssigned ? "❌ Desasignar" : "➕ Asignar"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            <div style={styles.modalFooter}>
              <button
                onClick={() => setMostrarModalAsignacion(false)}
                style={styles.btnCerrarModal}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear nueva zona */}
      {mostrarModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContentZona}>
            <div style={styles.modalHeader}>
              <h3 style={{ color: "#FF8C42", margin: 0 }}>📍 Nueva Zona</h3>
              <button
                onClick={() => {
                  setMostrarModal(false);
                  setModoCreacionActivo(false);
                  setPuntoSeleccionado(null);
                }}
                style={styles.btnCerrar}
              >
                ✕
              </button>
            </div>
            <div style={styles.coordenadas}>
              {puntoSeleccionado ? (
                <span style={{ color: "#22c55e" }}>
                  ✓ Centro: {puntoSeleccionado.lat.toFixed(5)},{" "}
                  {puntoSeleccionado.lng.toFixed(5)}
                </span>
              ) : (
                <span style={{ color: "#94a3b8" }}>
                  📍 Toca el mapa para seleccionar el centro
                </span>
              )}
            </div>
            <input
              placeholder="Nombre de la zona"
              value={nuevaZona.nombre}
              onChange={(e) =>
                setNuevaZona({ ...nuevaZona, nombre: e.target.value })
              }
              style={styles.input}
            />
            <div style={styles.colores}>
              {colores.map((color) => (
                <div
                  key={color}
                  onClick={() => setNuevaZona({ ...nuevaZona, color })}
                  style={{
                    ...styles.colorOption,
                    background: color,
                    border:
                      nuevaZona.color === color
                        ? "3px solid white"
                        : "1px solid #334155",
                  }}
                />
              ))}
            </div>
            <div style={styles.radioControl}>
              <span>Radio: {nuevaZona.radio}m</span>
              <input
                type="range"
                min="100"
                max="1500"
                step="50"
                value={nuevaZona.radio}
                onChange={(e) =>
                  setNuevaZona({
                    ...nuevaZona,
                    radio: parseInt(e.target.value),
                  })
                }
              />
            </div>
            <div style={styles.botonesModal}>
              <button
                onClick={() => {
                  setMostrarModal(false);
                  setModoCreacionActivo(false);
                }}
                style={styles.btnCancelarModal}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={!puntoSeleccionado}
                style={{
                  ...styles.btnGuardarModal,
                  opacity: !puntoSeleccionado ? 0.5 : 1,
                }}
              >
                Guardar Zona
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel lateral de zonas */}
      <div style={styles.panelLateral}>
        <div style={styles.headerLateral}>
          <h3 style={styles.tituloZonas}>🎯 Zonas de Trabajo</h3>
          <button
            onClick={() => setMostrarTematicas(!mostrarTematicas)}
            style={styles.btnTematicas}
          >
            🗺️ Temáticas
          </button>
          <button
            onClick={() => setModoCreacionActivo(!modoCreacionActivo)}
            style={{
              ...styles.btnCreacion,
              background: modoCreacionActivo ? "#FF8C42" : "#22c55e",
            }}
          >
            {modoCreacionActivo ? "✋ Cancelar" : "+ Crear Zona"}
          </button>
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

        {modoCreacionActivo && (
          <div style={styles.modoActivo}>
            <div style={{ fontSize: "20px", marginBottom: "4px" }}>📍👆</div>
            <div
              style={{ fontSize: "12px", color: "#FF8C42", fontWeight: "bold" }}
            >
              MODO CREACIÓN ACTIVO
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
              Toca el mapa para crear una zona
            </div>
          </div>
        )}

        <div style={styles.listaZonas}>
          {zonas.length === 0 ? (
            <div style={styles.vacio}>
              <div>🗺️ No hay zonas creadas</div>
              <div style={{ fontSize: "11px", marginTop: "8px" }}>
                Presiona "+ Crear Zona" para comenzar
              </div>
            </div>
          ) : (
            zonas.map((z) => (
              <div
                key={z.id}
                style={{
                  ...styles.zonaCard,
                  borderLeft: `4px solid ${z.color}`,
                  background:
                    zonaSeleccionada?.id === z.id ? "#FF8C4220" : "#0f172a",
                }}
                onClick={() => setZonaSeleccionada(z)}
              >
                <div style={styles.zonaHeader}>
                  <div>
                    <div style={styles.zonaNombre}>{z.nombre}</div>
                    <div style={styles.zonaInfo}>
                      📏 Radio: {z.radio_metros}m
                    </div>
                    <div style={styles.zonaInfo}>
                      👥 Domis: {domisAsignadosCount(z)}
                    </div>
                  </div>
                  <div style={styles.zonaAcciones}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirAsignacion(z);
                      }}
                      style={styles.botonAsignarDomi}
                    >
                      👥
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setZonaAEliminar(z);
                      }}
                      style={styles.botonEliminarZona}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div style={styles.zonaColor}>
                  <span
                    style={{
                      background: z.color,
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "10px",
                    }}
                  >
                    {z.color}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mapa */}
      <div style={styles.panelMapa}>
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

          {zonas.map((zona) => (
            <Circle
              key={zona.id}
              center={[zona.centro_lat, zona.centro_lng]}
              radius={zona.radio_metros}
              pathOptions={{
                color: zona.color,
                fillColor: zona.color,
                fillOpacity: 0.2,
              }}
              eventHandlers={{ click: () => setZonaSeleccionada(zona) }}
            >
              <Popup>
                {zona.nombre}
                <br />
                Radio: {zona.radio_metros}m
              </Popup>
            </Circle>
          ))}

          {puntoSeleccionado && (
            <Marker position={[puntoSeleccionado.lat, puntoSeleccionado.lng]}>
              <Popup>📍 Centro seleccionado</Popup>
            </Marker>
          )}
        </MapContainer>

        {modoCreacionActivo && (
          <div style={styles.modoActivoMapa}>
            <div>📍👆 Modo Creación Activo</div>
            <div style={{ fontSize: "11px" }}>
              Toca el mapa para crear una zona
            </div>
          </div>
        )}

        {/* Panel de información de zona seleccionada */}
        {zonaSeleccionada && (
          <div style={styles.infoPanel}>
            <div style={styles.infoHeader}>
              <h4 style={{ color: "#FF8C42", margin: 0 }}>
                📍 {zonaSeleccionada.nombre}
              </h4>
              <button
                onClick={() => setZonaSeleccionada(null)}
                style={styles.btnCerrarInfo}
              >
                ✕
              </button>
            </div>
            <div style={styles.infoContent}>
              <p>📏 Radio: {zonaSeleccionada.radio_metros}m</p>
              <p>
                🎨 Color:{" "}
                <span
                  style={{
                    background: zonaSeleccionada.color,
                    padding: "2px 8px",
                    borderRadius: "12px",
                  }}
                >
                  {zonaSeleccionada.color}
                </span>
              </p>
              <p>👥 Domis asignados: {domisAsignadosCount(zonaSeleccionada)}</p>
              <button
                onClick={() => abrirAsignacion(zonaSeleccionada)}
                style={styles.botonGestionar}
              >
                Gestionar Domis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { height: "100%", display: "flex", backgroundColor: "#0f172a" },

  // Modales
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.8)",
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
  modalContentAsignacion: {
    background: "#1e293b",
    padding: "20px",
    borderRadius: "16px",
    width: "450px",
    maxWidth: "90%",
    maxHeight: "80%",
    overflow: "auto" as const,
  },
  modalContentZona: {
    background: "#1e293b",
    padding: "24px",
    borderRadius: "16px",
    width: "400px",
    maxWidth: "90%",
  },
  modalHeader: {
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
  btnCancelarModal: {
    padding: "10px 20px",
    background: "#334155",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  btnGuardarModal: {
    padding: "10px 20px",
    background: "#FF8C42",
    color: "#0f172a",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  btnCerrarModal: {
    padding: "10px 20px",
    background: "#FF8C42",
    color: "#0f172a",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%",
  },
  botonesModal: { display: "flex", gap: "12px", marginTop: "20px" },

  // Panel lateral
  panelLateral: {
    width: "340px",
    background: "#1e293b",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  headerLateral: {
    padding: "16px",
    borderBottom: "1px solid #334155",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap" as const,
    gap: "10px",
  },
  tituloZonas: { color: "#FF8C42", margin: 0, fontSize: "16px" },
  btnTematicas: {
    padding: "8px 12px",
    background: "#334155",
    color: "#FF8C42",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
  },
  btnCreacion: {
    padding: "8px 12px",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
  },
  panelTematicas: {
    display: "flex",
    gap: "8px",
    padding: "12px",
    background: "#0f172a",
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
  modoActivo: {
    background: "#0f172a",
    padding: "12px",
    margin: "12px",
    borderRadius: "12px",
    textAlign: "center" as const,
    border: "1px solid #FF8C42",
  },
  listaZonas: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  zonaCard: {
    padding: "12px",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.2s",
    borderLeft: `4px solid #FF8C42`,
  },
  zonaHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  zonaNombre: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#fff",
    marginBottom: "4px",
  },
  zonaInfo: { fontSize: "11px", color: "#94a3b8", marginBottom: "2px" },
  zonaColor: { fontSize: "10px", marginTop: "4px" },
  zonaAcciones: { display: "flex", gap: "8px" },
  botonAsignarDomi: {
    background: "#3b82f6",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#fff",
    fontSize: "12px",
  },
  botonEliminarZona: {
    background: "#dc2626",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#fff",
    fontSize: "12px",
  },
  vacio: { textAlign: "center" as const, padding: "40px", color: "#94a3b8" },

  // Mapa
  panelMapa: { flex: 1, position: "relative" as const },
  modoActivoMapa: {
    position: "absolute" as const,
    top: "10px",
    left: "10px",
    background: "#1e293b",
    padding: "8px 16px",
    borderRadius: "20px",
    zIndex: 1000,
    textAlign: "center" as const,
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
    fontSize: "12px",
    fontWeight: "bold",
    color: "#FF8C42",
  },

  // Panel de información
  infoPanel: {
    position: "absolute" as const,
    bottom: "20px",
    right: "20px",
    width: "260px",
    background: "#1e293b",
    borderRadius: "12px",
    padding: "12px",
    zIndex: 1000,
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
    border: "1px solid #334155",
  },
  infoHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    borderBottom: "1px solid #334155",
    paddingBottom: "8px",
  },
  btnCerrarInfo: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "14px",
  },
  infoContent: { fontSize: "12px", color: "#94a3b8" },
  botonGestionar: {
    marginTop: "10px",
    padding: "6px 12px",
    background: "#FF8C42",
    color: "#0f172a",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%",
  },

  // Formulario
  coordenadas: {
    marginBottom: "12px",
    fontSize: "12px",
    color: "#94a3b8",
    background: "#0f172a",
    padding: "8px",
    borderRadius: "6px",
    textAlign: "center" as const,
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#fff",
  },
  colores: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
    marginBottom: "12px",
  },
  colorOption: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  radioControl: { marginBottom: "12px", color: "#94a3b8", fontSize: "12px" },

  // Asignación de domis
  listaDomis: {
    maxHeight: "400px",
    overflowY: "auto" as const,
    marginBottom: "16px",
  },
  domiItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    marginBottom: "8px",
    borderRadius: "8px",
  },
  domiInfo: { flex: 1 },
  domiNombre: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#fff",
    marginBottom: "4px",
  },
  domiCodigo: { fontSize: "10px", color: "#FF8C42", marginLeft: "8px" },
  domiDetalle: { fontSize: "10px", color: "#94a3b8" },
  asignadoBadge: { fontSize: "10px", color: "#22c55e", marginTop: "4px" },
  botonAsignar: {
    padding: "6px 12px",
    background: "#22c55e",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "11px",
  },
  botonDesasignar: {
    padding: "6px 12px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "11px",
  },
  modalFooter: { marginTop: "16px" },
};

export default AsignarZonas;
