import React, { useState, useEffect } from "react";
import MapaBase from "../common/MapaBase";
import { db } from "../../lib/firebase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const VerRecorridos: React.FC = () => {
  const [domis, setDomis] = useState<any[]>([]);
  const [domiSeleccionado, setDomiSeleccionado] = useState("");
  const [recorridoActual, setRecorridoActual] = useState<any>(null);
  const [recorridos, setRecorridos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [recorridoAEliminar, setRecorridoAEliminar] = useState<string | null>(
    null
  );
  const [puntoSeleccionado, setPuntoSeleccionado] = useState<any>(null);

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

  const cargarRecorridos = async () => {
    if (!domiSeleccionado) return;
    setCargando(true);
    const stats = await db.getEstadisticas(domiSeleccionado);
    setRecorridos(stats.recorridos || []);
    setCargando(false);
  };

  useEffect(() => {
    cargarRecorridos();
  }, [domiSeleccionado]);

  const recorridosFiltrados = recorridos.filter((r) => {
    if (fechaInicio && new Date(r.fecha) < new Date(fechaInicio)) return false;
    if (fechaFin && new Date(r.fecha) > new Date(fechaFin)) return false;
    return true;
  });

  const eliminarRecorrido = async (id: string) => {
    await db.eliminarRecorrido(id);
    cargarRecorridos();
    setRecorridoAEliminar(null);
    setMostrarModal(false);
  };

  const eliminarTodosRecorridos = async () => {
    if (
      window.confirm(
        "⚠️ ¿Estás seguro de eliminar TODOS los recorridos de este domi?"
      )
    ) {
      for (const r of recorridosFiltrados) {
        await db.eliminarRecorrido(r.id);
      }
      cargarRecorridos();
      alert(`✅ Se eliminaron ${recorridosFiltrados.length} recorridos`);
    }
  };

  const exportarPDFConMapa = async (recorrido: any) => {
    setGenerando(true);
    const domiNombre =
      domis.find((d) => d.id === domiSeleccionado)?.nombre || "domi";

    const loadingMsg = document.createElement("div");
    loadingMsg.textContent = "📸 Generando PDF con mapa...";
    loadingMsg.style.cssText =
      "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#FF8C42;color:#000;padding:12px 24px;border-radius:30px;z-index:9999;font-weight:bold";
    document.body.appendChild(loadingMsg);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mapaElement = document.querySelector(".leaflet-container");
      if (!mapaElement) throw new Error("No se encontró el mapa");

      const canvas = await html2canvas(mapaElement as HTMLElement, {
        scale: 3,
        backgroundColor: "#0f172a",
        logging: false,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      doc.setFontSize(22);
      doc.setTextColor(255, 140, 66);
      doc.text("INTERRAPIDISIMOS", 20, 25);
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(`Recorrido de: ${domiNombre}`, 20, 40);
      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      doc.text(
        `📅 Fecha: ${new Date(recorrido.fecha).toLocaleString()}`,
        20,
        55
      );
      doc.text(
        `📏 Distancia: ${(recorrido.distancia / 1000).toFixed(2)} km`,
        20,
        63
      );
      doc.text(
        `⏱️ Duración: ${Math.floor(recorrido.duracion / 60)} min ${
          recorrido.duracion % 60
        } sec`,
        20,
        71
      );
      doc.text(`📍 Puntos: ${recorrido.puntos?.length || 0}`, 20, 79);

      const imgWidth = 250;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgX = (297 - imgWidth) / 2;
      doc.addImage(
        imgData,
        "PNG",
        imgX,
        95,
        imgWidth,
        Math.min(imgHeight, 150)
      );
      doc.save(
        `recorrido_${domiNombre}_${new Date(
          recorrido.fecha
        ).toLocaleDateString()}.pdf`
      );
    } catch (error) {
      console.error(error);
      alert("Error al generar el PDF: " + (error as Error).message);
    } finally {
      document.body.removeChild(loadingMsg);
      setGenerando(false);
    }
  };

  const formatearHora = (timestamp: string | number) => {
    const fecha = new Date(timestamp);
    return fecha.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatearFechaHora = (timestamp: string | number) => {
    const fecha = new Date(timestamp);
    return fecha.toLocaleString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const puntosConHorarios =
    recorridoActual?.puntos?.map((p: any, idx: number) => ({
      ...p,
      indice: idx + 1,
      hora: formatearHora(p.timestamp),
      fechaHora: formatearFechaHora(p.timestamp),
    })) || [];

  return (
    <div style={styles.container}>
      {mostrarModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗑️</div>
            <h3 style={{ color: "#FF8C42", marginBottom: "8px" }}>
              Eliminar recorrido
            </h3>
            <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
              ¿Estás seguro de eliminar este recorrido?
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() =>
                  recorridoAEliminar && eliminarRecorrido(recorridoAEliminar)
                }
                style={styles.btnEliminar}
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => {
                  setMostrarModal(false);
                  setRecorridoAEliminar(null);
                }}
                style={styles.btnCancelar}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.filtros}>
        <select
          value={domiSeleccionado}
          onChange={(e) => setDomiSeleccionado(e.target.value)}
          style={styles.select}
        >
          <option value="">-- Seleccionar domi --</option>
          {domis.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre} ({d.codigo})
            </option>
          ))}
        </select>
      </div>

      {domiSeleccionado && (
        <>
          <div style={styles.filtrosFechas}>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              style={styles.input}
              placeholder="Fecha inicio"
            />
            <span style={{ color: "#94a3b8" }}>a</span>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              style={styles.input}
              placeholder="Fecha fin"
            />
            <button
              onClick={() => {
                setFechaInicio("");
                setFechaFin("");
              }}
              style={styles.btnLimpiar}
            >
              Limpiar
            </button>
            <button
              onClick={eliminarTodosRecorridos}
              style={styles.btnEliminarTodos}
              disabled={recorridosFiltrados.length === 0}
            >
              🗑️ Eliminar Todos ({recorridosFiltrados.length})
            </button>
          </div>

          <div style={styles.contenido}>
            <div style={styles.lista}>
              <h4 style={{ color: "#FF8C42", marginBottom: "12px" }}>
                📋 Recorridos ({recorridosFiltrados.length})
              </h4>
              {cargando ? (
                <p style={styles.cargando}>Cargando...</p>
              ) : recorridosFiltrados.length === 0 ? (
                <p style={styles.vacio}>No hay recorridos</p>
              ) : (
                recorridosFiltrados.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setRecorridoActual(r)}
                    style={{
                      ...styles.recorridoItem,
                      background:
                        recorridoActual?.id === r.id ? "#FF8C4220" : "#0f172a",
                      borderLeft:
                        recorridoActual?.id === r.id
                          ? "4px solid #FF8C42"
                          : "4px solid transparent",
                    }}
                  >
                    <div style={styles.recorridoFecha}>
                      <strong>
                        📅 {new Date(r.fecha).toLocaleDateString()}
                      </strong>
                      <span>{new Date(r.fecha).toLocaleTimeString()}</span>
                    </div>
                    <div style={styles.recorridoInfo}>
                      📏 {(r.distancia / 1000).toFixed(2)} km • ⏱️{" "}
                      {Math.floor(r.duracion / 60)} min {r.duracion % 60} seg •
                      📍 {r.puntos?.length || 0} puntos
                    </div>
                    <div style={styles.recorridoBotones}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportarPDFConMapa(r);
                        }}
                        disabled={generando}
                        style={styles.btnPDF}
                      >
                        {generando ? "⏳" : "📸 PDF"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecorridoAEliminar(r.id);
                          setMostrarModal(true);
                        }}
                        style={styles.btnEliminar}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={styles.mapa}>
              {recorridoActual ? (
                <>
                  <MapaBase historial={recorridoActual.puntos || []} />
                  {/* Panel de horarios */}
                  <div style={styles.panelHorarios}>
                    <div style={styles.panelHorariosHeader}>
                      <strong>
                        🕒 Puntos del recorrido ({puntosConHorarios.length})
                      </strong>
                      <button
                        onClick={() => setPuntoSeleccionado(null)}
                        style={styles.btnCerrarHorarios}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={styles.listaHorarios}>
                      {puntosConHorarios.map((p: any) => (
                        <div
                          key={p.indice}
                          style={{
                            ...styles.itemHorario,
                            background:
                              puntoSeleccionado?.indice === p.indice
                                ? "#FF8C4220"
                                : "transparent",
                          }}
                        >
                          <span style={styles.indicePunto}>#{p.indice}</span>
                          <span style={styles.horaPunto}>🕒 {p.hora}</span>
                          <span style={styles.coordPunto}>
                            📍 {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div style={styles.mapaPlaceholder}>
                  <span>🗺️</span>
                  <p>Selecciona un recorrido para ver la ruta con horarios</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
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
    overflow: "hidden",
  },
  filtros: { marginBottom: "8px" },
  select: {
    padding: "10px",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#fff",
    width: "100%",
  },
  filtrosFechas: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  input: {
    padding: "8px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "6px",
    color: "#fff",
    flex: 1,
  },
  btnLimpiar: {
    padding: "8px 16px",
    background: "#334155",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  btnEliminarTodos: {
    padding: "8px 16px",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
  },
  contenido: {
    flex: 1,
    display: "flex",
    gap: "16px",
    overflow: "hidden",
    minHeight: 0,
  },
  lista: {
    width: "360px",
    overflowY: "auto",
    background: "#1e293b",
    borderRadius: "12px",
    padding: "12px",
    flexShrink: 0,
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
  recorridoInfo: { fontSize: "11px", color: "#94a3b8", marginBottom: "8px" },
  recorridoBotones: { display: "flex", gap: "8px", justifyContent: "flex-end" },
  btnPDF: {
    padding: "4px 8px",
    background: "#FF8C42",
    color: "#000",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "bold",
  },
  btnEliminar: {
    padding: "4px 8px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "11px",
  },
  mapa: {
    flex: 1,
    background: "#0f172a",
    borderRadius: "12px",
    overflow: "hidden",
    position: "relative",
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
  cargando: { textAlign: "center", color: "#94a3b8", padding: "20px" },
  vacio: { textAlign: "center", color: "#94a3b8", padding: "20px" },
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
    textAlign: "center",
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
  // Panel de horarios
  panelHorarios: {
    position: "absolute",
    bottom: "10px",
    right: "10px",
    width: "280px",
    background: "#1e293b",
    borderRadius: "12px",
    zIndex: 1000,
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
    border: "1px solid #334155",
    overflow: "hidden",
  },
  panelHorariosHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    background: "#0f172a",
    borderBottom: "1px solid #334155",
    color: "#FF8C42",
    fontSize: "12px",
  },
  btnCerrarHorarios: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "14px",
  },
  listaHorarios: { maxHeight: "200px", overflowY: "auto", padding: "8px" },
  itemHorario: {
    padding: "6px 8px",
    fontSize: "10px",
    borderBottom: "1px solid #334155",
    display: "flex",
    gap: "8px",
    alignItems: "center",
    fontFamily: "monospace",
  },
  indicePunto: { color: "#FF8C42", fontWeight: "bold", minWidth: "35px" },
  horaPunto: { color: "#22c55e", minWidth: "65px" },
  coordPunto: {
    color: "#94a3b8",
    fontSize: "9px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};

export default VerRecorridos;
