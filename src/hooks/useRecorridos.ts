import { useState, useEffect } from "react";
import { db } from "../lib/firebase";

export const useRecorridos = () => {
  const [recorridos, setRecorridos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarRecorridos = async () => {
      const data = await db.obtenerRecorridos();
      setRecorridos(data);
      setLoading(false);
    };
    cargarRecorridos();
    db.onRecorridosChange(setRecorridos);
  }, []);

  const guardarRecorrido = async (nuevoRecorrido: any) => {
    return await db.guardarRecorrido(nuevoRecorrido);
  };

  const getRecorridosByDomi = (domiId: string) => {
    return recorridos.filter((r) => r.domiId === domiId);
  };

  return { recorridos, loading, guardarRecorrido, getRecorridosByDomi };
};
