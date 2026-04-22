// Servicio para enviar notificaciones push usando FCM HTTP v1 API

const FCM_URL =
  "https://fcm.googleapis.com/v1/projects/interrapidisimos-gps/messages:send";

// Función para obtener el access token usando la cuenta de servicio
async function getAccessToken(): Promise<string> {
  // Para desarrollo, usaremos un token simulado
  // En producción, necesitarás la cuenta de servicio
  return "mock_token";
}

export interface NotificacionData {
  titulo: string;
  cuerpo: string;
  imagen?: string;
  data?: Record<string, string>;
}

export async function enviarNotificacionPush(
  token: string,
  notificacion: NotificacionData
): Promise<boolean> {
  try {
    const accessToken = await getAccessToken();

    const body = {
      message: {
        token: token,
        notification: {
          title: notificacion.titulo,
          body: notificacion.cuerpo,
          ...(notificacion.imagen && { image: notificacion.imagen }),
        },
        ...(notificacion.data && { data: notificacion.data }),
        android: {
          priority: "high",
          notification: {
            sound: "default",
            channel_id: "interrapidisimos",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
            },
          },
        },
        webpush: {
          headers: {
            Urgency: "high",
          },
          notification: {
            icon: "/icon-192x192.png",
            badge: "/icon-96x96.png",
            vibrate: [200, 100, 200],
            requireInteraction: true,
          },
        },
      },
    };

    const response = await fetch(FCM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      console.log("✅ Notificación push enviada");
      return true;
    } else {
      const error = await response.text();
      console.error("❌ Error enviando notificación:", error);
      return false;
    }
  } catch (error) {
    console.error("❌ Error en notificación push:", error);
    return false;
  }
}

// Función para registrar el token del dispositivo
export async function registrarTokenPush(
  usuarioId: string,
  tipo: "domi" | "admin"
): Promise<string | null> {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    console.log("Notificaciones no soportadas");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Permiso de notificaciones denegado");
      return null;
    }

    // Obtener el registration del Service Worker
    const registration = await navigator.serviceWorker.ready;

    // Aquí normalmente obtendrías el token de FCM
    // Por ahora usamos un token simulado
    const mockToken = `${tipo}_${usuarioId}_${Date.now()}`;

    console.log(`✅ Token registrado para ${tipo}: ${mockToken}`);
    return mockToken;
  } catch (error) {
    console.error("Error registrando token:", error);
    return null;
  }
}
