import bcryptjs from "bcryptjs";


const usuarios = [{
    user : 1150,
    email : 'a@a.com',
    password : 'a'
}];

async function login(req, res){

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

    console.log(usuariosARevisar);

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