-- Documentación de SQL construido; no ejecutar durante la revisión.
-- Los ? son parámetros del driver, no variables para interpolación manual.
-- Ejemplo: selección [52,53], período civil; unión efectiva [filtro].
-- Registro completo y construcción dinámica: app/repositories/filter-history.repository.js.
-- No DDL ni migraciones. Índice compuesto (id_instalacion, fecha): pendiente de evaluación.

-- 1. Catálogo. Parámetros: [].
SELECT p.id_instalacion, i.id_instalacion AS instalacion_existente,
  i.nombre, i.info_extra, i.fabrica, i.id_fabrica, i.id_instalacion_fisica, i.estado,
  EXISTS (SELECT 1 FROM filtros_limites l WHERE l.id_instalacion = p.id_instalacion) AS tiene_configuracion_actual
FROM (
  SELECT id_instalacion FROM filtros_limites WHERE id_instalacion IS NOT NULL
  UNION
  SELECT DISTINCT id_instalacion FROM mediciones_filtros WHERE id_instalacion IS NOT NULL
) p
LEFT JOIN instalaciones i ON i.id_instalacion = p.id_instalacion
ORDER BY i.fabrica, i.info_extra, i.nombre, p.id_instalacion;

-- 2. Unión efectiva, sin ventanas.
-- Parámetros: [52, 53, desde, hasta].
SELECT MAX(CASE WHEN (`filtro_ventilador` IS NOT NULL AND (NULLIF(`min_filtro_ventilador`, 0) IS NOT NULL OR NULLIF(`max_filtro_ventilador`, 0) IS NOT NULL OR NULLIF(`max_alarma_filtro_ventilador`, 0) IS NOT NULL)) THEN 1 ELSE 0 END) AS `filtro_ventilador`,
  MAX(CASE WHEN (`prefiltro` IS NOT NULL AND (NULLIF(`min_prefiltro`, 0) IS NOT NULL OR NULLIF(`max_prefiltro`, 0) IS NOT NULL)) THEN 1 ELSE 0 END) AS `prefiltro`,
  MAX(CASE WHEN (`prefiltro_ventilador` IS NOT NULL AND (NULLIF(`min_prefiltro_ventilador`, 0) IS NOT NULL OR NULLIF(`max_prefiltro_ventilador`, 0) IS NOT NULL)) THEN 1 ELSE 0 END) AS `prefiltro_ventilador`,
  MAX(CASE WHEN (`filtro` IS NOT NULL AND (NULLIF(`min_filtro`, 0) IS NOT NULL OR NULLIF(`max_filtro`, 0) IS NOT NULL)) THEN 1 ELSE 0 END) AS `filtro`,
  MAX(CASE WHEN (`filtro_prefiltro` IS NOT NULL AND (NULLIF(`min_filtro_prefiltro`, 0) IS NOT NULL OR NULLIF(`max_filtro_prefiltro`, 0) IS NOT NULL)) THEN 1 ELSE 0 END) AS `filtro_prefiltro`,
  MAX(CASE WHEN (`ventilador` IS NOT NULL AND (NULLIF(`min_ventilador`, 0) IS NOT NULL OR NULLIF(`max_ventilador`, 0) IS NOT NULL)) THEN 1 ELSE 0 END) AS `ventilador`,
  MAX(CASE WHEN (`ventilador_1` IS NOT NULL AND (NULLIF(`min_ventilador_1`, 0) IS NOT NULL OR NULLIF(`max_ventilador_1`, 0) IS NOT NULL)) THEN 1 ELSE 0 END) AS `ventilador_1`,
  MAX(CASE WHEN (`ventilador_2` IS NOT NULL AND (NULLIF(`min_ventilador_2`, 0) IS NOT NULL OR NULLIF(`max_ventilador_2`, 0) IS NOT NULL)) THEN 1 ELSE 0 END) AS `ventilador_2`,
  MAX(CASE WHEN (`ventilador_3` IS NOT NULL AND (NULLIF(`min_ventilador_3`, 0) IS NOT NULL OR NULLIF(`max_ventilador_3`, 0) IS NOT NULL)) THEN 1 ELSE 0 END) AS `ventilador_3`,
  MAX(CASE WHEN (`ventilador_4` IS NOT NULL AND (NULLIF(`min_ventilador_4`, 0) IS NOT NULL OR NULLIF(`max_ventilador_4`, 0) IS NOT NULL)) THEN 1 ELSE 0 END) AS `ventilador_4`,
  MAX(CASE WHEN (`picos` IS NOT NULL AND (NULLIF(`min_picos`, 0) IS NOT NULL OR NULLIF(`max_picos`, 0) IS NOT NULL)) THEN 1 ELSE 0 END) AS `picos`,
  MAX(CASE WHEN (`picos2` IS NOT NULL AND (NULLIF(`min_picos2`, 0) IS NOT NULL OR NULLIF(`max_picos2`, 0) IS NOT NULL)) THEN 1 ELSE 0 END) AS `picos2`,
  MAX(CASE WHEN (`rpm_filtro` IS NOT NULL AND (NULLIF(`min_rpm_filtro`, 0) IS NOT NULL OR NULLIF(`max_rpm_filtro`, 0) IS NOT NULL)) THEN 1 ELSE 0 END) AS `rpm_filtro`,
  MAX(CASE WHEN (`rpm_filtro2` IS NOT NULL AND (NULLIF(`min_rpm_filtro2`, 0) IS NOT NULL OR NULLIF(`max_rpm_filtro2`, 0) IS NOT NULL)) THEN 1 ELSE 0 END) AS `rpm_filtro2`,
  MAX(CASE WHEN (`carro` IS NOT NULL AND (NULLIF(`min_carro`, 0) IS NOT NULL OR NULLIF(`max_carro`, 0) IS NOT NULL)) THEN 1 ELSE 0 END) AS `carro`,
  MAX(CASE WHEN (`carro2` IS NOT NULL AND (NULLIF(`min_carro2`, 0) IS NOT NULL OR NULLIF(`max_carro2`, 0) IS NOT NULL)) THEN 1 ELSE 0 END) AS `carro2`,
  MAX(CASE WHEN (`desperdicio` IS NOT NULL AND (NULLIF(`min_desperdicio`, 0) IS NOT NULL)) THEN 1 ELSE 0 END) AS `desperdicio`
FROM mediciones_filtros WHERE id_instalacion IN (?, ?) AND fecha >= ? AND fecha <= ?;

-- 3. Consulta representativa: solo filtro fue detectado por la operación anterior.
-- Parámetros: [52, 53, desde, hasta, segundos_bloque, 12001].
WITH elegibles AS (
  SELECT id_medicion, id_instalacion, fecha, estado,
    CASE WHEN (`filtro` IS NOT NULL AND (NULLIF(`min_filtro`, 0) IS NOT NULL OR NULLIF(`max_filtro`, 0) IS NOT NULL)) THEN `filtro` ELSE NULL END AS `filtro`,
    NULLIF(`min_filtro`, 0) AS `min_filtro`,
    NULLIF(`max_filtro`, 0) AS `max_filtro`
  FROM mediciones_filtros
  WHERE id_instalacion IN (?, ?) AND fecha >= ? AND fecha <= ?
    AND ((`filtro` IS NOT NULL AND (NULLIF(`min_filtro`, 0) IS NOT NULL OR NULLIF(`max_filtro`, 0) IS NOT NULL)))
), base AS (
  SELECT elegibles.*, FLOOR(TIMESTAMPDIFF(SECOND, '2000-01-01 00:00:00', fecha) / ?) AS bloque,
    COUNT(*) OVER () AS total_registros,
    COUNT(*) OVER (PARTITION BY id_instalacion) AS total_registros_sensor,
    MIN(`filtro`) OVER (PARTITION BY id_instalacion) AS `filtro_minimo`,
    AVG(`filtro`) OVER (PARTITION BY id_instalacion) AS `filtro_promedio`,
    MAX(`filtro`) OVER (PARTITION BY id_instalacion) AS `filtro_maximo`
  FROM elegibles
), marcada AS (
  SELECT base.*,
    ROW_NUMBER() OVER (PARTITION BY id_instalacion, bloque ORDER BY fecha ASC, id_medicion ASC) AS fila_primera,
    ROW_NUMBER() OVER (PARTITION BY id_instalacion, bloque ORDER BY fecha DESC, id_medicion DESC) AS fila_ultima,
    ROW_NUMBER() OVER (PARTITION BY id_instalacion, bloque ORDER BY `filtro` IS NULL, `filtro` ASC, fecha ASC, id_medicion ASC) AS `filtro_min`,
    ROW_NUMBER() OVER (PARTITION BY id_instalacion, bloque ORDER BY `filtro` IS NULL, `filtro` DESC, fecha ASC, id_medicion ASC) AS `filtro_max`
  FROM base
)
SELECT id_medicion, id_instalacion, DATE_FORMAT(fecha, '%Y-%m-%dT%H:%i:%s') AS fecha_local, estado,
  `filtro`, `min_filtro`, `max_filtro`, total_registros, total_registros_sensor,
  `filtro_minimo`, `filtro_promedio`, `filtro_maximo`
FROM marcada
WHERE fila_primera = 1 OR fila_ultima = 1 OR (`filtro` IS NOT NULL AND (`filtro_min` = 1 OR `filtro_max` = 1))
ORDER BY fecha ASC, id_instalacion ASC, id_medicion ASC
LIMIT ?;

-- 4. Exportación: repite catálogo/presencia, luego todas las filas elegibles.
-- Parámetros: [52, 53, desde, hasta, limite_filas + 1].
-- Solo filtro: columnas=11, limite_filas=60000, último parámetro=60001.
-- Las 17 métricas: columnas=59, limite_filas=25423, último parámetro=25424.
WITH elegibles AS (
  SELECT id_medicion, id_instalacion, fecha, estado,
    CASE WHEN (`filtro` IS NOT NULL AND (NULLIF(`min_filtro`, 0) IS NOT NULL OR NULLIF(`max_filtro`, 0) IS NOT NULL)) THEN `filtro` ELSE NULL END AS `filtro`,
    NULLIF(`min_filtro`, 0) AS `min_filtro`,
    NULLIF(`max_filtro`, 0) AS `max_filtro`
  FROM mediciones_filtros
  WHERE id_instalacion IN (?, ?) AND fecha >= ? AND fecha <= ?
    AND ((`filtro` IS NOT NULL AND (NULLIF(`min_filtro`, 0) IS NOT NULL OR NULLIF(`max_filtro`, 0) IS NOT NULL)))
)
SELECT id_medicion, id_instalacion, DATE_FORMAT(fecha, '%Y-%m-%dT%H:%i:%s') AS fecha_local, estado,
  `filtro`, `min_filtro`, `max_filtro`
FROM elegibles
ORDER BY fecha ASC, id_instalacion ASC, id_medicion ASC
LIMIT ?;
