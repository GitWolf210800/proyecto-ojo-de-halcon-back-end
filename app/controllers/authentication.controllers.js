import { createRegister } from "./register.controller.js";
import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import {connection} from "../middlewares/db.js";
import {createResetToken} from "../middlewares/authorization.js";
import sendMail from "../utils/mailer.js";
import path from "path";
import { serverApp } from "../middlewares/variables.mjs";

//Settings
dotenv.config();

async function login(req, res){
    //console.log(req.body);
    const user = parseInt(req.body.user);
    console.log(user);
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
            if (loginCorrecto) {
    const token = jsonwebtoken.sign(
        { user: user, name: results[0].nombre, lastName: results[0].apellido, sexo: results[0].sexo},
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION }
    );

    const cookieOption = {
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
        path: "/"
    };

    //console.log(token);

    res.cookie("jwt", token, cookieOption);

    // 🔥 UNIFICAMOS TODO
    const usuario = {
        name: results[0].nombre,
        lastName: results[0].apellido,
        legajo: user,
        sexo: results[0].sexo,
        rol: ""
    };

    switch (results[0].id_priv) {
        case 0:
            usuario.rol = "SUPER_USER";
            break;
        case 1:
            usuario.rol = "ADMIN_LIMITES";
            break;
        case 2:
            usuario.rol = "CALIBRACION_CLIMA";
            break;
        case 3:
            usuario.rol = "VISITANTE";
            break;
        case 5:
            usuario.rol = "POLIFUNCIONAL";
            break;
        case 6:
            usuario.rol = "PLANNER";
            break;
    }

    console.log(cookieOption);

    return res.send({
        status: "ok",
        message: "Usuario loggeado",
        usuario,
        cookieOption,
        token
    });
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

const register = createRegister({ getConnection: () => connection, bcryptjs });

async function resetPassword(req,res){

    try{

        const {token, password} = req.body;

        if(!token || !password){
            return res.status(400).json({
                status:"Error",
                message:"Datos incompletos"
            });
        }

        connection.query(
            "SELECT * FROM password_resets WHERE token=? AND expires_at > NOW()",
            [token],
            async (err,results)=>{

                if(err) return res.status(500).json({error:"DB error"});

                if(!results.length){
                    return res.status(400).json({
                        status:"Error",
                        message:"Token inválido o expirado"
                    });
                }

                const userId = results[0].user_id;

                const salt = await bcryptjs.genSalt(5);
                const hashPassword = await bcryptjs.hash(password,salt);

                connection.query(
                    "UPDATE usuarios SET passwordd=? WHERE id=?",
                    [hashPassword,userId],
                    (err)=>{

                        if(err) return res.status(500).json({error:"DB error"});

                        connection.query(
                            "DELETE FROM password_resets WHERE token=?",
                            [token]
                        );

                        res.json({
                            status:"ok",
                            message:"Contraseña actualizada"
                        });

                    }
                );

            }
        );

    }catch(err){
        res.status(500).json({error:"Error servidor"});
    }

}
export const methods = {
    login,
    logout,
    register,
    resetPassword
};