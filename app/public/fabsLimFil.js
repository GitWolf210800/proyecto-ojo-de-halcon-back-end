import { decodeJWT } from "./funciones.mjs";
//import { serverApp } from "./variables.mjs";
import { serverApp } from "./variables.mjs";
import { server } from "./variables.mjs";

document.getElementById("logout").addEventListener("click",()=>{
    document.cookie = 'jwt=; path=/; Expires=thu, 01 Jan 1970 00:00:01 GMT;';
    document.location.href = '/';
});

const datosUser = decodeJWT(document.cookie);

document.getElementById('bienvenida').textContent = `Bienvenido ${datosUser.name}`;

const buttonAction = async (ex)=>{    
    const res = await fetch(`${serverApp}/api/filfab`, {
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
        const fab = data.pop();
        const container = document.querySelector('.instalaciones');
        const formContainer = document.querySelector('.form-content');

        if(formContainer){
            while(formContainer.firstElementChild){
                formContainer.removeChild(formContainer.firstElementChild);
            }
        }

        while(container.firstElementChild){
            container.removeChild(container.firstElementChild);
        };

        for(let i = 0; i < data.length; i++){
            const button = document.createElement('button');
            button.innerHTML = data[i];
            button.className = `buttInst ${data[i]}`;
            container.appendChild(button);
        }

        document.querySelector('.instalaciones').addEventListener('click', async(e)=>{;
            const res = await fetch(`${serverApp}/api/formlimfil`, {
                method : 'POST',
                headers : {
                    'Content-Type' : 'application/json'
                },
                body : JSON.stringify({
                    button : e.srcElement.innerHTML,
                    fabrica : fab
                })
            });

            const resJson = await res.json();
            const datos = resJson[0];
            
            //console.log(datos);

            const container = document.querySelector('.form-content');

            while(container.firstElementChild){
                container.removeChild(container.firstElementChild);
            }

            let tittle = datos.nombre;

            const partes = tittle.split('_');
            const shift = partes.shift();
            const pop = partes.pop();
            const join  = partes.join(' ').toUpperCase();

            const divInfoInst = document.createElement('h3');
            divInfoInst.className = 'titulo formdata';
            divInfoInst.setAttribute('id', 'tituloIns');
            divInfoInst.textContent = join;
            container.appendChild(divInfoInst);

            const formulario = document.createElement('form');
            formulario.className = 'formulario';
            formulario.setAttribute('id', 'formulario');
            container.appendChild(formulario);
            const containerForm = document.querySelector('.formulario');

            let valores = Object.values(datos);
            let i = 0;
            let keys = [];

            for(let x in datos){
                if (x !== 'id_instalacion' && x !== 'nombre'){
                    keys.push(x);
                    let text = x.replace('lim', '');
                    (text === 'FiltroVent')
                        ? text = 'pre-aviso Diferencial Tela'
                        : text = text;
                    (text === 'FiltroVent_A')
                        ? text = 'Alarma Diferencial Tela'
                        : text = text;
                    const info = `${text}, Limite: ${valores[i]}`;
                    const divInfo = document.createElement('div');
                    divInfo.className = `info ${text}`;
                    divInfo.textContent = info;
                    containerForm.appendChild(divInfo);
                    const input = document.createElement('input');
                    input.setAttribute('id', `${x}`);
                    input.className = 'input';
                    input.type = 'number';
                    containerForm.appendChild(input);
                }
                i++;
            }
            const divInfoText = document.createElement('div');
            divInfoText.className = 'info';
            divInfoText.textContent = 'Indique el Motivo: '
            containerForm.appendChild(divInfoText);

            const inputText = document.createElement('input');
            inputText.setAttribute('id', 'motivo');
            inputText.setAttribute('required', 'true');
            inputText.className = 'input';
            inputText.type = 'text';
            containerForm.appendChild(inputText);

            const button = document.createElement('button');
            button.type = 'submit';
            button.innerHTML = 'Enviar';
            button.className = 'enviar';
            containerForm.appendChild(button);

            let dataSent = [];

            document.getElementById('formulario').addEventListener('submit', async(e)=>{
                e.preventDefault();
                const inputData = e.target.children;
                for (let i = 0; i < keys.length; i++){
                    if(inputData[keys[i]].value === ''){
                        dataSent.push (`"${keys[i]}" : ${datos[keys[i]]}`);
                    } 
                    else {
                    dataSent.push (`"${keys[i]}" : ${inputData[keys[i]].value}`);
                    }
                }

                dataSent.push(`"id_instalacion" : ${datos.id_instalacion}`);

                dataSent.push(`"motivo" : "${inputData.motivo.value}"`);

                const jsonDataSent = `{${dataSent}}`;

                const res = await fetch(`${serverApp}/api/formlimsent`, {
                    method : 'POST',
                    headers : {
                        'content-type' : 'application/json'
                    },
                    body : jsonDataSent
                });
                const resJson = await res.json();
                if(resJson.message) alert(resJson.message);

                const response = await fetch(`${server}/updateLim`, {method: 'GET'})
                .then(()=> console.log('node-red actualizado'))
                .catch(error => console.error('Error al actualizar node-red', error));

                if(resJson.redirect) window.location.href = resJson.redirect;
            });

        });

    })
    .catch(error => console.error('Error:', error));
};

document.querySelector('.botones').addEventListener('click', (e)=>{buttonAction(e)});

