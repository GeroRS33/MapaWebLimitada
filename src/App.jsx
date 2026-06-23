import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import MapView from './components/MapView';
import LocationCard from './components/LocationCard';
import { loadLocationsFromExcel } from './utils/parseExcel';
import iconoMiUbicacion from './assets/icons/Icono-MiUbicacion.svg';

const URUGUAY_CENTER = [-32.5228, -55.7658];
const MONTEVIDEO_CENTER = [-34.9011, -56.1673];
const DEFAULT_ZOOM = 7;
const DETAIL_ZOOM = 15;
const CITY_ZOOM = 13;

export default function App() {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(URUGUAY_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar datos de locales al iniciar la aplicación
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await loadLocationsFromExcel();
        setLocations(data);
      } catch (err) {
        console.error('Error cargando locales:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Detectar cambio de pantalla para adaptabilidad responsiva
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Determinar valor inicial
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Seleccionar un local comercial y enfocar la cámara del mapa
  const handleSelectLocation = (local) => {
    setSelectedLocation(local);
    if (local.lat && local.lng) {
      setMapCenter([local.lat, local.lng]);
      setMapZoom(DETAIL_ZOOM);
    }
  };

  // Cerrar la tarjeta informativa
  const handleCloseCard = () => {
    setSelectedLocation(null);
  };

  // Botón rápido: Ir a Montevideo
  const handleGoToMontevideo = () => {
    setMapCenter(MONTEVIDEO_CENTER);
    setMapZoom(CITY_ZOOM);
  };

  // Botón rápido: Usar mi ubicación actual
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no está soportada por tu navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter([latitude, longitude]);
        setMapZoom(14);
      },
      (error) => {
        console.error('Error al obtener ubicación:', error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('Permiso denegado. Habilita los permisos de ubicación en tu navegador.');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('La información de ubicación no está disponible actualmente.');
            break;
          case error.TIMEOUT:
            alert('Se agotó el tiempo de espera para obtener la ubicación.');
            break;
          default:
            alert('Ocurrió un error inesperado al obtener tu ubicación.');
        }
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  return (
    <>
      <Header />
      
      <SearchBar 
        locations={locations}
        onSelectLocation={handleSelectLocation}
        onGoToMontevideo={handleGoToMontevideo}
        onUseMyLocation={handleUseMyLocation}
      />
      
      <div 
        style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
        id="app-main-content-layout"
      >
        {loading ? (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flex: 1, 
              backgroundColor: '#F4F5F7',
              color: '#2E3192',
              fontSize: '1.2rem',
              fontWeight: '500' 
            }}
            id="loading-spinner"
          >
            Cargando locales...
          </div>
        ) : (
          <>
            <MapView 
              locations={locations}
              selectedLocation={selectedLocation}
              center={mapCenter}
              zoom={mapZoom}
              onMarkerClick={handleSelectLocation}
            />
            <button 
              className="mobile-location-fab"
              onClick={handleUseMyLocation}
              id="mobile-use-my-location-fab"
              aria-label="Usar mi Ubicación"
            >
              <span>Usar mi Ubicación</span>
              <img 
                src={iconoMiUbicacion} 
                alt="Ubicación" 
                className="fab-icon" 
                id="mobile-use-my-location-fab-icon"
              />
            </button>
          </>
        )}

        {/* Tarjeta de local para Desktop / Mobile */}
        {selectedLocation && (
          <LocationCard 
            location={selectedLocation}
            onClose={handleCloseCard}
            isMobile={isMobile}
          />
        )}
      </div>
    </>
  );
}
