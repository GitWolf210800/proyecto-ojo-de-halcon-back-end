document.getElementsByTagName("button")[0].addEventListener("click",()=>{
    document.cookie = 'jwt=; path=/; Expires=thu, 01 Jan 1970 00:00:01 GMT;';
    document.location.href = '/';
});

let todasLasCookies = document.cookie;

function decodeJWT(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

const datosUser = decodeJWT(todasLasCookies);

document.getElementById('bienvenida').textContent = `Bienvenido ${datosUser.name}`;
