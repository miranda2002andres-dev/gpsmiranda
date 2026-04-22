import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  onValue,
  push,
  get,
  remove,
} from "firebase/database";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

// TU CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyAUDQYICaCg2cL-0rKfmbqFLFLFDdow",
  authDomain: "interpáridisimos-gps.firebaseapp.com",
  databaseURL: "https://interrapidisimos-gps-default-rtdb.firebaseio.com",
  projectId: "interpáridisimos-gps",
  storageBucket: "interpáridisimos-gps.firebasestorage.app",
  messagingSenderId: "691863318955",
  appId: "1:691863318955:web:7135a9126f37519e75e2ee",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
let messaging: any = null;

// Inicializar messaging solo si está soportado
const initMessaging = async () => {
  if (await isSupported()) {
    messaging = getMessaging(app);
  }
};
initMessaging();

// ============ FUNCIONES PRINCIPALES ============

export const db = {
  // USUARIOS
  guardarUsuario: async (usuario: any) => {
    const usuarioRef = ref(database, `usuarios/${usuario.codigo}`);
    await set(usuarioRef, {
      id: usuario.id,
      nombre: usuario.nombre,
      codigo: usuario.codigo,
      password: usuario.password,
      color: usuario.color || "#FF8C42",
      telefono: usuario.telefono || "",
      vehiculo: usuario.vehiculo || "Moto",
      role: usuario.role || "domi",
      fechaCreacion: new Date().toISOString(),
      sesionActiva: true,
    });
    return true;
  },

  obtenerUsuarios: async () => {
    const snapshot = await get(ref(database, "usuarios"));
    const data = snapshot.val();
    return data ? Object.values(data) : [];
  },

  onUsuariosChange: (callback: (usuarios: any[]) => void) => {
    onValue(ref(database, "usuarios"), (snapshot) => {
      const data = snapshot.val();
      callback(data ? Object.values(data) : []);
    });
  },

  eliminarUsuario: async (codigo: string) => {
    await remove(ref(database, `ubicaciones_vivo/${codigo}`));
    await remove(ref(database, `usuarios/${codigo}`));
    return true;
  },

  // UBICACIONES
  guardarUbicacion: async (
    codigo: string,
    lat: number,
    lng: number,
    nombre: string
  ) => {
    await set(ref(database, `ubicaciones_vivo/${codigo}`), {
      lat,
      lng,
      timestamp: Date.now(),
      nombre,
      activo: true,
    });
    return true;
  },

  onUbicacionesChange: (callback: (ubicaciones: any) => void) => {
    onValue(ref(database, "ubicaciones_vivo"), (snapshot) => {
      const data = snapshot.val() || {};
      const activos: any = {};
      Object.entries(data).forEach(([key, value]: [string, any]) => {
        const esReciente =
          value && value.timestamp && Date.now() - value.timestamp < 30000;
        if (value && value.activo === true && esReciente) {
          activos[key] = value;
        }
      });
      callback(activos);
    });
  },

  marcarInactivo: async (codigo: string) => {
    await set(ref(database, `ubicaciones_vivo/${codigo}/activo`), false);
    return true;
  },

  mantenerSesionActiva: async (codigo: string) => {
    await set(ref(database, `usuarios/${codigo}/sesionActiva`), true);
    await set(ref(database, `usuarios/${codigo}/ultimaActividad`), Date.now());
    return true;
  },

  cerrarSesion: async (codigo: string) => {
    await set(ref(database, `usuarios/${codigo}/sesionActiva`), false);
    await db.marcarInactivo(codigo);
    return true;
  },

  // ACTIVAR GPS REMOTO
  activarGPSRemoto: async (codigo: string, nombreAdmin: string) => {
    await set(ref(database, `comandos/${codigo}`), {
      comando: "activar_gps",
      admin: nombreAdmin,
      timestamp: Date.now(),
      procesado: false,
    });
    return true;
  },

  onComandoPendiente: (codigo: string, callback: (comando: any) => void) => {
    const comandoRef = ref(database, `comandos/${codigo}`);
    onValue(comandoRef, (snapshot) => {
      const data = snapshot.val();
      if (data && !data.procesado) {
        callback(data);
        set(ref(database, `comandos/${codigo}/procesado`), true);
      }
    });
  },

  // NOTIFICACIONES PUSH
  obtenerTokenFCM: async (usuarioId: string, tipo: "domi" | "admin") => {
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

      // Esperar a que el Service Worker esté listo
      await navigator.serviceWorker.ready;

      // Obtener token de FCM
      if (messaging) {
        const token = await getToken(messaging, {
          vapidKey:
            "BG3WUwPHb5uaLajj4jzkpW43gUMRmPdbsySRMMUa9yoA5gRWSF_v3keUVZzblItSu-Oy_gFCuM10ksMkIgrsJ1",
        });

        // Guardar token en la base de datos
        await set(ref(database, `pushTokens/${tipo}/${usuarioId}`), token);
        console.log(`✅ Token FCM guardado para ${usuarioId}`);
        return token;
      }
      return null;
    } catch (error) {
      console.error("Error obteniendo token FCM:", error);
      return null;
    }
  },

  enviarNotificacionPush: async (
    token: string,
    titulo: string,
    cuerpo: string,
    data?: any
  ) => {
    // Notificación del navegador (funciona incluso si la app está minimizada)
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(titulo, {
        body: cuerpo,
        icon: "/icon-192x192.png",
        badge: "/icon-96x96.png",
        vibrate: [200, 100, 200],
        data: data || {},
      });
      console.log(`📢 Notificación mostrada: ${titulo}`);
      return true;
    }
    return false;
  },

  notificarUsuario: async (
    usuarioId: string,
    tipo: "domi" | "admin",
    titulo: string,
    cuerpo: string
  ) => {
    try {
      const snapshot = await get(
        ref(database, `pushTokens/${tipo}/${usuarioId}`)
      );
      const token = snapshot.val();
      if (token) {
        await db.enviarNotificacionPush(token, titulo, cuerpo);
      }
    } catch (error) {
      console.error("Error enviando notificación:", error);
    }
  },

  // CHAT
  enviarMensaje: async (
    domiId: string,
    mensaje: string,
    remitente: string,
    nombreRemitente: string,
    imagenBase64?: string
  ) => {
    const mensajeId = Date.now().toString();
    const nuevoMensaje: any = {
      id: mensajeId,
      texto: mensaje || "",
      remitente: remitente,
      nombre: nombreRemitente,
      timestamp: Date.now(),
      leido: false,
    };

    if (imagenBase64) {
      nuevoMensaje.imagenUrl = imagenBase64;
      nuevoMensaje.tieneImagen = true;
    }

    await set(
      ref(database, `chats/${domiId}/mensajes/${mensajeId}`),
      nuevoMensaje
    );
    await set(
      ref(database, `chats/${domiId}/ultimoMensaje`),
      mensaje || "📷 Imagen"
    );

    if (remitente === "admin") {
      // Incrementar contador de no leídos para el domi
      const noLeidosRef = ref(database, `chats/${domiId}/noLeidos`);
      const snapshot = await get(noLeidosRef);
      const actual = snapshot.val() || 0;
      await set(noLeidosRef, actual + 1);

      // ENVIAR NOTIFICACIÓN PUSH AL DOMI
      await db.notificarUsuario(
        domiId,
        "domi",
        `💬 ${nombreRemitente}`,
        mensaje || "📷 Imagen"
      );
    } else {
      // Incrementar contador de no leídos para el admin
      const adminNoLeidosRef = ref(database, `chats/admin/noLeidos`);
      const snapshot = await get(adminNoLeidosRef);
      const actual = snapshot.val() || 0;
      await set(adminNoLeidosRef, actual + 1);

      // ENVIAR NOTIFICACIÓN PUSH AL ADMIN
      await db.notificarUsuario(
        "admin",
        "admin",
        `💬 ${nombreRemitente}`,
        mensaje || "📷 Imagen"
      );
    }

    return true;
  },

  onMensajesChange: (domiId: string, callback: (mensajes: any[]) => void) => {
    const chatRef = ref(database, `chats/${domiId}/mensajes`);
    onValue(chatRef, (snapshot) => {
      const data = snapshot.val() || {};
      const mensajesArray = Object.values(data);
      mensajesArray.sort((a: any, b: any) => a.timestamp - b.timestamp);
      callback(mensajesArray);
    });
  },

  marcarMensajesLeidos: async (domiId: string, esAdmin: boolean = false) => {
    if (esAdmin) {
      await set(ref(database, `chats/admin/noLeidos`), 0);
    } else {
      await set(ref(database, `chats/${domiId}/noLeidos`), 0);
    }
    return true;
  },

  onNoLeidosChange: (
    domiId: string,
    callback: (noLeidos: number) => void,
    esAdmin: boolean = false
  ) => {
    const noLeidosRef = esAdmin
      ? ref(database, `chats/admin/noLeidos`)
      : ref(database, `chats/${domiId}/noLeidos`);
    onValue(noLeidosRef, (snapshot) => {
      callback(snapshot.val() || 0);
    });
  },

  // ZONAS
  guardarZona: async (zona: any) => {
    await set(ref(database, `zonas/${zona.id}`), zona);
    return true;
  },

  obtenerZonas: async () => {
    const snapshot = await get(ref(database, "zonas"));
    const data = snapshot.val();
    return data ? Object.values(data) : [];
  },

  onZonasChange: (callback: (zonas: any[]) => void) => {
    onValue(ref(database, "zonas"), (snapshot) => {
      const data = snapshot.val();
      callback(data ? Object.values(data) : []);
    });
  },

  eliminarZona: async (id: string) => {
    await remove(ref(database, `zonas/${id}`));
    return true;
  },

  // CASITAS
  guardarCasita: async (casita: any) => {
    await set(ref(database, `casitas/${casita.id}`), casita);
    return true;
  },

  obtenerCasitas: async () => {
    const snapshot = await get(ref(database, "casitas"));
    const data = snapshot.val();
    return data ? Object.values(data) : [];
  },

  onCasitasChange: (callback: (casitas: any[]) => void) => {
    onValue(ref(database, "casitas"), (snapshot) => {
      const data = snapshot.val();
      callback(data ? Object.values(data) : []);
    });
  },

  eliminarCasita: async (id: string) => {
    await remove(ref(database, `casitas/${id}`));
    return true;
  },

  // RECORRIDOS
  guardarRecorrido: async (recorrido: any) => {
    const nuevoId = push(ref(database, "recorridos")).key;
    await set(ref(database, `recorridos/${nuevoId}`), {
      ...recorrido,
      id: nuevoId,
      fecha: recorrido.fecha || new Date().toISOString(),
    });
    return true;
  },

  obtenerRecorridos: async () => {
    const snapshot = await get(ref(database, "recorridos"));
    const data = snapshot.val();
    return data ? Object.values(data) : [];
  },

  getEstadisticas: async (repartidorId: string) => {
    const snapshot = await get(ref(database, "recorridos"));
    const recorridos = snapshot.val() || {};
    let totalKm = 0,
      totalTiempo = 0,
      recorridosLista: any[] = [];

    Object.entries(recorridos).forEach(([id, r]: [string, any]) => {
      if (r.repartidor_id === repartidorId || r.domiId === repartidorId) {
        totalKm += (r.distancia || 0) / 1000;
        totalTiempo += r.duracion || 0;
        recorridosLista.push({ id, ...r });
      }
    });

    return {
      totalKm: Math.round(totalKm),
      totalTiempo: Math.floor(totalTiempo / 60),
      totalRecorridos: recorridosLista.length,
      recorridos: recorridosLista.sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      ),
    };
  },

  eliminarRecorrido: async (id: string) => {
    await remove(ref(database, `recorridos/${id}`));
    return true;
  },

  eliminarTodosRecorridos: async () => {
    await set(ref(database, "recorridos"), {});
    return true;
  },
};

export default database;
