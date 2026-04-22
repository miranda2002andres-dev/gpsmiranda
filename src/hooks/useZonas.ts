import { useState, useEffect } from "react";
import { db } from "../lib/firebase";

export const useZonas = () => {
  const [zonas, setZonas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarZonas = async () => {
      const zonasData = await db.obtenerZonas();
      if (zonasData.length > 0) {
        setZonas(zonasData);
      } else {
        const zonasDefault = [
          {
            id: "1",
            nombre: "Centro Histórico",
            color: "#FF6B6B",
            centro_lat: 10.4235,
            centro_lng: -75.5505,
            radio_metros: 500,
            domisAsignados: [],
          },
          {
            id: "2",
            nombre: "Bocagrande",
            color: "#4ECDC4",
            centro_lat: 10.4005,
            centro_lng: -75.5585,
            radio_metros: 600,
            domisAsignados: [],
          },
          {
            id: "3",
            nombre: "Castillo San Felipe",
            color: "#45B7D1",
            centro_lat: 10.4225,
            centro_lng: -75.5405,
            radio_metros: 400,
            domisAsignados: [],
          },
          {
            id: "4",
            nombre: "Getsemaní",
            color: "#96CEB4",
            centro_lat: 10.4255,
            centro_lng: -75.5465,
            radio_metros: 350,
            domisAsignados: [],
          },
        ];
        setZonas(zonasDefault);
      }
      setLoading(false);
    };
    cargarZonas();
    db.onZonasChange(setZonas);
  }, []);

  return { zonas, loading };
};
