import { useState, useEffect, useRef } from "react";

interface Ubicacion {
  lat: number;
  lng: number;
  timestamp: string;
  precision: number;
}

export const useGeolocation = (activo: boolean = true) => {
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historial, setHistorial] = useState<Ubicacion[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const ultimoPuntoRef = useRef<Ubicacion | null>(null);
  const primeraVezRef = useRef<boolean>(true);
  const ultimoEnvioRef = useRef<number>(0);

  const calcularDistancia = (p1: Ubicacion, p2: Ubicacion): number => {
    const R = 6371e3;
    const φ1 = (p1.lat * Math.PI) / 180;
    const φ2 = (p2.lat * Math.PI) / 180;
    const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
    const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const obtenerUbicacion = () => {
    if (!navigator.geolocation) {
      setError("GPS no soportado");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const ahora = Date.now();
        const nueva: Ubicacion = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString(),
          precision: position.coords.accuracy,
        };

        setUbicacion(nueva);

        // Solo guardar en historial si se movió más de 5 metros O pasaron más de 3 segundos
        const debeGuardar =
          primeraVezRef.current ||
          (ultimoPuntoRef.current &&
            calcularDistancia(ultimoPuntoRef.current, nueva) > 5) ||
          ahora - ultimoEnvioRef.current > 3000;

        if (debeGuardar) {
          setHistorial((prev) => [...prev, nueva]);
          ultimoPuntoRef.current = nueva;
          primeraVezRef.current = false;
          ultimoEnvioRef.current = ahora;
          console.log(
            `📍 Nuevo punto guardado: ${nueva.lat.toFixed(
              6
            )}, ${nueva.lng.toFixed(6)} | Distancia: ${calcularDistancia(
              ultimoPuntoRef.current || nueva,
              nueva
            ).toFixed(2)}m`
          );
        }
        setError(null);
      },
      (err) => {
        let msg = "Error de GPS";
        if (err.code === 1) msg = "Permiso denegado";
        if (err.code === 2) msg = "Señal no disponible";
        if (err.code === 3) msg = "Tiempo de espera";
        setError(msg);
        console.error("GPS Error:", msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
    );
  };

  useEffect(() => {
    if (!activo) {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setError("GPS no soportado");
      return;
    }

    // Obtener ubicación inicial
    obtenerUbicacion();

    // Watch para cambios continuos
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const ahora = Date.now();
        const nueva: Ubicacion = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString(),
          precision: position.coords.accuracy,
        };

        setUbicacion(nueva);

        const debeGuardar =
          primeraVezRef.current ||
          (ultimoPuntoRef.current &&
            calcularDistancia(ultimoPuntoRef.current, nueva) > 5) ||
          ahora - ultimoEnvioRef.current > 3000;

        if (debeGuardar) {
          setHistorial((prev) => [...prev, nueva]);
          ultimoPuntoRef.current = nueva;
          primeraVezRef.current = false;
          ultimoEnvioRef.current = ahora;
          console.log(
            `📍 Nuevo punto en watch: ${nueva.lat.toFixed(
              6
            )}, ${nueva.lng.toFixed(6)}`
          );
        }
        setError(null);
      },
      (err) => {
        let msg = "Error de GPS";
        if (err.code === 1) msg = "Permiso denegado";
        if (err.code === 2) msg = "Señal no disponible";
        if (err.code === 3) msg = "Tiempo de espera";
        setError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
    );

    // Intervalo de respaldo cada 3 segundos
    intervalRef.current = setInterval(obtenerUbicacion, 3000);

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      primeraVezRef.current = true;
      ultimoPuntoRef.current = null;
      ultimoEnvioRef.current = 0;
    };
  }, [activo]);

  return { ubicacion, error, historial };
};
