import React, { useState, useEffect, useRef } from "react";
import { db } from "../../lib/firebase";

interface ChatDomiProps {
  usuario: any;
  onClose: () => void;
}

interface Mensaje {
  id: string;
  texto: string;
  remitente: string;
  nombre: string;
  timestamp: number;
  leido: boolean;
  imagenUrl?: string;
  tieneImagen?: boolean;
}

const ChatDomi: React.FC<ChatDomiProps> = ({ usuario, onClose }) => {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviandoImagen, setEnviandoImagen] = useState(false);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = db.onMensajesChange(
      usuario.id,
      (nuevosMensajes: Mensaje[]) => {
        setMensajes(nuevosMensajes);
      }
    );
    db.marcarMensajesLeidos(usuario.id);
    return () => {
      if (unsubscribe && typeof unsubscribe === "function") unsubscribe();
    };
  }, [usuario.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim()) return;
    setEnviando(true);
    await db.enviarMensaje(usuario.id, nuevoMensaje, "domi", usuario.nombre);
    setNuevoMensaje("");
    setEnviando(false);
  };

  const optimizarImagen = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Redimensionar si es muy grande
          let width = img.width;
          let height = img.height;
          const maxSize = 800;

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height * maxSize) / width;
              width = maxSize;
            } else {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          // Comprimir a calidad 0.7
          const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(optimizedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const enviarImagen = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen es muy grande (máx 5MB)");
      return;
    }

    setEnviandoImagen(true);
    setImagenPreview("Cargando...");

    try {
      const imagenOptimizada = await optimizarImagen(file);
      setImagenPreview(imagenOptimizada);
      await db.enviarMensaje(
        usuario.id,
        "",
        "domi",
        usuario.nombre,
        imagenOptimizada
      );
    } catch (error) {
      console.error("Error enviando imagen:", error);
      alert("Error al enviar la imagen");
    } finally {
      setEnviandoImagen(false);
      setImagenPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatearHora = (timestamp: number) => {
    const fecha = new Date(timestamp);
    return `${fecha.getHours().toString().padStart(2, "0")}:${fecha
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const formatearFecha = (timestamp: number) => {
    const fecha = new Date(timestamp);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    if (fecha.toDateString() === hoy.toDateString()) return "Hoy";
    if (fecha.toDateString() === ayer.toDateString()) return "Ayer";
    return fecha.toLocaleDateString();
  };

  // Agrupar mensajes por fecha
  const mensajesAgrupados: { fecha: string; mensajes: Mensaje[] }[] = [];
  mensajes.forEach((msg) => {
    const fechaStr = formatearFecha(msg.timestamp);
    const grupo = mensajesAgrupados.find((g) => g.fecha === fechaStr);
    if (grupo) {
      grupo.mensajes.push(msg);
    } else {
      mensajesAgrupados.push({ fecha: fechaStr, mensajes: [msg] });
    }
  });

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <div>
            <h3 style={{ color: "#FF8C42", margin: 0 }}>💬 Chat con Admin</h3>
            <p
              style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 0" }}
            >
              {usuario.nombre} | {usuario.codigo}
            </p>
          </div>
          <button onClick={onClose} style={styles.btnCerrar}>
            ✕
          </button>
        </div>

        <div style={styles.chatContainer}>
          {mensajes.length === 0 ? (
            <div style={styles.sinMensajes}>
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>💬</div>
              <p>No hay mensajes aún</p>
            </div>
          ) : (
            mensajesAgrupados.map((grupo, idx) => (
              <div key={idx}>
                <div style={styles.separadorFecha}>{grupo.fecha}</div>
                {grupo.mensajes.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      ...styles.mensaje,
                      alignSelf:
                        msg.remitente === "domi" ? "flex-end" : "flex-start",
                      backgroundColor:
                        msg.remitente === "domi" ? "#FF8C42" : "#1e293b",
                      color: msg.remitente === "domi" ? "#0f172a" : "#fff",
                    }}
                  >
                    <div style={styles.mensajeRemitente}>
                      {msg.remitente === "domi"
                        ? `🚚 ${msg.nombre}`
                        : `👑 ${msg.nombre}`}
                    </div>
                    {msg.tieneImagen && msg.imagenUrl && (
                      <img
                        src={msg.imagenUrl}
                        alt="Imagen"
                        style={styles.mensajeImagen}
                        onClick={() => window.open(msg.imagenUrl, "_blank")}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (
                            e.target as HTMLImageElement
                          ).parentElement!.innerHTML +=
                            '<div style="color:red">⚠️ Imagen no disponible</div>';
                        }}
                      />
                    )}
                    {msg.texto && (
                      <div style={styles.mensajeTexto}>{msg.texto}</div>
                    )}
                    <div style={styles.mensajeHora}>
                      {formatearHora(msg.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
          {imagenPreview && imagenPreview !== "Cargando..." && (
            <div style={styles.previewContainer}>
              <img
                src={imagenPreview}
                alt="Preview"
                style={styles.previewImagen}
              />
              <div style={styles.previewTexto}>Enviando imagen...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputContainer}>
          <input
            type="text"
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && enviarMensaje()}
            placeholder="Escribe un mensaje..."
            style={styles.input}
            disabled={enviando}
          />
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={enviarImagen}
            style={{ display: "none" }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={enviandoImagen}
            style={styles.botonImagen}
          >
            {enviandoImagen ? "⏳" : "📷"}
          </button>
          <button
            onClick={enviarMensaje}
            disabled={enviando}
            style={styles.botonEnviar}
          >
            {enviando ? "⏳" : "📤"}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.85)",
    zIndex: 3000,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    background: "#1e293b",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "400px",
    height: "550px",
    maxHeight: "80%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    border: "1px solid #334155",
  },
  modalHeader: {
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
    fontSize: "18px",
    padding: "4px 8px",
  },
  chatContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  separadorFecha: {
    textAlign: "center",
    fontSize: "10px",
    color: "#64748b",
    margin: "8px 0",
    padding: "4px 8px",
    background: "#0f172a",
    borderRadius: "12px",
    alignSelf: "center",
  },
  sinMensajes: {
    textAlign: "center",
    color: "#94a3b8",
    padding: "30px 16px",
  },
  mensaje: {
    maxWidth: "80%",
    padding: "10px 14px",
    borderRadius: "12px",
    marginBottom: "4px",
  },
  mensajeRemitente: {
    fontSize: "10px",
    fontWeight: "bold",
    marginBottom: "4px",
    opacity: 0.8,
  },
  mensajeTexto: {
    fontSize: "13px",
    wordBreak: "break-word",
    lineHeight: 1.4,
  },
  mensajeImagen: {
    maxWidth: "200px",
    maxHeight: "200px",
    borderRadius: "8px",
    marginTop: "8px",
    cursor: "pointer",
    objectFit: "cover",
  },
  mensajeHora: {
    fontSize: "9px",
    opacity: 0.7,
    marginTop: "4px",
    textAlign: "right",
  },
  inputContainer: {
    display: "flex",
    padding: "10px",
    borderTop: "1px solid #334155",
    gap: "8px",
    backgroundColor: "#0f172a",
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "20px",
    color: "#fff",
    fontSize: "13px",
    outline: "none",
  },
  botonImagen: {
    width: "38px",
    height: "38px",
    borderRadius: "19px",
    background: "#3b82f6",
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
  },
  botonEnviar: {
    width: "38px",
    height: "38px",
    borderRadius: "19px",
    background: "#FF8C42",
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  previewContainer: {
    padding: "8px",
    background: "#0f172a",
    borderRadius: "8px",
    alignSelf: "flex-end",
    maxWidth: "200px",
  },
  previewImagen: {
    width: "100%",
    borderRadius: "8px",
  },
  previewTexto: {
    fontSize: "10px",
    color: "#94a3b8",
    textAlign: "center",
    marginTop: "4px",
  },
};

export default ChatDomi;
