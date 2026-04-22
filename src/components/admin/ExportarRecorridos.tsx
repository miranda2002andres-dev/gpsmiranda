import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ExportarRecorridos: React.FC = () => {
  const [domis, setDomis] = useState<any[]>([]);
  const [domiSeleccionado, setDomiSeleccionado] = useState("");
  const [recorridos, setRecorridos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

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

  const exportarPDF = () => {
    const domiNombre =
      domis.find((d) => d.id === domiSeleccionado)?.nombre || "domi";
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(255, 140, 66);
    doc.text("INTERRAPIDISIMOS - Reporte de Recorridos", 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(`Domi: ${domiNombre}`, 14, 35);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 45);
    if (fechaInicio || fechaFin) {
      doc.text(
        `Filtro: ${fechaInicio || "inicio"} - ${fechaFin || "fin"}`,
        14,
        55
      );
    }

    const tableData = recorridosFiltrados.map((r) => [
      new Date(r.fecha).toLocaleDateString(),
      new Date(r.fecha).toLocaleTimeString(),
      `${(r.distancia / 1000).toFixed(2)} km`,
      `${Math.floor(r.duracion / 60)} min ${r.duracion % 60} seg`,
      `${r.puntos?.length || 0} pts`,
    ]);

    autoTable(doc, {
      startY: 65,
      head: [["Fecha", "Hora", "Distancia", "Duración", "Puntos"]],
      body: tableData,
      theme: "dark",
      headStyles: { fillColor: [255, 140, 66], textColor: [0, 0, 0] },
      styles: { textColor: [255, 255, 255], lineColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [30, 41, 59] },
    });

    const totalKm = recorridosFiltrados.reduce(
      (sum, r) => sum + r.distancia / 1000,
      0
    );
    const totalTiempo = recorridosFiltrados.reduce(
      (sum, r) => sum + r.duracion / 60,
      0
    );

    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(
      `Total recorridos: ${recorridosFiltrados.length}`,
      14,
      (doc as any).lastAutoTable.finalY + 10
    );
    doc.text(
      `Total distancia: ${totalKm.toFixed(2)} km`,
      14,
      (doc as any).lastAutoTable.finalY + 20
    );
    doc.text(
      `Total tiempo: ${Math.floor(totalTiempo)} min`,
      14,
      (doc as any).lastAutoTable.finalY + 30
    );

    doc.save(`recorridos_${domiNombre}_${new Date().toLocaleDateString()}.pdf`);
  };

  const exportarCSV = () => {
    const domiNombre =
      domis.find((d) => d.id === domiSeleccionado)?.nombre || "domi";
    const headers = [
      "Fecha",
      "Hora",
      "Distancia (km)",
      "Duración (min)",
      "Puntos",
    ];
    const rows = recorridosFiltrados.map((r) => [
      new Date(r.fecha).toLocaleDateString(),
      new Date(r.fecha).toLocaleTimeString(),
      (r.distancia / 1000).toFixed(2),
      Math.floor(r.duracion / 60),
      r.puntos?.length || 0,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recorridos_${domiNombre}_${new Date().toLocaleDateString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
          </div>

          <div style={styles.botones}>
            <button
              onClick={exportarPDF}
              disabled={cargando || recorridosFiltrados.length === 0}
              style={styles.btnPDF}
            >
              📄 Exportar PDF
            </button>
            <button
              onClick={exportarCSV}
              disabled={cargando || recorridosFiltrados.length === 0}
              style={styles.btnCSV}
            >
              📊 Exportar CSV
            </button>
          </div>

          {cargando && <p style={styles.cargando}>Cargando recorridos...</p>}

          {!cargando && recorridosFiltrados.length === 0 && (
            <p style={styles.vacio}>No hay recorridos para exportar</p>
          )}

          {!cargando && recorridosFiltrados.length > 0 && (
            <div style={styles.resumen}>
              <p>📋 {recorridosFiltrados.length} recorridos encontrados</p>
              <p>
                📏 Total:{" "}
                {recorridosFiltrados
                  .reduce((sum, r) => sum + r.distancia / 1000, 0)
                  .toFixed(2)}{" "}
                km
              </p>
              <p>
                ⏱️ Total:{" "}
                {Math.floor(
                  recorridosFiltrados.reduce(
                    (sum, r) => sum + r.duracion / 60,
                    0
                  )
                )}{" "}
                minutos
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "20px",
    maxWidth: "600px",
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
  filtrosFechas: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap" as const,
  },
  input: {
    padding: "8px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "6px",
    color: "#fff",
    flex: 1,
  },
  botones: { display: "flex", gap: "12px", marginBottom: "20px" },
  btnPDF: {
    flex: 1,
    padding: "12px",
    background: "#FF8C42",
    color: "#0f172a",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  btnCSV: {
    flex: 1,
    padding: "12px",
    background: "#22c55e",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  cargando: { textAlign: "center" as const, color: "#94a3b8", padding: "40px" },
  vacio: { textAlign: "center" as const, color: "#94a3b8", padding: "40px" },
  resumen: {
    background: "#1e293b",
    padding: "16px",
    borderRadius: "12px",
    marginTop: "20px",
    textAlign: "center" as const,
    color: "#fff",
  },
};

export default ExportarRecorridos;
