import { FILTER_METRICS, checkedMetrics } from '../services/filter-history-metrics.js';

export const CATALOG_SQL = `SELECT p.id_instalacion, i.id_instalacion AS instalacion_existente,
  i.nombre, i.info_extra, i.fabrica, i.id_fabrica, i.id_instalacion_fisica, i.estado,
  EXISTS (SELECT 1 FROM filtros_limites l WHERE l.id_instalacion = p.id_instalacion) AS tiene_configuracion_actual
FROM (
  SELECT id_instalacion FROM filtros_limites WHERE id_instalacion IS NOT NULL
  UNION
  SELECT DISTINCT id_instalacion FROM mediciones_filtros WHERE id_instalacion IS NOT NULL
) p
LEFT JOIN instalaciones i ON i.id_instalacion = p.id_instalacion
ORDER BY i.fabrica, i.info_extra, i.nombre, p.id_instalacion`;

const column = name => `\`${name}\``;
// Measurement and limit columns are numeric in the historical schema.
const eligible = metric => `(${column(metric.campo)} IS NOT NULL AND (${metric.limites.map(limit =>
  `NULLIF(${column(limit.campo)}, 0) IS NOT NULL`).join(' OR ')}))`;

function selection(ids, desde, hasta) {
  if (!Array.isArray(ids) || !ids.length || ids.length > 100 || new Set(ids).size !== ids.length ||
      ids.some(id => !Number.isSafeInteger(id) || id <= 0)) throw new Error('Invalid SQL selection');
  return { where: `id_instalacion IN (${ids.map(() => '?').join(', ')}) AND fecha >= ? AND fecha <= ?`,
    values: [...ids, desde, hasta] };
}

export function presenceStatement(ids, desde, hasta) {
  const selected = selection(ids, desde, hasta);
  return { sql: `SELECT ${FILTER_METRICS.map(metric =>
    `MAX(CASE WHEN ${eligible(metric)} THEN 1 ELSE 0 END) AS ${column(metric.campo)}`).join(',\n  ')}
FROM mediciones_filtros WHERE ${selected.where}`, values: selected.values };
}

function normalizedSelection(ids, desde, hasta, metrics) {
  checkedMetrics(metrics);
  const selected = selection(ids, desde, hasta);
  const fields = metrics.flatMap(metric => [metric.campo, ...metric.limites.map(limit => limit.campo)]);
  const expressions = metrics.flatMap(metric => [
    `CASE WHEN ${eligible(metric)} THEN ${column(metric.campo)} ELSE NULL END AS ${column(metric.campo)}`,
    ...metric.limites.map(limit => `NULLIF(${column(limit.campo)}, 0) AS ${column(limit.campo)}`),
  ]);
  return { fields, values: selected.values, sql: `WITH elegibles AS (
  SELECT id_medicion, id_instalacion, fecha, estado, ${expressions.join(',\n    ')}
  FROM mediciones_filtros
  WHERE ${selected.where} AND (${metrics.map(eligible).join(' OR ')})
)` };
}

export function historyStatement(ids, desde, hasta, seconds, metrics) {
  if (!Number.isSafeInteger(seconds) || seconds < 1) throw new Error('Invalid sampling');
  const base = normalizedSelection(ids, desde, hasta, metrics);
  const statistics = metrics.flatMap(({ campo }) => ['MIN', 'AVG', 'MAX'].map((fn, i) =>
    `${fn}(${column(campo)}) OVER (PARTITION BY id_instalacion) AS ${column(`${campo}_${['minimo', 'promedio', 'maximo'][i]}`)}`));
  const extremes = metrics.flatMap(({ campo }) => ['ASC', 'DESC'].map((order, i) =>
    `ROW_NUMBER() OVER (PARTITION BY id_instalacion, bloque ORDER BY ${column(campo)} IS NULL, ${column(campo)} ${order}, fecha ASC, id_medicion ASC) AS ${column(`${campo}_${i ? 'max' : 'min'}`)}`));
  const summaryFields = metrics.flatMap(({ campo }) => ['minimo', 'promedio', 'maximo'].map(suffix => `${campo}_${suffix}`));
  const conditions = metrics.map(({ campo }) => `(${column(campo)} IS NOT NULL AND (${column(`${campo}_min`)} = 1 OR ${column(`${campo}_max`)} = 1))`);
  return { sql: `${base.sql}, base AS (
  SELECT elegibles.*, FLOOR(TIMESTAMPDIFF(SECOND, '2000-01-01 00:00:00', fecha) / ?) AS bloque,
    COUNT(*) OVER () AS total_registros,
    COUNT(*) OVER (PARTITION BY id_instalacion) AS total_registros_sensor,
    ${statistics.join(',\n    ')}
  FROM elegibles
), marcada AS (
  SELECT base.*,
    ROW_NUMBER() OVER (PARTITION BY id_instalacion, bloque ORDER BY fecha ASC, id_medicion ASC) AS fila_primera,
    ROW_NUMBER() OVER (PARTITION BY id_instalacion, bloque ORDER BY fecha DESC, id_medicion DESC) AS fila_ultima,
    ${extremes.join(',\n    ')}
  FROM base
)
SELECT id_medicion, id_instalacion, DATE_FORMAT(fecha, '%Y-%m-%dT%H:%i:%s') AS fecha_local, estado,
  ${base.fields.map(column).join(', ')}, total_registros, total_registros_sensor,
  ${summaryFields.map(column).join(', ')}
FROM marcada
WHERE fila_primera = 1 OR fila_ultima = 1 OR ${conditions.join(' OR ')}
ORDER BY fecha ASC, id_instalacion ASC, id_medicion ASC
LIMIT ?`, values: [...base.values, seconds, 12001] };
}

export function exportBudget(metrics) {
  const columns = 8 + metrics.reduce((sum, metric) => sum + 1 + metric.limites.length, 0);
  return { columnas: columns, limite_filas: Math.min(60000, Math.max(5000, Math.floor(1500000 / columns))) };
}

export function exportStatement(ids, desde, hasta, metrics) {
  const base = normalizedSelection(ids, desde, hasta, metrics);
  return { sql: `${base.sql}
SELECT id_medicion, id_instalacion, DATE_FORMAT(fecha, '%Y-%m-%dT%H:%i:%s') AS fecha_local, estado,
  ${base.fields.map(column).join(', ')}
FROM elegibles
ORDER BY fecha ASC, id_instalacion ASC, id_medicion ASC
LIMIT ?`, values: [...base.values, exportBudget(metrics).limite_filas + 1] };
}

export function createFilterHistoryRepository({ getConnection }) {
  const query = (sql, values) => new Promise((resolve, reject) => {
    getConnection().query(sql, values, (error, rows) => error ? reject(error) : resolve(rows));
  });
  const execute = statement => query(statement.sql, statement.values);
  return {
    catalog: () => query(CATALOG_SQL, []),
    presence: (ids, desde, hasta) => execute(presenceStatement(ids, desde, hasta)),
    history: (ids, desde, hasta, seconds, metrics) => execute(historyStatement(ids, desde, hasta, seconds, metrics)),
    exportRows: (ids, desde, hasta, metrics) => execute(exportStatement(ids, desde, hasta, metrics)),
  };
}
