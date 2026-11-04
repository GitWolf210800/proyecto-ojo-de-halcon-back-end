import { randomUUID } from 'node:crypto';

export const TIME_ZONE = 'America/Argentina/Buenos_Aires';
export const MAX_POINTS = 12000;
export const TARGET_POINTS = 8000;
export const MAX_INTERVAL_DAYS = 184;
// Shared by all service instances in this process. Never released on HTTP disconnect.
let historyBusy = false;
export const METRICS = Object.freeze(['temperatura', 'humedad', 'humedad_absoluta', 'entalpia']);
export const LIMITS = Object.freeze([
  'min_A_temperatura', 'min_temperatura', 'max_temperatura', 'max_A_temperatura',
  'min_A_humedad', 'min_humedad', 'max_humedad', 'max_A_humedad',
  'min_humedad_absoluta', 'max_humedad_absoluta',
]);
export const POINT_FIELDS = Object.freeze([...METRICS, 'estado_temperatura', 'estado_humedad', ...LIMITS]);

export class ClimateInputError extends Error {}
export class ClimateSizeError extends Error {}
export class ClimateBusyError extends Error {}
export function numberOrNull(value) {
  if (value === null || value === undefined || typeof value === 'boolean' ||
      !['number', 'string'].includes(typeof value) || (typeof value === 'string' && !value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

// Wall-clock values: UTC is used only for calendar arithmetic, never to shift SQL dates.
function calendarTime(value) {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
  if (year < 1000) return null;
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, 0);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day && date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute && date.getUTCSeconds() === second ? date.getTime() : null;
}

export function validateClimateQuery(body) {
  const allowed = ['alcance', 'id_instalacion', 'id_fabrica', 'fabrica', 'desde', 'hasta'];
  if (body?.alcance === 'seleccion') allowed.push('id_instalaciones');
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(body)) ||
      Reflect.ownKeys(body).some(key => !allowed.includes(key))) throw new ClimateInputError();
  if (!['sensor', 'fabrica', 'seleccion'].includes(body.alcance)) throw new ClimateInputError();
  // Labels are server-owned; a client label must never select a factory.
  if (body.fabrica != null) throw new ClimateInputError();
  let ids;
  if (body.alcance === 'seleccion') {
    const list = body.id_instalaciones;
    if (body.id_instalacion != null || body.id_fabrica != null ||
        !Array.isArray(list) || list.length < 1 || list.length > 100) throw new ClimateInputError();
    for (const id of list) {
      if (!Number.isSafeInteger(id) || id <= 0) throw new ClimateInputError();
    }
    ids = [...new Set(list)];
  } else if (body.alcance === 'sensor') {
    if (!Number.isSafeInteger(body.id_instalacion) || body.id_instalacion <= 0 || body.id_fabrica != null) throw new ClimateInputError();
  } else if (typeof body.id_fabrica !== 'string' || !body.id_fabrica.trim() ||
      body.id_fabrica.length > 200 || body.id_instalacion != null) throw new ClimateInputError();
  const start = calendarTime(body.desde), end = calendarTime(body.hasta);
  if (start === null || end === null || end <= start || end - start > MAX_INTERVAL_DAYS * 86400000) throw new ClimateInputError();
  return { alcance: body.alcance, ...(ids && { id_instalaciones: ids }), id_instalacion: body.id_instalacion ?? null,
    id_fabrica: body.id_fabrica?.trim() ?? null, desde: body.desde, hasta: body.hasta, rangeMs: end - start };
}

export function normalizeCatalog(rows) {
  const seen = new Set();
  return rows.map(row => {
    const id = numberOrNull(row.id_instalacion);
    if (!Number.isSafeInteger(id) || id <= 0 || seen.has(id)) throw new Error('Invalid catalog');
    seen.add(id);
    const nombre = String(row.nombre ?? '');
    const descripcion = String(row.info_extra || nombre);
    return { id_instalacion: id, nombre, descripcion, etiqueta: descripcion,
      fabrica: String(row.fabrica ?? '').trim() || 'SIN FÁBRICA',
      id_fabrica: String(row.id_fabrica ?? '').trim(), id_instalacion_fisica: numberOrNull(row.id_instalacion_fisica) };
  });
}

export function samplingSeconds(rangeMs, sensorCount) {
  if (!Number.isSafeInteger(sensorCount) || sensorCount <= 0) throw new RangeError('Invalid sensor count');
  if (!Number.isFinite(rangeMs) || rangeMs <= 0) throw new RangeError('Invalid sampling interval');
  const rowsPerBlock = 2 + 2 * METRICS.length;
  const blocks = Math.max(1, Math.min(600, Math.floor(TARGET_POINTS / (sensorCount * rowsPerBlock))));
  // SQL buckets are epoch-aligned, with inclusive endpoints: at most ceil(range / step) + 1.
  // Reserve one boundary bucket rather than assuming the requested start aligns with SQL.
  const ideal = Math.max(1, Math.ceil(rangeMs / 1000 / Math.max(1, blocks - 1)));
  const scales = [1, 5, 10, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 21600, 43200, 86400,
    ...[2, 3, 7, 14, 30, 60, 90].map(days => days * 86400)];
  return scales.find(value => value >= ideal) ?? ideal;
}

export function formatClimateResult(rows, query, sensors, seconds, requestId) {
  if (rows.length > MAX_POINTS) throw new ClimateSizeError();
  const selected = new Set(sensors.map(sensor => sensor.id_instalacion));
  const summaries = new Map();
  const points = rows.map(row => {
    const id = numberOrNull(row.id_instalacion), measurement = numberOrNull(row.id_medicion);
    const date = typeof row.fecha_local === 'string' ? row.fecha_local : '';
    if (!selected.has(id) || !Number.isSafeInteger(measurement) || measurement <= 0 ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(date) || calendarTime(date.replace('T', ' ')) === null) {
      throw new Error('Invalid history row');
    }
    if (!summaries.has(id)) {
      summaries.set(id, { id_instalacion: id, total_registros: numberOrNull(row.total_registros_sensor) ?? 0,
        ...Object.fromEntries(METRICS.map(metric => [metric, {
          minimo: numberOrNull(row[`${metric}_minimo`]), promedio: numberOrNull(row[`${metric}_promedio`]),
          maximo: numberOrNull(row[`${metric}_maximo`]),
        }])) });
    }
    return { id_medicion: measurement, id_instalacion: id, fecha: date,
      ...Object.fromEntries(POINT_FIELDS.map(field => [field, numberOrNull(row[field])])) };
  });
  let { fabrica, id_fabrica } = sensors[0];
  let entidad = query.alcance === 'sensor' ? sensors[0].etiqueta : fabrica;
  if (query.alcance === 'seleccion') {
    entidad = sensors.length === 1 ? 'Selección de 1 sensor' : `Selección de ${sensors.length} sensores`;
    if (!sensors.every(s => s.fabrica === fabrica)) fabrica = 'Varias fábricas';
    if (!sensors.every(s => s.id_fabrica === id_fabrica)) id_fabrica = null;
  }
  return { tipo: 'historico_clima', solicitud_id: requestId, alcance: query.alcance,
    entidad, id_fabrica, fabrica, desde: query.desde, hasta: query.hasta, zona_horaria: TIME_ZONE,
    muestreo_segundos: seconds, sensores: sensors,
    resumen: { total_registros: numberOrNull(rows[0]?.total_registros) ?? 0, puntos_mostrados: points.length },
    resumen_por_sensor: sensors.map(sensor => summaries.get(sensor.id_instalacion) ?? {
      id_instalacion: sensor.id_instalacion, total_registros: 0,
      ...Object.fromEntries(METRICS.map(metric => [metric, { minimo: null, promedio: null, maximo: null }])),
    }), puntos: points };
}

function resolveSensors(query, catalog) {
  if (query.alcance === 'seleccion') {
    const byId = new Map(catalog.map(sensor => [sensor.id_instalacion, sensor]));
    return query.id_instalaciones.map(id => {
      const sensor = byId.get(id);
      if (!sensor) throw new ClimateInputError();
      return sensor;
    });
  }
  return catalog.filter(sensor => query.alcance === 'sensor'
    ? sensor.id_instalacion === query.id_instalacion : sensor.id_fabrica === query.id_fabrica);
}

export function createClimateHistoryService({ repository, makeId = randomUUID }) {
  const catalog = async () => normalizeCatalog(await repository.catalog());
  return {
    catalog,
    async consult(body) {
      const query = validateClimateQuery(body);
      if (historyBusy) throw new ClimateBusyError();
      historyBusy = true;
      try {
        const sensors = resolveSensors(query, await catalog());
        if (!sensors.length) throw new ClimateInputError();
        const seconds = samplingSeconds(query.rangeMs, sensors.length);
        const requestId = makeId();
        const rows = await repository.history(sensors.map(sensor => sensor.id_instalacion), query.desde, query.hasta, seconds);
        return formatClimateResult(rows, query, sensors, seconds, requestId);
      } finally {
        historyBusy = false;
      }
    },
  };
}
