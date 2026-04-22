import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { db } from "../../lib/firebase";
import { useGeolocation } from "../../hooks/useGeolocation";
import ChatDomi from "./ChatDomi";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface DomiDashboardProps {
  usuario: any;
  onLogout: () => void;
}

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

function SetViewOnLocation({
  location,
}: {
  location: [number, number] | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (location) map.setView(location, 17);
  }, [location, map]);
  return null;
}

const DomiDashboard: React.FC<DomiDashboardProps> = ({ usuario, onLogout }) => {
  const [gpsActivo, setGpsActivo] = useState(false);
  const [recorridoActivo, setRecorridoActivo] = useState(false);
  const { ubicacion, error, historial } = useGeolocation(gpsActivo);
  const [puntosGuardados, setPuntosGuardados] = useState(0);
  const [casitas, setCasitas] = useState<any[]>([]);
  const [capaActual, setCapaActual] = useState("satelite");
  const [mostrarTematicas, setMostrarTematicas] = useState(false);
  const [distanciaTotal, setDistanciaTotal] = useState(0);
  const [tiempoInicio, setTiempoInicio] = useState<number | null>(null);
  const [recorridoGuardado, setRecorridoGuardado] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [mostrarChat, setMostrarChat] = useState(false);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [backgroundActivo, setBackgroundActivo] = useState(false);
  const [recorridoPendienteGuardar, setRecorridoPendienteGuardar] =
    useState(false);
  const historialRef = useRef<any[]>([]);
  const tiempoInicioRef = useRef<number | null>(null);
  const distanciaRef = useRef<number>(0);

  // Mantener refs actualizados
  useEffect(() => {
    historialRef.current = historial;
  }, [historial]);
  useEffect(() => {
    tiempoInicioRef.current = tiempoInicio;
  }, [tiempoInicio]);
  useEffect(() => {
    distanciaRef.current = distanciaTotal;
  }, [distanciaTotal]);

  const calcularDistanciaTotal = (puntos: any[]): number => {
    let total = 0;
    for (let i = 1; i < puntos.length; i++) {
      const R = 6371e3;
      const φ1 = (puntos[i - 1].lat * Math.PI) / 180;
      const φ2 = (puntos[i].lat * Math.PI) / 180;
      const Δφ = ((puntos[i].lat - puntos[i - 1].lat) * Math.PI) / 180;
      const Δλ = ((puntos[i].lng - puntos[i - 1].lng) * Math.PI) / 180;
      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    return total;
  };

  // Guardar recorrido automáticamente al desactivar GPS
  const guardarRecorridoActual = async () => {
    const puntosActuales = historialRef.current;
    const tiempoInicioActual = tiempoInicioRef.current;
    const distanciaActual = distanciaRef.current;

    if (puntosActuales.length >= 2 && tiempoInicioActual) {
      const duracion = Math.floor((Date.now() - tiempoInicioActual) / 1000);
      const nuevoRecorrido = {
        repartidor_id: usuario.id,
        domiId: usuario.id,
        domiNombre: usuario.nombre,
        puntos: puntosActuales.map((p) => ({
          lat: p.lat,
          lng: p.lng,
          timestamp: p.timestamp,
        })),
        distancia: distanciaActual,
        duracion: duracion,
        fecha: new Date().toISOString(),
        zonas_visitadas: [],
      };
      await db.guardarRecorrido(nuevoRecorrido);
      console.log(
        `✅ Recorrido guardado automáticamente: ${(
          distanciaActual / 1000
        ).toFixed(2)} km, ${Math.floor(duracion / 60)} min`
      );
      return true;
    }
    return false;
  };

  // Función para desactivar GPS (guardando recorrido si estaba activo)
  const desactivarGPS = async () => {
    if (recorridoActivo) {
      setMensaje("💾 Guardando recorrido antes de desactivar GPS...");
      await guardarRecorridoActual();
      setRecorridoActivo(false);
      setRecorridoGuardado(true);
    }

    setGpsActivo(false);
    setBackgroundActivo(false);
    await db.marcarInactivo(usuario.codigo);

    // Limpiar estado
    setPuntosGuardados(0);
    setDistanciaTotal(0);
    setTiempoInicio(null);
    setMensaje("📍 GPS desactivado");
    setTimeout(() => setMensaje(""), 3000);
  };

  // Efecto para actualizar distancia y puntos cuando cambia el historial
  useEffect(() => {
    if (historial.length > 0 && recorridoActivo) {
      setDistanciaTotal(calcularDistanciaTotal(historial));
      setPuntosGuardados(historial.length);
    }
  }, [historial, recorridoActivo]);

  // Efecto para guardar ubicación en Firebase
  useEffect(() => {
    if (gpsActivo && ubicacion) {
      db.guardarUbicacion(
        usuario.codigo,
        ubicacion.lat,
        ubicacion.lng,
        usuario.nombre
      ).catch(console.error);
    }
  }, [ubicacion, gpsActivo, usuario.codigo, usuario.nombre]);

  // Efecto para mantener sesión activa
  useEffect(() => {
    const mantenerSesion = async () => {
      await db.mantenerSesionActiva(usuario.codigo);
    };
    mantenerSesion();
    const interval = setInterval(mantenerSesion, 30000);
    const handleBeforeUnload = () => {
      if (recorridoActivo) guardarRecorridoActual();
      db.cerrarSesion(usuario.codigo);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      db.cerrarSesion(usuario.codigo);
    };
  }, [usuario.codigo, recorridoActivo]);

  // Escuchar comandos de admin
  useEffect(() => {
    if (!db.onComandoPendiente) return;
    const unsubscribe = db.onComandoPendiente(
      usuario.codigo,
      async (comando) => {
        if (comando.comando === "activar_gps" && !gpsActivo) {
          setGpsActivo(true);
          setMensaje(`📍 GPS activado por ${comando.admin || "Admin"}`);
          setTimeout(() => setMensaje(""), 3000);
        }
      }
    );
    return () => {
      if (unsubscribe && typeof unsubscribe === "function") unsubscribe();
    };
  }, [usuario.codigo, gpsActivo]);

  // Escuchar apagado desde admin
  useEffect(() => {
    if (!db.onAdminApagarGPS) return;
    const unsubscribe = db.onAdminApagarGPS(usuario.codigo, (apagado) => {
      if (apagado && gpsActivo) desactivarGPS();
    });
    return () => {
      if (unsubscribe && typeof unsubscribe === "function") unsubscribe();
    };
  }, [usuario.codigo, gpsActivo]);

  // Cargar casitas
  useEffect(() => {
    const cargarCasitas = async () => {
      const data = await db.obtenerCasitas();
      setCasitas(data);
    };
    cargarCasitas();
    const unsubscribe = db.onCasitasChange(setCasitas);
    return () => {
      if (unsubscribe && typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  // Mensajes no leídos
  useEffect(() => {
    if (!db.onNoLeidosChange) return;
    const unsubscribe = db.onNoLeidosChange(usuario.id, (noLeidos) =>
      setMensajesNoLeidos(noLeidos)
    );
    return () => {
      if (unsubscribe && typeof unsubscribe === "function") unsubscribe();
    };
  }, [usuario.id]);

  const activarGPS = async () => {
    setGpsActivo(true);
    setMensaje("📍 GPS Activado!");
    setTimeout(() => setMensaje(""), 2000);
  };

  const iniciarRecorrido = () => {
    if (!gpsActivo) {
      alert("⚠️ Primero activa el GPS");
      return;
    }
    if (!ubicacion) {
      alert("⚠️ Esperando ubicación...");
      return;
    }
    setRecorridoActivo(true);
    setTiempoInicio(Date.now());
    setPuntosGuardados(0);
    setDistanciaTotal(0);
    setRecorridoGuardado(false);
    setMensaje("🚀 Recorrido iniciado!");
    setTimeout(() => setMensaje(""), 2000);
  };

  const guardarRecorrido = async () => {
    if (!recorridoActivo) {
      alert("No hay un recorrido activo");
      return;
    }
    if (historial.length < 2) {
      alert("No hay suficientes puntos. Camina un poco más.");
      return;
    }

    const duracion = Math.floor(
      (Date.now() - (tiempoInicio || Date.now())) / 1000
    );
    const nuevoRecorrido = {
      repartidor_id: usuario.id,
      domiId: usuario.id,
      domiNombre: usuario.nombre,
      puntos: historial.map((p) => ({
        lat: p.lat,
        lng: p.lng,
        timestamp: p.timestamp,
      })),
      distancia: distanciaTotal,
      duracion: duracion,
      fecha: new Date().toISOString(),
      zonas_visitadas: [],
    };
    await db.guardarRecorrido(nuevoRecorrido);
    setRecorridoActivo(false);
    setRecorridoGuardado(true);
    setMensaje(
      `✅ Recorrido guardado! ${(distanciaTotal / 1000).toFixed(2)} km`
    );
    setTimeout(() => setMensaje(""), 3000);
  };

  const cancelarRecorrido = () => {
    if (window.confirm("¿Cancelar el recorrido?")) {
      setRecorridoActivo(false);
      setPuntosGuardados(0);
      setDistanciaTotal(0);
      setTiempoInicio(null);
      setRecorridoGuardado(false);
      setMensaje("❌ Recorrido cancelado");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const nuevoRecorrido = () => {
    setRecorridoGuardado(false);
    iniciarRecorrido();
  };

  const tiempoTranscurrido =
    recorridoActivo && tiempoInicio
      ? Math.floor((Date.now() - tiempoInicio) / 1000)
      : 0;
  const minutos = Math.floor(tiempoTranscurrido / 60);
  const segundos = tiempoTranscurrido % 60;
  const puntosPolyline = historial.map(
    (p) => [p.lat, p.lng] as [number, number]
  );

  return (
    <div style={styles.container}>
      {mostrarChat && (
        <ChatDomi usuario={usuario} onClose={() => setMostrarChat(false)} />
      )}

      <div style={styles.header}>
        <div style={styles.headerTop}>
          <h1 style={styles.titulo}>⚡ INTERRAPIDISIMOS</h1>
          <div style={styles.headerIcons}>
            <button
              onClick={() => setMostrarChat(true)}
              style={styles.iconButton}
            >
              💬{" "}
              {mensajesNoLeidos > 0 && (
                <span style={styles.badge}>{mensajesNoLeidos}</span>
              )}
            </button>
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              style={styles.iconButton}
            >
              ☰
            </button>
          </div>
        </div>
        <p style={styles.usuarioInfo}>
          {usuario?.nombre} | {usuario?.codigo}
          {gpsActivo && <span style={styles.gpsBadge}>🟢 GPS Activo</span>}
          {recorridoActivo && (
            <span style={styles.grabandoBadge}>📡 Grabando</span>
          )}
        </p>
      </div>

      {menuAbierto && (
        <div style={styles.menuDropdown}>
          <button
            onClick={() => {
              setMostrarTematicas(!mostrarTematicas);
              setMenuAbierto(false);
            }}
            style={styles.menuItem}
          >
            🗺️ Cambiar tema del mapa
          </button>
          <button onClick={onLogout} style={styles.menuItem}>
            🚪 Cerrar sesión
          </button>
        </div>
      )}

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

      <div style={styles.controlesPrincipales}>
        {!gpsActivo ? (
          <button onClick={activarGPS} style={styles.botonActivarGPS}>
            📍 ACTIVAR GPS
          </button>
        ) : (
          <button onClick={desactivarGPS} style={styles.botonDesactivarGPS}>
            🔴 DESACTIVAR GPS
          </button>
        )}

        {gpsActivo && !recorridoActivo && !recorridoGuardado && (
          <button onClick={iniciarRecorrido} style={styles.botonIniciar}>
            ▶ INICIAR RECORRIDO
          </button>
        )}
      </div>

      {recorridoActivo && (
        <div style={styles.estadoRecorrido}>
          <div style={styles.statsRow}>
            <div style={styles.stat}>
              <span style={styles.statVal}>
                {(distanciaTotal / 1000).toFixed(2)}
              </span>
              <span style={styles.statLabel}>km</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statVal}>
                {minutos}:{segundos < 10 ? `0${segundos}` : segundos}
              </span>
              <span style={styles.statLabel}>tiempo</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statVal}>{puntosGuardados}</span>
              <span style={styles.statLabel}>puntos</span>
            </div>
          </div>
          <div style={styles.botonesRecorrido}>
            <button onClick={guardarRecorrido} style={styles.botonGuardar}>
              💾 GUARDAR
            </button>
            <button onClick={cancelarRecorrido} style={styles.botonCancelar}>
              ✕ CANCELAR
            </button>
          </div>
        </div>
      )}

      {recorridoGuardado && gpsActivo && (
        <div style={styles.recorridoGuardadoContainer}>
          <span style={styles.recorridoGuardadoText}>
            ✅ Recorrido guardado
          </span>
          <button onClick={nuevoRecorrido} style={styles.botonNuevo}>
            ➕ NUEVO RECORRIDO
          </button>
        </div>
      )}

      {mensaje && <div style={styles.mensajeFlotante}>{mensaje}</div>}
      {error && <div style={styles.errorFlotante}>⚠️ {error}</div>}

      <div style={styles.mapaWrapper}>
        <MapContainer
          center={
            ubicacion ? [ubicacion.lat, ubicacion.lng] : [10.391, -75.479]
          }
          zoom={17}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url={CAPAS_MAPA[capaActual].url}
            attribution={CAPAS_MAPA[capaActual].attribution}
          />
          {ubicacion && (
            <SetViewOnLocation location={[ubicacion.lat, ubicacion.lng]} />
          )}

          {puntosPolyline.length > 1 && (
            <Polyline
              positions={puntosPolyline}
              color="#FF8C42"
              weight={5}
              opacity={0.9}
            />
          )}

          {ubicacion && (
            <Marker
              position={[ubicacion.lat, ubicacion.lng]}
              icon={L.divIcon({
                html: `<div style="background:${
                  usuario.color || "#FF8C42"
                };width:22px;height:22px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px rgba(0,0,0,0.2);animation:pulse 1.5s infinite;"></div>`,
                iconSize: [22, 22],
              })}
            >
              <Popup>
                <strong>{usuario.nombre}</strong>
                <br />
                📍 {ubicacion.lat.toFixed(6)}, {ubicacion.lng.toFixed(6)}
                <br />
                🕒 {new Date().toLocaleTimeString()}
              </Popup>
            </Marker>
          )}

          {casitas.map((casita) => (
            <Marker
              key={casita.id}
              position={[casita.lat, casita.lng]}
              icon={L.divIcon({
                html: `<div style="background:#FF8C42;width:24px;height:24px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;">🏠</div>`,
                iconSize: [24, 24],
              })}
            >
              <Popup>
                <strong>🏠 {casita.nombre}</strong>
                <br />
                {casita.direccion || "Sin dirección"}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <style>{`
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes fadeOut { 0% { opacity: 1; } 70% { opacity: 1; } 100% { opacity: 0; visibility: hidden; } }
        @keyframes slideDown { 0% { transform: translateY(-100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#0f172a",
  },
  header: {
    backgroundColor: "#1e293b",
    padding: "12px 16px",
    borderBottom: "2px solid #FF8C42",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titulo: { margin: 0, fontSize: "16px", color: "#FF8C42", fontWeight: "bold" },
  headerIcons: { display: "flex", gap: "12px" },
  iconButton: {
    background: "transparent",
    border: "none",
    color: "#FF8C42",
    fontSize: "18px",
    cursor: "pointer",
    position: "relative",
    padding: "4px",
  },
  badge: {
    position: "absolute",
    top: "-5px",
    right: "-8px",
    background: "#ef4444",
    color: "#fff",
    fontSize: "9px",
    borderRadius: "50%",
    padding: "2px 5px",
  },
  usuarioInfo: { margin: "8px 0 0 0", fontSize: "11px", color: "#94a3b8" },
  gpsBadge: {
    background: "#22c55e",
    color: "#0f172a",
    padding: "2px 6px",
    borderRadius: "12px",
    fontSize: "9px",
    marginLeft: "8px",
  },
  grabandoBadge: {
    background: "#FF8C42",
    color: "#0f172a",
    padding: "2px 6px",
    borderRadius: "12px",
    fontSize: "9px",
    marginLeft: "8px",
  },
  menuDropdown: {
    position: "absolute",
    top: "70px",
    right: "16px",
    background: "#1e293b",
    borderRadius: "8px",
    overflow: "hidden",
    zIndex: 100,
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    border: "1px solid #334155",
  },
  menuItem: {
    display: "block",
    width: "100%",
    padding: "10px 16px",
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "13px",
    textAlign: "left",
    cursor: "pointer",
  },
  panelTematicas: {
    display: "flex",
    gap: "6px",
    padding: "8px 12px",
    background: "#1e293b",
    borderBottom: "1px solid #334155",
    flexWrap: "wrap",
  },
  tematicaActiva: {
    padding: "4px 8px",
    background: "#FF8C42",
    color: "#0f172a",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: "bold",
  },
  tematicaInactiva: {
    padding: "4px 8px",
    background: "#0f172a",
    color: "#94a3b8",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "10px",
  },
  controlesPrincipales: {
    padding: "10px 16px",
    background: "#1e293b",
    borderBottom: "1px solid #334155",
    display: "flex",
    gap: "10px",
  },
  botonActivarGPS: {
    flex: 1,
    padding: "10px",
    backgroundColor: "#22c55e",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px",
  },
  botonDesactivarGPS: {
    flex: 1,
    padding: "10px",
    backgroundColor: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px",
  },
  botonIniciar: {
    flex: 1,
    padding: "10px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px",
  },
  estadoRecorrido: {
    padding: "10px 16px",
    background: "#1e293b",
    borderBottom: "1px solid #334155",
  },
  statsRow: {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: "10px",
  },
  stat: { display: "flex", flexDirection: "column", alignItems: "center" },
  statVal: { fontSize: "20px", fontWeight: "bold", color: "#FF8C42" },
  statLabel: { fontSize: "9px", color: "#94a3b8" },
  botonesRecorrido: { display: "flex", gap: "10px" },
  botonGuardar: {
    flex: 1,
    padding: "8px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "12px",
  },
  botonCancelar: {
    flex: 1,
    padding: "8px",
    backgroundColor: "#64748b",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  recorridoGuardadoContainer: {
    padding: "10px 16px",
    background: "#1e293b",
    borderBottom: "1px solid #334155",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recorridoGuardadoText: {
    color: "#22c55e",
    fontSize: "12px",
    fontWeight: "bold",
  },
  botonNuevo: {
    padding: "6px 12px",
    backgroundColor: "#22c55e",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "11px",
  },
  mensajeFlotante: {
    position: "absolute",
    bottom: "80px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#22c55e",
    color: "#0f172a",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "12px",
    zIndex: 100,
    animation: "fadeOut 3s ease forwards",
    fontWeight: "bold",
  },
  errorFlotante: {
    position: "absolute",
    bottom: "80px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#ef4444",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "12px",
    zIndex: 100,
    animation: "fadeOut 3s ease forwards",
  },
  mapaWrapper: { flex: 1, position: "relative" },
};

export default DomiDashboard;
