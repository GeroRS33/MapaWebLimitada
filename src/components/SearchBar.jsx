import React, { useState, useEffect, useRef } from 'react';
import iconoMiUbicacion from '../assets/icons/Icono-MiUbicacion.svg';

export default function SearchBar({ 
  locations, 
  onSelectLocation, 
  onGoToMontevideo, 
  onUseMyLocation,
  onDropdownVisibleChange
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);

  // Notificar al padre si las sugerencias están visibles
  useEffect(() => {
    if (onDropdownVisibleChange) {
      onDropdownVisibleChange(showDropdown && suggestions.length > 0);
    }
  }, [showDropdown, suggestions, onDropdownVisibleChange]);

  // Filtrar sugerencias basándose en el query de búsqueda
  useEffect(() => {
    if (query.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    const cleanQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Filtrar locales por Nombre, Dirección, Localidad/Ciudad, Departamento
    const filtered = locations.filter(loc => {
      // Ignorar locales sin nombre
      if (!loc.nombre) return false;

      const nombre = (loc.nombre || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const direccion = (loc.direccion || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const ciudad = (loc.ciudad || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const departamento = (loc.departamento || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      return nombre.includes(cleanQuery) || 
             direccion.includes(cleanQuery) || 
             ciudad.includes(cleanQuery) || 
             departamento.includes(cleanQuery);
    });

    setSuggestions(filtered.slice(0, 6)); // Mostrar máximo 6 sugerencias
  }, [query, locations]);

  // Manejar el clic fuera del buscador para cerrar las sugerencias
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (local) => {
    onSelectLocation(local);
    setQuery(local.nombre);
    setShowDropdown(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      handleSelect(suggestions[0]);
    }
  };

  return (
    <section className="search-section" id="search-bar-section" ref={containerRef}>
      <form className="search-input-wrapper" onSubmit={handleSubmit} id="search-form">
        <div className="search-input-container" id="search-input-container-box">
          <input
            type="text"
            className="search-input"
            id="search-locations-input"
            placeholder="Buscar por Localidad, Barrio, Calle..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            autoComplete="off"
          />
          <button type="submit" className="search-icon-btn" id="search-submit-btn" aria-label="Buscar">
            <svg 
              className="search-icon-svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>

        {showDropdown && suggestions.length > 0 && (
          <div className="search-suggestions" id="search-suggestions-dropdown">
            {suggestions.map((local) => (
              <div
                key={local.id}
                className="suggestion-item"
                onClick={() => handleSelect(local)}
                id={`suggestion-item-${local.id}`}
              >
                <span className="suggestion-name">{local.nombre}</span>
                <span className="suggestion-details">
                  {local.direccion ? `${local.direccion}, ` : ''}
                  {local.ciudad ? `${local.ciudad}, ` : ''}
                  {local.departamento || ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </form>

      <div className="search-actions" id="search-action-links">
        <button 
          onClick={onGoToMontevideo} 
          className="action-btn" 
          id="action-btn-montevideo"
        >
          Ir a Montevideo
        </button>
        <button 
          onClick={onUseMyLocation} 
          className="action-btn" 
          id="action-btn-mylocation"
        >
          <img 
            src={iconoMiUbicacion} 
            alt="Ubicación" 
            className="action-icon" 
            id="action-icon-mylocation-img"
          />
          Usar mi ubicación
        </button>
      </div>
    </section>
  );
}
