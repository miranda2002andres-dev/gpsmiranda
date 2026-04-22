import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";

const CrearUsuario: React.FC = () => {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    codigo: "",
    password: "123456",
    telefono: "",
    vehiculo: "",
    color: "#FF8C42",
  });
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<any>(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<any>(null);

  // Colores predefinidos para la paleta rápida
  const coloresRapidos = [
    "#FF8C42",
    "#FF4444",
    "#44FF44",
    "#4444FF",
    "#FF69B4",
    "#9B59B6",
    "#F1C40F",
    "#1ABC9C",
    "#E67E22",
    "#C0392B",
    "#2ECC71",
    "#2980B9",
    "#8E44AD",
    "#F39C12",
    "#16A085",
    "#27AE60",
    "#D35400",
    "#7D3C98",
  ];

  useEffect(() => {
    const cargarUsuarios = async () => {
      const usuariosData = await db.obtenerUsuarios();
      const domis = usuariosData.filter(
        (u: any) => u.role === "domi" || u.rol === "domi"
      );
      setUsuarios(domis);
    };
    cargarUsuarios();
    db.onUsuariosChange((usuariosData) => {
      const domis = usuariosData.filter(
        (u: any) => u.role === "domi" || u.rol === "domi"
      );
      setUsuarios(domis);
    });
  }, []);

  const handleGuardar = async () => {
    if (!nuevoUsuario.nombre || !nuevoUsuario.codigo) {
      alert("Nombre y código son requeridos");
      return;
    }
    if (!nuevoUsuario.password || nuevoUsuario.password.length < 4) {
      alert("La contraseña debe tener al menos 4 caracteres");
      return;
    }

    if (modoEdicion && usuarioEditando) {
      const usuarioActualizado = { ...usuarioEditando, ...nuevoUsuario };
      await db.guardarUsuario(usuarioActualizado);
    } else {
      const nuevoId = Date.now().toString();
      await db.guardarUsuario({
        id: nuevoId,
        ...nuevoUsuario,
        role: "domi",
      });
    }

    setNuevoUsuario({
      nombre: "",
      codigo: "",
      password: "123456",
      telefono: "",
      vehiculo: "",
      color: "#FF8C42",
    });
    setModoEdicion(false);
    setUsuarioEditando(null);
  };

  const handleEditar = (usuario: any) => {
    setModoEdicion(true);
    setUsuarioEditando(usuario);
    setNuevoUsuario({
      nombre: usuario.nombre,
      codigo: usuario.codigo,
      password: usuario.password || "123456",
      telefono: usuario.telefono || "",
      vehiculo: usuario.vehiculo || "",
      color: usuario.color || "#FF8C42",
    });
  };

  const eliminarUsuario = async (usuario: any) => {
    await db.eliminarUsuario(usuario.codigo);
    setUsuarioAEliminar(null);
  };

  return (
    <div style={styles.container}>
      {/* Modal de confirmación para eliminar */}
      {usuarioAEliminar && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>👤</div>
            <h3 style={{ color: "#FF8C42", marginBottom: "8px" }}>
              Eliminar usuario
            </h3>
            <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
              ¿Estás seguro de eliminar a "{usuarioAEliminar.nombre}"?
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => eliminarUsuario(usuarioAEliminar)}
                style={styles.btnEliminar}
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setUsuarioAEliminar(null)}
                style={styles.btnCancelar}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.formCard}>
        <h3 style={styles.title}>
          {modoEdicion ? "✏️ Editar Usuario" : "➕ Nuevo Usuario"}
        </h3>

        <input
          placeholder="Nombre completo *"
          value={nuevoUsuario.nombre}
          onChange={(e) =>
            setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })
          }
          style={styles.input}
        />

        <input
          placeholder="Código (ej: 1001) *"
          value={nuevoUsuario.codigo}
          onChange={(e) =>
            setNuevoUsuario({ ...nuevoUsuario, codigo: e.target.value })
          }
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Contraseña * (mínimo 4)"
          value={nuevoUsuario.password}
          onChange={(e) =>
            setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })
          }
          style={styles.input}
        />

        <input
          placeholder="Teléfono"
          value={nuevoUsuario.telefono}
          onChange={(e) =>
            setNuevoUsuario({ ...nuevoUsuario, telefono: e.target.value })
          }
          style={styles.input}
        />

        <select
          value={nuevoUsuario.vehiculo}
          onChange={(e) =>
            setNuevoUsuario({ ...nuevoUsuario, vehiculo: e.target.value })
          }
          style={styles.select}
        >
          <option value="">Seleccionar vehículo</option>
          <option value="Moto">🏍️ Moto</option>
          <option value="Bicicleta">🚲 Bicicleta</option>
          <option value="Carro">🚗 Carro</option>
          <option value="Camioneta">🚚 Camioneta</option>
        </select>

        {/* Selector de color - Input color + paleta rápida */}
        <div style={styles.colorSection}>
          <label style={styles.colorLabel}>
            🎨 Color del marcador en el mapa
          </label>

          {/* Selector de color nativo del navegador */}
          <div style={styles.colorPickerContainer}>
            <input
              type="color"
              value={nuevoUsuario.color}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, color: e.target.value })
              }
              style={styles.colorPicker}
            />
            <div
              style={{
                ...styles.colorMuestra,
                backgroundColor: nuevoUsuario.color,
              }}
            />
            <span style={styles.colorTexto}>{nuevoUsuario.color}</span>
          </div>

          {/* Paleta de colores rápidos */}
          <div style={styles.paletaContainer}>
            <div style={styles.paletaTitulo}>📌 Colores rápidos</div>
            <div style={styles.paletaColores}>
              {coloresRapidos.map((color) => (
                <div
                  key={color}
                  style={{
                    ...styles.colorOption,
                    backgroundColor: color,
                    border:
                      nuevoUsuario.color === color
                        ? "3px solid white"
                        : "1px solid #334155",
                    boxShadow:
                      nuevoUsuario.color === color
                        ? "0 0 0 2px #FF8C42"
                        : "none",
                  }}
                  onClick={() =>
                    setNuevoUsuario({ ...nuevoUsuario, color: color })
                  }
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
          <button onClick={handleGuardar} style={styles.button}>
            {modoEdicion ? "💾 Actualizar Usuario" : "➕ Crear Usuario"}
          </button>
          {modoEdicion && (
            <button
              onClick={() => {
                setModoEdicion(false);
                setUsuarioEditando(null);
                setNuevoUsuario({
                  nombre: "",
                  codigo: "",
                  password: "123456",
                  telefono: "",
                  vehiculo: "",
                  color: "#FF8C42",
                });
              }}
              style={styles.buttonSecondary}
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      <h3 style={styles.title}>
        👥 Usuarios Registrados ({usuarios?.length || 0})
      </h3>
      {!usuarios || usuarios.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>👤</div>
          <div>No hay usuarios creados</div>
          <div style={{ fontSize: "12px", marginTop: "8px" }}>
            Crea el primer usuario con el formulario
          </div>
        </div>
      ) : (
        <div style={styles.usuarioList}>
          {usuarios.map((usuario) => (
            <div
              key={usuario.id}
              style={{
                ...styles.usuarioCard,
                borderLeft: `4px solid ${usuario.color || "#FF8C42"}`,
              }}
            >
              <div style={styles.usuarioNombre}>
                {usuario.nombre}
                <span
                  style={{
                    marginLeft: "8px",
                    fontSize: "10px",
                    background: "#22c55e",
                    padding: "2px 6px",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                >
                  Activo
                </span>
              </div>
              <div style={styles.usuarioInfo}>🔑 Código: {usuario.codigo}</div>
              <div style={styles.usuarioInfo}>
                🔒 Contraseña: {usuario.password || "••••••"}
              </div>
              <div style={styles.usuarioInfo}>
                📱 {usuario.telefono || "No registrado"}
              </div>
              <div style={styles.usuarioInfo}>
                🚗 {usuario.vehiculo || "No asignado"}
              </div>
              <div style={styles.usuarioInfo}>
                🎨 Color:
                <span
                  style={{
                    background: usuario.color,
                    padding: "2px 8px",
                    borderRadius: "12px",
                    marginLeft: "8px",
                    color: "#fff",
                  }}
                >
                  {usuario.color}
                </span>
              </div>
              <div style={styles.acciones}>
                <button
                  onClick={() => handleEditar(usuario)}
                  style={styles.buttonSecondary}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => setUsuarioAEliminar(usuario)}
                  style={styles.buttonDanger}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "20px",
    maxWidth: "700px",
    margin: "0 auto",
    height: "100%",
    overflowY: "auto" as const,
  },
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
  formCard: {
    background: "#1e293b",
    padding: "20px",
    borderRadius: "16px",
    marginBottom: "24px",
  },
  title: {
    color: "#FF8C42",
    marginBottom: "20px",
    fontSize: "18px",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
  },
  select: {
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
  },
  colorSection: { marginBottom: "16px" },
  colorLabel: {
    fontSize: "12px",
    color: "#94a3b8",
    marginBottom: "8px",
    display: "block",
  },
  colorPickerContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 12px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    marginBottom: "12px",
  },
  colorPicker: {
    width: "40px",
    height: "40px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    background: "transparent",
  },
  colorMuestra: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    border: "1px solid #334155",
  },
  colorTexto: {
    flex: 1,
    color: "#fff",
    fontSize: "13px",
    fontFamily: "monospace",
  },
  paletaContainer: {
    background: "#0f172a",
    borderRadius: "12px",
    padding: "12px",
    border: "1px solid #334155",
  },
  paletaTitulo: {
    fontSize: "11px",
    color: "#FF8C42",
    marginBottom: "8px",
    fontWeight: "bold",
  },
  paletaColores: { display: "flex", flexWrap: "wrap" as const, gap: "8px" },
  colorOption: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  button: {
    padding: "12px 20px",
    background: "#FF8C42",
    color: "#0f172a",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    flex: 1,
  },
  buttonSecondary: {
    padding: "8px 16px",
    background: "#334155",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  buttonDanger: {
    padding: "8px 16px",
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  usuarioList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  usuarioCard: {
    background: "#1e293b",
    borderRadius: "12px",
    padding: "16px",
    borderLeft: `4px solid #FF8C42`,
  },
  usuarioNombre: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#fff",
    marginBottom: "8px",
  },
  usuarioInfo: { fontSize: "12px", color: "#94a3b8", marginBottom: "4px" },
  acciones: { display: "flex", gap: "8px", marginTop: "12px" },
  emptyState: {
    textAlign: "center" as const,
    padding: "40px",
    color: "#94a3b8",
  },
};

export default CrearUsuario;
