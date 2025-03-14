import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import {connection} from "../middlewares/db.js";
import path from "path";

//Settings
dotenv.config();

async function login(req, res){
    console.log(req.body);
    const user = parseInt(req.body.user);
    const password = req.body.password;
    if(!user || !password){
        return res.status(400).send({status:"Error", message:"Los Campos Estan Incompletos"});
    }

    connection.query(`SELECT * FROM usuarios WHERE id_legajo = ${user}`, async function(error, results, fields){
        if(error){
            console.log(error);
        };
        if(Object.keys(results).length > 0){
            const loginCorrecto = await bcryptjs.compare(password, results[0].passwordd);
            if(loginCorrecto){
                const token = jsonwebtoken.sign({user: user, name: results[0].nombre, lastName: results[0].apellido}, 
                    process.env.JWT_SECRET, 
                    {expiresIn: process.env.JWT_EXPIRATION}
                );
                const cookieOption = {
                    httpOnly: false,          // Previene el acceso desde JavaScript
                    //secure: false,           // Cambia a true en producción con HTTPS
                    sameSite: 'Lax',        // Permite el uso de cookies en cross-origin
                    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
                    //path: "/"
                };
                res.cookie("jwt",token,cookieOption);//-- se prueba desactivar, con el nuevo login en Vue3

                let usuario = { name: results[0].nombre, lastName: results[0].apellido, legajo: user  };

                if (results[0].id_priv === 0){
                    usuario.rol = 'SUPER_USER';
                    res.send({status:"ok", message: "Super_Usuario loggeado", usuario, cookieOption, token});
                    console.log(cookieOption);
                } 
                else if (results[0].id_priv === 1){
                    res.send({status: 'ok', message: 'usuario admin limites loggeado', redirect: '/limites'});
                }
            } 
            else return res.status(400).send({status: "Error", message:"¡Error de Login!"});    
        } 
        else return res.status(400).send({status: "Error", message:"¡Error de Login!"});
    });

}

async function logout(req, res) {
    res.clearCookie('jwt', {path: '/'});
    res.status(200).json({message: 'Sesion Cerrada'});
}

async function register(req, res){
    console.log(req.body);
    const name = req.body.name;
    const lastName = req.body.lastName;
    const legajo = parseInt(req.body.legajo);
    const puesto = req.body.puesto;
    let clavex = req.body.clavex;
    let email = req.body.email;
    const passUser = req.body.passUser;
    const legajoPat = req.body.legajoPat;
    const passUserPat = req.body.passUserPat;

    (email) ? email = email : email = 'NULL';

    if (!clavex) clavex = 'NULL';
    else if (clavex === 'SUPER_USER') clavex = 0;
    else if (clavex === 'ADMIN_LIMITES') clavex = 1;

    if (!name || !lastName || !legajo || !puesto || !passUser || !legajoPat || !passUserPat){
        return res.status(400).send({status: "Error", message: "Los campos obligatorios estan incompletos"});
    }


    connection.query(`SELECT * FROM usuarios WHERE id_legajo = ${legajoPat}`, async function(error, results, fields){
        if (error){
            console.log(error);
        }
        if(Object.keys(results).length > 0){
            const passUserPatVerif = await bcryptjs.compare(passUserPat, results[0].passwordd);
            (!passUserPatVerif)
                ? res.status(400).send({status: 'Error', message: 'Error de password de usuario Patrocinador'})
                : console.log('ok passPatron');
            
            (results[0].id_priv !== 0)
                ? res.status(400).send({status: 'Error', message: 'El usuario patrocinador ingresado, no tiene autorizacion para la solicitud!'})
                : console.log('ok usuarioPatron');
        } else return res.status(400).send({status: 'Error', message: 'El Usuario Patrocinador ingresado no existe'});
    });



    connection.query(`SELECT * FROM usuarios WHERE id_legajo = ${legajo}`, function(error, results, fields){
        if(error){
            console.log(error);
        }
        if(Object.keys(results).length > 0){
            res.status(400).send({status:'Error', message: 'Este Usuario ya Existe!'});
        }
    });

    const salt = await bcryptjs.genSalt(5);
    const hashPassword = await bcryptjs.hash(passUser,salt);
    let query = `INSERT INTO usuarios (
        id_legajo,
        nombre,
        apellido,
        puesto,
        email,
        passwordd,
        id_priv
    )  VALUES( ${legajo}, 
        '${name}', 
        '${lastName}', 
        '${puesto}', 
        '${email}', 
        '${hashPassword}', 
        ${clavex});`;
    console.log(query);

    connection.query(query, function(error, results, fields){
        if (error){
            console.log(error);
        } else {
            return res.status(201).send({status:"ok", message: `Usuario ${legajo} agregado`, redirect:"/"});
        }
    });

}

export const methods = {
    login,
    logout,
    register
};