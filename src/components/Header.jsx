import React from 'react';
import logoWeb from '../assets/icons/Logo_MapaWeb.svg';
import iconoUbicacion from '../assets/icons/Icono-Ubicacion.svg';

export default function Header() {
  return (
    <header className="app-header" id="app-header">
      <div className="header-logo-container">
        <img
          src={logoWeb}
          alt="WEB logo"
          className="header-logo"
          id="header-logo-img"
        />
      </div>
      <div className="header-title-container" id="header-title-wrapper">
        <img
          src={iconoUbicacion}
          alt="Ubicación"
          className="header-title-icon"
          id="header-title-icon-img"
        />
        <h1 className="header-title" id="header-main-title">Puntos de Venta</h1>
      </div>
    </header>
  );
}
