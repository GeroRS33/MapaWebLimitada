import * as XLSX from 'xlsx';
import { rawLocations } from '../data/locations';
import mvdExcelUrl from '../../ClientesSolo_MVD.xlsx?url';
import interiorExcelUrl from '../../ClientesSolo_INTERIOR.xlsx?url';

function normalizeKey(str) {
  if (!str) return '';
  return str.toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // remove accents
}

const KEY_MAPPINGS = {
  activo: ['local activo (*)', 'local activo'],
  nombre: ['nombre visible en local *', 'nombre visible en local'],
  direccion: ['direccion *', 'direccion'],
  coordenadas: ['coordenadas', 'coordenada'],
  celular: ['celular'],
  telefono: ['telefono'],
  localidad: ['localidad/barrio (*)', 'localidad/barrio *', 'localidad/barrio'],
  departamento: ['departamento'],
  horariosSemana: ['horarios semana', 'horario semana'],
  sabados: ['sabados', 'sabado', 'sabados'],
  domingos: ['domingos', 'domingo']
};

function getMappedValue(row, colMap, key) {
  const possibleHeaders = KEY_MAPPINGS[key];
  if (!possibleHeaders) return null;
  for (const header of possibleHeaders) {
    if (colMap[header] !== undefined) {
      return row[colMap[header]];
    }
  }
  return null;
}

/**
 * Procesa las filas crudas del Excel y las normaliza a un formato de objeto estándar.
 * También soporta el fallback en formato de objetos de rawLocations.
 */
export function processRawExcelData(data, label = 'UNKNOWN') {
  console.log(`🔍 [DEBUG] Iniciando procesamiento de datos para: ${label}...`);
  
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  const processed = [];

  // Verificar si es el fallback (un array de objetos con propiedades ya definidas)
  const isObjectArray = typeof data[0] === 'object' && !Array.isArray(data[0]);

  if (isObjectArray) {
    console.log(`📋 [DEBUG] Procesando datos estáticos en formato de objeto (Fallback)`);
    data.forEach((row, idx) => {
      // Ignorar filas vacías o marcadores de prueba sin nombre
      if (!row.Nombre && !row.nombre) return;
      
      const id = row.ID || row.id || `fallback_${idx}`;
      const nombre = row.Nombre || row.nombre || null;
      const direccion = row.Dirección || row.direccion || null;
      const ciudad = row['Localidad/Ciudad'] || row.Localidad || row.ciudad || null;
      const departamento = row.Departamento || row.departamento || null;
      
      // Prioridad teléfono
      let selectedPhone = null;
      if (row.Telefono !== undefined && row.Telefono !== null && String(row.Telefono).trim() !== '') {
        selectedPhone = String(row.Telefono).trim();
      } else if (row.Teléfono !== undefined && row.Teléfono !== null && String(row.Teléfono).trim() !== '') {
        selectedPhone = String(row.Teléfono).trim();
      } else if (row.Celular !== undefined && row.Celular !== null && String(row.Celular).trim() !== '') {
        selectedPhone = String(row.Celular).trim();
      } else if (row.celular !== undefined && row.celular !== null && String(row.celular).trim() !== '') {
        selectedPhone = String(row.celular).trim();
      } else if (row.telefono !== undefined && row.telefono !== null && String(row.telefono).trim() !== '') {
        selectedPhone = String(row.telefono).trim();
      }

      const horariosSemana = row['Horarios Semana'] || row.horariosSemana || null;
      const sabados = row.Sabados || row.Sábado || row.sabados || null;
      const domingos = row.Domingos || row.Domingo || row.domingos || null;

      const lat = row.Latitud !== undefined ? Number(row.Latitud) : (row.lat !== undefined ? Number(row.lat) : NaN);
      const lng = row.Longitud !== undefined ? Number(row.Longitud) : (row.lng !== undefined ? Number(row.lng) : NaN);
      const hasCoords = !isNaN(lat) && !isNaN(lng);

      if (hasCoords) {
        processed.push({
          id,
          nombre,
          direccion,
          ciudad,
          departamento,
          telefono: selectedPhone,
          horariosSemana,
          sabados,
          domingos,
          lat,
          lng,
          hasCoordinates: true
        });
      } else {
        console.warn(`⚠️ [WARNING] El local "${nombre}" fue ignorado en el mapa porque no tiene coordenadas válidas.`);
      }
    });
    return processed;
  }

  // --- SI SON FILAS DE EXCEL (ARRAY DE ARRAYS) ---
  // Localizar la fila de encabezado de forma dinámica
  let headerRowIndex = -1;
  for (let r = 0; r < data.length; r++) {
    const row = data[r];
    if (row && row.some(cell => cell && normalizeKey(cell).includes('local activo'))) {
      headerRowIndex = r;
      break;
    }
  }

  if (headerRowIndex === -1) {
    console.error(`❌ [ERROR] No se pudo encontrar la fila de cabeceras en ${label}`);
    return [];
  }

  const headerRow = data[headerRowIndex];
  
  // Mapear encabezado normalizado a su índice
  const colMap = {};
  headerRow.forEach((val, idx) => {
    if (val !== null && val !== undefined) {
      const norm = normalizeKey(val);
      colMap[norm] = idx;
      // Robustez: si contiene "local activo", lo asociamos a la clave genérica "local activo"
      if (norm.includes('local activo')) {
        colMap['local activo'] = idx;
      }
    }
  });

  // Procesar filas de datos después de las cabeceras
  for (let r = headerRowIndex + 1; r < data.length; r++) {
    const row = data[r];
    if (!row || row.length === 0) continue;

    const rawActivo = getMappedValue(row, colMap, 'activo');
    if (rawActivo === undefined || rawActivo === null) continue;

    // Verificar si está activo
    const activeStr = String(rawActivo).trim().toLowerCase();
    const isActive = ['true', 'verdadero', '1', 'si', 'sí', 'activo'].includes(activeStr);
    if (!isActive) continue;

    const nombre = getMappedValue(row, colMap, 'nombre');
    // Ignorar filas sin nombre
    if (!nombre) continue;

    const direccion = getMappedValue(row, colMap, 'direccion');
    const coordenadasRaw = getMappedValue(row, colMap, 'coordenadas');
    const celular = getMappedValue(row, colMap, 'celular');
    const telefono = getMappedValue(row, colMap, 'telefono');
    const localidad = getMappedValue(row, colMap, 'localidad');
    let departamento = getMappedValue(row, colMap, 'departamento');

    // Default departamento if not present and is MVD
    if (!departamento && label === 'MVD') {
      departamento = 'Montevideo';
    }

    const horariosSemana = getMappedValue(row, colMap, 'horariosSemana');
    const sabados = getMappedValue(row, colMap, 'sabados');
    const domingos = getMappedValue(row, colMap, 'domingos');

    // Prioridad Teléfono sobre Celular
    let selectedPhone = null;
    if (telefono !== undefined && telefono !== null && String(telefono).trim() !== '') {
      selectedPhone = String(telefono).trim();
    } else if (celular !== undefined && celular !== null && String(celular).trim() !== '') {
      selectedPhone = String(celular).trim();
    }

    // Coordenadas
    let lat = NaN;
    let lng = NaN;
    let hasCoords = false;

    if (coordenadasRaw) {
      const parts = String(coordenadasRaw).split(',');
      if (parts.length === 2) {
        lat = Number(parts[0].trim());
        lng = Number(parts[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          hasCoords = true;
        }
      }
    }

    const item = {
      id: `${label}_${r}`,
      nombre,
      direccion,
      ciudad: localidad, // Mapear a ciudad que es lo que espera el componente
      departamento,
      telefono: selectedPhone,
      horariosSemana,
      sabados,
      domingos,
      lat,
      lng,
      hasCoordinates: hasCoords
    };

    if (hasCoords) {
      processed.push(item);
    } else {
      console.warn(`⚠️ [WARNING] El local "${nombre}" fue ignorado en el mapa porque no tiene coordenadas válidas (Coordenadas raw: "${coordenadasRaw}").`);
    }
  }

  console.log(`✅ [DEBUG] Procesamiento finalizado para ${label}. Total locales válidos: ${processed.length}`);
  return processed;
}

/**
 * Carga y parsea los archivos Excel de forma dinámica.
 * Si falla, usa los datos estáticos de locations.js como fallback.
 */
export async function loadLocationsFromExcel() {
  try {
    console.log(`🌐 [DEBUG] Cargando Excels dinámicamente desde Vite...`);
    
    const [mvdResponse, intResponse] = await Promise.all([
      fetch(mvdExcelUrl),
      fetch(interiorExcelUrl)
    ]);

    if (!mvdResponse.ok || !intResponse.ok) {
      throw new Error('No se pudieron recuperar los archivos Excel desde el servidor');
    }

    const [mvdBuffer, intBuffer] = await Promise.all([
      mvdResponse.arrayBuffer(),
      intResponse.arrayBuffer()
    ]);

    // Decodificar MVD
    const mvdData = new Uint8Array(mvdBuffer);
    const mvdWorkbook = XLSX.read(mvdData, { type: 'array' });
    const mvdSheet = mvdWorkbook.Sheets[mvdWorkbook.SheetNames[0]];
    const mvdRows = XLSX.utils.sheet_to_json(mvdSheet, { header: 1 });
    const mvdProcessed = processRawExcelData(mvdRows, 'MVD');

    // Decodificar INTERIOR
    const intData = new Uint8Array(intBuffer);
    const intWorkbook = XLSX.read(intData, { type: 'array' });
    const intSheet = intWorkbook.Sheets[intWorkbook.SheetNames[0]];
    const intRows = XLSX.utils.sheet_to_json(intSheet, { header: 1 });
    const intProcessed = processRawExcelData(intRows, 'INTERIOR');

    const merged = [...mvdProcessed, ...intProcessed];
    console.log(`📊 [DEBUG] Total general de locales cargados: ${merged.length}`);
    return merged;
  } catch (error) {
    console.warn('⚠️ [WARNING] No se pudo cargar los Excels de forma dinámica. Usando datos estáticos de respaldo:', error.message);
    return processRawExcelData(rawLocations, 'FALLBACK');
  }
}
