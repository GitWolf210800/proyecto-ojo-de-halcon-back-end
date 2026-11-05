# Histórico de filtros — primera fase backend

Tres operaciones de lectura, sin cambios de esquema ni dependencias:

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/historico-filtros/catalogo` | Catálogo y registro cerrado de métricas |
| POST | `/api/historico-filtros/consulta` | Puntos representativos y estadísticas de la población elegible |
| POST | `/api/historico-filtros/exportacion` | Filas completas elegibles, sin reducción; JSON, no XLSX |

## Acceso

Se reutiliza la instancia del middleware climático bajo el alias local `historyAccess`.
`APP_ACCESS_MODE`, normalizado igual que en Clima, permite acceso anónimo en modo `local`.
Cualquier otro valor exige cookie `jwt`, algoritmo HS256 e identificación de un usuario
existente en `usuarios`. No se agrega restricción por rol ni un criterio nuevo de vigencia.
La autorización precede al controlador y a todo SQL de Filtros.

## Catálogo

Unión de IDs no nulos de `filtros_limites` y `mediciones_filtros`, sin duplicados.
`LEFT JOIN instalaciones` conserva filtros históricos y también IDs sin instalación.
Se leen columnas explícitas; no se consultan valores ni límites actuales para habilitar métricas.

Ejemplo sintético abreviado a una métrica (la respuesta real de catálogo enumera las 17):

```json
{
  "tipo": "catalogo_filtros",
  "zona_horaria": "America/Argentina/Buenos_Aires",
  "metricas": [{
    "campo": "desperdicio", "etiqueta": "Desperdicio", "unidad": "Pa",
    "limites": [{ "campo": "min_desperdicio", "tipo": "min" }]
  }],
  "sensores": [{
    "id_instalacion": 52,
    "nombre": "Filtro ejemplo",
    "descripcion": "Sector ejemplo",
    "etiqueta": "Filtro ejemplo — Sector ejemplo",
    "fabrica": "Fábrica ejemplo",
    "id_fabrica": "GS-602",
    "id_instalacion_fisica": 12,
    "estado_instalacion": "ACTIVO",
    "tiene_configuracion_actual": true,
    "situacion_catalogo": "activo"
  }]
}
```

- `descripcion` procede de `info_extra`; vacío o ausente produce `null`.
- `etiqueta` combina nombre y descripción cuando son distintos.
- `estado_instalacion` es texto (`string`) o `null`, procedente de `instalaciones.estado`.
- `situacion_catalogo`: sin instalación o sin configuración = `historico`;
  con ambas y estado `ACTIVO` = `activo`; cualquier otro estado = `inactivo`.
- Sin instalación: `nombre` y `etiqueta` son `Filtro #<id>`; descripción, fábrica,
  ID de fábrica, ubicación física y estado son `null`. El booleano de configuración
  sigue reflejando la existencia real de una fila en `filtros_limites`.
- Los textos se recortan; no se corrigen nombres ni sufijos.
- La futura agrupación visual debe usar `fabrica`. `id_fabrica` se conserva como
  metadato y no se supone que identifica uniformemente una fábrica física.

## Selección y fechas

Ambos POST reciben exactamente:

```json
{
  "alcance": "seleccion",
  "id_instalaciones": [52, 53, 54],
  "desde": "2020-01-01 00:00:00",
  "hasta": "2020-01-02 00:00:00"
}
```

Solo se admite `seleccion`. Entre 1 y 100 elementos **antes** de deduplicar;
enteros JSON positivos y seguros, conservando la primera aparición. No se aceptan
selectores alternativos ni campos adicionales. Todos los IDs se resuelven contra
el catálogo del servidor, en cada POST. Un ID inexistente produce 400 antes de la
consulta de presencia o de mediciones. Se pueden combinar fábricas y sectores.

Fechas civiles válidas con formato exacto `YYYY-MM-DD HH:mm:ss`, final posterior
al inicio y extremos SQL inclusivos. El intervalo máximo por consulta es de 184 días,
aproximadamente seis meses. No hay límite de antigüedad respecto del reloj actual.
Zona contractual: `America/Argentina/Buenos_Aires`. La aritmética UTC solo valida
el calendario; los parámetros SQL mantienen el texto civil sin conversión de zona.
Las respuestas usan `YYYY-MM-DDTHH:mm:ss` sin `Z` ni desplazamiento.

## Registro y habilitación histórica

| Campo | Unidad | Límites históricos |
| --- | --- | --- |
| filtro_ventilador | Pa | min_filtro_ventilador, max_filtro_ventilador, max_alarma_filtro_ventilador |
| prefiltro | Pa | min_prefiltro, max_prefiltro |
| prefiltro_ventilador | Pa | min_prefiltro_ventilador, max_prefiltro_ventilador |
| filtro | Pa | min_filtro, max_filtro |
| filtro_prefiltro | Pa | min_filtro_prefiltro, max_filtro_prefiltro |
| ventilador | Pa | min_ventilador, max_ventilador |
| ventilador_1 | Pa | min_ventilador_1, max_ventilador_1 |
| ventilador_2 | Pa | min_ventilador_2, max_ventilador_2 |
| ventilador_3 | Pa | min_ventilador_3, max_ventilador_3 |
| ventilador_4 | Pa | min_ventilador_4, max_ventilador_4 |
| picos | Pa | min_picos, max_picos |
| picos2 | Pa | min_picos2, max_picos2 |
| rpm_filtro | RPM | min_rpm_filtro, max_rpm_filtro |
| rpm_filtro2 | RPM | min_rpm_filtro2, max_rpm_filtro2 |
| carro | % | min_carro, max_carro |
| carro2 | % | min_carro2, max_carro2 |
| desperdicio | Pa | min_desperdicio |

El registro contiene 17 valores y 34 límites. No incluye ni consulta `ciclon`,
`min_ciclon`, `max_ciclon`, `max_cilcon` ni `max_desperdicio`.
Tipos de límites del contrato: `min`, `max`, `alarmaMax`.

Para cada fila, una medición numérica no nula es elegible solo si al menos uno
de sus límites de esa misma fila es no nulo y distinto de cero. La medición cero
sí es válida; límites cero/nulos se exponen como `null`. Una métrica no elegible
se expone como `null`. Una fila sin ninguna métrica elegible queda fuera.
El SQL opera sobre las columnas numéricas del esquema histórico; el formateador
rechaza/normaliza valores no numéricos, sin convertir booleanos o cadenas vacías en cero.

Primero se calcula `MAX(CASE WHEN ... THEN 1 ELSE 0 END)` por las 17 métricas,
sin ventanas. Solo la unión efectiva de métricas de la selección y período pasa
a las ventanas de la consulta pesada. La configuración actual no enmascara historia.
Los límites activos se conservan incluso si el valor de esa métrica es nulo en
una fila que tiene otra métrica elegible. No se agrega clasificación visual en el backend.

## Consulta muestreada

1. Filtrar por selección, fechas y elegibilidad histórica; normalizar valores/límites.
2. Calcular conteo total y por sensor, y MIN/AVG/MAX por sensor antes de reducir.
3. Dividir en bloques alineados a `2000-01-01 00:00:00`.
4. Conservar primera/última fila y extremos no nulos por cada métrica efectiva.
5. Ordenar por fecha, instalación e ID de medición, con `LIMIT ? = 12001`.

Objetivo aproximado: 8000 puntos globales. Presupuesto conservador por bloque:
`2 + 2 * metricas_efectivas`. Bloques por sensor entre 1 y 600, en función de toda
la selección; se reserva un bloque de borde por los extremos inclusivos. Escalas
hasta 90 días y, si no alcanzan, intervalo ideal calculado. Límite duro 12000;
la fila 12001 causa 422 y no se devuelve una lista truncada.

Ejemplo sintético con una métrica efectiva y un filtro sin datos:

```json
{
  "tipo": "historico_filtros",
  "solicitud_id": "uuid-generado-por-servidor",
  "alcance": "seleccion",
  "entidad": "Selección de 2 filtros",
  "desde": "2020-01-01 00:00:00",
  "hasta": "2020-01-02 00:00:00",
  "zona_horaria": "America/Argentina/Buenos_Aires",
  "sensores": [
    { "id_instalacion": 52, "nombre": "Filtro #52", "descripcion": null, "etiqueta": "Filtro #52", "fabrica": null, "id_fabrica": null, "id_instalacion_fisica": null, "estado_instalacion": null, "tiene_configuracion_actual": false, "situacion_catalogo": "historico" },
    { "id_instalacion": 53, "nombre": "Filtro #53", "descripcion": null, "etiqueta": "Filtro #53", "fabrica": null, "id_fabrica": null, "id_instalacion_fisica": null, "estado_instalacion": null, "tiene_configuracion_actual": false, "situacion_catalogo": "historico" }
  ],
  "metricas": [{ "campo": "desperdicio", "etiqueta": "Desperdicio", "unidad": "Pa", "limites": [{ "campo": "min_desperdicio", "tipo": "min" }] }],
  "muestreado": true,
  "muestreo_segundos": 300,
  "resumen": { "total_registros": 1, "puntos_mostrados": 1 },
  "resumen_por_sensor": [
    { "id_instalacion": 52, "total_registros": 1, "metricas": { "desperdicio": { "minimo": 0, "promedio": 0, "maximo": 0 } } },
    { "id_instalacion": 53, "total_registros": 0, "metricas": { "desperdicio": { "minimo": null, "promedio": null, "maximo": null } } }
  ],
  "puntos": [{ "id_medicion": 1, "id_instalacion": 52, "fecha": "2020-01-01T01:00:00", "estado": 1, "desperdicio": 0, "min_desperdicio": 10 }]
}
```

`sensores` y `resumen_por_sensor` mantienen toda la selección y su orden. Métricas
sin datos para un sensor tienen estadísticas nulas; sensor sin filas tiene conteo
cero. Si la unión efectiva está vacía: `metricas: []`, `puntos: []`, muestreo `null`,
conteos cero, resumen por cada sensor con `metricas: {}`. Se omite el SQL pesado.
Los campos de valores/límites de los puntos son exclusivamente los de la unión efectiva.

El campo `estado` de cada punto y fila exportada procede de `mediciones_filtros.estado`
(`int(4)`, nullable): es un número entero seguro o `null`. Se conserva cero; `null`
o ausencia se devuelven como `null`. Cualquier otro valor no nulo produce un error
interno controlado (500), sin devolver datos parciales. No se convierten textos a
códigos ni se interpreta su significado industrial. Este campo no calcula
normal/aviso/alarma y es distinto de `estado_instalacion`.

## Exportación completa

Es otra operación: vuelve a validar cuerpo, catálogo, presencia y período. No usa
una instantánea en memoria de una consulta gráfica anterior ni sus estadísticas.
No combina valores actuales. Devuelve todas las filas elegibles, sin ventanas ni
bloques, ordenadas por fecha, instalación e ID; no genera XLSX ni descarga parcial.

```text
columnas = 8 + suma(1 + cantidad_de_limites, por métrica efectiva)
limite_filas = min(60000, max(5000, floor(1500000 / columnas)))
LIMIT parametrizado = limite_filas + 1
```

Con las 17 métricas: 59 columnas presupuestadas, 25423 filas permitidas. El valor
`columnas` es un presupuesto tabular para Excel (incluye 8 columnas base), no el
número de propiedades de cada objeto JSON. Los metadatos se resuelven con `sensores`.
La fila adicional causa 422, con solo `message`, sin ninguna fila parcial.

Respuesta: los mismos `solicitud_id`, `alcance`, `entidad`, `desde`, `hasta`,
`zona_horaria`, `sensores` y `metricas` de la operación, más:

```json
{
  "tipo": "exportacion_filtros",
  "muestreado": false,
  "total_exportado": 1,
  "columnas": 10,
  "limite_filas": 60000,
  "filas": [{ "id_medicion": 1, "id_instalacion": 52, "fecha": "2020-01-01T01:00:00", "estado": 1, "desperdicio": 0, "min_desperdicio": 10 }]
}
```

`filas` tiene la misma forma que cada punto, pero sin reducción. Vue deberá generar
el libro con estos datos y metadatos de esta operación. Los resultados entre consulta
y exportación pueden diferir si la base cambió; no se promete aislamiento transaccional
entre catálogo, detección de métricas y lectura de filas. Sin métricas efectivas se
devuelven todos los sensores, `filas: []`, `total_exportado: 0`, `columnas: 8`.

## Concurrencia, errores y conexión

`history-query-gate.js` es una única barrera por proceso compartida por Clima,
consulta de Filtros y exportación. Se adquiere después de validar el cuerpo y antes
del catálogo interno; permanece hasta terminar o fallar el procesamiento, se libera
en `finally`. Una desconexión HTTP no libera el cupo mientras SQL siga pendiente.
Los endpoints de catálogo quedan fuera; el driver puede encolarlos en su conexión.
La barrera no coordina procesos/instancias distintos.

| Estado | Motivo |
| --- | --- |
| 400 | Selección o fechas inválidas; ID fuera del catálogo |
| 401 | Sesión inválida/usuario inexistente fuera del modo local |
| 422 | Exceso de puntos o filas; reducir período o selección |
| 429 | Otra operación pesada; `Retry-After: 5` |
| 500 | Fallo interno genérico, sin SQL, stack ni detalle del driver |

Cada consulta SQL obtiene dinámicamente la conexión vigente con `getConnection()`.
No se usa timeout fatal del driver, no se simula cancelación SQL y no se cambia `db.js`.
IDs, fechas, segundos y límite de filas son parámetros. Los identificadores proceden
solo del registro cerrado, nunca del cliente o del catálogo.

## Índice pendiente y validación operativa

Según el relevamiento aportado, la tabla InnoDB tiene aproximadamente 2,75 millones
de filas estimadas, 287,81 MB de datos y 122,73 MB de índices. Existen índices separados
`idx_id_instalacion` y `idx_fecha_f`; no se afirma que exista uno compuesto.
Antes del despliegue debe evaluarse `(id_instalacion, fecha)` con autorización explícita
y ventana controlada. No se incluyen ni ejecutan migraciones o DDL.

La detección agregada y las ventanas recorren datos anteriores al LIMIT: el tope de
salida no limita el costo del escaneo. El catálogo también consulta IDs históricos.
Queda pendiente validar planes/costos y compatibilidad de CTE/ventanas sobre una copia
autorizada, y confirmar que la zona de los DATETIME históricos coincide con el contrato.
Esta implementación se valida con mocks; no se conecta a la base ni a servicios reales.

## Pruebas aisladas

```text
node --test test/filter-history.test.js test/climate-history.test.js test/unlock-history.test.js test/industrial-authorization.test.js test/register.test.js
```

Cubren el catálogo actual/retirado/huérfano, registro cerrado, semántica histórica,
selección y fechas, SQL parametrizado, presupuestos, exportación, errores, respuesta
única, conexión reemplazada y concurrencia cruzada incluyendo desconexión HTTP.
Los módulos de prueba no importan el bootstrap ni `db.js`.
