import React, { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useLeafletContext } from '@react-leaflet/core';
import L from 'leaflet';
import LocationMarker from './LocationMarker';
import pinIconAzul from '../assets/icons/Icono-Ubicacion-Azul.svg';

// Importar estilos de Leaflet requeridos
import 'leaflet/dist/leaflet.css';

// Conector interno para garantizar acceso a la instancia del MarkerClusterGroup
function ClusterGroupConnector({ onGroupReady }) {
  const context = useLeafletContext();
  useEffect(() => {
    if (context.layerContainer && onGroupReady) {
      onGroupReady(context.layerContainer);
    }
  }, [context, onGroupReady]);
  return null;
}

// Controlador reactivo para centrar y aplicar zoom en el mapa
function MapController({ 
  center, 
  zoom, 
  searchSelection, 
  markersMapRef, 
  clusterGroupRef 
}) {
  const map = useMap();
  const lastHandledSearchRef = useRef(null);

  // 1. Manejo de cambios estándar de center/zoom (ej. Botón Ir a Montevideo, Usar mi ubicación, Clic en pin)
  useEffect(() => {
    if (center && (!searchSelection || searchSelection === lastHandledSearchRef.current)) {
      const targetZoom = (zoom !== undefined && zoom !== null) ? zoom : map.getZoom();
      map.setView(center, targetZoom, {
        animate: true,
        duration: 1.2
      });
    }
  }, [center, zoom, map]);

  // 2. Manejo inteligente de selección desde búsqueda
  useEffect(() => {
    if (!searchSelection || !searchSelection.location) return;
    if (searchSelection === lastHandledSearchRef.current) return;
    lastHandledSearchRef.current = searchSelection;

    const local = searchSelection.location;
    if (!local.lat || !local.lng) return;

    const clusterGroup = clusterGroupRef.current;
    const targetLatLng = [local.lat, local.lng];

    // Si había un cluster spiderfied anteriormente, replegarlo
    if (clusterGroup && clusterGroup._spiderfied) {
      clusterGroup._spiderfied.unspiderfy();
    }

    // Buscar el marcador Leaflet asociado a este local
    let marker = markersMapRef.current.get(local.id);
    if (!marker && clusterGroup && typeof clusterGroup.getLayers === 'function') {
      const allLayers = clusterGroup.getLayers();
      marker = allLayers.find(m => m.locationId === local.id || m.options?.locationId === local.id);
      if (marker) {
        markersMapRef.current.set(local.id, marker);
      }
    }

    // Determinar el nivel de zoom óptimo inicial:
    // parentClusterZoom es el nivel máximo de zoom en el que este marcador comparte cluster con otros.
    // Para mostrarlo individualmente, se requiere zoom >= parentClusterZoom + 1.
    // Usamos como base DETAIL_ZOOM (15), sin superar el maxZoom del mapa (18).
    let targetZoom = 15;
    if (marker && marker.__parent && typeof marker.__parent._zoom === 'number') {
      const parentClusterZoom = marker.__parent._zoom;
      targetZoom = Math.min(18, Math.max(15, parentClusterZoom + 1));
    }

    // Función de verificación post-animación:
    // Comprueba si el marcador continúa agrupado y ajusta el zoom o aplica spiderfy según corresponda
    const checkAndEnsureUnclustered = () => {
      if (!marker || !clusterGroup) return;

      const visibleParent = clusterGroup.getVisibleParent(marker);

      // Si el visibleParent no es el propio marcador, sigue agrupado en un cluster
      if (visibleParent && visibleParent !== marker) {
        const currentZoom = map.getZoom();
        if (currentZoom < 18) {
          // Aún hay margen de zoom: aumentamos el zoom de a 1 nivel para buscar la separación mínima
          const nextZoom = Math.min(18, currentZoom + 1);
          map.setView(targetLatLng, nextZoom, { animate: true, duration: 0.5 });
          
          map.once('moveend', () => {
            const finalParent = clusterGroup.getVisibleParent(marker);
            if (finalParent && finalParent !== marker) {
              // Si aún en zoom 18 permanece agrupado (mismas coordenadas), desplegamos con spiderfy
              if (typeof finalParent.spiderfy === 'function') {
                finalParent.spiderfy();
              }
            }
          });
        } else {
          // Ya estamos en zoom máximo 18 (locales con coordenadas idénticas o muy cercanas):
          // Desplegar marcadores individualmente con spiderfy
          if (typeof visibleParent.spiderfy === 'function') {
            visibleParent.spiderfy();
          }
        }
      }
    };

    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    const isAlreadyAtTarget = currentCenter.distanceTo(targetLatLng) < 1 && currentZoom === targetZoom;

    if (isAlreadyAtTarget) {
      checkAndEnsureUnclustered();
    } else {
      map.once('moveend', checkAndEnsureUnclustered);
      map.setView(targetLatLng, targetZoom, {
        animate: true,
        duration: 1.2
      });
    }

    return () => {
      map.off('moveend', checkAndEnsureUnclustered);
    };
  }, [searchSelection, map, markersMapRef, clusterGroupRef]);

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

export default function MapView({ 
  locations, 
  selectedLocation, 
  searchSelection,
  center, 
  zoom, 
  onMarkerClick 
}) {
  const selectedLocationRef = useRef(selectedLocation);
  selectedLocationRef.current = selectedLocation;

  const clusterGroupRef = useRef(null);
  const markersMapRef = useRef(new Map());

  const handleGroupReady = useCallback((group) => {
    clusterGroupRef.current = group;
  }, []);

  const handleRegisterMarker = useCallback((id, markerInstance) => {
    if (markerInstance) {
      markerInstance.locationId = id;
      markersMapRef.current.set(id, markerInstance);
    } else {
      markersMapRef.current.delete(id);
    }
  }, []);

  // Refrescar clusters inmediatamente ante cualquier cambio en el local seleccionado
  useEffect(() => {
    selectedLocationRef.current = selectedLocation;
    if (!selectedLocation && clusterGroupRef.current && clusterGroupRef.current._spiderfied) {
      clusterGroupRef.current._spiderfied.unspiderfy();
    }
    if (clusterGroupRef.current && typeof clusterGroupRef.current.refreshClusters === 'function') {
      clusterGroupRef.current.refreshClusters();
    }
  }, [selectedLocation]);

  // Función para crear iconos de cluster personalizados y estilizados con la identidad visual
  const createClusterCustomIcon = useCallback((cluster) => {
    const count = cluster.getChildCount();
    const childMarkers = cluster.getAllChildMarkers();
    const currentSelected = selectedLocationRef.current;

    const isSelectedCluster = Boolean(
      currentSelected && 
      childMarkers.some(m => m.locationId === currentSelected.id || m.options?.locationId === currentSelected.id)
    );

    return L.divIcon({
      html: `<span>${count}</span>`,
      className: `custom-cluster-icon ${isSelectedCluster ? 'is-selected' : ''}`,
      iconSize: L.point(40, 40, true)
    });
  }, []);

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
          url={`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${import.meta.env.VITE_CARTO_API_KEY}`}
        />

        {/* Agrupación de marcadores (Clustering) */}
        <MarkerClusterGroup 
          ref={clusterGroupRef}
          chunkedLoading 
          iconCreateFunction={createClusterCustomIcon}
          showCoverageOnHover={false}
          spiderfyOnMaxZoom={true}
        >
          <ClusterGroupConnector onGroupReady={handleGroupReady} />
          {mapLocations.map((local) => (
            <LocationMarker
              key={local.id}
              location={local}
              isSelected={selectedLocation && selectedLocation.id === local.id}
              onClick={onMarkerClick}
              onRegisterMarker={handleRegisterMarker}
            />
          ))}
        </MarkerClusterGroup>

        {/* Orquestación de animación de cámara */}
        <MapController 
          center={center} 
          zoom={zoom} 
          searchSelection={searchSelection}
          markersMapRef={markersMapRef}
          clusterGroupRef={clusterGroupRef}
        />

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
