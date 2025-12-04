import jsonwebtoken from "jsonwebtoken";
import jwt from "jsonwebtoken";
import dotenv, { parse } from "dotenv";
import { connection } from "./db.js";
import fetch from "node-fetch";
import { obtenerFechaFormateada } from "./funciones.mjs";
import { server } from "./variables.mjs";


dotenv.config();

async function verifyToken(req, res) {
    try {
    // 🔹 Leemos el token desde la cookie
    const loggeado = revisarCookie(req);
    const token = req.cookies?.jwt;
    //const loggeado = revisarCookie(req);
    //console.log(loggeado.data.user, loggeado.status);
    //console.log('verifyToken');
    //console.log(loggeado);

    if (!token) {
      return res.status(401).json({ valid: false, message: "No hay token presente" });
    }

    // 🔹 Verificamos el token con la misma clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Si llegó hasta acá, el token es válido y no está vencido
    return res.status(200).json({
      valid: true,
      user: decoded, // opcional: puedes mandar los datos decodificados
    });

  } catch (err) {
    // 🔹 Si el token expiró o no es válido, capturamos el error
    if (err.name === "TokenExpiredError") {
      console.warn("⚠️ Token expirado");
      return res.status(401).json({ valid: false, message: "Token expirado" });
    }

    console.error("❌ Token inválido:", err.message);
    return res.status(401).json({ valid: false, message: "Token inválido" });
  }
};

function queryAsync(query) {
    return new Promise((resolve, reject) => {
        connection.query(query, (error, results, fields) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};

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
    //console.log(req.body);

    if(loggeado.status){
        const queryVer = `SELECT * FROM usuarios WHERE id_legajo = ${loggeado.data.user};`;
        const querySensorData = `SELECT STRAIGHT_JOIN 
                                    * 
                                FROM instalaciones i 
                                JOIN factor_calibracion_puestos_clima f 
                                ON i.id_instalacion = f.id_instalacion 
                                WHERE i.id_instalacion = ${data.id_instalacion};`;

        //console.log(data.motivoSelect);
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
        console.log('datos_sensor: ', datosSensor);
        const sensorIp = datosSensor[0].direccion_ip;
        let intentos = datosSensor[0].intentos;
        const estado = datosSensor[0].estado;

        if(estado === 'MANTENIMIENTO') {
            res.status(400).send({status: 'Error', message: 'En espera de mantenimiento'});
            return;
        }

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
        let accion = '';
        let estadoTemperatura = 'OK';
        let estadoHumedad = 'OK';
        let dataNodeRed = [];

        let estadoCalibracion = false;
        const fechaActual = new Date(); //Obteniendo fecha actual
        const proximo = new Date(fechaActual);
        const frecuencia = data.frecuencia;

        const fechaCalibracion = datosSensor[0].proxima_fecha;

        if(fechaCalibracion) {
            const fechaDB = new Date(fechaCalibracion);
            const now = new Date();

            if(!isNaN(fechaDB)){
                if(fechaDB <= now) {
                    intentos = 0;
                    console.log('verificacion de fecha correcta...');
                } else {
                    intentos += 1;
                    console.log('no transcurrio la fecha prevista...');
                }
            }
        }


        if(intentos > 2) {
            console.log('entro al if intentos', intentos);
            message = 'Error: Cantidad de intentos superada! \n';
            accion = 'SE INFORMA A MT IMPOSIBILIDAD DE CALIBRACIÓN';
            const mensaje = `Verificar Sensor: ${datosSensor[0].nombre} \nIntentos de Calibracion, Superados!!!`;
            const queryUpdate = `UPDATE instalaciones
                                    SET
                                estado = 'MANTENIMIENTO'
                                WHERE id_instalacion = ${datosSensor[0].id_instalacion};`;

            const queryInsert = `INSERT INTO historial_factor_calibracion_puestos_clima
                                    (
                                        id_instalacion,
                                        id_instalacion_fisica,
                                        fecha,
                                        motivo,
                                        accion,
                                        id_legajo
                                    )
                                VALUES
                                    (
                                        ${data.id_instalacion},
                                        ${datosSensor[0].id_instalacion_fisica},
                                        CURRENT_TIMESTAMP(),
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

            try{
                console.log({instalacion: datosSensor[0].nombre, mensaje, estado: 'MANTENIMIENTO'});
                const respuesta = await fetch(`http://192.168.3.200:1880/informesClima`,{
                    method: 'POST',
                    headers: {
                        'Content-Type' : 'application/json'
                    },
                    body: JSON.stringify({instalacion: datosSensor[0].nombre, mensaje, estado: 'MANTENIMIENTO'})
                });
                const respuestaJson = await respuesta.json();
                if(respuestaJson.message){
                    console.log(respuestaJson.message);
                }
                } catch (error) {
                    console.error('Error al enviar datos a Node-Red', error.message);
                }

            res.status(400).send({status: 'Error', message});

            return;
        }

        /*if(fc2T <= 0.6 || fc2T >= 1.4) fc2T = 1;

        if(fc2H <= 0.6 || fc2H >= 1.4) fc2H = 1;*/

        if (difTemperatura > 0.5 && difHumedad > 3) {
            fcT = fc1T*fc2T;
            message += 'Temperatura : Calibrada \n';
            estadoTemperatura = 'NO OK';

            fcH = fc1H*fc2H;
            message += 'Humedad : Calibrada';
            estadoHumedad = 'NO OK';

            accion = 'SE CORRIGEN TEMP Y HR%';
            estadoCalibracion = true;
        } else if(difTemperatura > 0.5) {
            fcT = fc1T*fc2T;
            fcH = fc1H;
            message += 'Temperatura : Calibrada \n';
            message += 'Humedad : Sin Acción';
            accion = 'SE CORRIGE TEMPERATURA';
            estadoTemperatura = 'NO OK';
            estadoCalibracion = true;
        } else if(difHumedad > 3) {
            fcH = fc1H*fc2H;
            fcT = fc1T;
            message += 'Temperatura : Sin Acción \n';
            message += 'Humedad : Calibrada';
            accion = 'SE CORRIGE HUMEDAD';
            estadoHumedad = 'NO OK';
            estadoCalibracion = true;
        } else {
            fcT = fc1T;
            fcH = fc1H;
            message += 'Temperatura : Sin Acción \n';
            message += 'Humedad : Sin Acción';
            accion = 'SIN ACCIÓN';
        }

        /*else {
            fcH = fc1H;
            message += 'Humedad : Sin Acción';
            accion = 'SIN ACCIÓN';
            estadoHumedad = 'OK'; 
        }*/

        if(estadoCalibracion) {
            proximo.setDate(fechaActual.getDate() + 1);
        } else {
            proximo.setDate(fechaActual.getDate() + frecuencia);
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

        const proximaFecha = obtenerFechaFormateada(proximo);
        const queryUpdate = `UPDATE factor_calibracion_puestos_clima 
                                SET 
                            fecha = CURRENT_TIMESTAMP, 
                            proxima_fecha = '${proximaFecha}', 
                            intentos = ${intentos}, 
                            ${dataQuery} 
                            WHERE id_instalacion = ${data.id_instalacion};`;
        //
        //console.log(queryUpdate);

        const queryInsert = `INSERT INTO historial_factor_calibracion_puestos_clima
                                 (
                                id_instalacion,
                                id_instalacion_fisica,
                                fecha,
                                proxima_fecha, 
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
                                 '${proximaFecha}', 
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

        const dia = String(fechaActual.getDate()).padStart(2, "0");
        const mes = String(fechaActual.getMonth() + 1).padStart(2, "0");
        const year = fechaActual.getFullYear();

        const horas = String(fechaActual.getHours()).padStart(2, "0");
        const minutos = String(fechaActual.getMinutes()).padStart(2, "0");
        const segundos = String(fechaActual.getSeconds()).padStart(2, "0");

        dataNodeRed = [
            `${fechaActual.getDate()}/${fechaActual.getMonth() + 1}/${fechaActual.getFullYear()}`,
            loggeado.data.user,
            `${data.id_fabrica}`,
            `${datosSensor[0].info_extra}`,
            `${motivoDB[0].motivo}`,
            TemperaturaReal,
            humedadReal,
            temperaturaSala,
            humedadSala,
            fcT,
            fcH,
            estadoTemperatura,
            estadoHumedad,
            accion,
            proximaFecha,
            `${datosSensor[0].direccion_ip}`,
            '=SI(INDIRECTO("S"&FILA())=1,SI(INDIRECTO("O"&FILA())<=HOY(),HOY()-INDIRECTO("O"&FILA()),""),"")',
            '=HOY()-INDIRECT(\"A\"&ROW())',
            `=CONTAR.SI(INDIRECTO("C"&FILA()&":C"),INDIRECTO("C"&FILA()))`,
            `${dia}/${mes}/${year} ${horas}:${minutos}:${segundos}`,
            `${datosSensor[0].estado === 'ACTIVO' ? 'SI' : 'NO'}`
        ];


        connection.query(queryUpdate, function(error, results, fields){
            if(error) console.log(error);
        });

        connection.query(queryInsert, function(error, results, fields){
            if(error) console.log(error);
        });

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

        try{
            const respuesta = await fetch(`${server}/calibracionClima`,{
                method: 'POST',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify(dataNodeRed)
            });
            const respuestaJson = await respuesta.json();
            if(respuestaJson.message){
                console.log(respuestaJson.message);
            }
        } catch (error) {
            console.error('Error al enviar datos a Node-Red', error.message);
        }

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

async function formCalClima(req, res, next){
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
            //console.log(results);
            res.json(results);
        }
        else res.status(400).send({status: 'Error', message: 'La instalación no existe!!'});
    });
};

async function edicionMarchaCompresores(req, res, next){
    const loggeado = revisarCookie(req);
    console.log(loggeado);
    console.log(req.body);
    if(loggeado.status){
        const query = `SELECT * FROM usuarios WHERE id_legajo = ${loggeado.data.user};`;
        const datos = req.body;
        let querySent = '';
        let queryLog = '';
        let cambios = '';
        let sentNodeRed = {};
        connection.query(query, function(error, results, field){
            if (error) {
                console.log(error);
                return res.status(400).send({status:"Error", message: "Error de verificacion de usuario"});
            }

            if(results[0].id_priv === 0 || results[0].id_priv === 4){
                console.log('ok');
            } else return res.status(400).send({status: "Error", message: "El usuario no tiene permiso para realizar la accion requerida"});

            for(let x in datos){
                const nombre = x;
                const pos = nombre.lastIndexOf("_");
                const compresorNombre = nombre.slice(0, pos);
                sentNodeRed[compresorNombre] = datos[x];

                querySent += `UPDATE instalaciones
                SET estado = "${datos[x]}" 
                WHERE nombre = "${compresorNombre}"; `;
                cambios += `${x}: ${datos[x]}, `;
            }

            queryLog = `INSERT INTO historal_cambios_estado_compresores (id_legajo, fecha, cambios)
            VALUES (${loggeado.data.user}, CURRENT_TIMESTAMP(), '${JSON.stringify(datos)}');`;

            console.log(querySent);
            connection.query(querySent, async function(error, results, field){
                if(error){
                    console.log(error);
                    return res.status(400).send({status: "Error", message: "Error en la carga de base de datos"});
                }

                try {
                    // Control de timeout (por si Node-RED no responde)
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 5000); // 5 segundos

                    const nodeRed = await fetch(`${server}/updatecompresores`, {
                        method: 'POST',
                        headers: {
                            'Content-Type' : 'application/json'
                        },
                        body: JSON.stringify(sentNodeRed)
                    });

                    clearTimeout(timeout);

                    // Verificamos si Node-RED respondió correctamente
                    if (nodeRed.status !== 200) {
                        console.error(`Error desde Node-RED: ${nodeRed.status} ${nodeRed.statusText}`);
                        return res.status(502).send({
                            status: "Error",
                            message: "Node-RED respondió con un código no exitoso.",
                            detalle: `${nodeRed.status} ${nodeRed.statusText}`
                        });
                    }

                    // Intentamos leer el cuerpo de la respuesta
                    let respuesta;
                    try {
                        respuesta = await nodeRed.json();
                    } catch {
                        respuesta = await nodeRed.text();
                    }

                    console.log("Respuesta Node-RED:", respuesta);

                    // Todo salió bien → devolvemos éxito al cliente
                    return res.status(200).send({
                        status: "Ok",
                        message: "Cambios efectuados correctamente y confirmados por Node-RED.",
                        servicio: respuesta
                    });

                } catch (error) {
                    if (error.name === "AbortError") {
                        console.error("Timeout: Node-RED no respondió a tiempo.");
                        return res.status(504).send({
                            status: "Error",
                            message: "El servicio de Node-RED no respondió (timeout)."
                        });
                    } else {
                        console.error("Error al contactar Node-RED:", error);
                        return res.status(500).send({
                            status: "Error",
                            message: "Error al intentar contactar con el servicio de Node-RED."
                        });
                    }
                }

            });

            connection.query(queryLog, async function(error, results, field){
                if(error){
                    console.log(error);
                }
            });

        });
    } else return res.status(400).send({status: "Error", message: "Ususario no Loggeado al Sistema"})
    //const dataIn = re
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

/*function revisarCookie(req){
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
};*/


/*function revisarCookie(req){
    try{
        const token = req.cookies?.jwt;
        if (!token) return { status: false };

        const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
        return { status: true, data: decoded };
    } catch {
        return { status: false };
    }
}*/

function revisarCookie(req) {
    try {
        const raw = req.headers.cookie;
        if (!raw) return { status: false };

        const found = raw.split("; ").find(c => c.startsWith("jwt="));
        if (!found) return { status: false };

        const token = found.substring(4);
        const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);

        return { status: true, data: decoded };
    } catch {
        return { status: false };
    }
}

export const methods = {
    soloAdmin,
    soloPublico,
    adminLimites,
    filFabPages,
    formLimFil,
    formLimFildataIn,
    formCalClima,
    formCalSent,
    edicionMarchaCompresores,
    verifyToken
};