import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const CAPAS_MAPA = {
  satelite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "© Esri",
    nombre: "🛰️ Satélite",
  },
  calle: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap",
    nombre: "🗺️ Calles",
  },
  oscuro: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "© CartoDB",
    nombre: "🌙 Oscuro",
  },
  relieve: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "© OpenTopoMap",
    nombre: "⛰️ Relieve",
  },
};

interface MapaBaseProps {
  ubicacion?: { lat: number; lng: number; timestamp?: string } | null;
  historial?: any[];
  zonas?: any[];
  otrosRepartidores?: any[];
  casitas?: any[];
  onMapClick?: (lat: number, lng: number) => void;
  modoCreacion?: boolean;
  onZoomToLocation?: (lat: number, lng: number) => void;
}

const MapaBase: React.FC<MapaBaseProps> = ({
  ubicacion,
  historial = [],
  zonas = [],
  otrosRepartidores = [],
  casitas = [],
  onMapClick,
  modoCreacion = false,
  onZoomToLocation,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const otrosMarkersRef = useRef<L.Marker[]>([]);
  const zonasCirclesRef = useRef<L.Circle[]>([]);
  const casitasMarkersRef = useRef<L.Marker[]>([]);
  const [capaActual, setCapaActual] = useState("satelite");

  const CARTAGENA_CENTER: [number, number] = [10.391, -75.479];

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current, {
      zoomControl: false,
    }).setView(CARTAGENA_CENTER, 13);

    L.tileLayer(CAPAS_MAPA.satelite.url, {
      attribution: CAPAS_MAPA.satelite.attribution,
      maxZoom: 20,
    }).addTo(mapInstanceRef.current);

    L.control.zoom({ position: "bottomright" }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Escuchar evento de zoom desde Admin
  useEffect(() => {
    const handleZoomToLocation = (event: any) => {
      const { lat, lng } = event.detail;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([lat, lng], 17);
        // También mostrar un popup temporal
        const popup = L.popup()
          .setLatLng([lat, lng])
          .setContent("📍 Ubicación del domi")
          .openOn(mapInstanceRef.current);
        setTimeout(() => popup.remove(), 3000);
      }
      if (onZoomToLocation) onZoomToLocation(lat, lng);
    };

    window.addEventListener("zoomToLocation", handleZoomToLocation);
    return () =>
      window.removeEventListener("zoomToLocation", handleZoomToLocation);
  }, [onZoomToLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapInstanceRef.current!.removeLayer(layer);
      }
    });

    L.tileLayer(CAPAS_MAPA[capaActual as keyof typeof CAPAS_MAPA].url, {
      attribution:
        CAPAS_MAPA[capaActual as keyof typeof CAPAS_MAPA].attribution,
      maxZoom: 20,
    }).addTo(mapInstanceRef.current);
  }, [capaActual]);

  useEffect(() => {
    if (!mapInstanceRef.current || !onMapClick) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };

    mapInstanceRef.current.on("click", handleMapClick);
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off("click", handleMapClick);
      }
    };
  }, [onMapClick]);

  useEffect(() => {
    if (!mapInstanceRef.current || !ubicacion) return;
    mapInstanceRef.current.setView([ubicacion.lat, ubicacion.lng], 17);
  }, [ubicacion]);

  useEffect(() => {
    if (!mapInstanceRef.current || !ubicacion) return;

    if (markerRef.current) markerRef.current.remove();

    const icon = L.divIcon({
      className: "ubicacion-marker",
      html: `<div style="background:#FF8C42;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(255,140,66,0.3);animation:pulse 1.5s infinite"></div>`,
      iconSize: [20, 20],
    });

    markerRef.current = L.marker([ubicacion.lat, ubicacion.lng], { icon })
      .addTo(mapInstanceRef.current)
      .bindPopup(
        `<b>📍 Tú ubicación</b><br>🕒 ${new Date(
          ubicacion.timestamp || Date.now()
        ).toLocaleTimeString()}`
      );
  }, [ubicacion]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (polylineRef.current) polylineRef.current.remove();

    if (historial.length > 1) {
      const puntos = historial.map((h) => [h.lat, h.lng] as [number, number]);
      polylineRef.current = L.polyline(puntos, {
        color: "#FF8C42",
        weight: 5,
        opacity: 0.9,
      }).addTo(mapInstanceRef.current);
    }
  }, [historial]);

  // Marcadores de otros repartidores - CADA UNO CON SU COLOR
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    otrosMarkersRef.current.forEach((m) => m.remove());
    otrosMarkersRef.current = [];

    otrosRepartidores.forEach((r) => {
      const colorDelDomi = r.color || "#FF8C42";

      const icon = L.divIcon({
        className: "repartidor-marker",
        html: `<div style="background:${colorDelDomi};width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 2px rgba(0,0,0,0.2);animation:pulse 1.5s infinite"></div>`,
        iconSize: [16, 16],
      });

      const marker = L.marker([r.lat, r.lng], { icon }).addTo(
        mapInstanceRef.current!
      ).bindPopup(`
          <b>🚚 ${r.nombre}</b><br>
          🎨 Color: <span style="background:${colorDelDomi};padding:2px 8px;border-radius:12px;color:#fff">${colorDelDomi}</span><br>
          📱 ${r.telefono || "N/A"}<br>
          🕒 ${new Date(r.timestamp).toLocaleTimeString()}
        `);

      otrosMarkersRef.current.push(marker);
    });
  }, [otrosRepartidores]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    zonasCirclesRef.current.forEach((c) => c.remove());
    zonasCirclesRef.current = [];

    zonas.forEach((zona) => {
      const centerLat = zona.centro_lat || zona.centro?.lat;
      const centerLng = zona.centro_lng || zona.centro?.lng;
      const radius = zona.radio_metros || zona.radio || 300;

      if (centerLat && centerLng) {
        const circle = L.circle([centerLat, centerLng], {
          color: zona.color || "#FF8C42",
          fillColor: zona.color || "#FF8C42",
          fillOpacity: 0.2,
          radius: radius,
        }).addTo(mapInstanceRef.current!);

        circle.bindPopup(`<b>${zona.nombre}</b><br>Radio: ${radius}m`);
        zonasCirclesRef.current.push(circle);
      }
    });
  }, [zonas]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    casitasMarkersRef.current.forEach((m) => m.remove());
    casitasMarkersRef.current = [];

    casitas.forEach((casita) => {
      const icon = L.divIcon({
        className: "casita-marker",
        html: `<div style="background:#FF8C42;width:24px;height:24px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;">🏠</div>`,
        iconSize: [24, 24],
      });

      const marker = L.marker([casita.lat, casita.lng], { icon })
        .addTo(mapInstanceRef.current!)
        .bindPopup(
          `<b>🏠 ${casita.nombre}</b><br>${casita.direccion || "Sin dirección"}`
        );

      casitasMarkersRef.current.push(marker);
    });
  }, [casitas]);

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />

      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 1000,
          background: "#1e293b",
          borderRadius: "8px",
          padding: "5px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        }}
      >
        {Object.entries(CAPAS_MAPA).map(([key, capa]) => (
          <button
            key={key}
            onClick={() => setCapaActual(key)}
            style={{
              padding: "8px 12px",
              background: capaActual === key ? "#FF8C42" : "transparent",
              color: capaActual === key ? "#0f172a" : "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              display: "block",
              width: "100%",
              textAlign: "left",
            }}
          >
            {capa.nombre}
          </button>
        ))}
      </div>

      {modoCreacion && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            zIndex: 1000,
            background: "#FF8C42",
            color: "#0f172a",
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          📍 Modo Creación - Toca el mapa
        </div>
      )}

      {ubicacion && (
        <button
          onClick={() =>
            mapInstanceRef.current?.setView([ubicacion.lat, ubicacion.lng], 17)
          }
          style={{
            position: "absolute",
            bottom: "20px",
            right: "10px",
            zIndex: 1000,
            width: "40px",
            height: "40px",
            borderRadius: "20px",
            background: "#1e293b",
            border: "none",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            fontSize: "18px",
            cursor: "pointer",
            color: "#FF8C42",
          }}
        >
          📍
        </button>
      )}

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .leaflet-control-zoom a {
          background: #1e293b !important;
          color: #FF8C42 !important;
          border: none !important;
        }
        .leaflet-control-zoom a:hover {
          background: #FF8C42 !important;
          color: #1e293b !important;
        }
      `}</style>
    </div>
  );
};

export default MapaBase;
