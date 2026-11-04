-- Catalog: no parameters
SELECT i.id_instalacion, i.nombre, i.info_extra,
       i.fabrica, i.id_fabrica, i.id_instalacion_fisica
FROM instalaciones i
WHERE EXISTS (SELECT 1 FROM clima_limites l WHERE l.id_instalacion = i.id_instalacion)
  AND EXISTS (SELECT 1 FROM factor_calibracion_puestos_clima f WHERE f.id_instalacion = i.id_instalacion)
ORDER BY i.fabrica, i.info_extra, i.nombre, i.id_instalacion;

-- History: [seconds, installationId, from, to, 12001]
WITH base AS (
  SELECT id_medicion, id_instalacion, fecha, temperatura, humedad, humedad_absoluta, entalpia, estado_temperatura, estado_humedad, min_A_temperatura, min_temperatura, max_temperatura, max_A_temperatura, min_A_humedad, min_humedad, max_humedad, max_A_humedad, min_humedad_absoluta, max_humedad_absoluta,
    FLOOR(TIMESTAMPDIFF(SECOND, '2000-01-01 00:00:00', fecha) / ?) AS bloque,
    COUNT(*) OVER () AS total_registros,
    COUNT(*) OVER (PARTITION BY id_instalacion) AS total_registros_sensor,
    MIN(temperatura) OVER (PARTITION BY id_instalacion) AS temperatura_minimo,
    AVG(temperatura) OVER (PARTITION BY id_instalacion) AS temperatura_promedio,
    MAX(temperatura) OVER (PARTITION BY id_instalacion) AS temperatura_maximo,
    MIN(humedad) OVER (PARTITION BY id_instalacion) AS humedad_minimo,
    AVG(humedad) OVER (PARTITION BY id_instalacion) AS humedad_promedio,
    MAX(humedad) OVER (PARTITION BY id_instalacion) AS humedad_maximo,
    MIN(humedad_absoluta) OVER (PARTITION BY id_instalacion) AS humedad_absoluta_minimo,
    AVG(humedad_absoluta) OVER (PARTITION BY id_instalacion) AS humedad_absoluta_promedio,
    MAX(humedad_absoluta) OVER (PARTITION BY id_instalacion) AS humedad_absoluta_maximo,
    MIN(entalpia) OVER (PARTITION BY id_instalacion) AS entalpia_minimo,
    AVG(entalpia) OVER (PARTITION BY id_instalacion) AS entalpia_promedio,
    MAX(entalpia) OVER (PARTITION BY id_instalacion) AS entalpia_maximo
  FROM mediciones_clima_24hs
  WHERE id_instalacion IN (?) AND fecha >= ? AND fecha <= ?
    AND (temperatura IS NOT NULL OR humedad IS NOT NULL OR humedad_absoluta IS NOT NULL OR entalpia IS NOT NULL)
), marcada AS (
  SELECT base.*,
    ROW_NUMBER() OVER (PARTITION BY id_instalacion, bloque ORDER BY fecha ASC, id_medicion ASC) AS fila_primera,
    ROW_NUMBER() OVER (PARTITION BY id_instalacion, bloque ORDER BY fecha DESC, id_medicion DESC) AS fila_ultima,
    ROW_NUMBER() OVER (PARTITION BY id_instalacion, bloque ORDER BY temperatura IS NULL, temperatura ASC, fecha ASC, id_medicion ASC) AS temperatura_min,
    ROW_NUMBER() OVER (PARTITION BY id_instalacion, bloque ORDER BY temperatura IS NULL, temperatura DESC, fecha ASC, id_medicion ASC) AS temperatura_max,
    ROW_NUMBER() OVER (PARTITION BY id_instalacion, bloque ORDER BY humedad IS NULL, humedad ASC, fecha ASC, id_medicion ASC) AS humedad_min,
    ROW_NUMBER() OVER (PARTITION BY id_instalacion, bloque ORDER BY humedad IS NULL, humedad DESC, fecha ASC, id_medicion ASC) AS humedad_max,
    ROW_NUMBER() OVER (PARTITION BY id_instalacion, bloque ORDER BY humedad_absoluta IS NULL, humedad_absoluta ASC, fecha ASC, id_medicion ASC) AS humedad_absoluta_min,
    ROW_NUMBER() OVER (PARTITION BY id_instalacion, bloque ORDER BY humedad_absoluta IS NULL, humedad_absoluta DESC, fecha ASC, id_medicion ASC) AS humedad_absoluta_max,
    ROW_NUMBER() OVER (PARTITION BY id_instalacion, bloque ORDER BY entalpia IS NULL, entalpia ASC, fecha ASC, id_medicion ASC) AS entalpia_min,
    ROW_NUMBER() OVER (PARTITION BY id_instalacion, bloque ORDER BY entalpia IS NULL, entalpia DESC, fecha ASC, id_medicion ASC) AS entalpia_max
  FROM base
)
SELECT id_medicion, id_instalacion, DATE_FORMAT(fecha, '%Y-%m-%dT%H:%i:%s') AS fecha_local,
  temperatura, humedad, humedad_absoluta, entalpia, estado_temperatura, estado_humedad, min_A_temperatura, min_temperatura, max_temperatura, max_A_temperatura, min_A_humedad, min_humedad, max_humedad, max_A_humedad, min_humedad_absoluta, max_humedad_absoluta, total_registros, total_registros_sensor,
  temperatura_minimo, temperatura_promedio, temperatura_maximo, humedad_minimo, humedad_promedio, humedad_maximo, humedad_absoluta_minimo, humedad_absoluta_promedio, humedad_absoluta_maximo, entalpia_minimo, entalpia_promedio, entalpia_maximo
FROM marcada
WHERE fila_primera = 1 OR fila_ultima = 1 OR temperatura_min = 1 OR temperatura_max = 1 OR humedad_min = 1 OR humedad_max = 1 OR humedad_absoluta_min = 1 OR humedad_absoluta_max = 1 OR entalpia_min = 1 OR entalpia_max = 1
ORDER BY fecha ASC, id_instalacion ASC, id_medicion ASC
LIMIT ?;
