import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import { connection } from "./db.js";
import fetch from "node-fetch";

dotenv.config();

async function formLimFildataIn(req, res, next){
    const loggeado = revisarCookie(req);
    console.log(req.body);
    if(loggeado.status){
        const queryVer = `SELECT * FROM usuarios
                       WHERE id_legajo = ${loggeado.data.user}`;;
        connection.query(queryVer, function(error, results, fields){
            if (error) console.log(error);
            if(results[0].id_priv === 0 || results[0].id_priv === 1){
                console.log('ok'); 
            } else res.status(400).send({status: 'Error', message: 'El usuario no tiene autorizacion para la peticion!'}, res.redirect('/'));
        });

        const data = req.body;
        let dataQuery = [];
        let keys = [];
        let dataInsert = [];

        for(let v in data){
            if(data[v] === null || data[v] === ''){
                console.log('error de datos in limFiltros');
                res.status(400).send({status: 'Error', message: 'Error de entrada de Datos'}, res.redirect('/'));
            }
        }


        for(let x in data){
            if(x !== 'id_instalacion' && x !== 'motivo'){
                dataQuery.push(`${x} = ${data[x]}`);
            };
            keys.push(x);
            if(x === 'motivo'){
                dataInsert.push(`'${data[x]}'`);
            } else dataInsert.push(data[x]);
        }
        dataQuery.push(`id_legajo = ${loggeado.data.user}`);
        const queryUpdate = `UPDATE filtros_limites SET fecha = CURRENT_TIMESTAMP, ${dataQuery} WHERE id_instalacion = ${data.id_instalacion};`;

        const queryInsert = `INSERT INTO ultimos_cambios_filtros (fecha,${keys},id_legajo) VALUES(CURRENT_TIMESTAMP,${dataInsert},${loggeado.data.user});`;
        
        connection.query(queryInsert, function(error, results, fields){
            if(error) console.log(error);
        });

        connection.query(queryUpdate, function(error, results, fields){
            if(error) console.log(error);
        });

        res.status(200).send({status: 'ok', message: 'Cambios efectuados correctamente', redirect :'/limitesfiltros'});
        
    }
}

function formLimFil(req, res, next){
    const loggeado = revisarCookie(req);
    console.log(req.body);
    let dato = '';
    if(loggeado.status){
        if(req.body.fabrica === 'Fábrica 1') dato = 'fab1_';
        else if (req.body.fabrica === 'Fábrica 3') dato = 'fab3_';
        else if (req.body.fabrica === 'Fábrica 4') dato = 'fab4_';
        else if (req.body.fabrica === 'Fábrica 6') dato = 'fab6_';
        else if (req.body.fabrica === 'Fábrica 9') dato = 'fab9_';
        else return res.status(400).send({status: 'Error', message: 'Error de datos'}, redirect('/limitesfiltros'));
        
        const dataIn = `${dato}${req.body.button}_filtro`;

        const query = `SELECT STRAIGHT_JOIN 
                        i.id_instalacion,
                        i.nombre,
                        t.min_prefiltro,
                        t.min_filtro,
                        t.max_filtro_ventilador,
                        t.max_alarma_filtro_ventilador,
                        t.min_ventilador,
                        t.min_picos,
                        t.min_picos2,
                        t.min_rpm_filtro,
                        t.min_rpm_filtro2,
                        t.min_carro,
                        t.min_carro2
                     FROM filtros_limites t
                     JOIN instalaciones i
                     ON i.id_instalacion = t.id_instalacion
                     WHERE i.nombre = '${dataIn}';`;

        connection.query(query, function(error, results, fields){
            if(error) console.log(error);
            if(Object.keys(results).length > 0){
                console.log(results);
                res.json(results);
            }
            else return res.status(400).send({status: 'Error', message: 'Error, la instalacion no existe'})
        });
        
    }
    else return res.redirect('/');
};


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
    filFabPages,
    formLimFil,
    formLimFildataIn
};