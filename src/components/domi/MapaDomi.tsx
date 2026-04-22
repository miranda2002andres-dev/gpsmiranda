import React from "react";
import MapaBase from "../common/MapaBase";

interface MapaDomiProps {
  ubicacion: any;
  historial: any[];
  zonas: any[];
  casitas: any[];
}

const MapaDomi: React.FC<MapaDomiProps> = ({
  ubicacion,
  historial,
  zonas,
  casitas,
}) => {
  return (
    <MapaBase
      ubicacion={ubicacion}
      historial={historial}
      zonas={zonas}
      casitas={casitas}
    />
  );
};

export default MapaDomi;
