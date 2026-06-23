import React, { useState, useEffect, useRef } from 'react';
import iconoLocal from '../assets/icons/Icono-Local.svg';
import iconoDireccion from '../assets/icons/Icono-Direccion.svg';
import iconoTelefono from '../assets/icons/Icono-Telefono.svg';
import iconoComoLlegar from '../assets/icons/Icono-ComoLlegar.svg';
import iconoDepartamento from '../assets/icons/Icono-Departamento.svg';

// Helper para calcular el tamaño de fuente responsivo del título según el largo del texto
const getTitleFontSize = (name) => {
  if (!name) return '1.45rem';
  const length = name.length;
  if (length <= 14) return '1.45rem';
  const calculated = 1.45 - (length - 14) * 0.03;
  return `${Math.max(0.95, calculated)}rem`;
};

export default function LocationCard({ location, onClose, isMobile }) {
  if (!location) return null;

  const cardRef = useRef(null);
  const touchStartY = useRef(0);
  const startTranslateY = useRef(0);
  const currentTranslateY = useRef(0);
  const isDraggingRef = useRef(false);

  const [currentSnapPoint, setCurrentSnapPoint] = useState('low');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const [displayedLocation, setDisplayedLocation] = useState(location);
  const [isExiting, setIsExiting] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const currentLoc = isMobile ? location : (displayedLocation || location);

  const googleMapsUrl = (currentLoc.lat && currentLoc.lng)
    ? `https://www.google.com/maps/dir/?api=1&destination=${currentLoc.lat},${currentLoc.lng}`
    : '#';

  const handleDirectionsClick = (e) => {
    e.stopPropagation(); // Evitar que el arrastre interfiera con botones
    if (!currentLoc.lat || !currentLoc.lng) {
      e.preventDefault();
      alert('Las coordenadas de este local no están disponibles temporalmente.');
    }
  };

  const getSnapPoints = () => {
    const cardHeight = cardRef.current ? cardRef.current.offsetHeight : window.innerHeight * 0.6;
    return {
      high: 0,
      medium: cardHeight * 0.5,
      low: Math.max(0, cardHeight - 160)
    };
  };

  // Resetear estados si cambia de mobile/desktop
  useEffect(() => {
    if (isMobile) {
      setIsExiting(false);
      setIsChanging(false);
    }
  }, [isMobile]);

  // Resetear al snap point low cuando se monta la tarjeta o cambia el local
  useEffect(() => {
    let timerId;
    let frame1Id;
    let frame2Id;

    if (isMobile) {
      setIsTransitioning(false);
      if (cardRef.current) {
        cardRef.current.style.transition = 'none';
        cardRef.current.style.transform = 'translateY(100%)';
      }

      frame1Id = requestAnimationFrame(() => {
        frame2Id = requestAnimationFrame(() => {
          if (!cardRef.current) return;
          const snaps = getSnapPoints();
          currentTranslateY.current = snaps.low;
          setCurrentSnapPoint('low');
          
          setIsTransitioning(true);
          cardRef.current.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
          cardRef.current.style.transform = `translateY(${snaps.low}px)`;
          
          timerId = setTimeout(() => {
            if (cardRef.current) {
              cardRef.current.style.transition = '';
            }
          }, 350);
        });
      });

      return () => {
        cancelAnimationFrame(frame1Id);
        cancelAnimationFrame(frame2Id);
        clearTimeout(timerId);
      };
    } else {
      // En desktop limpiamos cualquier transformación
      if (cardRef.current) {
        cardRef.current.style.transform = '';
        cardRef.current.style.transition = '';
      }
    }
  }, [isMobile, currentLoc.id]);

  // Manejar la transición de datos con desvanecimiento en desktop
  useEffect(() => {
    if (isMobile) {
      setDisplayedLocation(location);
      return;
    }

    if (location) {
      if (displayedLocation && location.id !== displayedLocation.id) {
        setIsChanging(true);
        const timer = setTimeout(() => {
          setDisplayedLocation(location);
          setIsChanging(false);
        }, 150);
        return () => clearTimeout(timer);
      } else {
        setDisplayedLocation(location);
      }
    }
  }, [location, isMobile]);

  // Cancelar la animación de salida si se selecciona una nueva locación
  useEffect(() => {
    setIsExiting(false);
  }, [location?.id]);

  // Manejar el retardo para la animación de salida en Desktop
  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(() => {
        onClose();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isExiting, onClose]);

  // Manejar el redimensionamiento de la pantalla para ajustar la posición de la tarjeta
  useEffect(() => {
    const handleResize = () => {
      if (isMobile && cardRef.current) {
        const snaps = getSnapPoints();
        const targetVal = snaps[currentSnapPoint];
        currentTranslateY.current = targetVal;
        cardRef.current.style.transform = `translateY(${targetVal}px)`;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, currentSnapPoint]);

  const handleDragStart = (clientY, target, isScrollableBody) => {
    const bodyEl = document.getElementById('location-card-body-info');
    
    // Si la tarjeta está arriba y el cuerpo scrollable tiene scroll hacia abajo, no arrastrar
    if (currentSnapPoint === 'high' && isScrollableBody && bodyEl && bodyEl.scrollTop > 0) {
      return false;
    }

    isDraggingRef.current = true;
    touchStartY.current = clientY;
    startTranslateY.current = currentTranslateY.current;
    setIsTransitioning(false);
    return true;
  };

  const handleDragMove = (clientY) => {
    if (!isDraggingRef.current) return;
    const deltaY = clientY - touchStartY.current;
    let newTranslateY = startTranslateY.current + deltaY;

    const snaps = getSnapPoints();

    // Elasticidad en los bordes
    if (newTranslateY < snaps.high) {
      newTranslateY = snaps.high + (newTranslateY - snaps.high) * 0.3;
    } else if (newTranslateY > snaps.low) {
      newTranslateY = snaps.low + (newTranslateY - snaps.low) * 0.2;
    }

    currentTranslateY.current = newTranslateY;
    if (cardRef.current) {
      cardRef.current.style.transform = `translateY(${newTranslateY}px)`;
    }
  };

  const handleDragEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const snaps = getSnapPoints();
    setIsTransitioning(true);

    const currentY = currentTranslateY.current;
    const distances = [
      { name: 'high', val: snaps.high, dist: Math.abs(currentY - snaps.high) },
      { name: 'medium', val: snaps.medium, dist: Math.abs(currentY - snaps.medium) },
      { name: 'low', val: snaps.low, dist: Math.abs(currentY - snaps.low) }
    ];
    distances.sort((a, b) => a.dist - b.dist);
    const closestSnap = distances[0];

    currentTranslateY.current = closestSnap.val;
    setCurrentSnapPoint(closestSnap.name);

    if (cardRef.current) {
      cardRef.current.style.transform = `translateY(${closestSnap.val}px)`;
    }
  };

  // Eventos Touch
  const handleTouchStart = (e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) {
      return;
    }
    const bodyEl = document.getElementById('location-card-body-info');
    const isScrollableBody = bodyEl && bodyEl.contains(e.target);
    handleDragStart(e.touches[0].clientY, e.target, isScrollableBody);
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    handleDragMove(e.touches[0].clientY);
    
    // Prevenir scrolling del fondo mientras arrastramos la tarjeta entera
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Eventos Mouse para poder simularlo en testing responsivo desde desktop
  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) {
      return;
    }
    const bodyEl = document.getElementById('location-card-body-info');
    const isScrollableBody = bodyEl && bodyEl.contains(e.target);

    const started = handleDragStart(e.clientY, e.target, isScrollableBody);
    if (started) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }
  };

  const handleWindowMouseMove = (e) => {
    handleDragMove(e.clientY);
  };

  const handleWindowMouseUp = () => {
    handleDragEnd();
    window.removeEventListener('mousemove', handleWindowMouseMove);
    window.removeEventListener('mouseup', handleWindowMouseUp);
  };

  const handleCloseClick = (e) => {
    e.stopPropagation();
    if (isMobile) {
      onClose();
    } else {
      setIsExiting(true);
    }
  };

  const handleButtonClick = (e) => {
    e.stopPropagation();
  };

  const cardClassName = isMobile
    ? `location-card-mobile ${isTransitioning ? 'is-transitioning' : ''} location-card-mobile--${currentSnapPoint}`
    : `location-card-desktop ${isExiting ? 'is-exiting' : ''} ${isChanging ? 'is-changing' : ''}`;

  const cardId = isMobile ? 'location-card-panel-mobile' : 'location-card-panel-desktop';
  const cardStyle = isMobile ? { transform: 'translateY(100%)' } : undefined;

  return (
    <div 
      ref={cardRef}
      className={cardClassName} 
      id={cardId}
      style={cardStyle}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
      onMouseDown={isMobile ? handleMouseDown : undefined}
    >
      {isMobile && (
        <div className="mobile-drag-handle" id="mobile-card-drag-handle" />
      )}

      {/* ── Encabezado: icono + nombre + cierre ── */}
      <div className="location-card-header" id="location-card-header-section">
        <div className="location-title-group" id="location-title-group-box">
          <img
            src={iconoLocal}
            alt="Local"
            className="location-title-icon"
            id="location-title-icon-img"
          />
          <h2 
            className="location-name" 
            id="location-name-title"
            style={{ fontSize: getTitleFontSize(currentLoc.nombre) }}
          >
            {currentLoc.nombre}
          </h2>
        </div>
        <button
          className="card-close-btn"
          onClick={handleCloseClick}
          id="location-card-close-btn"
          aria-label="Cerrar"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" id="location-card-close-icon">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <hr className="card-divider" id="location-card-divider-line" />

      {/* ── Cuerpo: filas de información ── */}
      <div className="location-card-body" id="location-card-body-info">

        {/* Dirección */}
        <div className="location-info-row" id="location-info-row-address">
          <span className="info-text-container" id="location-address-text">
            {currentLoc.direccion 
              ? (currentLoc.ciudad && String(currentLoc.ciudad).trim() !== '' 
                  ? `${currentLoc.direccion}, ${currentLoc.ciudad}` 
                  : currentLoc.direccion)
              : 'Sin dirección'}
          </span>
          <img
            src={iconoDireccion}
            alt="Dirección"
            className="info-icon"
            id="location-address-icon"
          />
        </div>

        {/* Teléfono */}
        {currentLoc.telefono && (
          <div className="location-info-row" id="location-info-row-phone">
            <span className="info-text-container" id="location-phone-text">
              {currentLoc.telefono}
            </span>
            <img
              src={iconoTelefono}
              alt="Teléfono"
              className="info-icon"
              id="location-phone-icon"
            />
          </div>
        )}

        {/* Departamento */}
        {currentLoc.departamento && (
          <div className="location-info-row" id="location-info-row-department">
            <span className="info-text-container" id="location-department-text">
              {currentLoc.departamento}
            </span>
            <img
              src={iconoDepartamento}
              alt="Departamento"
              className="info-icon info-icon--department"
              id="location-department-icon"
            />
          </div>
        )}

        {/* Horarios de atención */}
        <div className="location-schedule-section" id="location-schedule-section">
          <div className="schedule-flex-container">
            
            {/* Columna izquierda: Título y tabla */}
            <div className="schedule-left-content">
              <div className="schedule-title" id="schedule-title-text">Horarios de atención</div>
              
              <div className="schedule-table" id="schedule-table-box">
                {/* Semana */}
                <div className="schedule-row" id="schedule-row-week">
                  <span className="schedule-day">Semana</span>
                  <span className="schedule-time">{currentLoc.horariosSemana || 'Cerrado'}</span>
                  <svg className="schedule-cal-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>

                {/* Sábado */}
                <div className="schedule-row" id="schedule-row-saturday">
                  <span className="schedule-day">Sábado</span>
                  <span className="schedule-time">{currentLoc.sabados || 'Cerrado'}</span>
                  <svg className="schedule-cal-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>

                {/* Domingo */}
                <div className="schedule-row" id="schedule-row-sunday">
                  <span className="schedule-day">Domingo</span>
                  <span className="schedule-time">{currentLoc.domingos || 'Cerrado'}</span>
                  <svg className="schedule-cal-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
              </div>
            </div>

            {/* Columna derecha: Reloj y línea vertical */}
            <div className="schedule-right-timeline">
              <div className="timeline-clock-wrapper">
                <svg className="schedule-clock-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" id="schedule-clock-icon-svg">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div className="timeline-line" id="schedule-timeline-line"></div>
            </div>

          </div>
        </div>

        {/* Advertencia si no hay coordenadas */}
        {!currentLoc.hasCoordinates && (
          <div
            className="location-info-row location-no-coords-warning"
            id="location-info-row-warning"
          >
            <span>Ubicación en mapa no disponible (pendiente de geocodificación)</span>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="location-card-buttons" id="location-card-buttons-container">
          <a
            href={currentLoc.hasCoordinates ? googleMapsUrl : '#'}
            target={currentLoc.hasCoordinates ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="card-btn btn-primary"
            id="location-direction-link"
            onClick={handleDirectionsClick}
          >
            <span>Cómo llegar al Local</span>
            <img
              src={iconoComoLlegar}
              alt="Cómo llegar"
              className="btn-icon"
              id="location-direction-icon-img"
            />
          </a>

          {currentLoc.telefono && (
            <a
              href={`tel:${currentLoc.telefono.replace(/\s+/g, '')}`}
              className="card-btn btn-secondary"
              id="location-call-link"
              onClick={handleButtonClick}
            >
              <span>Llamar</span>
              <img
                src={iconoTelefono}
                alt="Llamar"
                className="btn-icon"
                id="location-call-icon-img"
              />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
