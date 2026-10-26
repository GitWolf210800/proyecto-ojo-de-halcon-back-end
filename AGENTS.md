# Instrucciones del backend

- Aplicación Express 4 con módulos ES; usar npm y conservar package-lock.json.
- Entrada y rutas actuales: app/index.js.
- Conexión activa: app/middlewares/db.js.
- Desarrollo: npm run dev. Forever: npm run prod / npm run prodStop.
- No hay scripts de compilación ni pruebas.
- El frontend proyect-vue es un repositorio Git independiente adjunto al mismo proyecto.
- Antes de modificar el frontend, localizar su carpeta adjunta y leer el AGENTS.md de su raíz.
- No iniciar el servidor ni consultar servicios industriales durante auditorías.
- Nunca mostrar, copiar, registrar ni versionar valores de secretos, contraseñas, tokens o credenciales.
- Está permitido modificar código cuando la tarea lo solicite.
- No ejecutar escrituras contra bases de datos reales, iniciar conexiones industriales ni contactar equipos o servicios de producción sin autorización explícita del usuario.
- Las pruebas deben utilizar mocks, datos de prueba o entornos aislados, respetando las restricciones de acceso a sistemas reales.
- Autorizar y validar antes de ejecutar SQL o contactar dispositivos; la autorización técnica de la aplicación no sustituye la autorización explícita del usuario para acceder a sistemas reales según la regla anterior.
- Usar consultas parametrizadas y detener el flujo ante denegaciones.
- Mantener una matriz explícita de id_priv y roles compartida con el frontend.
- Los cambios de esquema y las migraciones sobre bases de datos reales requieren autorización explícita del usuario.
- Conservar contratos existentes; separar rutas, servicios y acceso a datos incrementalmente.
- Informar cambios, validación y efectos sobre integraciones.
