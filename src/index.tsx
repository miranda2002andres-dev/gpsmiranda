import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// Registrar Service Worker manualmente para notificaciones
const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );
      console.log("✅ Service Worker registrado:", registration);

      if ("Notification" in window && Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        console.log("📢 Permiso de notificaciones:", permission);
      }
    } catch (error) {
      console.error("❌ Error registrando Service Worker:", error);
    }
  }
};

registerServiceWorker();

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
