# Historial de desbloqueos de cardas

GET /api/historial-desbloqueo-cardas?page=1&pageSize=25

Configurar manualmente APP_ACCESS_MODE=local en la instancia corporativa y
APP_ACCESS_MODE=internet en la instancia publicada. Reiniciar Express después
de modificar el .env. Esta implementación no modifica archivos .env ni puertos.
La instancia configurada como local debe ser exclusivamente corporativa: no
publicarla, ya que permite consultas sin sesión a cualquier cliente que la alcance.

El servidor lee process.env.APP_ACCESS_MODE, aplica trim y lowercase. Solo local
omite autenticación. Internet, ausente, vacío o desconocido exigen cookie jwt,
firma HS256 válida, vencimiento verificado, identificador positivo y usuario
existente mediante consulta parametrizada. No se usan Origin, Host, IP ni modo Vue.
No hay filtro por id_priv: todos los roles existentes pueden consultar; no se
modifica la matriz de permisos industriales ni sus barreras.

Paginación: page=1 y pageSize=25 por defecto; pageSize de 1 a 100. Valores
inválidos y offsets fuera del rango entero seguro devuelven 400. Autenticación
fallida devuelve 401; errores SQL devuelven 500 sin detalles. COUNT precede a
SELECT y ambos se esperan; un fallo detiene el flujo. Son consultas separadas,
sin múltiples sentencias, sobre la conexión vigente obtenida en cada consulta.
No se modifica la configuración global heredada multipleStatements de db.js.
COUNT y SELECT no constituyen una instantánea transaccional: inserciones
concurrentes pueden cambiar el total entre ambas consultas.

SQL y parámetros:

```sql
SELECT id_legajo FROM usuarios WHERE id_legajo = ?
-- [decoded.user], solo cuando se exige sesión
SELECT COUNT(*) AS total FROM desbloqueo_cardas WHERE ? = ?
-- [1, 1]
SELECT d.id_desbloqueo, d.id_legajo, u.nombre, u.apellido, d.fecha, d.maquinas
FROM desbloqueo_cardas AS d
LEFT JOIN usuarios AS u ON u.id_legajo = d.id_legajo
ORDER BY d.fecha DESC, d.id_desbloqueo DESC
LIMIT ? OFFSET ?
-- [pageSize, (page - 1) * pageSize]
```

El LEFT JOIN conserva usuarios eliminados con nombre y apellido nulos. Fecha y
maquinas se entregan sin transformación. Vue presenta la fecha en es-AR y
America/Argentina/Buenos_Aires; conserva literalmente el texto de maquinas.

Validación aislada: node --test test/unlock-history.test.js test/industrial-authorization.test.js test/register.test.js
Las pruebas no importan db.js ni el arranque; usan mocks y claves efímeras.
