import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import LocationMarker from './LocationMarker';
import pinIconAzul from '../assets/icons/Icono-Ubicacion-Azul.svg';

// Importar estilos de Leaflet requeridos
import 'leaflet/dist/leaflet.css';

// Controlador reactivo para centrar y aplicar zoom en el mapa
function MapController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      const targetZoom = (zoom !== undefined && zoom !== null) ? zoom : map.getZoom();
      map.setView(center, targetZoom, {
        animate: true,
        duration: 1.2
      });
    }
  }, [center, zoom, map]);

  return null;
}

// Subcomponente para manejar el redimensionamiento del mapa y compatibilidad con Safari
function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Invalidad tamaño al montar
    map.invalidateSize();

    // Invalidad de nuevo tras pequeños timeouts
    const timer1 = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    const timer2 = setTimeout(() => {
      map.invalidateSize();
    }, 300);

    // Invalidad al cambiar el tamaño de la ventana
    const handleResize = () => {
      map.invalidateSize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  return null;
}

// Función para crear iconos de cluster personalizados y estilizados con la identidad visual
const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `<span>${count}</span>`,
    className: 'custom-cluster-icon',
    iconSize: L.point(40, 40, true)
  });
};

export default function MapView({ 
  locations, 
  selectedLocation, 
  center, 
  zoom, 
  onMarkerClick 
}) {
  // Filtrar solo los locales que tienen coordenadas válidas para mostrar en el mapa
  const mapLocations = locations.filter(loc => loc.hasCoordinates);

  return (
    <div className="map-container-wrapper" id="map-container-wrapper-id">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        className="map-instance" 
        id="map-instance-id"
        zoomControl={true}
        minZoom={6}
        maxZoom={18}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Agrupación de marcadores (Clustering) */}
        <MarkerClusterGroup 
          chunkedLoading 
          iconCreateFunction={createClusterCustomIcon}
          showCoverageOnHover={false}
          spiderfyOnMaxZoom={true}
        >
          {mapLocations.map((local) => (
            <LocationMarker
              key={local.id}
              location={local}
              isSelected={selectedLocation && selectedLocation.id === local.id}
              onClick={onMarkerClick}
            />
          ))}
        </MarkerClusterGroup>

        {/* Orquestación de animación de cámara */}
        <MapController center={center} zoom={zoom} />

        {/* Manejo de redimensionamiento para compatibilidad con Safari */}
        <MapResizeHandler />
      </MapContainer>

      {/* Contador flotante de puntos de venta (solo desktop) */}
      <div className="map-counter-pill" id="map-counter-pill-box">
        <img 
          src={pinIconAzul} 
          alt="Pin" 
          className="counter-icon" 
          id="counter-icon-img"
        />
        <span className="counter-text" id="counter-text-label">
          Mostrando {mapLocations.length} puntos de venta
        </span>
      </div>
    </div>
  );
}
