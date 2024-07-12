'use-strict';
import { ventanaFlotanteClima, mouseOutfCl,puestoClimaRef } from "./funciones.mjs";
import { serverNodeRed } from "./variables.mjs";

const instalacion = 'g30';
let mediciones = ['temperatura', 'humedad', 'humedadAbs',];

for (let i = 0; i < mediciones.length; i++){
    const boton = document.getElementById(`clima_grafico_${mediciones[i]}`);
    boton.addEventListener('mouseover', (e) =>{
        const funcion = ventanaFlotanteClima(
            `fab3_${instalacion}_clima`,
             mediciones[i], 
             `clima_grafico_${mediciones[i]}`,
             e);
    boton.addEventListener('mouseout', (e) => {
        mouseOutfCl(e, boton);
    });
    });
};


const actualizarDatos = () => {
    const http = new XMLHttpRequest();
    let datos;
    http.open('GET', `${serverNodeRed}/datoClima`, true);

    http.onreadystatechange=function(){
        if(this.readyState==4 && this.status==200){
            datos = JSON.parse(http.responseText);
            //console.log(datos);
            let datosClima = datos.clima;
            let datosFiltros = datos.filtros;
            puestoClimaRef(
                'clima_color_temperatura', 
                'clima_color_humedad', 
                'text_temperatura', 
                'text_humedad', 
                datosClima, `fab3_${instalacion}_clima`, 
                'clima_color_humedadAbs', 
                'text_humedadAbs'
            );
        }
    }
    http.send();
};

const actualizarDatosInterCambiadores = () => {
        const http = new XMLHttpRequest();
        // Definir la URL del servidor
        let url = `${serverNodeRed}/salaClima`;
        // Definir el objeto JSON con los detalles de los datos a solicitar
        let requestData = {instalacion: `fab3_${instalacion}_intercambiadores`};
            // Convertir el objeto JSON a una cadena JSON
        let jsonData = JSON.stringify(requestData);
    
        // Abrir una conexión GET con la URL y enviar los datos JSON en el cuerpo de la solicitud
        http.open('GET', url + '?data=' + encodeURIComponent(jsonData), true);

            // Definir el callback para manejar la respuesta del servidor
        http.onreadystatechange = function() {
            if (http.readyState === XMLHttpRequest.DONE) {
                if (http.status === 200) {
                // La solicitud fue exitosa, llamar a la función handleResponse con los datos recibidos
                    const date = JSON.parse(http.responseText);
                    //console.log(date);
                    for (let x in date){
                        //console.log(`${x} : ${date[x]}`);
                        if(x.startsWith('Ent_') || x.startsWith('Sal_') || x.startsWith('Bomba_')){
                            const element = document.getElementById(x);
                            if(typeof date[x] !== 'string'){
                                element.textContent = date[x].toFixed(1);
                            } else element.textContent = date[x];
                        }
                    }
                }
            }
        }
        // Enviar la solicitud al servidor
        http.send();
        
};

actualizarDatos();
actualizarDatosInterCambiadores();

setInterval(actualizarDatos,actualizarDatosInterCambiadores , 60000);
