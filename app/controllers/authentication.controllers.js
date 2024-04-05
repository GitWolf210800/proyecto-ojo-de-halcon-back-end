import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import {connection} from "../middlewares/db.js";

//Settings
dotenv.config();
var usuarioss = [];


export const usuarios = [{
    user : 1150,
    email : 'a@a.com',
    password : '$2a$05$jW.mYAll7N2vq1ZjTAmqf.pnGn1TvN/JbVVoHcrKUMHtoukRg8mkO'
}];


async function login(req, res){
    console.log(req.body);
    const user = parseInt(req.body.user);
    const password = req.body.password;
    if(!user || !password){
        return res.status(400).send({status:"Error", message:"Los Campos Estan Incompletos"});
    }

    const salt = await bcryptjs.genSalt(5);
    const hashPassword = await bcryptjs.hash(password,salt);
    console.log(`password Hash: (${hashPassword})`);

    connection.connect();

    connection.query(`SELECT * FROM usuarios WHERE id_legajo = ${user}`, async function(error, results, fields){
        if(error){
            console.log(error);
        };
        if(Object.keys(results).length > 0){
            const loginCorrecto = await bcryptjs.compare(password, results[0].passwordd);
            console.log('entro!');
            console.log(loginCorrecto);
            if(loginCorrecto){
            const token = jsonwebtoken.sign({user: user, name: results[0].nombre, lastName: results[0].apellido}, 
                process.env.JWT_SECRET, 
                {expiresIn: process.env.JWT_EXPIRATION});
            const cookieOption = {
                expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
                path: "/"
            };
            res.cookie("jwt",token,cookieOption);
            res.send({status:"ok", message: "Usuario loggeado", redirect: "/admin"});
        } else return res.status(400).send({status: "Error", message:"¡Error de Login!"});    
            //return res.status(200).send({status:"ok", message:"Inicio de Sesion Exitoso", redirect: '/admin'});
        } else {
            return res.status(400).send({status: "Error", message:"¡Error de Login!"});
        }
    });
    connection.end();

   /*
    const usuariosARevisar = usuarios.find(usuario => usuario.user === user);

    if(!usuariosARevisar){
        return res.status(400).send({status: "Error", message:"¡Error de Login!"});
     }

     const loginCorrecto = await bcryptjs.compare(password, usuariosARevisar.password);
     if(!loginCorrecto){
        return res.status(400).send({status: "Error", message:"¡Error de Login!"});
     }
     const token = jsonwebtoken.sign({user: usuariosARevisar.user}, 
        process.env.JWT_SECRET, 
        {expiresIn: process.env.JWT_EXPIRATION});

    const cookieOption = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
        path: "/"
    };
    res.cookie("jwt",token,cookieOption);
    res.send({status:"ok", message: "Usuario loggeado", redirect: "/admin"});*/
}

async function register(req, res){
    console.log(req.body);
    const name = req.body.name;
    const lastName = req.body.lastName;
    const legajo = parseInt(req.body.legajo);
    const puesto = req.body.puesto;
    let email = req.body.email;
    const passUser = req.body.passUser;
    const legajoPat = req.body.legajoPat;
    const passUserPat = req.body.passUserPat;

    (email) ? email = email : email = null;

    if (!name || !lastName || !legajo || !puesto || !passUser || !legajoPat || !passUserPat){
        return res.status(400).send({status: "Error", message: "Los campos obligatorios estan incompletos"});
    }

    const usuariosARevisar = usuarios.find(usuario => usuario.user === legajo);

    //console.log(usuariosARevisar);

    if(usuariosARevisar){
       return res.status(400).send({status: "Error", message:"Este usuario ya Existe!"});
    }

    const salt = await bcryptjs.genSalt(5);
    const hashPassword = await bcryptjs.hash(passUser,salt);
   const newUser = {
        user : legajo, email : email, password : hashPassword
    };
    usuarios.push(newUser);
    console.log(usuarios);
    return res.status(201).send({status:"ok", message: `Usuario ${legajo} agregado`, redirect:"/"});
}

export const methods = {
    login,
    register
};