import uruguayZones from '../data/uruguayZones.json';

/**
 * Normaliza un texto eliminando acentos/diacríticos, convirtiendo a minúsculas y limpiando espacios.
 */
export function normalizeText(str) {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Motor de búsqueda combinado para Puntos de Venta (locales) y Zonas Geográficas (departamentos, ciudades, barrios, localidades).
 *
 * @param {string} query - Término buscado por el usuario.
 * @param {Array} locations - Array de locales comerciales cargados.
 * @param {Array} [customZones] - Array opcional de zonas geográficas (por defecto utiliza uruguayZones).
 * @param {number} [maxResults=7] - Cantidad máxima de sugerencias a retornar.
 * @returns {Array} Sugerencias combinadas y ordenadas por relevancia con la propiedad isGeoZone.
 */
export function searchCombined(query, locations = [], customZones = uruguayZones, maxResults = 7) {
  const cleanQuery = normalizeText(query);
  if (!cleanQuery) return [];

  // 1. PUNTOS DE VENTA (Comercios)
  const storeMatches = [];
  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    if (!loc || !loc.nombre) continue;

    const nombre = normalizeText(loc.nombre);
    const direccion = normalizeText(loc.direccion);
    const ciudad = normalizeText(loc.ciudad);
    const dept = normalizeText(loc.departamento);

    let score = 0;
    if (nombre === cleanQuery) {
      score = 110; // Coincidencia exacta de nombre
    } else if (nombre.startsWith(cleanQuery)) {
      score = 90; // Comienza con el texto
    } else if (nombre.includes(' ' + cleanQuery)) {
      score = 80; // Palabra contenida
    } else if (nombre.includes(cleanQuery)) {
      score = 70; // Subcadena en el nombre
    } else if (ciudad && (ciudad === cleanQuery || ciudad.startsWith(cleanQuery))) {
      score = 55; // Coincidencia en localidad/ciudad
    } else if (direccion && direccion.includes(cleanQuery)) {
      score = 50; // Coincidencia en dirección
    } else if (dept && (dept === cleanQuery || dept.startsWith(cleanQuery))) {
      score = 35; // Coincidencia en departamento
    }

    if (score > 0) {
      storeMatches.push({
        item: {
          ...loc,
          isGeoZone: false
        },
        score
      });
    }
  }

  // 2. ZONAS GEOGRÁFICAS (Departamentos, Ciudades, Barrios, Localidades)
  const zoneMatches = [];
  for (let i = 0; i < customZones.length; i++) {
    const zone = customZones[i];
    if (!zone || !zone.name) continue;

    const name = normalizeText(zone.name);

    let score = 0;
    if (name === cleanQuery) {
      // Coincidencia exacta de nombre de zona
      if (zone.type === 'departamento') score = 115;
      else if (zone.type === 'ciudad') score = 110;
      else if (zone.type === 'barrio') score = 105;
      else score = 100;
    } else if (name.startsWith(cleanQuery)) {
      if (zone.type === 'departamento') score = 95;
      else if (zone.type === 'ciudad') score = 90;
      else if (zone.type === 'barrio') score = 85;
      else score = 80;
    } else if (name.includes(' ' + cleanQuery) || name.includes('/ ' + cleanQuery)) {
      score = 75;
    } else if (name.includes(cleanQuery)) {
      score = 60;
    }

    if (score > 0) {
      zoneMatches.push({
        item: {
          ...zone,
          isGeoZone: true
        },
        score
      });
    }
  }

  // Ordenar cada grupo por puntuación descendente
  storeMatches.sort((a, b) => b.score - a.score);
  zoneMatches.sort((a, b) => b.score - a.score);

  // 3. COMBINACIÓN EQUILIBRADA (Evita que una categoría desplace completamente a la otra)
  let combined = [];

  if (storeMatches.length > 0 && zoneMatches.length > 0) {
    // Si ambas categorías tienen resultados, reservamos hasta la mitad para cada una
    const half = Math.ceil(maxResults / 2);
    const topStores = storeMatches.slice(0, half);
    const topZones = zoneMatches.slice(0, half);

    combined = [...topStores, ...topZones].sort((a, b) => b.score - a.score);
  } else if (storeMatches.length > 0) {
    combined = storeMatches.slice(0, maxResults);
  } else if (zoneMatches.length > 0) {
    combined = zoneMatches.slice(0, maxResults);
  }

  return combined.slice(0, maxResults).map(c => c.item);
}
