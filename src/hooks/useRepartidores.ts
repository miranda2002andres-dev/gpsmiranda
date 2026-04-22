import { useState, useEffect } from "react";
import { db } from "../lib/firebase";

export const useRepartidores = () => {
  const [repartidores, setRepartidores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarRepartidores = async () => {
      try {
        const usuarios = await db.obtenerUsuarios();
        const domis = usuarios.filter(
          (u: any) => u.role === "domi" || u.rol === "domi"
        );
        setRepartidores(domis);
      } catch (err) {
        setError("Error cargando repartidores");
      } finally {
        setLoading(false);
      }
    };
    cargarRepartidores();
    db.onUsuariosChange((usuarios) => {
      const domis = usuarios.filter(
        (u: any) => u.role === "domi" || u.rol === "domi"
      );
      setRepartidores(domis);
    });
  }, []);

  return { repartidores, loading, error };
};
