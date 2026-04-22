// src/services/fcmService.ts

// Esta función se ejecutaría desde un backend (Node.js)
// Por ahora la simulamos, pero necesitarás un servidor para esto

export async function enviarNotificacionFCM(
  token: string,
  titulo: string,
  cuerpo: string,
  data?: any
) {
  // Para desarrollo, usamos notificaciones del navegador
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(titulo, {
      body: cuerpo,
      icon: "/icon-192x192.png",
      badge: "/icon-96x96.png",
      vibrate: [200, 100, 200],
      data: data || {},
    });
    return true;
  }
  return false;
}

// Función para obtener token de FCM (desde el frontend)
export async function obtenerTokenFCM(): Promise<string | null> {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    console.log("Notificaciones no soportadas");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const registration = await navigator.serviceWorker.ready;

    // Esperar a que Firebase esté disponible
    const { getMessaging, getToken } = await import("firebase/messaging");
    const { app } = await import("../lib/firebase");

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey:
        "BG3WUwPHb5uaLajj4jzkpW43gUMRmPdbsySRMMUa9yoA5gRWSF_v3keUVZzblItSu-Oy_gFCuM10ksMkIgrsJ1",
    });

    console.log("✅ Token FCM obtenido:", token);
    return token;
  } catch (error) {
    console.error("Error obteniendo token FCM:", error);
    return null;
  }
}
