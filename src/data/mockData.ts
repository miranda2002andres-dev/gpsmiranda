import { Usuario, Zona, Recorrido, Casita } from "../types";

export const MOCK_USUARIOS: Usuario[] = [
  {
    id: "1",
    nombre: "Admin",
    email: "admin@domicilios.com",
    password: "123456",
    role: "admin",
    activo: true,
  },
  {
    id: "2",
    nombre: "Carlos Pérez",
    email: "carlos@domicilios.com",
    password: "123456",
    role: "domi",
    activo: true,
    telefono: "3001234567",
    vehiculo: "Moto",
    codigo: "1001",
    color: "#FF6B6B",
  },
  {
    id: "3",
    nombre: "Ana Gómez",
    email: "ana@domicilios.com",
    password: "123456",
    role: "domi",
    activo: true,
    telefono: "3107654321",
    vehiculo: "Bicicleta",
    codigo: "1002",
    color: "#4ECDC4",
  },
  {
    id: "4",
    nombre: "Luis Martínez",
    email: "luis@domicilios.com",
    password: "123456",
    role: "domi",
    activo: true,
    telefono: "3209876543",
    vehiculo: "Carro",
    codigo: "1003",
    color: "#45B7D1",
  },
];

export const MOCK_ZONAS: Zona[] = [
  {
    id: "1",
    nombre: "Centro Histórico",
    color: "#FF6B6B",
    centro_lat: 10.4235,
    centro_lng: -75.5505,
    radio_metros: 500,
    domisAsignados: [],
    creadaPor: "admin",
    fechaCreacion: new Date().toISOString(),
  },
  {
    id: "2",
    nombre: "Bocagrande",
    color: "#4ECDC4",
    centro_lat: 10.4005,
    centro_lng: -75.5585,
    radio_metros: 600,
    domisAsignados: [],
    creadaPor: "admin",
    fechaCreacion: new Date().toISOString(),
  },
  {
    id: "3",
    nombre: "Castillo San Felipe",
    color: "#45B7D1",
    centro_lat: 10.4225,
    centro_lng: -75.5405,
    radio_metros: 400,
    domisAsignados: [],
    creadaPor: "admin",
    fechaCreacion: new Date().toISOString(),
  },
  {
    id: "4",
    nombre: "Getsemaní",
    color: "#96CEB4",
    centro_lat: 10.4255,
    centro_lng: -75.5465,
    radio_metros: 350,
    domisAsignados: [],
    creadaPor: "admin",
    fechaCreacion: new Date().toISOString(),
  },
];

export const MOCK_RECORRIDOS: Recorrido[] = [];

export const MOCK_CASITAS: Casita[] = [];
