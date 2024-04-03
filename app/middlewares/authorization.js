import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import  {usuarios}  from "../controllers/authentication.controllers.js";

dotenv.config();

function soloAdmin(req, res, next){
    const logueado = revisarCookie(req);
    if(logueado) return next();
    else return res.redirect('/');
};

function soloPublico(req, res, next){
    const logueado = revisarCookie(req);
    if(!logueado) return next();
    else return res.redirect('/admin');
};

function revisarCookie(req){
    try{
        const cookieJWT = req.headers.cookie.split('; ').find(cookie => cookie.startsWith('jwt=')).slice(4);
        const decodificada = jsonwebtoken.verify(cookieJWT, process.env.JWT_SECRET);
        console.log(decodificada);
        const usuariosARevisar = usuarios.find(usuario => usuario.user === decodificada.user);
        console.log(usuariosARevisar);
        if(!usuariosARevisar){
            return false
         } else return true;
    }
    catch {
        return false;
    }
};

export const methods = {
    soloAdmin,
    soloPublico
};