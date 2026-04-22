import React, { useState, useEffect } from "react";
import MapaBase from "../common/MapaBase";
import { db } from "../../lib/firebase";
import Notificaciones from "./Notificaciones";
import VerRecorridos from "./VerRecorridos";
import AsignarZonas from "./AsignarZonas";
import CrearUsuario from "./CrearUsuario";
import Casitas from "../common/Casitas";
import ChatAdmin from "./ChatAdmin";

interface AdminDashboardProps {
  onLogout: () => void;
}

// Función para obtener el nombre del barrio según coordenadas (Cartagena)
const obtenerBarrio = (lat: number, lng: number): string => {
  const barrios = [
    {
      nombre: "Centro Histórico",
      latMin: 10.418,
      latMax: 10.428,
      lngMin: -75.555,
      lngMax: -75.545,
    },
    {
      nombre: "Bocagrande",
      latMin: 10.395,
      latMax: 10.405,
      lngMin: -75.56,
      lngMax: -75.55,
    },
    {
      nombre: "Castillo San Felipe",
      latMin: 10.418,
      latMax: 10.426,
      lngMin: -75.542,
      lngMax: -75.532,
    },
    {
      nombre: "Getsemaní",
      latMin: 10.42,
      latMax: 10.428,
      lngMin: -75.55,
      lngMax: -75.542,
    },
    {
      nombre: "La Boquilla",
      latMin: 10.45,
      latMax: 10.465,
      lngMin: -75.53,
      lngMax: -75.515,
    },
    {
      nombre: "Manga",
      latMin: 10.41,
      latMax: 10.418,
      lngMin: -75.555,
      lngMax: -75.545,
    },
    {
      nombre: "El Laguito",
      latMin: 10.39,
      latMax: 10.398,
      lngMin: -75.56,
      lngMax: -75.552,
    },
  ];
  for (const barrio of barrios) {
    if (
      lat >= barrio.latMin &&
      lat <= barrio.latMax &&
      lng >= barrio.lngMin &&
      lng <= barrio.lngMax
    ) {
      return barrio.nombre;
    }
  }
  return "Zona no identificada";
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [vista, setVista] = useState("mapa");
  const [domis, setDomis] = useState<any[]>([]);
  const [domisEnVivo, setDomisEnVivo] = useState<any[]>([]);
  const [todosDomis, setTodosDomis] = useState<any[]>([]);
  const [zonas, setZonas] = useState<any[]>([]);
  const [casitas, setCasitas] = useState<any[]>([]);
  const [refrescando, setRefrescando] = useState(false);
  const [panelDesplegado, setPanelDesplegado] = useState(true);
  const [mostrarChat, setMostrarChat] = useState(false);
  const [chatUsuario, setChatUsuario] = useState<any>(null);
  const [filtroActivos, setFiltroActivos] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  // Cargar todos los domis
  useEffect(() => {
    const cargarTodosDomis = async () => {
      const usuarios = await db.obtenerUsuarios();
      const domisFiltrados = usuarios.filter(
        (u: any) => u.role === "domi" || u.rol === "domi"
      );
      setTodosDomis(domisFiltrados);
    };
    cargarTodosDomis();

    const unsubscribeUsuarios = db.onUsuariosChange((usuarios) => {
      const domisFiltrados = usuarios.filter(
        (u: any) => u.role === "domi" || u.rol === "domi"
      );
      setTodosDomis(domisFiltrados);
    });

    return () => {
      if (unsubscribeUsuarios && typeof unsubscribeUsuarios === "function")
        unsubscribeUsuarios();
    };
  }, []);

  // Cargar domis activos en tiempo real
  useEffect(() => {
    if (todosDomis.length === 0) return;

    const unsubscribeUbicaciones = db.onUbicacionesChange((ubicaciones) => {
      const formateados = Object.entries(ubicaciones)
        .filter(([id, data]: [string, any]) => data.activo === true)
        .map(([id, data]: [string, any]) => {
          const domi = todosDomis.find((d) => d.codigo === id);
          return {
            id: domi?.id || id,
            nombre: domi?.nombre || data.nombre || "Desconocido",
            codigo: domi?.codigo || id,
            telefono: domi?.telefono || "",
            color: domi?.color || "#FF8C42",
            lat: data.lat,
            lng: data.lng,
            timestamp: data.timestamp,
            barrio: obtenerBarrio(data.lat, data.lng),
            activo: true,
          };
        });
      setDomisEnVivo(formateados);
    });

    return () => {
      if (
        unsubscribeUbicaciones &&
        typeof unsubscribeUbicaciones === "function"
      )
        unsubscribeUbicaciones();
    };
  }, [todosDomis]);

  useEffect(() => {
    const cargarZonas = async () => {
      const zonasData = await db.obtenerZonas();
      setZonas(zonasData);
    };
    const cargarCasitas = async () => {
      const casitasData = await db.obtenerCasitas();
      setCasitas(casitasData);
    };
    cargarZonas();
    cargarCasitas();

    const unsubscribeZonas = db.onZonasChange(setZonas);
    const unsubscribeCasitas = db.onCasitasChange(setCasitas);

    return () => {
      if (unsubscribeZonas && typeof unsubscribeZonas === "function")
        unsubscribeZonas();
      if (unsubscribeCasitas && typeof unsubscribeCasitas === "function")
        unsubscribeCasitas();
    };
  }, []);

  const actualizar = () => {
    setRefrescando(true);
    setTimeout(() => setRefrescando(false), 1000);
  };

  const hacerZoomADomi = (lat: number, lng: number) => {
    window.dispatchEvent(
      new CustomEvent("zoomToLocation", { detail: { lat, lng } })
    );
  };

  const activarGPSDomi = async (codigo: string, nombre: string) => {
    if (
      window.confirm(
        `¿Activar el GPS de ${nombre}? Se enviará una notificación a su dispositivo.`
      )
    ) {
      if (db.activarGPSDomi) {
        await db.activarGPSDomi(codigo, "Administrador");
        alert(
          `✅ Notificación enviada a ${nombre}. El GPS se activará en su dispositivo.`
        );
      } else {
        alert(`❌ Error al activar GPS de ${nombre}`);
      }
    }
  };

  const apagarUbicacionDomi = async (codigo: string, nombre: string) => {
    if (window.confirm(`¿Desactivar el GPS de ${nombre}?`)) {
      await db.marcarInactivo(codigo);
      alert(`✅ GPS de ${nombre} desactivado`);
    }
  };

  const eliminarUsuario = async (usuario: any) => {
    if (
      window.confirm(
        `⚠️ ¿Estás seguro de eliminar a "${usuario.nombre}"? Esta acción eliminará todas sus ubicaciones y recorridos.`
      )
    ) {
      await db.eliminarUsuario(usuario.codigo);
      alert(`✅ Usuario ${usuario.nombre} eliminado correctamente`);
    }
  };

  const abrirChat = (domi: any) => {
    setChatUsuario(domi);
    setMostrarChat(true);
  };

  const domisParaLista = todosDomis.map((domi) => {
    const activo = domisEnVivo.some((d) => d.codigo === domi.codigo);
    const ubicacionActiva = domisEnVivo.find((d) => d.codigo === domi.codigo);
    return {
      ...domi,
      activo,
      lat: ubicacionActiva?.lat,
      lng: ubicacionActiva?.lng,
      barrio: ubicacionActiva?.barrio || "No disponible",
      timestamp: ubicacionActiva?.timestamp,
    };
  });

  const domisFiltrados = domisParaLista.filter(
    (d) =>
      (filtroActivos ? d.activo : true) &&
      (d.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        d.codigo.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div style={styles.container}>
      {mostrarChat && chatUsuario && (
        <ChatAdmin
          usuario={chatUsuario}
          onClose={() => setMostrarChat(false)}
          adminNombre="Administrador"
        />
      )}

      <div style={styles.header}>
        <div>
          <h2 style={styles.titulo}>👑 Panel Administración</h2>
          <p style={styles.subtitulo}>
            📍 {domisEnVivo.length} domis activos | 👥 {todosDomis.length} total
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <Notificaciones />
          <button
            onClick={actualizar}
            disabled={refrescando}
            style={styles.botonActualizar}
          >
            {refrescando ? "⏳" : "🔄"}
          </button>
          <button onClick={onLogout} style={styles.botonSalir}>
            Salir
          </button>
        </div>
      </div>

      <div style={styles.tabs}>
        <button
          onClick={() => setVista("mapa")}
          style={vista === "mapa" ? styles.tabActivo : styles.tabInactivo}
        >
          🗺️ MAPA EN VIVO
        </button>
        <button
          onClick={() => setVista("domis")}
          style={vista === "domis" ? styles.tabActivo : styles.tabInactivo}
        >
          👥 DOMIS ({todosDomis.length})
        </button>
        <button
          onClick={() => setVista("zonas")}
          style={vista === "zonas" ? styles.tabActivo : styles.tabInactivo}
        >
          🎯 ZONAS
        </button>
        <button
          onClick={() => setVista("casitas")}
          style={vista === "casitas" ? styles.tabActivo : styles.tabInactivo}
        >
          🏠 CASITAS
        </button>
        <button
          onClick={() => setVista("recorridos")}
          style={vista === "recorridos" ? styles.tabActivo : styles.tabInactivo}
        >
          📋 RECORRIDOS
        </button>
      </div>

      {vista === "mapa" && (
        <div style={styles.mapaWrapper}>
          <MapaBase
            otrosRepartidores={domisEnVivo}
            zonas={zonas}
            casitas={casitas}
          />

          <div style={styles.listaFlotante}>
            <div
              style={styles.listaHeader}
              onClick={() => setPanelDesplegado(!panelDesplegado)}
            >
              <h4 style={{ color: "#FF8C42", margin: 0, cursor: "pointer" }}>
                🟢 DOMIS ({domisEnVivo.length} activos / {todosDomis.length}{" "}
                total)
              </h4>
              <span style={styles.flecha}>{panelDesplegado ? "▲" : "▼"}</span>
            </div>
            {panelDesplegado && (
              <div style={styles.listaContent}>
                <div style={styles.filtrosPanel}>
                  <input
                    type="text"
                    placeholder="🔍 Buscar domi..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={styles.buscador}
                  />
                  <div style={styles.filtroToggle}>
                    <button
                      onClick={() => setFiltroActivos(true)}
                      style={{
                        ...styles.filtroBtn,
                        background: filtroActivos ? "#FF8C42" : "#334155",
                        color: filtroActivos ? "#0f172a" : "#94a3b8",
                      }}
                    >
                      🟢 Solo Activos
                    </button>
                    <button
                      onClick={() => setFiltroActivos(false)}
                      style={{
                        ...styles.filtroBtn,
                        background: !filtroActivos ? "#FF8C42" : "#334155",
                        color: !filtroActivos ? "#0f172a" : "#94a3b8",
                      }}
                    >
                      👥 Todos
                    </button>
                  </div>
                </div>

                {domisFiltrados.length === 0 ? (
                  <div style={styles.sinActivos}>
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>
                      📍
                    </div>
                    <p>No hay domis registrados</p>
                  </div>
                ) : (
                  domisFiltrados.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        ...styles.domiItem,
                        borderLeft: `4px solid ${d.color || "#FF8C42"}`,
                        opacity: d.activo ? 1 : 0.7,
                      }}
                    >
                      <div style={styles.domiNombre}>
                        <strong>{d.nombre}</strong>
                        <span style={styles.domiCodigo}>#{d.codigo}</span>
                        {d.activo ? (
                          <span style={styles.activoBadge}>🟢 Activo</span>
                        ) : (
                          <span style={styles.inactivoBadge}>⚫ Inactivo</span>
                        )}
                      </div>
                      <div style={styles.domiBarrio}>🏘️ {d.barrio}</div>
                      {d.activo && d.lat && d.lng && (
                        <>
                          <div style={styles.domiUbicacion}>
                            📍 {d.lat.toFixed(5)}, {d.lng.toFixed(5)}
                          </div>
                          <div style={styles.domiHora}>
                            🕒 {new Date(d.timestamp).toLocaleTimeString()}
                          </div>
                        </>
                      )}
                      {!d.activo && (
                        <div style={styles.domiInactivo}>
                          ⚠️ GPS desactivado
                        </div>
                      )}
                      <div style={styles.domiAcciones}>
                        {d.activo && d.lat && d.lng && (
                          <button
                            onClick={() => hacerZoomADomi(d.lat, d.lng)}
                            style={styles.botonZoom}
                          >
                            🔍 Zoom
                          </button>
                        )}
                        <button
                          onClick={() => abrirChat(d)}
                          style={styles.botonChat}
                        >
                          💬 Chat
                        </button>
                        {!d.activo && (
                          <button
                            onClick={() => activarGPSDomi(d.codigo, d.nombre)}
                            style={styles.botonActivar}
                          >
                            🟢 Activar
                          </button>
                        )}
                        {d.activo && (
                          <button
                            onClick={() =>
                              apagarUbicacionDomi(d.codigo, d.nombre)
                            }
                            style={styles.botonApagar}
                          >
                            🔴 Apagar
                          </button>
                        )}
                        <button
                          onClick={() => eliminarUsuario(d)}
                          style={styles.botonEliminar}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {vista === "domis" && <CrearUsuario />}
      {vista === "zonas" && <AsignarZonas />}
      {vista === "casitas" && <Casitas />}
      {vista === "recorridos" && <VerRecorridos />}
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "2px solid #FF8C42",
    flexWrap: "wrap",
    gap: "10px",
  },
  titulo: { margin: 0, fontSize: "18px", color: "#FF8C42" },
  subtitulo: { margin: "4px 0 0", fontSize: "11px", color: "#94a3b8" },
  botonActualizar: {
    padding: "6px 12px",
    backgroundColor: "#334155",
    color: "#FF8C42",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  botonSalir: {
    padding: "6px 12px",
    backgroundColor: "transparent",
    color: "#FF8C42",
    border: "1px solid #FF8C42",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  tabs: {
    display: "flex",
    backgroundColor: "#1e293b",
    padding: "8px 16px",
    gap: "8px",
    overflowX: "auto",
  },
  tabActivo: {
    padding: "8px 16px",
    backgroundColor: "#FF8C42",
    color: "#0f172a",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  tabInactivo: {
    padding: "8px 16px",
    backgroundColor: "transparent",
    color: "#94a3b8",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  mapaWrapper: { flex: 1, position: "relative" },
  listaFlotante: {
    position: "absolute",
    top: "10px",
    left: "10px",
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    minWidth: "300px",
    maxWidth: "340px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
    zIndex: 1000,
    border: "1px solid #334155",
    overflow: "hidden",
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
  },
  listaHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    cursor: "pointer",
    borderBottom: "1px solid #334155",
    backgroundColor: "#0f172a",
  },
  flecha: { color: "#FF8C42", fontSize: "12px" },
  listaContent: { flex: 1, overflowY: "auto", padding: "8px" },
  filtrosPanel: { marginBottom: "12px", padding: "0 4px" },
  buscador: {
    width: "100%",
    padding: "8px",
    marginBottom: "8px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "12px",
  },
  filtroToggle: { display: "flex", gap: "8px", marginBottom: "8px" },
  filtroBtn: {
    flex: 1,
    padding: "6px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "bold",
  },
  sinActivos: {
    textAlign: "center",
    color: "#94a3b8",
    padding: "20px",
    fontSize: "12px",
  },
  domiItem: {
    padding: "10px",
    borderBottom: "1px solid #334155",
    marginBottom: "8px",
    borderRadius: "8px",
    backgroundColor: "#0f172a",
  },
  domiNombre: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
    flexWrap: "wrap",
    gap: "4px",
    fontSize: "13px",
    color: "#fff",
  },
  domiCodigo: {
    fontSize: "9px",
    color: "#FF8C42",
    backgroundColor: "rgba(255,140,66,0.2)",
    padding: "2px 6px",
    borderRadius: "10px",
  },
  activoBadge: {
    fontSize: "8px",
    color: "#22c55e",
    backgroundColor: "rgba(34,197,94,0.2)",
    padding: "2px 6px",
    borderRadius: "10px",
  },
  inactivoBadge: {
    fontSize: "8px",
    color: "#64748b",
    backgroundColor: "rgba(100,116,139,0.2)",
    padding: "2px 6px",
    borderRadius: "10px",
  },
  domiBarrio: { fontSize: "10px", color: "#22c55e", marginBottom: "4px" },
  domiUbicacion: {
    fontSize: "9px",
    color: "#94a3b8",
    marginBottom: "4px",
    fontFamily: "monospace",
  },
  domiHora: { fontSize: "8px", color: "#64748b", marginBottom: "8px" },
  domiInactivo: { fontSize: "9px", color: "#f59e0b", marginBottom: "8px" },
  domiAcciones: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    marginTop: "4px",
  },
  botonZoom: {
    padding: "4px 8px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "10px",
  },
  botonChat: {
    padding: "4px 8px",
    backgroundColor: "#8b5cf6",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "10px",
  },
  botonActivar: {
    padding: "4px 8px",
    backgroundColor: "#22c55e",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "10px",
  },
  botonApagar: {
    padding: "4px 8px",
    backgroundColor: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "10px",
  },
  botonEliminar: {
    padding: "4px 8px",
    backgroundColor: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "10px",
  },
};

export default AdminDashboard;
