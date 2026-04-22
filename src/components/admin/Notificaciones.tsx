import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";

const Notificaciones: React.FC = () => {
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    if (db && db.onNotificacionesChange) {
      db.onNotificacionesChange(setNotificaciones);
    }
  }, []);

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  const marcarLeida = (id: string) => {
    if (db && db.marcarNotificacionLeida) {
      db.marcarNotificacionLeida(id);
    }
  };

  return (
    <div style={styles.container}>
      <button onClick={() => setMostrar(!mostrar)} style={styles.boton}>
        🔔 {noLeidas > 0 && <span style={styles.badge}>{noLeidas}</span>}
      </button>
      {mostrar && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            <h4 style={{ color: "#FF8C42", margin: 0 }}>📢 Notificaciones</h4>
            <button onClick={() => setMostrar(false)} style={styles.btnCerrar}>
              ✕
            </button>
          </div>
          {notificaciones.length === 0 ? (
            <p style={styles.vacio}>No hay notificaciones</p>
          ) : (
            notificaciones.map((n) => (
              <div
                key={n.id}
                style={{ ...styles.notificacion, opacity: n.leida ? 0.6 : 1 }}
                onClick={() => marcarLeida(n.id)}
              >
                <div style={styles.tipo}>
                  {n.tipo === "entrada" ? "📍 ENTRADA" : "🚪 SALIDA"}
                </div>
                <div style={styles.mensaje}>
                  <strong>{n.repartidor_nombre}</strong>{" "}
                  {n.tipo === "entrada" ? "entró a" : "salió de"}{" "}
                  <strong style={{ color: "#FF8C42" }}>{n.zona_nombre}</strong>
                </div>
                <div style={styles.hora}>
                  {new Date(n.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { position: "relative" as const },
  boton: {
    background: "transparent",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    position: "relative" as const,
    padding: "8px",
    color: "#FF8C42",
  },
  badge: {
    position: "absolute" as const,
    top: "-5px",
    right: "-5px",
    background: "#ef4444",
    color: "#fff",
    fontSize: "10px",
    borderRadius: "50%",
    padding: "2px 6px",
  },
  dropdown: {
    position: "absolute" as const,
    top: "40px",
    right: "0",
    width: "320px",
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
    zIndex: 1000,
    maxHeight: "450px",
    overflow: "hidden",
    border: "1px solid #334155",
  },
  dropdownHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #334155",
    backgroundColor: "#0f172a",
  },
  btnCerrar: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "16px",
  },
  notificacionesList: {
    maxHeight: "380px",
    overflowY: "auto" as const,
  },
  notificacion: {
    padding: "12px 16px",
    borderBottom: "1px solid #334155",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  tipo: {
    fontSize: "10px",
    color: "#FF8C42",
    fontWeight: "bold",
    marginBottom: "4px",
  },
  mensaje: {
    fontSize: "12px",
    color: "#fff",
    marginBottom: "4px",
  },
  hora: {
    fontSize: "10px",
    color: "#94a3b8",
  },
  vacio: {
    textAlign: "center" as const,
    color: "#94a3b8",
    padding: "30px",
  },
};

export default Notificaciones;
