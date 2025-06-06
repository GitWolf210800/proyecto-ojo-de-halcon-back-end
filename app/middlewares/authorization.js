import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import { connection } from "./db.js";
import fetch from "node-fetch";

dotenv.config();

function queryAsync(query) {
    return new Promise((resolve, reject) => {
        connection.query(query, (error, results, fields) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
}

async function formLimFildataIn(req, res, next){
    const loggeado = revisarCookie(req);
    console.log(loggeado);
    console.log(req.body);
    if(loggeado.status){
        const queryVer = `SELECT * FROM usuarios
                       WHERE id_legajo = ${loggeado.data.user}`;;
        connection.query(queryVer, function(error, results, fields){
            if (error) console.log(error);
            if(results[0].id_priv === 0 || results[0].id_priv === 1){
                console.log('ok'); 
            } else res.status(400).send({status: 'Error', message: 'El usuario no tiene autorizacion para la peticion!'});
        });

        const data = req.body;
        let dataQuery = [];
        let keys = [];
        let dataInsert = [];

        for(let v in data){
            if(data[v] === null || data[v] === ''){
                console.log('error de datos in limFiltros');
                res.status(400).send({status: 'Error', message: 'Error de entrada de Datos'});
            }
        }


        for(let x in data){
            if(x === 'nombre') continue;

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
        
        console.log(queryInsert);

        connection.query(queryInsert, function(error, results, fields){
            if(error) console.log(error);
        });

        connection.query(queryUpdate, function(error, results, fields){
            if(error) console.log(error);
        });

        res.status(200).send({status: 'ok', message: 'Cambios efectuados correctamente'});
        
    }
};

async function formCalSent (req, res, next){
    const loggeado = revisarCookie(req);
    const data = req.body;
    console.log(loggeado);
    console.log(req.body);

    if(loggeado.status){
        const queryVer = `SELECT * FROM usuarios WHERE id_legajo = ${loggeado.data.user};`;
        const querySensorData = `SELECT * FROM instalaciones WHERE id_instalacion = ${data.id_instalacion};`;
        console.log(data.motivoSelect);
        const queryMotivo = `SELECT * FROM motivos WHERE id_motivo = ${data.motivo};`;

        connection.query(queryVer, function(error, results, fields){
            if(error) console.log(error);

            if(results[0].id_priv === 0 || results[0].id_priv === 2 ){
               console.log('ok'); 
            } else res.status(400).send({status: 'Error', message: 'El usuario no tiene autorizacion para la peticion'});
        });

        const datosSensor = await queryAsync(querySensorData);
        const motivoDB = await queryAsync(queryMotivo);
        const motivo = motivoDB[0].id_motivo;
        console.log('motivo: ', motivoDB);
        const sensorIp = datosSensor[0].direccion_ip;

        for(let v in data){
            if(data[v] === null || data[v] === ''){
                console.log('Error en datos en formCalSent');
                res.status(400).send({status: 'Error', message: 'Error de entrada de Datos'});
            }
        };

        //console.log(datosSensor[0].direccion_ip);
        
        const fc1T = data.factor_calibracion_temperatura;
        const fc1H = data.factor_calibracion_humedad;
        const temperaturaSala = data.valor_sala_temperatura;
        const TemperaturaReal = data.valor_calibracion_temperatura;
        const difTemperatura = Math.abs(temperaturaSala - TemperaturaReal);
        const humedadSala = data.valor_sala_humedad;
        const humedadReal = data.valor_calibracion_humedad;
        const difHumedad = Math.abs(humedadSala - humedadReal);
        let fc2T = TemperaturaReal / temperaturaSala;
        let fc2H = humedadReal / humedadSala;
        let fcT = 1;
        let fcH = 1;
        let dataQuery = [];
        let keys = [];
        let dataInsert = [];
        let message = '';


        if(fc2T <= 0.6 || fc2T >= 1.4) fc2T = 1;

        if(fc2H <= 0.6 || fc2H >= 1.4) fc2H = 1;

        if(difTemperatura > 0.5) {
            fcT = fc1T*fc2T;
            message += 'Temperatura : Calibrada \n';
        } else {
            fcT = fc1T;
            message += 'Temperatura : Sin Acción \n';
        }

        if(difHumedad > 3) {
            fcH = fc1H*fc2H;
            message += 'Humedad : Calibrada';
        } else {
            fcH = fc1H;
            message += 'Humedad : Sin Acción';
        }

        for(let x in data){
            if(x === 'nombre') continue;

            if(x === 'fecha' || x === 'hora') continue;

            if(x === 'factor_calibracion' || x.startsWith('valor')) continue;

            //if(x !== 'id_instalacion' && !x.startsWith('valor') && x !== 'temperatura' && x !== 'humedad') dataQuery.push(`${x} = ${data[x]}`);

            if(data['valor_calibracion_temperatura'] && data['valor_calibracion_humedad']) dataQuery.push(`temperatura = ${fcT}, humedad = ${fcH}`);
                
            else if (data['valor_calibracion_temperatura']) dataQuery.push(`temperatura = ${fcT}`);
                
            else if (data['valor_calibracion_humedad']) dataQuery.push(`humedad = ${fcH}`);

            keys.push(x);

            dataInsert.push(data[x]);
        }

        try {
            const respuesta = await fetch(`http://${sensorIp}/calibrar`,{
                method: 'POST',
                headers: {
                    'Content-Type':'application/json'
                },
                body: JSON.stringify({temperatura: fcT, humedad: fcH })
            });

            const respuestaJson = await respuesta.json();

        } catch (error) {
            console.error('Error al enviar datos al ESP8266:', error.message);
        }

        const queryUpdate = `UPDATE factor_calibracion_puestos_clima SET fecha = CURRENT_TIMESTAMP, ${dataQuery} WHERE id_instalacion = ${data.id_instalacion};`;

        console.log(queryUpdate);

        const queryInsert = `INSERT INTO historial_factor_calibracion_puestos_clima
                                 (
                                id_instalacion,
                                id_instalacion_fisica,
                                fecha, 
                                 temperatura, 
                                 temperatura_sala, 
                                 temperatura_real,
                                 humedad, 
                                 humedad_sala, 
                                 humedad_real,
                                 motivo,  
                                 accion, 
                                 id_legajo
                                 ) 
                                 VALUES
                                 (
                                 ${data.id_instalacion},
                                 ${datosSensor[0].id_instalacion_fisica},
                                 CURRENT_TIMESTAMP, 
                                 ${fcT}, 
                                 ${temperaturaSala},
                                 ${TemperaturaReal},
                                 ${fcH},
                                 ${humedadSala},
                                 ${humedadReal},
                                 ${motivo},
                                 '${message}', 
                                 ${loggeado.data.user}
                                 );`;

        connection.query(queryUpdate, function(error, results, fields){
            if(error) console.log(error);
        });

        connection.query(queryInsert, function(error, results, fields){
            if(error) console.log(error);
        });

        res.status(200).send({status: 'ok', message});
    }
};

function formLimFil(req, res, next){
    const loggeado = revisarCookie(req);
    console.log(req.body);
    console.log(loggeado.status);
    const dataIn = req.body.instalacion;
    /*let dato = '';
    if(loggeado.status){
        if(req.body.fabrica === 'Fábrica 1') dato = 'fab1_';
        else if (req.body.fabrica === 'Fábrica 3') dato = 'fab3_';
        else if (req.body.fabrica === 'Fábrica 4') dato = 'fab4_';
        else if (req.body.fabrica === 'Fábrica 6') dato = 'fab6_';
        else if (req.body.fabrica === 'Fábrica 9') dato = 'fab9_';
        else return res.status(400).send({status: 'Error', message: 'Error de datos'}, redirect('/limitesfiltros'));
        
        const dataIn = `${dato}${req.body.button}_filtro`;*/

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
                //console.log(results);
                res.json(results);
            }
            else return res.status(400).send({status: 'Error', message: 'Error, la instalacion no existe'})
        });
        
    //}
    //else return res.redirect('/');
};

function formCalClima(req, res, next){
    const loggeado = revisarCookie(req);

    console.log(req.body);
    console.log(loggeado.status);
    const dataIn = req.body.instalacion;

    const query = `SELECT STRAIGHT_JOIN
                    i.id_instalacion,
                    i.id_fabrica,
                    i.nombre,
                    t.fecha,
                    t.frecuencia,
                    t.temperatura,
                    t.humedad
                    FROM factor_calibracion_puestos_clima t
                    JOIN instalaciones i
                    ON t.id_instalacion = i.id_instalacion
                    WHERE i.nombre = '${dataIn}';`;

    connection.query(query, function(error, results, fields){
        if (error) console.log(error);

        if(Object.keys(results).length > 0){
            res.json(results);
        }
        else res.status(400).send({status: 'Error', message: 'La instalación no existe!!'});
    });
};

/*function formCalClimaHumedad(req, res, next){
    const loggeado = revisarCookie(req);

    console.log(req.body);
    console.log(loggeado.status);
    const dataIn = req.body.instalacion;

    const query = `SELECT STRAIGHT_JOIN
                    i.id_instalacion,
                    i.nombre,
                    t.fecha,
                    t.humedad
                    FROM factor_calibracion_puestos_clima t
                    JOIN instalaciones i
                    ON t.id_instalacion = i.id_instalacion
                    WHERE i.nombre = '${dataIn}';`;

    connection.query(query, function(error, results, fields){
        if (error) console.log(error);

        if(Object.keys(results).length > 0){
            res.json(results);
        }
        else res.status(400).send({status: 'Error', message: 'La instalación no existe!!'});
    });
};*/

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
    const logueado = revisarCookie(req.data);
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
    formLimFildataIn,
    formCalClima,
    formCalSent
};