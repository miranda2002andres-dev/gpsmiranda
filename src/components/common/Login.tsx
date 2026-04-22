import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";

interface LoginProps {
  onLogin: (usuario: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [codigo, setCodigo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState("codigo");

  useEffect(() => {
    const cargarUsuarios = async () => {
      const users = await db.obtenerUsuarios();
      if (users.length === 0) {
        const defaultUsers = [
          {
            id: "1",
            nombre: "Carlos Pérez",
            codigo: "1001",
            password: "123456",
            color: "#FF4444",
            telefono: "3001234567",
            vehiculo: "Moto",
            role: "domi",
          },
          {
            id: "2",
            nombre: "Ana Gómez",
            codigo: "1002",
            password: "123456",
            color: "#44FF44",
            telefono: "3107654321",
            vehiculo: "Bicicleta",
            role: "domi",
          },
          {
            id: "3",
            nombre: "Luis Martínez",
            codigo: "1003",
            password: "123456",
            color: "#4444FF",
            telefono: "3209876543",
            vehiculo: "Carro",
            role: "domi",
          },
        ];
        for (const u of defaultUsers) {
          await db.guardarUsuario(u);
        }
      }
    };
    cargarUsuarios();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (modo === "admin") {
      if (codigo === "ADMIN" && password === "Admin2025") {
        onLogin({
          id: "admin",
          nombre: "Administrador",
          role: "admin",
          codigo: "ADMIN",
        });
        setLoading(false);
        return;
      }
      setError("Código o contraseña de admin incorrectos");
      setLoading(false);
      return;
    }

    const usuarios = await db.obtenerUsuarios();
    const usuario = usuarios.find(
      (u: any) => u.codigo === codigo && u.password === password
    );

    if (usuario) {
      onLogin(usuario);
    } else {
      setError(`Usuario "${codigo}" no encontrado o contraseña incorrecta`);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.titulo}>⚡ INTERRAPIDISIMOS</h1>
        <p style={styles.slogan}>TE LA PONEMOS RE FÁCIL</p>
        <div style={styles.toggle}>
          <button
            onClick={() => setModo("codigo")}
            style={
              modo === "codigo" ? styles.toggleActivo : styles.toggleInactivo
            }
          >
            🚚 DOMI
          </button>
          <button
            onClick={() => setModo("admin")}
            style={
              modo === "admin" ? styles.toggleActivo : styles.toggleInactivo
            }
          >
            👑 ADMIN
          </button>
        </div>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder={
              modo === "admin" ? "Código Admin" : "Código (ej: 1001)"
            }
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.boton} disabled={loading}>
            {loading ? "Cargando..." : "INGRESAR ⚡"}
          </button>
        </form>
        <div style={styles.test}>
          <p>
            <strong>🧪 ACCESOS:</strong>
          </p>
          <p>
            👑 ADMIN: <strong>ADMIN</strong> / <strong>Admin2025</strong>
          </p>
          <p>
            🚚 DOMI 1: <strong>1001</strong> / <strong>123456</strong>
          </p>
          <p>
            🚚 DOMI 2: <strong>1002</strong> / <strong>123456</strong>
          </p>
          <p>
            🚚 DOMI 3: <strong>1003</strong> / <strong>123456</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a",
  },
  card: {
    background: "#1e293b",
    padding: "32px",
    borderRadius: "24px",
    width: "90%",
    maxWidth: "400px",
    border: "1px solid #FF8C42",
  },
  titulo: {
    color: "#FF8C42",
    textAlign: "center",
    fontSize: "24px",
    marginBottom: "8px",
  },
  slogan: {
    color: "#94a3b8",
    textAlign: "center",
    fontSize: "11px",
    marginBottom: "24px",
  },
  toggle: {
    display: "flex",
    gap: "8px",
    marginBottom: "24px",
    background: "#0f172a",
    borderRadius: "12px",
    padding: "4px",
  },
  toggleActivo: {
    flex: 1,
    padding: "8px",
    background: "#FF8C42",
    color: "#0f172a",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  toggleInactivo: {
    flex: 1,
    padding: "8px",
    background: "transparent",
    color: "#94a3b8",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "16px",
  },
  boton: {
    width: "100%",
    padding: "12px",
    background: "#FF8C42",
    color: "#0f172a",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  error: {
    padding: "10px",
    background: "#ef444420",
    border: "1px solid #ef4444",
    borderRadius: "8px",
    color: "#ef4444",
    marginBottom: "16px",
    textAlign: "center",
    fontSize: "12px",
  },
  test: {
    marginTop: "20px",
    padding: "12px",
    background: "#0f172a",
    borderRadius: "8px",
    fontSize: "11px",
    color: "#94a3b8",
    textAlign: "center",
  },
};

export default Login;
