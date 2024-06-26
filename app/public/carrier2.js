'use-strict';
import { alarmClima, server, neutral, serverNodeRed, okClima, alertClima, paroManual } from "./variables.mjs";
import { decodeJWT, ventanaFlotanteClima, mouseOutfCl, climaExt } from "./funciones.mjs";
import { datosCarrier } from "./funciones.mjs";

const instalacion = 'carrier2';
const tempExt = document.getElementById('tempExtt');
const humExt = document.getElementById('humExtt');
const entalpiaExt = document.getElementById('entalpiaa');

let http = new XMLHttpRequest();
let userVerif = decodeJWT(document.cookie);
const nombre = document.getElementById('nombreInstalacion').textContent = 'Carrier 2';

/*if (userVerif){
    const valUser = async () => {
        await fetch(`${server}/api/valUserClimaAdmin`, {
            method: 'GET',
            headers: {
                'content-type' : 'application/json'
            },
            body : JSON.stringify({
                usuario: userVerif.user
            })
        });
    };
}*/

datosCarrier(instalacion);
climaExt(`${serverNodeRed}/dataFab9exterior`);

const actualizarDatos = () => {
    datosCarrier(instalacion);
    climaExt(`${serverNodeRed}/dataFab9exterior`);
};

tempExt.addEventListener("mouseover", (e) => {
    const tempExterior = ventanaFlotanteClima(
      'fab9_exterior_clima',
      'temperatura',
      tempExt,
      e
    );
  });
  
  tempExt.addEventListener("mouseout", (e) => {
    const tempExterior = mouseOutfCl(e, tempExt);
  });


  humExt.addEventListener("mouseover", (e) => {
    const humExterior = ventanaFlotanteClima(
      'fab9_exterior_clima',
      'humedad',
      humExt,
      e
    );
  });
  
 humExt.addEventListener("mouseout", (e) => {
    const humExterior = mouseOutfCl(e, humExt);
  });

  entalpiaExt.addEventListener("mouseover", (e) => {
    const entExterior = ventanaFlotanteClima(
      'fab9_exterior_clima',
      'entalpia',
      entalpiaExt,
      e
    );
  });
  
  entalpiaExt.addEventListener("mouseout", (e) => {
    const entExterior = mouseOutfCl(e, entalpiaExt);
  });


  setInterval(actualizarDatos, 60000);