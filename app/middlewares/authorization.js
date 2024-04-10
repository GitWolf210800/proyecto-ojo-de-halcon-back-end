import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import { connection } from "./db.js";

dotenv.config();

function filFabPages(req, res, next){
    const logueado = revisarCookie(req);
    console.log(req.body);
    if(logueado.status){
        let dato = '';
        if (req.body.button === 'Fábrica 1') dato = 'Fabrica 1';
        else if (req.body.button === 'Fábrica 3') dato = 'Fabrica 3';
        else if (req.body.button === 'Fábrica 4') dato = 'Fabrica 4';
        else if (req.body.button === 'Fábrica 6') dato = 'Fabrica 6';
        else if (req.body.button === 'Fábrica 9') dato = 'Fabrica 9';
        else return res.status(400).send({status: "Error", message:"Error de datos"}, redirect('/limites'));
        
        const query = `SELECT nombre FROM instalaciones 
        WHERE nombre LIKE '%_filtro'
        AND fabrica = '${dato}';`;

        connection.query(query, function(error, results, fields){
            if (error) console.log(error);

            let data = [];

            for(let i = 0; i < results.length; i++){
                const dato = results[i].nombre;
                const partes = dato.split('_');
                const shift = partes.shift();
                const pop = partes.pop();
                data.push(partes.join('_')); 
            };

            data.push(req.body.button);

            console.log(data);

            res.json(data);

        });

    } else return res.redirect('/');
};

function soloAdmin(req, res, next){
    const logueado = revisarCookie(req);
    if(logueado.status){ 
        const query = `SELECT * FROM usuarios WHERE id_legajo = ${logueado.data.user}`;
        connection.query(query, function(error, results, field){
            if (error) console.log(error);
            if (results[0].id_priv === 0) return next();
            else return res.redirect('/');
        });
    }
    else return res.redirect('/');
};

function adminLimites(req, res, next){
    const logueado = revisarCookie(req);
    if(logueado.status){
        const query = `SELECT * FROM usuarios WHERE id_legajo = ${logueado.data.user}`;
        connection.query(query, function(error, results, field){
            if (error) console.log(error);
            if (results[0].id_priv === 1 || results[0].id_priv === 0){ 
                return next();
            }
            else return res.redirect('/');
        });
    } else return res.redirect('/');
};

function soloPublico(req, res, next){
    const logueado = revisarCookie(req);
    if(logueado.status){
        const query = `SELECT * FROM usuarios WHERE id_legajo = ${logueado.data.user};`
        connection.query(query, function(error, results, field){
            if (error) console.log(error);

            if (results[0].id_priv === 0) {
                
                return res.redirect('/admin');
            }
            else if (results[0].id_priv === 1){ 
                return res.redirect('/limites');
            }
        });
    }
    else return next();
};

function revisarCookie(req){
    try{
        const cookieJWT = req.headers.cookie.split('; ').find(cookie => cookie.startsWith('jwt=')).slice(4);
        const decodificada = jsonwebtoken.verify(cookieJWT, process.env.JWT_SECRET);

         if(!decodificada){
            const datos = {
                status : false
            };

            return datos
         } else {
            const datos = {
                data : decodificada,
                status : true
            };
            return datos;
         }
    }
    catch {
        return false;
    }
};

export const methods = {
    soloAdmin,
    soloPublico,
    adminLimites,
    filFabPages
};