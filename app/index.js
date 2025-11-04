import express from "express"; 
import cookieParser from "cookie-parser";
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { methods as authentication } from "./controllers/authentication.controllers.js";
import { methods as authorization } from "./middlewares/authorization.js";

// Detectar entorno
const isDev = process.env.NODE_ENV !== 'production';

// Configuración de orígenes permitidos (para producción)
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://192.168.3.200:3000',
  'http://192.168.3.122:3000',
  'http://localhost:4000',
  'http://192.168.3.122:4000',
  'https://app.wolfmantech.cloud',
  'http://localhost:5000'
];

// Server
const app = express();
app.set('port', 4000);

// Middleware para log de origen (útil para debug CORS)
app.use((req, res, next) => {
  console.log("Request from origin:", req.headers.origin);
  next();
});

// CORS
app.use(cors({
  origin: function (origin, callback) {
    if (isDev || !origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn("CORS bloqueado para:", origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Otros middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));

// Rutas
app.get('/eyeHawk', (req, res)=> res.sendFile(__dirname + '/pages/home.html'));
app.get('/salaClima', (req, res)=> res.sendFile(__dirname + '/pages/sala_clima.html'));
app.get('/', (req, res)=> res.sendFile(__dirname + '/pages/home.html'));
app.get('/carrier1', (req, res)=> res.sendFile(__dirname + '/pages/carrier1.html'));
app.get('/carrier2', (req, res)=> res.sendFile(__dirname + '/pages/carrier2.html'));
app.get('/carrier3', (req, res)=> res.sendFile(__dirname + '/pages/carrier3.html'));
app.get('/carrier4', (req, res)=> res.sendFile(__dirname + '/pages/carrier4.html'));
app.get('/carrier5', (req, res)=> res.sendFile(__dirname + '/pages/carrier5.html'));
app.get('/login', authorization.soloPublico, (req, res)=> res.sendFile(__dirname + '/pages/login.html'));
app.get('/register', authorization.soloPublico, (req, res)=> res.sendFile(__dirname + '/pages/register.html'));
app.get('/admin', authorization.soloAdmin, (req, res)=> res.sendFile(__dirname + '/pages/admin/admin.html'));
app.get('/limites', authorization.adminLimites, (req, res)=> res.sendFile(__dirname + '/pages/admin/limites.html'));
app.get('/limitesfiltros', authorization.adminLimites, (req, res)=> res.sendFile(__dirname + '/pages/admin/fabsLimFil.html'));

app.post('/api/filfab', authorization.filFabPages);
app.post('/api/formlimfil', authorization.formLimFil);
app.post('/api/formlimsent', authorization.formLimFildataIn);
app.post('/api/formCalClima', authorization.formCalClima);
app.post('/api/edicionMarchaCompresores', authorization.edicionMarchaCompresores);
app.post('/api/formCalSent', authorization.formCalSent);
app.post('/api/login', authentication.login);
app.get('/api/logout', authentication.logout);
app.get('/api/verify-token', authorization.verifyToken);
app.post('/api/register', authentication.register);

// Iniciar servidor
app.listen(app.get('port'));
console.log('Servidor corriendo en puerto', app.get('port'));
