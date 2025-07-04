import express from "express"; 
import cookieParser from "cookie-parser";
import cors from 'cors';
//Fix para __dirname
import path from 'path';
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { methods as authentication } from "./controllers/authentication.controllers.js";
import { methods as authorization } from "./middlewares/authorization.js";

//Server
const app = express();
app.set('port', 4000);
app.listen(app.get('port'));
console.log('Servidor Corriendo en puerto', app.get('port'));

//Settings
app.use(express.static(__dirname + '/public'));
//app.use(cors());
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = ['http://192.168.3.122:3000', 'http://localhost:3000', 'http://192.168.3.122:4000', 'http://localhost:4000'];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir peticiones sin origen (por ejemplo, desde Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            return callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,              // Permite el uso de cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

//rutas
app.get('/eyeHawk', (req, res)=> res.sendFile(__dirname + '/pages/home.html'));
app.get('/salaClima', (req, res)=> res.sendFile(__dirname + '/pages/sala_clima.html'));
app.get('/', (req, res)=> res.sendFile(__dirname + '/pages/home.html'));
app.get('/carrier1', (req, res)=> res.sendFile(__dirname + '/pages/carrier1.html'));
app.get('/carrier2', (req, res)=> res.sendFile(__dirname + '/pages/carrier2.html'));
app.get('/carrier3', (req, res)=> res.sendFile(__dirname + '/pages/carrier3.html'));
app.get('/carrier4', (req, res)=> res.sendFile(__dirname + '/pages/carrier4.html'));
app.get('/carrier5', (req, res)=> res.sendFile(__dirname + '/pages/carrier5.html'));
app.get('/login',authorization.soloPublico, (req, res)=> res.sendFile(__dirname + '/pages/login.html'));
app.get('/register',authorization.soloPublico,(req, res)=> res.sendFile(__dirname + '/pages/register.html'));
app.get('/admin', authorization.soloAdmin,(req, res)=> res.sendFile(__dirname + '/pages/admin/admin.html'));
app.get('/limites', authorization.adminLimites,(req, res)=> res.sendFile(__dirname + '/pages/admin/limites.html'));
app.get('/limitesfiltros', authorization.adminLimites,(req, res)=> res.sendFile(__dirname + '/pages/admin/fabsLimFil.html'));
app.post('/api/filfab', authorization.filFabPages);
app.post('/api/formlimfil', authorization.formLimFil);
app.post('/api/formlimsent', authorization.formLimFildataIn);
app.post('/api/formCalClima', authorization.formCalClima);
//app.post('/api/formCalClimaHumedad', authorization.formCalClimaHumedad);
app.post('/api/formCalSent', authorization.formCalSent);
app.post('/api/login', authentication.login);
app.get('/api/logout', authentication.logout);
app.post('/api/register', authentication.register);
