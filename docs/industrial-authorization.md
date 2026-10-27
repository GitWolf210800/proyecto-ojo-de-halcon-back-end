# Barrera de autorización industrial

Matriz vigente del backend y referencia para mantener el frontend alineado:

| POST | id_priv permitidos | Roles actuales |
| --- | --- | --- |
| /api/edicionCardaLock | 0, 5, 6 | SUPER_USER, POLIFUNCIONAL, PLANNER |
| /api/formlimsent | 0, 1 | SUPER_USER, ADMIN_LIMITES |
| /api/formCalSent | 0, 2 | SUPER_USER, CALIBRACION_CLIMA |

La matriz ejecutable está en `app/middlewares/industrial-authorization.js`.
Todavía no está compartida programáticamente con Vue.
Los nombres actuales corresponden al mapeo de login del backend.
Cualquier otro id_priv se deniega en estas rutas.
RESPONSABLE_MANTENIMIENTO_CLIMA es un rol futuro válido: no se le asigna
id_priv ni permisos backend. JEFE_PRODUCCION es una referencia obsoleta.
Ambos nombres permanecen intactos en el frontend.

La barrera verifica la cookie JWT con la clave configurada, exige un identificador
de usuario escalar entero o una cadena de dígitos, consulta `usuarios` mediante
parámetros y espera el resultado antes de invocar el controlador. Obtiene la
conexión vigente por solicitud. Ante cualquier denegación o fallo responde una
sola vez con HTTP 400, status `Error` y el mensaje histórico de la ruta (incluido
el signo `!` de formlimsent), sin detalles internos.

La barrera lee `req.cookies.jwt`, provista por cookie-parser antes de las rutas
protegidas, y exige un string no vacío. La verificación acepta únicamente HS256
con `process.env.JWT_SECRET`, el algoritmo predeterminado utilizado por el login.
No se modifica
revisarCookie, soloAdmin ni la lógica interna de los tres controladores.
Estos conservan sus consultas y comprobaciones heredadas; esta fase agrega una
comprobación previa, no una transacción que cubra operaciones posteriores.

Validación aislada: `node --test test/industrial-authorization.test.js test/register.test.js`.
Las pruebas usan conexiones simuladas y JWT sintéticos con una clave efímera.
No importan index.js ni db.js, ni inician servidores o conexiones. La comprobación
del orden de las rutas lee index.js como texto.
