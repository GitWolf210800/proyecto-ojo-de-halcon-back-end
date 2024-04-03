import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
export const usuarios = [{
    user : 1150,
    email : 'a@a.com',
    password : '$2a$05$uG566rRvNbIybe9xx.CyiuhEHp228O/GO5eWRnGuunaT8MZtaOz5W'
}];

async function login(req, res){
    console.log(req.body);
    const user = parseInt(req.body.user);
    const password = req.body.password;
    if(!user || !password){
        return res.status(400).send({status:"Error", message:"Los Campos Estan Incompletos"});
    }

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
    res.send({status:"ok", message: "Usuario loggeado", redirect: "/admin"})
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