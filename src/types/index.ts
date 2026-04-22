export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  password: string;
  role: "admin" | "domi";
  activo: boolean;
  telefono?: string;
  vehiculo?: string;
  codigo?: string;
  color?: string;
}

export interface Zona {
  id: string;
  nombre: string;
  color: string;
  centro_lat: number;
  centro_lng: number;
  radio_metros: number;
  domisAsignados: string[];
  creadaPor: string;
  fechaCreacion: string;
}

export interface PuntoUbicacion {
  lat: number;
  lng: number;
  timestamp: string;
  precision?: number;
}

export interface Recorrido {
  id: string;
  domiId: string;
  domiNombre: string;
  fecha: string;
  puntos: PuntoUbicacion[];
  distancia: number;
  duracion: number;
  zonasVisitadas: string[];
}

export interface Casita {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  direccion: string;
  fechaCreacion: string;
}
