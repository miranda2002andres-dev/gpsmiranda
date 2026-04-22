import React, { useState, useEffect } from "react";
import Login from "./components/common/Login";
import AdminDashboard from "./components/admin/AdminDashboard";
import DomiDashboard from "./components/domi/DomiDashboard";

interface Usuario {
  id: string;
  nombre: string;
  email?: string;
  codigo?: string;
  role: string;
  rol?: string;
  color?: string;
}

function App() {
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);

  useEffect(() => {
    // Solicitar permiso de notificaciones al cargar la app
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("📢 Permiso de notificaciones:", permission);
      });
    }

    const usuarioGuardado = localStorage.getItem("usuario_actual");
    if (usuarioGuardado) {
      try {
        setUsuarioActual(JSON.parse(usuarioGuardado));
      } catch (e) {
        console.error("Error parsing usuario:", e);
      }
    }
  }, []);

  const handleLogin = (usuario: Usuario) => {
    setUsuarioActual(usuario);
    localStorage.setItem("usuario_actual", JSON.stringify(usuario));
  };

  const handleLogout = () => {
    setUsuarioActual(null);
    localStorage.removeItem("usuario_actual");
  };

  if (!usuarioActual) {
    return <Login onLogin={handleLogin} />;
  }

  const userRole = usuarioActual.role || usuarioActual.rol;
  if (userRole === "admin") {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return <DomiDashboard usuario={usuarioActual} onLogout={handleLogout} />;
}

export default App;
