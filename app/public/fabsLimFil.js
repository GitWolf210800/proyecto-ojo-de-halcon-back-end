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

const buttonAction = async (ex)=>{    
    /*console.log(`action:`);
    console.log(ex);
    console.log(ex.srcElement.innerText);*/
    const res = await fetch('http://192.168.3.122:4000/api/filfab', {
    method: 'POST',
    headers: {
        'content-type' : 'application/json'
    },
    body: JSON.stringify({
        button : ex.srcElement.innerText
    })
})
    .then(response => response.json())
    .then(data => {
        console.log(data); 

        const fab = data.pop();

        console.log(fab);

        for(let i = 0; i < data.length; i++){
            const container = document.querySelector('.instalaciones');
            const button = document.createElement('button');
            button.innerHTML = data[i];
            button.className = `buttInst ${data[i]}`;
            container.appendChild(button);
        }
    })
    .catch(error => console.error('Error:', error));
};

document.getElementById('fabrica1').addEventListener('click', (e)=>{buttonAction(e)});

document.getElementById('fabrica3').addEventListener('click', (e)=>{buttonAction(e)});

document.getElementById('fabrica4').addEventListener('click', (e)=>{buttonAction(e)});

document.getElementById('fabrica6').addEventListener('click', (e)=>{buttonAction(e)});

document.getElementById('fabrica9').addEventListener('click', (e)=>{buttonAction(e)});