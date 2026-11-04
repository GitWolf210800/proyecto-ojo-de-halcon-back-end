# Histórico de clima: primera fase backend

## Alcance y acceso

GET /api/historico-clima/catalogo y POST /api/historico-clima/consulta.
No incluye Vue, filtros, Excel, valores actuales, nuevas conexiones ni cambios de esquema.
APP_ACCESS_MODE se normaliza con trim/lowercase: solamente local permite acceso sin sesión.
Internet, ausente, vacío u otro valor requieren cookie JWT, firma HS256 y usuario existente
en usuarios. Todos los id_priv/roles vigentes pueden leer, sin filtro por privilegio.
No se cambian las políticas industriales ni el middleware de historial de cardas.
La instancia local debe ser accesible únicamente desde la red corporativa autorizada.

## Evidencia del catálogo (inspección estática, sin consultar producción)

Referencia: .node-red/projects/proyecto-ojo-de-halcon-back-end-node-red/flows.json.
El flujo habilitado 84c2982a2c8abeab usa las funciones 9001ec6aab3d020c y 76346ecb01ddb039.
La fuente del global temperatura_humedad_nombres es:

1. Inject a93ad02c26833393 (al inicio y cada 3600 segundos), o links de actualización
   07f6c37706d06dcc / 5e19e0b0d1ff52e4.
2. Function 9efb733fc37cc2a1: SELECT desde clima_limites, JOIN instalaciones y
   factor_calibracion_puestos_clima por id_instalacion.
3. MySQL bca124af01571712.
4. Function ec1f045352097f2b: guarda cada fila bajo su nombre y construye
   temperatura_humedad_nombres con esos nombres.
5. El histórico obtiene IDs desde esos objetos y consulta instalaciones.

No se demostró una columna de tipo en instalaciones que clasifique por sí sola el clima.
Sí existe un criterio relacional explícito: pertenencia a ambas tablas de configuración.
Se reproduce mediante dos EXISTS; evita duplicados de JOIN y no inventa clasificaciones
por nombre, estado o rangos de IDs. No requiere una lista manual ni acceso a globals.
El catálogo se consulta de nuevo para cada petición histórica. No contiene IP ni valores actuales.
No se incorporan instalaciones sin esa configuración ni recuperación de instalaciones retiradas.
No se agrega lógica de habilitación de métricas: se conservan las cuatro variables del flujo climático.
Diferencia intencional: Express observa configuración persistida actual, mientras Node-RED
puede conservar el catálogo en memoria hasta la siguiente actualización. La unicidad de nombre
usada por los globals debe verificarse antes del despliegue para confirmar paridad de población.

## Contratos

Catálogo (200):
```json
{
  "tipo": "catalogo_clima",
  "zona_horaria": "America/Argentina/Buenos_Aires",
  "sensores": [{
    "id_instalacion": 52,
    "nombre": "sensor-fixture",
    "descripcion": "Preparación",
    "etiqueta": "Preparación",
    "fabrica": "Fábrica fixture",
    "id_fabrica": "F1",
    "id_instalacion_fisica": 12
  }]
}
```
Ejemplos sintéticos. Descripción/etiqueta proceden de info_extra, con nombre como respaldo.
Fábrica vacía se representa como SIN FÁBRICA, igual que la referencia.

Consulta admitida:
```json
{
  "alcance": "sensor",
  "id_instalacion": 52,
  "fabrica": null,
  "desde": "2026-01-01 00:00:00",
  "hasta": "2026-01-02 00:00:00"
}
```
Para alcance fabrica, enviar id_fabrica como string del catálogo (por ejemplo "F1")
y omitir id_instalacion o enviarlo null. id_fabrica se normaliza con trim tanto en el catálogo
como en la petición. fabrica es solamente una etiqueta de salida: en las peticiones debe
estar ausente o ser null. Nunca se agrupa por su nombre libre.
Para sensor, id_fabrica debe estar ausente o ser null. id_instalacion debe ser un entero JSON.
Los alcances existentes sensor y fabrica mantienen su contrato y no admiten id_instalaciones.
El alcance seleccion permite combinar sensores de distintos sectores y fábricas. Por ejemplo,
si 110 y 309 pertenecen a un grupo del catálogo y 205 a otro:

```json
{
  "alcance": "seleccion",
  "id_instalaciones": [110, 205, 309],
  "desde": "2026-11-03 12:00:00",
  "hasta": "2026-11-04 12:00:00"
}
```

La lista debe contener entre 1 y 100 elementos antes de eliminar duplicados. Cada ID debe
ser un entero JSON positivo y seguro. Se conserva su primera aparición. id_instalacion e
id_fabrica deben estar ausentes o ser null. El servidor resuelve todos los IDs con el
catálogo vigente: si falta uno, devuelve 400 antes de ejecutar la consulta histórica.
No se admiten propiedades adicionales, solicitud_id del cliente ni selección de tablas o columnas.
«Seleccionar una fábrica completa» podrá ser una comodidad del frontend que copie los IDs
de los sensores de ese grupo del catálogo a id_instalaciones. id_fabrica identifica un grupo
del catálogo y no garantiza cobertura de toda la fábrica física.
Fechas exactas, calendario válido, intervalo positivo y extremos inclusivos.
El intervalo máximo por consulta es de 184 días, aproximadamente seis meses.
No hay límite de antigüedad ni ventana relativa a hoy: períodos de años anteriores son válidos
si cada solicitud respeta esos 184 días. La disponibilidad real depende de la retención de la base.

Respuesta de consulta (200):
```json
{
  "tipo": "historico_clima",
  "solicitud_id": "uuid-generado-por-servidor",
  "alcance": "sensor",
  "entidad": "Preparación",
  "id_fabrica": "F1",
  "fabrica": "Fábrica fixture",
  "desde": "2026-01-01 00:00:00",
  "hasta": "2026-01-02 00:00:00",
  "zona_horaria": "America/Argentina/Buenos_Aires",
  "muestreo_segundos": 300,
  "sensores": [{
    "id_instalacion": 52,
    "nombre": "sensor-fixture",
    "descripcion": "Preparación",
    "etiqueta": "Preparación",
    "fabrica": "Fábrica fixture",
    "id_fabrica": "F1",
    "id_instalacion_fisica": 12
  }],
  "resumen": { "total_registros": 0, "puntos_mostrados": 0 },
  "resumen_por_sensor": [{
    "id_instalacion": 52,
    "total_registros": 0,
    "temperatura": { "minimo": null, "promedio": null, "maximo": null },
    "humedad": { "minimo": null, "promedio": null, "maximo": null },
    "humedad_absoluta": { "minimo": null, "promedio": null, "maximo": null },
    "entalpia": { "minimo": null, "promedio": null, "maximo": null }
  }],
  "puntos": []
}
```
sensores y resumen_por_sensor contienen toda la selección del catálogo incluso sin resultados.
Los sensores sin registros tienen total_registros 0 y todas sus estadísticas null.
En alcance fabrica la etiqueta general procede del primer sensor del grupo, incluso si
las etiquetas individuales difieren. Ese alcance agrupa por ID, no por nombre.
En alcance seleccion, entidad es «Selección de N sensores», con N igual al número de IDs únicos.
sensores y resumen_por_sensor siguen el orden solicitado. Los puntos mantienen el orden
cronológico de SQL. La etiqueta fabrica es la etiqueta común o «Varias fábricas» si difiere.
Independientemente, id_fabrica es el ID común o null si difiere. Cada sensor conserva sus
propios metadatos, incluso cuando dos grupos distintos tienen la misma etiqueta.
Cada punto conserva
id_medicion, id_instalacion, fecha local, temperatura, humedad, humedad_absoluta, entalpia,
estado_temperatura, estado_humedad y los diez límites históricos (POINT_FIELDS en el servicio).
Como el gráfico de referencia, no agrega el estado general propio de su exportación Excel.
Cada resumen por sensor contiene id_instalacion, total_registros y, por cada variable,
minimo/promedio/maximo calculados por SQL antes del muestreo. Vacíos/no finitos/invalidos
numéricos se convierten en null; nunca en cero. Filas con identidad/fecha inválida causan error,
no se descartan silenciosamente.

Errores con solo message: 400 entrada/selección inválida; 401 sesión inválida;
422 exceso de puntos; 429 consulta histórica ocupada, con Retry-After: 5;
500 error de consulta/sesión/datos. No se devuelve SQL ni error del driver.

## SQL y muestreo

SQL final reproducible para una instalación: climate-history.sql (placeholders, sin valores reales).
La fuente ejecutable es climate-history.repository.js. Tablas y columnas son constantes de código.
Catálogo: SELECT instalaciones con EXISTS clima_limites y factor_calibracion_puestos_clima.
Autenticación: SELECT id_legajo FROM usuarios WHERE id_legajo = ?; parámetros [usuario].
Histórico: una única sentencia WITH base / marcada / SELECT sobre mediciones_clima_24hs.
Parámetros en orden: [segundosBloque, ...idsValidados, desde, hasta, 12001].
Para N instalaciones hay N+4 placeholders. N y el muestreo se calculan sobre los sensores
únicos resueltos en el catálogo. En el ejemplo de tres sensores y 24 horas, los parámetros son
`[600, 110, 205, 309, "2026-11-03 12:00:00", "2026-11-04 12:00:00", 12001]`.
Se valida que cada ID sea entero seguro positivo, único; IN contiene solamente signos ?.
No se envían múltiples sentencias ni opciones multipleStatements. db.js permanece intacto:
su configuración heredada habilita múltiples sentencias, pero este módulo no la usa.
Cada operación obtiene getConnection() al ejecutarse, incluida la consulta después del catálogo.

Objetivo global TARGET_POINTS=8000 para toda la selección. Cada bloque puede aportar
2 + 2 * cantidad de métricas filas representativas (actualmente 10).
El presupuesto por sensor es floor(8000 / (sensores * filasPorBloque)), acotado entre 1 y 600.
Se reserva un bloque para los extremos inclusivos y la alineación SQL con una época fija:
ideal = ceil(intervaloSegundos / max(1, presupuestoPorSensor - 1)).
Se elige la primera escala >= ideal: escalas de segundos/horas y 1, 2, 3, 7, 14, 30, 60 y 90 días.
Si ninguna alcanza, se usa ideal; nunca se vuelve a un día. sensorCount debe ser entero positivo.
Estimación conservadora: sensores * filasPorBloque * (ceil(intervaloSegundos / muestreo) + 1).
Para selecciones enormes cuyo presupuesto no permita ni los bloques de borde, el objetivo
no es garantizable sin descartar sensores; se conserva la defensa final de 12000 puntos.
Por bloque se conservan primera/última fila y mínimos/máximos de las cuatro variables.
Todas las ventanas tienen desempate por fecha e id_medicion. Orden final fecha,
id_instalacion, id_medicion ascendente. Estadísticas y conteos se calculan antes de reducir.
El objetivo no es un límite estricto: se recuperan como máximo 12001 filas y se rechaza
la respuesta si supera 12000, con 422 y sugerencia de reducir el período/selección.
No se entrega un resultado parcial como si estuviera completo.

## Fechas, timeout y despliegue

Contrato de hora civil de planta: America/Argentina/Buenos_Aires. SQL recibe exactamente
el texto validado sin convertirlo con la zona del servidor. DATE_FORMAT devuelve fecha local
sin offset. Date UTC se usa solo para validación calendaria y duración civil, no para transformar
instantes. La fase asume almacenamiento SQL en hora civil de planta. Antes de desplegar,
confirmar tipo DATETIME/TIMESTAMP y zona de sesión/almacenamiento; no desplegar si la base usa
otra semántica sin acordar conversión. No se promete resolver horas ambiguas de cambios
históricos de zona: el contrato heredado no transporta offset.

Driver activo: mysql, conexión compartida existente. Su timeout de secuencia produce
PROTOCOL_SEQUENCE_TIMEOUT fatal (node_modules/mysql/lib/protocol/Protocol.js), por lo que
no se configura: no es seguro cancelar una consulta así sobre la conexión compartida.
No hay AbortController ni Promise.race fingiendo cancelación. Cancelar HTTP no garantiza
cancelar SQL. No hay plazo máximo de ejecución garantizado en esta fase.

Barrera de concurrencia específica: como máximo una consulta histórica en curso por proceso,
compartida por todas las instancias del servicio. Se adquiere después de validar la entrada y
antes de consultar el catálogo de esa petición; se libera en finally después del resultado o error.
No hay cola de históricos: las solicitudes adicionales reciben 429 y Retry-After: 5 segundos.
Ese encabezado sugiere cuándo reintentar, no garantiza que la consulta anterior haya terminado.
GET catálogo no adquiere esta barrera ni recibe 429 por ella. La conexión SQL compartida puede
igualmente serializar operaciones: la barrera no garantiza latencia independiente del catálogo.
Una desconexión HTTP no libera la barrera mientras el SQL siga pendiente. Si el driver nunca
responde, la barrera permanece ocupada; no se simula cancelación ni se destruye la conexión.
En despliegues con varios procesos, cada uno tiene su propia barrera; no hay coordinación distribuida.

Requisitos previos al despliegue, a verificar manualmente con autorización:
- Compatibilidad MariaDB con CTE y funciones de ventana.
- Índice (id_instalacion, fecha) en mediciones_clima_24hs; no se ejecutó SHOW INDEX.
- Pertenencia del catálogo, unicidad de nombres y retención real de mediciones_clima_24hs.
- Tipos numéricos/IDs dentro del rango seguro JavaScript y semántica temporal descrita.
- Costo de las ventanas para 184 días/fábrica completa; LIMIT limita salida, no el escaneo SQL.
- La conexión compartida puede sufrir espera por consultas costosas, aun con la barrera histórica.
- Catálogo e histórico son lecturas separadas, no una instantánea transaccional.

## Validación aislada

node --test test/climate-history.test.js test/unlock-history.test.js test/industrial-authorization.test.js test/register.test.js

Las pruebas importan únicamente módulos sin bootstrap/DB; inyectan conexiones mock y JWT
con claves efímeras. No consultan Node-RED, SQL real, MQTT ni equipos. Verifican contratos,
acceso, calendario, SQL construido, estadísticas normalizadas, muestreo y respuesta única.
No ejecutan el SQL: la equivalencia con MariaDB y su rendimiento quedan pendientes de un
entorno aislado autorizado. Complementar con node --check y git diff --check.
