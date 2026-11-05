import { randomUUID } from 'node:crypto';
import { numberOrNull, validateClimateQuery, TIME_ZONE } from './climate-history.js';
import { FILTER_METRICS } from './filter-history-metrics.js';
import { acquireHistoryQuery } from './history-query-gate.js';
import { exportBudget } from '../repositories/filter-history.repository.js';

export class FilterInputError extends Error {}
export class FilterSizeError extends Error {}
export class FilterBusyError extends Error {}

export function validateFilterQuery(body) {
  const allowed = ['alcance', 'id_instalaciones', 'desde', 'hasta'];
  if (!body || typeof body !== 'object' || body.alcance !== 'seleccion' ||
      Reflect.ownKeys(body).some(key => !allowed.includes(key))) throw new FilterInputError();
  // Reuse the established civil-calendar and ordered selection validation unchanged.
  try { return validateClimateQuery(body); } catch { throw new FilterInputError(); }
}

export function normalizeFilterCatalog(rows) {
  const seen = new Set();
  return rows.map(row => {
    const id = numberOrNull(row.id_instalacion);
    if (!Number.isSafeInteger(id) || id < 1 || seen.has(id)) throw new Error('Invalid catalog');
    seen.add(id);
    const exists = numberOrNull(row.instalacion_existente) === id;
    const configured = numberOrNull(row.tiene_configuracion_actual) === 1;
    const text = value => value == null ? null : String(value).trim() || null;
    const nombre = exists ? text(row.nombre) ?? `Filtro #${id}` : `Filtro #${id}`;
    const descripcion = exists ? text(row.info_extra) : null;
    const estado = exists ? text(row.estado) : null;
    return { id_instalacion: id, nombre, descripcion,
      etiqueta: descripcion && descripcion !== nombre ? `${nombre} — ${descripcion}` : nombre,
      fabrica: exists ? text(row.fabrica) : null, id_fabrica: exists ? text(row.id_fabrica) : null,
      id_instalacion_fisica: exists ? numberOrNull(row.id_instalacion_fisica) : null,
      estado_instalacion: estado, tiene_configuracion_actual: configured,
      situacion_catalogo: !exists || !configured ? 'historico' : estado === 'ACTIVO' ? 'activo' : 'inactivo' };
  });
}

export function filterSamplingSeconds(rangeMs, sensorCount, metricCount) {
  if (!Number.isSafeInteger(sensorCount) || sensorCount < 1 || sensorCount > 100 ||
      !Number.isSafeInteger(metricCount) || metricCount < 1 || metricCount > FILTER_METRICS.length ||
      !Number.isFinite(rangeMs) || rangeMs <= 0) throw new RangeError('Invalid sampling');
  const blocks = Math.max(1, Math.min(600, Math.floor(8000 / (sensorCount * (2 + 2 * metricCount)))));
  // Inclusive, epoch-aligned buckets require one additional boundary bucket.
  const ideal = Math.max(1, Math.ceil(rangeMs / 1000 / Math.max(1, blocks - 1)));
  const scales = [1, 5, 10, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 21600, 43200, 86400,
    ...[2, 3, 7, 14, 30, 60, 90].map(days => days * 86400)];
  return scales.find(seconds => seconds >= ideal) ?? ideal;
}

const activeLimit = value => { const n = numberOrNull(value); return n === 0 ? null : n; };
export function historicalValues(row, metrics) {
  return Object.fromEntries(metrics.flatMap(metric => {
    const limits = metric.limites.map(limit => [limit.campo, activeLimit(row[limit.campo])]);
    const enabled = limits.some(([, value]) => value !== null);
    return [[metric.campo, enabled ? numberOrNull(row[metric.campo]) : null], ...limits];
  }));
}

function formatRows(rows, sensors, query, metrics) {
  const ids = new Set(sensors.map(sensor => sensor.id_instalacion));
  return rows.map(row => {
    const id = numberOrNull(row.id_instalacion), measurement = numberOrNull(row.id_medicion);
    const date = row.fecha_local;
    const civil = typeof date === 'string' ? date.replace('T', ' ') : '';
    const parsed = new Date(`${date}Z`);
    if (!ids.has(id) || !Number.isSafeInteger(measurement) || measurement < 1 ||
        typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(date) ||
        !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 19) !== date ||
        civil < query.desde || civil > query.hasta) throw new Error('Invalid history row');
    const values = historicalValues(row, metrics);
    if (!metrics.some(metric => values[metric.campo] !== null)) throw new Error('Ineligible history row');
    const estado = row.estado ?? null;
    if (estado !== null && !Number.isSafeInteger(estado)) throw new Error('Invalid historical state');
    return { id_medicion: measurement, id_instalacion: id, fecha: date, estado, ...values };
  });
}

export function createFilterHistoryService({ repository, makeId = randomUUID }) {
  const catalog = async () => normalizeFilterCatalog(await repository.catalog());
  async function run(body, exporting) {
    const query = validateFilterQuery(body);
    const release = acquireHistoryQuery(FilterBusyError);
    try {
      const byId = new Map((await catalog()).map(sensor => [sensor.id_instalacion, sensor]));
      const sensors = query.id_instalaciones.map(id => {
        if (!byId.has(id)) throw new FilterInputError();
        return byId.get(id);
      });
      const ids = sensors.map(sensor => sensor.id_instalacion);
      const presence = await repository.presence(ids, query.desde, query.hasta);
      if (!Array.isArray(presence) || presence.length !== 1) throw new Error('Invalid presence result');
      const metrics = FILTER_METRICS.filter(metric => numberOrNull(presence[0][metric.campo]) === 1);
      const seconds = metrics.length ? filterSamplingSeconds(query.rangeMs, sensors.length, metrics.length) : null;
      const budget = exportBudget(metrics);
      const rows = !metrics.length ? [] : exporting
        ? await repository.exportRows(ids, query.desde, query.hasta, metrics)
        : await repository.history(ids, query.desde, query.hasta, seconds, metrics);
      if (rows.length > (exporting ? budget.limite_filas : 12000)) throw new FilterSizeError();
      const points = formatRows(rows, sensors, query, metrics);
      const common = { tipo: exporting ? 'exportacion_filtros' : 'historico_filtros', solicitud_id: makeId(),
        alcance: 'seleccion', entidad: `Selección de ${sensors.length} ${sensors.length === 1 ? 'filtro' : 'filtros'}`,
        desde: query.desde, hasta: query.hasta, zona_horaria: TIME_ZONE, sensores: sensors, metricas: metrics };
      if (exporting) return { ...common, muestreado: false, total_exportado: points.length, ...budget, filas: points };
      const summaries = new Map();
      for (const row of rows) {
        const id = numberOrNull(row.id_instalacion);
        if (!summaries.has(id)) summaries.set(id, row);
      }
      return { ...common, muestreado: true, muestreo_segundos: seconds,
        resumen: { total_registros: numberOrNull(rows[0]?.total_registros) ?? 0, puntos_mostrados: points.length },
        resumen_por_sensor: sensors.map(sensor => {
          const row = summaries.get(sensor.id_instalacion);
          return { id_instalacion: sensor.id_instalacion, total_registros: numberOrNull(row?.total_registros_sensor) ?? 0,
            metricas: Object.fromEntries(metrics.map(metric => [metric.campo, Object.fromEntries(
              ['minimo', 'promedio', 'maximo'].map(suffix => [suffix, numberOrNull(row?.[`${metric.campo}_${suffix}`])]))])) };
        }), puntos: points };
    } finally { release(); }
  }
  return { catalog, consult: body => run(body, false), export: body => run(body, true) };
}
