import { MAX_POINTS, METRICS, POINT_FIELDS } from '../services/climate-history.js';

// Same membership as Node-RED query 9efb733fc37cc2a1; EXISTS avoids duplicate installations.
export const CATALOG_SQL = `SELECT i.id_instalacion, i.nombre, i.info_extra,
       i.fabrica, i.id_fabrica, i.id_instalacion_fisica
FROM instalaciones i
WHERE EXISTS (SELECT 1 FROM clima_limites l WHERE l.id_instalacion = i.id_instalacion)
  AND EXISTS (SELECT 1 FROM factor_calibracion_puestos_clima f WHERE f.id_instalacion = i.id_instalacion)
ORDER BY i.fabrica, i.info_extra, i.nombre, i.id_instalacion`;

export function historyStatement(ids, desde, hasta, seconds) {
  if (!Array.isArray(ids) || !ids.length || ids.some(id => !Number.isSafeInteger(id) || id <= 0) ||
      new Set(ids).size !== ids.length || !Number.isSafeInteger(seconds) || seconds < 1) throw new Error('Invalid SQL parameters');
  const placeholders = ids.map(() => '?').join(', ');
  const statistics = METRICS.flatMap(metric => ['MIN', 'AVG', 'MAX'].map((fn, index) =>
    `${fn}(${metric}) OVER (PARTITION BY id_instalacion) AS ${metric}_${['minimo', 'promedio', 'maximo'][index]}`));
  const extremes = METRICS.flatMap(metric => ['ASC', 'DESC'].map((order, index) =>
    `ROW_NUMBER() OVER (PARTITION BY id_instalacion, bloque ORDER BY ${metric} IS NULL, ${metric} ${order}, fecha ASC, id_medicion ASC) AS ${metric}_${index === 0 ? 'min' : 'max'}`));
  const conditions = METRICS.flatMap(metric => [`${metric}_min = 1`, `${metric}_max = 1`]);
  const summaryFields = METRICS.flatMap(metric => ['minimo', 'promedio', 'maximo'].map(suffix => `${metric}_${suffix}`));
  const sql = `WITH base AS (
  SELECT id_medicion, id_instalacion, fecha, ${POINT_FIELDS.join(', ')},
    FLOOR(TIMESTAMPDIFF(SECOND, '2000-01-01 00:00:00', fecha) / ?) AS bloque,
    COUNT(*) OVER () AS total_registros,
    COUNT(*) OVER (PARTITION BY id_instalacion) AS total_registros_sensor,
    ${statistics.join(',\n    ')}
  FROM mediciones_clima_24hs
  WHERE id_instalacion IN (${placeholders}) AND fecha >= ? AND fecha <= ?
    AND (temperatura IS NOT NULL OR humedad IS NOT NULL OR humedad_absoluta IS NOT NULL OR entalpia IS NOT NULL)
), marcada AS (
  SELECT base.*,
    ROW_NUMBER() OVER (PARTITION BY id_instalacion, bloque ORDER BY fecha ASC, id_medicion ASC) AS fila_primera,
    ROW_NUMBER() OVER (PARTITION BY id_instalacion, bloque ORDER BY fecha DESC, id_medicion DESC) AS fila_ultima,
    ${extremes.join(',\n    ')}
  FROM base
)
SELECT id_medicion, id_instalacion, DATE_FORMAT(fecha, '%Y-%m-%dT%H:%i:%s') AS fecha_local,
  ${POINT_FIELDS.join(', ')}, total_registros, total_registros_sensor,
  ${summaryFields.join(', ')}
FROM marcada
WHERE fila_primera = 1 OR fila_ultima = 1 OR ${conditions.join(' OR ')}
ORDER BY fecha ASC, id_instalacion ASC, id_medicion ASC
LIMIT ?`;
  // One extra row detects overflow; the service rejects it, never returns truncated data.
  return { sql, values: [seconds, ...ids, desde, hasta, MAX_POINTS + 1] };
}

export function createClimateHistoryRepository({ getConnection }) {
  const query = (sql, values) => new Promise((resolve, reject) => {
    getConnection().query(sql, values, (error, rows) => error ? reject(error) : resolve(rows));
  });
  return {
    findUser: user => query('SELECT id_legajo FROM usuarios WHERE id_legajo = ?', [user]),
    catalog: () => query(CATALOG_SQL, []),
    history(ids, desde, hasta, seconds) {
      const statement = historyStatement(ids, desde, hasta, seconds);
      return query(statement.sql, statement.values);
    },
  };
}
