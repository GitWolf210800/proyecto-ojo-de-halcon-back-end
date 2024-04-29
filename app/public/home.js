/* ojoDeHalcon Version 2.0

 ! Software Developed by @GitWolf210800 --gitHub // Ezequiel Quintana Torrent, since proyect 2023 - 2024
   For: Tipoiti S.A.T.I.C. in Innovacion & Desarrollo

 ** Tecnologies extern used:
 * Chart.js
 * SVG graphics in XML tecnology
   
*/

"use strict";

//////////////////////////// Here declared Address Server
const server = "http://192.168.3.122:1880";
const serverApp = 'http://192.168.3.122:4000/login';                                       
let direccion =  `${server}/datoClima`;
let datos;
let http = new XMLHttpRequest();
/////////////////////////////////////////////////////////

///////////////////////////// popUp windows, Chart variable global, and Colours ///////////////////////
var chart;
var chartCl;
let paso = 1;
let pasoCl = 1;
const ventanaFlotante = document.getElementById("ventanaFlotante");                 // Here declared in popUp windows, previosly developed in CSS and HTML
const ventanaFlotanteclima = document.getElementById("ventanaClima");              //  idem

////////////////////// colours
const tempoColdExt = "#3275E4";
const tempOkExt = "#F4E441";
const tempMhotExt = "#FA9133";
const tempHotExt = "#F43B2F";
const fallaColor = '#5A00C6';

const humOkExt = "#37AED8";

const alarmClima = '#ffff00f0';     /// Yellow colour
const alertClima = "#BD1F1F";
const preAlertClima = "#E4C500";
const okClima = "#2bc12cff";

const neutral = "#8F8F8F";
const neutClima = '#4A4D4F';

const alertFiltro = "#DC5252";
const okFiltro = "#24A024";

const textOk = "#7DD129";
const textNotOk = "#DF1111";

const offline = "#C96100";

const mouseOver = "#58B7D3";

const mouseOut = "#333";
///////////////////////////////////////////////////////////////////////////////////////////////////


/////////////////////////////////// objects SVG declared for logic used ///////////////////////

const botonLogin = document.getElementById('loginButton');
const fab1FiltroPrensa = document.getElementById("filtroPrensaFab1");
const fab1filtroCoton = document.getElementById("filtroCotoniaFab1");
const fab1FiltroBatan = document.getElementById("filtroBatanFab1");
const fab1FiltroCard = document.getElementById("filtroCardasFab1");
const fab1ClimaTCardT = document.getElementById('climaGt.cardasTFab1');
const fab1ClimaTCardH = document.getElementById('climaGt.cardasHFab1');
const fab1FiltroPrep = document.getElementById("filtroPrepFab1");
const fab1ClimaPeiT = document.getElementById("climaGpeinadorasTFab1");
const fab1ClimaPeiH = document.getElementById("climaGpeinadorasHFab1");
const fab1peiHumAbs = document.getElementById('climaGpeinadorasEFab1');
const fab1ClimaManT = document.getElementById("climaGmanuaresTFab1");
const fab1ClimaManH = document.getElementById("climaGmanuaresHFab1");
const fab1FiltroCont = document.getElementById("filtroContinuasFab1");
const fab1FiltroBob = document.getElementById("filtroBobinajeFab1");
const fab1ClimaCont1T = document.getElementById("climaGcontinuas-1TFab1");
const fab1ClimaCont1H = document.getElementById("climaGcontinuas-1HFab1");
const fab1ClimaCont2T = document.getElementById("climaGcontinuas-2TFab1");
const fab1ClimaCont2H = document.getElementById("climaGcontinuas-2HFab1");
const fab1cont2HumAbs = document.getElementById('climaGcontinuas-2EFab1');
const fab1ClimaVortex1T = document.getElementById("climaGvortex-1TFab1");
const fab1ClimaVortex1H = document.getElementById("climaGvortex-1HFab1");
const fab1ClimaVortex2T = document.getElementById("climaGvortex-2TFab1");
const fab1ClimaVortex2H = document.getElementById("climaGvortex-2HFab1");
const fab1ClimaVortex3T = document.getElementById("climaGvortex-3TFab1");
const fab1ClimaVortex3H = document.getElementById("climaGvortex-3HFab1");
const fab1ClimaVortex4T = document.getElementById("climaGvortexTFab1");
const fab1ClimaVortex4H = document.getElementById("climaGvortexHFab1");


const fab1ClimaBobT = document.getElementById("climaGbobinajeTFab1");
const fab1ClimaBobH = document.getElementById("climaGbobinajeHFab1");
const fab1bobHumAbs = document.getElementById('climaGbobinajeEFab1');
const fab1ClimaEmpT = document.getElementById("climaGempaqueTFab1");
const fab1ClimaEmpH = document.getElementById("climaGempaqueHFab1");
const fab1empHumAbs = document.getElementById('climaGempaqueEFab1');
const fab1FiltroColor = document.getElementById("filtroColorFab1");
const fab1ClimaColorT = document.getElementById("climaGcolorTFab1");
const fab1ClimaColorH = document.getElementById("climaGcolorHFab1");
const fab1colHumAbs = document.getElementById('climaGcolorHFab1-6');


const fab3FiltroEx8 = document.getElementById("filtroEX-8Fab3");
const fab3ClimaC80T = document.getElementById("climaGc80TFab3");
const fab3ClimaC80H = document.getElementById("climaGc80HFab3");
const fab3ClimaC50T = document.getElementById('climaGcardasTFab3');
const fab3ClimaC50H = document.getElementById('climaGcardasHFab3');
const fab3C50HumAbs = document.getElementById('climaGcardasEFab3');
const fab3ClimaPeiT = document.getElementById("climaGpeinadorasTFab3");
const fab3ClimaPeiH = document.getElementById("climaGpeinadorasHFab3");
const fab3PeiHumAbs = document.getElementById("climaGpeinadorasEFab3");
const fab3ClimaManT = document.getElementById("climaGmanuaresTFab3");
const fab3ClimaManH = document.getElementById("climaGmanuaresHFab3");
const fab3Pei65HumAbs = document.getElementById('climaGmanEFab3');
const fab3ClimaLabT = document.getElementById('climaGmecheraTFab3-3');
const fab3ClimaLabH = document.getElementById('climaGmanuaresHFab3-7-9');
const fab3LabHumAbs = document.getElementById('climaGlaboratorioEFab3');

const fab3ClimaMechT = document.getElementById('climaGmecheraTFab3');
const fab3ClimaMechH = document.getElementById('climaGmanuaresHFab3-7');
const fab3MechHumAbs = document.getElementById('climaGmecheraEFab3');

const fab3FiltroPei = document.getElementById("filtroPrepFab3-5");
const fab3FiltroPrep = document.getElementById("filtroPrepFab3");
const fab3FiltroCardas = document.getElementById("filtroCardasFab3");
const fab3FiltroCont = document.getElementById("filtroContFab3");
const fab3FiltroBob = document.getElementById("filtroBobFab3");
const fab3FiltroG33 = document.getElementById("filtroG33Fab3");
const fab3ClimaG30T = document.getElementById("climaGg30TFab3");
const fab3ClimaG30H = document.getElementById("climaGg30HFab3");
const fab3G30HumAbs = document.getElementById('climaGg30EFab3');
const fab3ClimaBobT = document.getElementById("climaGbobTFab3");
const fab3ClimaBobH = document.getElementById("climaGbobHFab3");
const fab3bobHumAbs = document.getElementById('climaGbobEFab3');
const fab3ClimaTejT = document.getElementById('climaGtejTFab3');
const fab3ClimaTejH = document.getElementById('climaGtejHFab3');
const fab3tejHumAbs = document.getElementById('climaGtejEFab3');
const fab3ClimaG33T = document.getElementById("climaGg33TFab3");
const fab3ClimaG33H = document.getElementById("climaGg33HFab3");
const fab3G33HumAbs = document.getElementById('climaGg33EFab3');
const fab3Clima3ZT = document.getElementById("climaG3zTFab3");
const fab3Clima3ZH = document.getElementById("climaG3zHFab3-1");
const fab3z3HumAbs = document.getElementById('climaG3zEFab3');

const fab4FiltroBatan = document.getElementById("filtroBatanFab4");
const fab4FiltroCardas = document.getElementById("filtroCardaFab4");
const fab4FiltroClima = document.getElementById("filtroClimaFab4");
const fab4ClimaPrepT = document.getElementById("climaGprepTFab4");
const fab4ClimaPrepH = document.getElementById("climaGprepHFab4");
const fab4HumAbsPrep = document.getElementById("climaGprepEFab4");

const fab4ClimaOpenEndT = document.getElementById("climaGopenEndTFab4");
const fab4ClimaOpenEndH = document.getElementById("climaGopenEndHFab4");

const fab4FiltroRetor = document.getElementById("filtroRetorFab4");
const fab4ClimaRetorT = document.getElementById("climaGoretorTFab4");
const fab4ClimaRetorH = document.getElementById("climaGoretorHFab4");

const fab6FiltroPrep = document.getElementById("filtroPrepFab6");
const fab6ClimaPrepT = document.getElementById("climaGPrepTFab6");
const fab6ClimaPrepH = document.getElementById("climaGPrepHFab6");
const fab6HumAbsPrep = document.getElementById("climaGPrepEFab6");

const fab6FiltroCont = document.getElementById("filtroContFab6");
const fab6ClimaContT = document.getElementById("climaGContTFab6");
const fab6ClimaContH = document.getElementById("climaGContHFab6");
const fab6HumAbsCont = document.getElementById("climaGContEFab6");

const fab6FiltroBob = document.getElementById("filtroBobFab6");
const fab6ClimaBobT = document.getElementById("climaGBobTFab6");
const fab6ClimaBobH = document.getElementById("climaGBobHFab6");
const fab6HumAbsBob = document.getElementById("climaGBobHFab6-1");

const fab9ClimaCarda1T = document.getElementById("climaGCardas-1TFab9");
const fab9ClimaCarda1H = document.getElementById("climaGBobHFab6-6");
const fab9car1HumAbs = document.getElementById('climaGPrepEFab9-1');
const fab9ClimaCarda2T = document.getElementById("climaGCardas-2TFab9");
const fab9ClimaCarda2H = document.getElementById("climaGCardas-2HFab9");
const fab9FiltroCardaA = document.getElementById("filtroCardasAFab9");
const fab9FiltroCardaB = document.getElementById("filtroCardasBFab9");
const fab9FiltroLuwa = document.getElementById("filtroLuwaFab9");
const fab9FiltroPrep = document.getElementById("filtroPrepFab9");
const fab9ClimaPrepT = document.getElementById("climaGPrepTFab9");
const fab9ClimaPrepH = document.getElementById("climaGPrepHFab9");
const fab9FiltroOE = document.getElementById("filtroOpenEndFab9");
const fab9ClimaOET = document.getElementById("climaGPrepTFab9-3");
const fab9ClimaOEH = document.getElementById("climaGPrepTFab9-3-2");
const fab9OEHumAbs = document.getElementById('climaGopenEndEFab9');
const fab9ClimaEmpT = document.getElementById("climaGEmpTFab9");
const fab9ClimaEmpH = document.getElementById("climaGEmpHFab9");
const fab9empHumAbs = document.getElementById('climaGEmpEFab9');
const fab9ClimaExtT = document.getElementById('tempExtt');
const fab9ClimaExtH = document.getElementById('text349');
const fab9ClimaExtE = document.getElementById('entalpiaa');

/////////////////////////////////////////////////////////////////////////////////////////////

const isMobile = () => {                                 //// This function is for detected if is mobile
  return /Mobi|Android/i.test(navigator.userAgent);
};

const detecPant = () => {                               //// This function is for detected between mobile and PC
  if(isMobile()) {
    console.log('Pantalla de un SmartPhone');
    //alert('Pantalla de un celular');
  } else {
    console.log('Pantalla de una Pc');
    //alert('pantalla de una PC');
  }
};

const climaExt = (direccion) => {                        /// This function is for interact in object SVG clima Extern
  const tempExteriortext = document.getElementById("tempExt");
  const tempExt = document.getElementById("tempExt");
  const humExterior = document.getElementById("humExt");
 // const fecha = document.getElementById("fecha");
  const entalpiaText = document.getElementById("entalpia");
  
/*
  const fechaActual = new Date();
  const fechaText = `${fechaActual.getDate()} / ${
    fechaActual.getMonth() + 1
  } / ${fechaActual.getFullYear()}`;
  fecha.textContent = fechaText;*/

  const sector = new XMLHttpRequest();

  sector.onreadystatechange = () => {
    if (sector.readyState == XMLHttpRequest.DONE) {
      if (sector.status == 200) {
        const date = JSON.parse(sector.responseText);
        const tempExtdate = `${parseInt(date.datos[0].temperatura)} °C`;
        const humExtdata = `${parseInt(date.datos[0].humedad)} %`;
        entalpiaText.textContent = `${date.datos[0].entalpia.toFixed(2)} Kj / Kg`;
        const ultimaVezText = document.getElementById("ultimaVez").textContent = date.actualizacion;

        if (date.datos[0].temperatura < 20) {
          tempExt.style.fill = tempoColdExt;
          tempExt.style.stroke = tempoColdExt;
        } else if (date.datos[0].temperatura < 30) {
          tempExt.style.fill = tempOkExt;
          tempExt.style.stroke = tempOkExt;
        } else if (
          date.datos[0].temperatura >= 30 &&
          date.datos[0].temperatura < 38
        ) {
          tempExt.style.fill = tempMhotExt;
          tempExt.style.stroke = tempMhotExt;
        } else if (date.datos[0].temperatura >= 38) {
          tempExt.style.fill = tempHotExt;
          tempExt.style.stroke = tempHotExt;
        }
        tempExteriortext.textContent = tempExtdate;
        humExterior.textContent = humExtdata;
      } else console.log("error", sector);
    }
  };
  sector.open("GET", direccion, true);
  sector.send();
};

const ventanaFlotanteFiltro = (nombre, boton, e) => {    /// This function is for show data in filters installation and popUp windows adjusted automatically
let ctxFl = document.getElementById("myChartfiltro");
if(window.chart) window.chart.destroy();
// Definir la URL del servidor
let url = `${server}/filtro24hs`;

// Definir el objeto JSON con los detalles de los datos a solicitar
let requestData = {
  instalacion: nombre
};

// Convertir el objeto JSON a una cadena JSON
let jsonData = JSON.stringify(requestData);


// Abrir una conexión GET con la URL y enviar los datos JSON en el cuerpo de la solicitud
http.open('GET', url + '?data=' + encodeURIComponent(jsonData), true);

// Definir el callback para manejar la respuesta del servidor
http.onreadystatechange = function() {
  if (http.readyState === XMLHttpRequest.DONE) {
    if (http.status === 200) {
      // La solicitud fue exitosa, llamar a la función handleResponse con los datos recibidos
      //handleResponse(responseData);
      const date = JSON.parse(http.responseText);
      const dataTempReal = date.datos[0];
      
      if (nombre !== 'fabx_prensa_filtro'){
        const infoTVent = `Ventilador: (Limite Inf: ${dataTempReal.limVent} Pa)`;
        const infoVent = `${dataTempReal.ventilador.toFixed(2)} Pa`;
        const preFiltroData = dataTempReal.preFiltro;
        const limPreFiltroData = dataTempReal.limPreFiltro;
        const picos2Data = dataTempReal.picos2;
        const limPicos = dataTempReal.limPicos;
        const rpm2Data = dataTempReal.rpmFiltro2;
        const limRpmFiltro = dataTempReal.limRpm;
        const carro2Data = dataTempReal.carro2;
        const limCarro = dataTempReal.limCarro;
        const picos2Title = document.getElementById("titlePicos2");
        const picos2 = document.getElementById("pico2");
        const carro = document.getElementById("carro");
        const rpm2Title = document.getElementById("RPM2H");
        const rpm2 = document.getElementById("rpm2");
        const carro2Title = document.getElementById("carro2H");
        const carro2 = document.getElementById("carro2");
        const inst = document.getElementById("instalacion");
        const titleVent = (document.getElementById("titleVent").textContent = infoTVent);
        const vent = document.getElementById("vent");
        inst.textContent = `${date.instalacion}`;
  
        let ultID = dataTempReal.ID;
        //let ultMed = dataTempReal.fecha.getTime();
  
        if (nombre !== 'fab4_cardas_filtro'){
          document.getElementById('titleTela').style.display = 'block';
          document.getElementById('filtroVent').style.display = 'block';
          document.getElementById('myChartfiltro').style.display = 'block';
          const limtieG = dataTempReal.limFiltroVent_A + 50;
          const datos = date.datos;
          const infoTFiltroV = `Diferencial de la Tela: (Limite Sup: ${dataTempReal.limFiltroVent} Pa)`;
          const infoFiltroVent = `${dataTempReal.filtroVentilador.toFixed(2)} Pa`;
          const infoTpicos = `Picos: (Limite Inf: ${dataTempReal.limPicos} Pa)`;
          const infoPicos = `${dataTempReal.picos.toFixed(2)} Pa`;
          const infoTRpm = `RPM: (Limite Inf: ${dataTempReal.limRpm} RPM)`;
          const infoRpm = `${dataTempReal.rpmFiltro} RPM`;
          const infoTCarro = `Carro: (Limite Inf: ${dataTempReal.limCarro})`;
          const infoCarro = `${dataTempReal.carro}`;
          const titleFiltroV = (document.getElementById("titleTela").textContent = infoTFiltroV);
          const diferencial = document.getElementById("filtroVent");
          const titlePico = (document.getElementById("titlePicos").textContent = infoTpicos);
          const pico = document.getElementById("pico");
          const titleRpm = (document.getElementById("titleRpm").textContent = infoTRpm);
          const rpm = document.getElementById("rpm");
          const titleCarro = (document.getElementById("titleCarro").textContent = infoTCarro);
          let datoss = [];
          let limite = [];
          let limiteA = [];
  
          for (let i = 0; i < datos.length; i++) {  // here running bucle for array data since dataBase server

            let fecha = new Date(datos[i].fecha);
            let hora = fecha.getHours().toString().padStart(2, "0");
            let minuto = fecha.getMinutes().toString().padStart(2, "0");
            let horaText = `${hora}:${minuto}`;
            datoss.push({
               x: horaText,
               y: `${parseInt(datos[i].filtroVentilador)}`,
              });
            limite.push({
              x: horaText,
              y: `${datos[i].limFiltroVent}`,
              });
            limiteA.push({
              x : horaText,
              y : `${datos[i].limFiltroVent_A}`
            });

            }

            limiteA.reverse();
            limite.reverse();
            datoss.reverse();
            //console.log(limiteA);
       window.chart = new Chart(ctxFl, {
            type: "line",
            data: {
            datasets: [
                {
                  label: "Diferencial",
                  borderColor: "blue",
                  borderWidth: 1.5,
                  data: datoss,
                  //yAxisID: 'y',
                },
                {
                  label: "Límite Optimo",
                  borderColor: "#E6C000",
                  borderWidth: 1,
                  data: limite,
                  //yAxisID: 'y1',
                },
                {
                  label: `Limite Alarma ${dataTempReal.limFiltroVent_A} Pa`,
                  borderColor: "#FF1111",
                  borderWidth: 1,
                  data: limiteA,
                  //yAxisID: 'y1',
                }
              ],
            },
            options: {
              elements: {
                point: {
                  radius: 0, // Establecer el radio de los puntos en 0 para ocultarlos
                },
              },
              animations: {
                  /*tension: {
                  },*/
              },
              scales: {
                y: {
                  max: limtieG,
                  min: 0,
                 /* title: {
                                    display: true,
                                    text: 'Valores',
                                  },*/
                },
                },
              },
            });
  
                      ////////// Validations status with limits data and types data is installations
        diferencial.textContent = infoFiltroVent;

        if (dataTempReal.filtroVentilador > dataTempReal.limFiltroVent && dataTempReal.filtroVentilador < dataTempReal.limFiltroVent_A){
          diferencial.style.color = alarmClima
        }
        else if (dataTempReal.filtroVentilador > dataTempReal.limFiltroVent_A){
          diferencial.style.color = textNotOk
        }
        else diferencial.style.color = textOk
  
        pico.textContent = infoPicos;
        dataTempReal.picos < dataTempReal.limPicos
            ? (pico.style.color = textNotOk)
            : (pico.style.color = textOk);
        rpm.textContent = infoRpm;
        dataTempReal.rpmFiltro < dataTempReal.limRpm
            ? (rpm.style.color = textNotOk)
            : (rpm.style.color = textOk);
        carro.textContent = infoCarro;
        dataTempReal.carro < dataTempReal.limCarro
            ? (carro.style.color = textNotOk)
            : (carro.style.color = textOk);
  
        }
  
        vent.textContent = infoVent;
        dataTempReal.ventilador < dataTempReal.limVent
            ? (vent.style.color = textNotOk)
            : (vent.style.color = textOk);
  
        (dataTempReal.carro === null) 
            ? (carro.style.display = "none", document.getElementById("titleCarro").style.display = "none") 
            : (carro.style.display = "block", document.getElementById("titleCarro").style.display = "block");
  
        (dataTempReal.rpmFiltro === null)
            ? (rpm.style.display = "none", document.getElementById("titleRpm").style.display = "none")
            : (rpm.style.display = "block", document.getElementById("titleRpm").style.display = "block");
  
        if (nombre === "fab4_cardas_filtro"){
              document.getElementById('titleTela').style.display = 'none';
              document.getElementById('filtroVent').style.display = 'none';
              document.getElementById('myChartfiltro').style.display = 'none';
              const preFiltroTitle = document.getElementById("preFiltroH");
              const preFiltro = document.getElementById("preFiltro");
              //const ventTitle = document.getElementById("titleVent");
              //const vent = document.getElementById("vent");
              const picosTitle = document.getElementById("titlePicos");
              const picos = document.getElementById("pico");
              preFiltroTitle.style.display = "block";
              preFiltro.style.display = "block";
              preFiltro.textContent = `${dataTempReal.preFiltro} Pa`;
              
              picosTitle.style.display = "none";
              picos.style.display = "none";           
  
              document.getElementById("titleVent").textContent
         } else {
              const preFiltroTitle = document.getElementById("preFiltroH").style.display = "none";
              const preFiltro = document.getElementById("preFiltro").style.display = "none";
              const ventTitle = document.getElementById("titleVent").style.display = "block";
              const vent = document.getElementById("vent").style.display = "block";
              const picosTitle = document.getElementById("titlePicos").style.display = "block";
              const picos = document.getElementById("pico").style.display = "block";
              }
  
          if(preFiltroData !== null) {
             const preFiltroTitle = document.getElementById("preFiltroH");
             const preFiltro = document.getElementById("preFiltro");
             preFiltroTitle.style.display = "block";
             preFiltro.style.display = "block";
             preFiltroTitle.textContent = `Pre-Filtro, (Limite Inf: ${dataTempReal.limPreFiltro}) Pa`
             preFiltro.textContent = `${dataTempReal.preFiltro} Pa`
  
          if (preFiltroData < limPreFiltroData) {
              preFiltro.style.color = textNotOk;
          } else preFiltro.style.color = textOk;
  
          } 
  
          if (picos2Data !== null) {
              picos2Title.style.display = "block";
              picos2.style.display = "block";
              picos2Title.textContent = `Picos-2, Limite: ${dataTempReal.limPicos}`;
              picos2.textContent = `${dataTempReal.picos2} Pa`;
  
          (picos2Data < limPicos)
              ? (picos2.style.color = textNotOk)
              : (picos2.style.color = textOk);
  
         } else {
              picos2Title.style.display = "none";
              picos2.style.display = "none";
          }
  
              
          if (rpm2Data !== null) {
              rpm2Title.style.display = "block";
              rpm2.style.display = "block";
              rpm2Title.textContent = `RPM-2, Limite: ${limRpmFiltro}RPM`;
              rpm2.textContent = `${rpm2Data} RPM`;
          if (rpm2Data < limRpmFiltro) rpm2.style.color = textNotOk;
          else rpm2.style.color = textOk;
  
          } else { 
              rpm2Title.style.display = "none";
              rpm2.style.display = "none";    
              }
  
          if (carro2Data !== null) {
              carro2Title.style.display = "block";
              carro2.style.display = "block";
              carro2Title.textContent = `Carro-2, (Limite inf: ${limCarro})`
              carro2.textContent = `${carro2Data}`
  
         if (carro2Data < limCarro) {
              carro2.style.color = textNotOk;
         } else carro2.style.color = textOk;
         } else {
            carro2Title.style.display = "none";
            carro2.style.display = "none";
         }
  
      

      if (preFiltroData !== null && rpm2Data === null && picos2Data === null) ventanaFlotante.style.height = "375px";

      else if (preFiltroData === null && rpm2Data !== null && picos2Data !== null && carro2Data !== null) ventanaFlotante.style.height = "435px";

      else if (preFiltroData === null && rpm2Data !== null && picos2Data === null && carro2Data !== null) ventanaFlotante.style.height = "400px";

      else if (preFiltroData !== null && rpm2Data !== null && picos2Data !== null && carro2Data !== null) ventanaFlotante.style.height = "470px";

      else if (preFiltroData === null && picos2Data !== null ) ventanaFlotante.style.height = "380px";

      else ventanaFlotante.style.height = "330px";
      
      }
    } else {
      // Ocurrió un error en la solicitud
      console.error('Error en la solicitud: ' + http.status);
    }
  }
};

// Enviar la solicitud al servidor
http.send();

let x = e.clientX + 15; // Agregar un desplazamiento a la derecha
let y = e.clientY;
boton.style.fill = mouseOver;

if (e.clientY >= 45 && e.clientY < 100) y = y + 30;

else if (e.clientY >= 400 && e.clientY < 600 && e.clientX >= 100 && e.clientX < 200) {
  y = y - 380;
  x = x + 50;
} 

else if (e.clientY >= 300 && e.clientY < 450 && e.clientX >= 1200 && e.clientX < 1400) {
  y = y - 280;
  x = x - 360;
} 
else if (e.clientY >= 200 && e.clientY < 300 && e.clientX >= 1000) {
  y = y - 280;
  x = x - 400;
}
else if (e.clientY >= 300 && e.clientY < 400 && e.clientX >= 1000) {
  y = y - 250;
  x = x - 400;
}
else if (e.clientY >= 300 && e.clientY < 400 && e.clientX >= 300 && e.clientX < 400) {
  y = y - 280;
  x = x + 30;
} 
else if (e.clientY >= 400 && e.clientY < 500 && e.clientX >= 200 && e.clientX < 300) {
  y = y - 360;
  x = x + 50;
} 
else if (e.clientY >= 400 && e.clientY < 500 && e.clientX >= 400 && e.clientX < 500) {
  y = y - 360;
  x = x - 350;
}
else if (e.clientY >= 600 && e.clientY < 700 && e.clientX >= 500 && e.clientX < 600){
  x = x - 345;
  y = y - 430;
}
else if (e.clientY >= 500 && e.clientY < 700 && e.clientX >= 200 && e.clientX < 500) {
  y = y - 360;
  x = x + 25;
}
else if (e.clientY >= 400 && e.clientY < 700 && e.clientX >= 500) {
  y = y - 360;
  x = x - 345;
}
else if (e.clientY >= 400 && e.clientY < 600 && e.clientX >= 780) {
  y = y - 360;
  x = x - 330;
}
else if (e.clientY >= 700 && e.clientY < 900 && e.clientX >= 800 && e.clientX < 900) {
  y = y - 360;
  x = x + 40;
}
else if (e.clientY >= 100 && e.clientY < 200) {
  y = y + 30;
}
else if (e.clientY >= 200 && e.clientY < 300) {
  y = y - 200;
  x = x + 25;
} else if (e.clientY >= 300 && e.clientY < 400) {
  y = y - 330;
  x = x + 20;
}
else if (e.clientY >= 400 && e.clientY < 500) {
  y = y - 360;
  x = x - 310;
} else if (e.clientY >= 500 && e.clientY < 600) {
  y = y - 360;
  x = x - 310;
} else if (e.clientY >= 600 && e.clientY < 700) {
  y = y - 360;
  x = x - 35;
} else y = y - 50;

ventanaFlotante.style.left = x + "px";
ventanaFlotante.style.top = y + "px";
ventanaFlotante.style.display = "block";

};

const ventanaFlotanteClima = (nombre, medicion, boton, e) => {  /// This function is for show data in clima installation and popUp windows adjusted automatically

let ctxCL = document.getElementById("myChartClima");
  //const instalacion = document.getElementById("instalacionclima");
const nameInst = document.getElementById("nombre");
// Definir la URL del servidor
let url = `${server}/clima24hs`;

// Definir el objeto JSON con los detalles de los datos a solicitar
var requestData = {
  instalacion: nombre,
  medir: medicion
};

// Convertir el objeto JSON a una cadena JSON
var jsonData = JSON.stringify(requestData);


// Abrir una conexión GET con la URL y enviar los datos JSON en el cuerpo de la solicitud
http.open('GET', url + '?data=' + encodeURIComponent(jsonData), true);

// Definir el callback para manejar la respuesta del servidor
http.onreadystatechange = function() {
  if (http.readyState === XMLHttpRequest.DONE) {
    if (http.status === 200) {
      // La solicitud fue exitosa, llamar a la función handleResponse con los datos recibidos
      const date = JSON.parse(http.responseText);
          const dataTempRealcl = date.datos[0];
          const datos = date.datos;
          nameInst.textContent = `${date.instalacion}, ${date.nombre}`;
          //nombre.textContent = date.nombre;
          let historial = [];
          let limiteSup = [];
          let limiteInterSup = [];
          let limiteInterInf = [];
          let limiteInf = [];
          let limiteSupT;
          let limiteInterSupT;
          let limtieInfT;
          let limiteInterInfT;
          let colorG;
          let limiteColor;
          let limiteInterColor;
          let tempMaxA = dataTempRealcl.max_Atemp;
          let tempMinA = dataTempRealcl.min_Atemp;
          let humMaxA = dataTempRealcl.max_Ahum;
          let humMinA = dataTempRealcl.min_Ahum;


          //Iterar sobre el array de datos de la base de datos
          for (let i = 0; i < datos.length; i++) {
            let medFor = datos[i].id_medicion; 

              let fecha = new Date(datos[i].fecha);
              let hora = fecha.getHours().toString().padStart(2, "0");
              let minuto = fecha.getMinutes().toString().padStart(2, "0");
              let horaText = `${hora}:${minuto}`;

              // El paquete de datos se arma en base a la solicitud del usuario. Condicion si es temperatura, humedad o humedadAbs
              if (date.medicion === "temperatura") {
                limiteInf.push({ x: horaText, y: `${datos[i].min_Atemp}` });
                limiteInterInf.push ({ x: horaText, y: `${datos[i].minTemp}` });
                limiteInterSup.push ({ x: horaText, y: `${datos[i].maxTemp}` })
                historial.push({ x: horaText, y: `${datos[i].temperatura}` });
                limiteSup.push({ x: horaText, y: `${datos[i].max_Atemp}` });
              } else if (date.medicion === "humedad") {
                limiteInf.push({ x: horaText, y: `${datos[i].min_Ahum}` });
                limiteInterInf.push({ x: horaText, y: `${datos[i].minHum}` });
                limiteInterSup.push({ x: horaText, y: `${datos[i].maxHum}` })
                historial.push({ x: horaText, y: `${datos[i].humedad}` });
                limiteSup.push({ x: horaText, y: `${datos[i].max_Ahum}` });
              }
              else if (date.medicion === "prensa_filtro") {
                historial.push({ x: horaText, y: `${datos[i].filtro}` }); 
              }
              else if (date.medicion === "humAbsoluta") {
                limiteInf.push({ x: horaText, y: `${datos[i].minHumAbs}` });
                historial.push({ x: horaText, y: `${datos[i].humedadAbs}` });
                limiteSup.push({ x: horaText, y: `${datos[i].maxHumAbs}` });
              }
              else if (date.medicion === 'entalpia'){
                historial.push({ x: horaText, y: `${datos[i].entalpia}`});
              }
              
          }

          //Validacion si el Dato es temperatura, humedad o humedadAbsoluta para armar el paquete de datos
          if (date.medicion === "temperatura") {
            limiteSupT = `Limite Superior: ${dataTempRealcl.max_Atemp}°C`;
            limiteInterSupT = `Limite InterSup: ${dataTempRealcl.maxTemp}°C`;
            limtieInfT = `Limite Inferior: ${dataTempRealcl.min_Atemp}°C`;
            limiteInterInfT = `Limite InterInf: ${dataTempRealcl.minTemp}°C`;
            colorG = "#FA7D07";
            limiteInterColor = '#E7C101';
            limiteColor = "#A507FA";
          } else if (date.medicion === "humedad") {
            limiteSupT = `Limite Superior: ${dataTempRealcl.max_Ahum}%`;
            limiteInterSupT = `Limite InterSup: ${dataTempRealcl.maxHum}%`;
            limtieInfT = `Limite Inferior: ${dataTempRealcl.min_Ahum}%`;
            limiteInterInfT = `Limite InterInf: ${dataTempRealcl.minHum}%`;
            colorG = "#417CDF";
            limiteInterColor = '#E7C101';
            limiteColor = "#20A907";
          }
          else if (date.medicion === "prensa_filtro") colorG = "#31BD00";

          else if (date.medicion === "humAbsoluta") {
            limiteSupT = `Limite Superior: ${dataTempRealcl.maxHumAbs}g/kg`;
            limtieInfT = `Limite Inferior: ${dataTempRealcl.minHumAbs}g/kg`;
            colorG = "#0076E5";
            limiteColor = "#FA1300";
          }
          else if (date.medicion === 'entalpia') colorG = "#0076E5";

          // Aqui se da vuelta los datos del array para representarlo en la grafica
          limiteInterInf.reverse();
          limiteInf.reverse();
          historial.reverse();
          limiteSup.reverse();
          limiteInterSup.reverse();

          // Aqui se destruye la grafica en caso de haberse utilizado previamente
          if(this.chartCl) this.chartCl.destroy();

          //Aqui es donde se arma la grafica, pero antes se define si es medida simple o medida de doble limite
          if ((date.medicion === 'temperatura' && tempMaxA !== 0 && tempMinA !== 0) || (date.medicion === 'humedad' && humMaxA !== 0 && humMinA !== 0)){
            this.chartCl = new Chart(ctxCL, {
              type: "line",
              data: {
                datasets: [
                  {
                    label: limtieInfT,
                    borderColor: limiteColor,
                    borderWidth: 1.5,
                    data: limiteInf,
                  },
                  {
                    label: limiteSupT,
                    borderColor: limiteColor,
                    borderWidth: 1.5,
                    data: limiteSup,
                  },
                  {
                    label : limiteInterInfT,
                    borderColor : limiteInterColor,
                    borderWidth: 1.5,
                    data: limiteInterInf
                  },
                  {
                    label: limiteInterSupT,
                    borderColor: limiteInterColor,
                    borderWidth: 1.5,
                    data: limiteInterSup
                  },
                  {
                    label: date.medicion,
                    borderColor: colorG,
                    borderWidth: 2,
                    data: historial,
                  }
                ],
              },
              options: {
                elements: {
                  point: {
                    radius: 0, // Establecer el radio de los puntos en 0 para ocultarlos
                  },
                },
                animations: {
                  duration: 0,
                },
                scales: {
                  x: {
                    min: historial[0].x,
                  }
                 /* y: {
                    max: limiteSupG + 2,
                    min: limiteInfG - 2,
                  },*/
                },
              },
            });
          } 
          else if ( (tempMaxA === 0 && tempMinA === 0) || (humMaxA === 0 && humMinA === 0)){
            this.chartCl = new Chart(ctxCL, {
              type: "line",
              data: {
                datasets: [
                  {
                    label : limiteInterInfT,
                    borderColor : limiteInterColor,
                    borderWidth: 1.5,
                    data: limiteInterInf
                  },
                  {
                    label: date.medicion,
                    borderColor: colorG,
                    borderWidth: 2,
                    data: historial,
                  },
                  {
                    label: limiteInterSupT,
                    borderColor: limiteInterColor,
                    borderWidth: 1.5,
                    data: limiteInterSup
                  }
                ],
              },
              options: {
                elements: {
                  point: {
                    radius: 0, // Establecer el radio de los puntos en 0 para ocultarlos
                  },
                },
                animations: {
                  duration: 0,
                },
                scales: {
                  x: {
                    min: historial[0].x,
                  }
                 /* y: {
                    max: limiteSupG + 2,
                    min: limiteInfG - 2,
                  },*/
                },
              },
            });
          }
          else {
            this.chartCl = new Chart(ctxCL, {
              type: "line",
              data: {
                datasets: [
                  {
                    label: limtieInfT,
                    borderColor: limiteColor,
                    borderWidth: 1.5,
                    data: limiteInf,
                  },
                  {
                    label: date.medicion,
                    borderColor: colorG,
                    borderWidth: 2,
                    data: historial,
                  },
                  {
                    label: limiteSupT,
                    borderColor: limiteColor,
                    borderWidth: 1.5,
                    data: limiteSup,
                  }
                ],
              },
              options: {
                elements: {
                  point: {
                    radius: 0, // Establecer el radio de los puntos en 0 para ocultarlos
                  },
                },
                animations: {
                  duration: 0,
                },
                scales: {
                  x: {
                    min: historial[0].x,
                  }
                 /* y: {
                    max: limiteSupG + 2,
                    min: limiteInfG - 2,
                  },*/
                },
              },
            });
          }
          document.getElementById("myChartClima").style.display = "block";
    } else {
      // Ocurrió un error en la solicitud
      console.error('Error en la solicitud: ' + http.status);
    }
  }
};

let x = e.clientX + 15; // Agregar un desplazamiento a la derecha
let y = e.clientY;
boton.style.fill = mouseOver;

// definir la posicion de la ventana en la pantalla del usuario/cliente, en base a la posicion del eje x e y del mouse donde se
// esta seleccionando el objeto
if (e.clientY >= 45 && e.clientY < 100) {
  console.log('entra al if');
  x = x - 300; 
  y = y + 30;
}

else if (e.clientY >= 200 && e.clientY < 300 && e.clientX >= 800 && e.clientX <= 1200) {
  y = y - 200;
  x = x - 550;
}

else if (e.clientY >= 300 && e.clientY < 400 && e.clientX >= 100 && e.clientX < 400) {
  y = y - 310;
  x = x + 50;
}
else if (e.clientY >= 300 && e.clientY < 400 && e.clientX >= 200 && e.clientX < 400) {
  y = y - 310;
  x = x - 200;
}
else if (e.clientY >= 300 && e.clientY < 500 && e.clientX >= 800) {
  y = y - 330;
  x = x - 350;
}
else if (e.clientY >= 400 && e.clientY < 500 && e.clientX >= 100) {
  y = y - 320;
  x = x + 50;
}
else if (e.clientY >= 400 && e.clientY < 500 && e.clientX >= 1100) {
  y = y - 320;
  x = x - 250;
}
else if (e.clientY >= 500 && e.clientY < 600 && e.clientX >= 1100) {
  y = y - 340;
  x = x - 400;
}
else if (e.clientY >= 50 && e.clientY < 600 && e.clientX >= 800) {
  //console.log('entra al if');
  y = y - 340;
  x = x - 400;
}
else if (e.clientY >= 100 && e.clientY < 200) {
  y = y + 30;
}
else if (e.clientY >= 200 && e.clientY < 300) {
  y = y + 5;
}
else if (e.clientY >= 300 && e.clientY < 400) {
  y = y - 310;
  x = x - 280;
}
else if (e.clientY >= 400 && e.clientY < 500) {
  y = y - 325;
  x = x - 250;
}
else if (e.clientY >= 500 && e.clientY < 600) {
  y = y - 340;
  x = x - 305;
}
else if (e.clientY >= 600 && e.clientY < 800) {
  y = y - 340;
  x = x - 305;
}

else y = y - 50;

//aca se define en el CSS los px de posicion de la ventana flotante, y el modo de la ventana, en este caso 'block'
ventanaFlotanteclima.style.left = x + "px";
ventanaFlotanteclima.style.top = y + "px";
ventanaFlotanteclima.style.display = "block";


// Enviar la solicitud al servidor
http.send();
};

const mouseOutf = (e, boton) => {   // This function is for disguise popUp windows filters
  boton.style.fill = mouseOut;
  ventanaFlotante.style.display = "none";
  paso = 1;
  if(chart) this.chart.destroy();
};

const mouseOutfCl = (e, boton) => {  // This function is for disguise popUp windows Clima installations
  boton.style.fill = "#333";
  ventanaFlotanteclima.style.display = "none";
  document.getElementById("myChartClima").style.display = "none";
  pasoCl = 1;
  if(chartCl) this.chartCl.destroy();
};


const puestoClimaRef = (botonTemp, botonHum, textTemp, textHum, data, instalacion, botonEnt, textEnt) => {  // This function is for intected witch objects SVG, in map installations adjustement colors according to, limits and show now status data information
  
  //Se declaran los objetos SVG, se pasan los parametros en la funcion, con que objeto debe interactuar
  const buttonTemp = document.getElementById(botonTemp);
  const buttonHum = document.getElementById(botonHum);
  const textTempp = document.getElementById(textTemp);
  const textHumm = document.getElementById(textHum);
  const buttonEnt = document.getElementById(botonEnt);
  //aca se almacenan los datos en array de la base de datos, pasados por parametros en la funcion
    let datos;

    //se itera el array de datos de la base de datos
    for (let i = 0; i < data.length; i++){
      // se verifica por nombre de instalacion, para almacenar los datos en la variable 'datos'
      if (data[i].nombre === instalacion){
          datos = data[i];
          break
      }
    }

    //Verificando la existencia en 'true' de datos de la instalacion, de no existir 'false', esta en modo offline
    if (datos){
      //de existir los datos se almacenen en constantes, para ser utilizadas mas adelante
        const temp = datos.temperatura;
        const hum = datos.humedad;
        const minATemper = datos.min_Atemp;
        const minTemp = datos.minTemp;
        const maxTemp = datos.maxTemp;
        const maxATemper = datos.max_Atemp;
        const minAHum = datos.min_Ahum;
        const minHum = datos.minHum;
        const maxHum = datos.maxHum;
        const maxAHum = datos.max_Ahum;
        // armando la cadena de texto para mostrar en el objeto
        const infoTemp = `${parseInt(temp)}°C`;
        const infoHum = `${parseInt(hum)}% H.r`;

        //los datos armados previamente se insertan en los objetos llamados previamente
        textTempp.textContent = infoTemp;
        textHumm.textContent = infoHum;

        // se verifican los estados de las varibles obtenidas de la base de datos, de estar en los rango, se pinta de verde
        // si estan fuera de los rangos de limites, se pintan de rojo, o amarillo 'de pasarse por el primer limite'
        // en caso de estar en NaN, se considera en modo falla

        
        if (minATemper !== 0 && maxATemper !== 0){
          if (temp < minATemper || temp > maxATemper){ 
            buttonTemp.style.fill = alertClima
            textTempp.style.stroke = '#000';
            textTempp.style.fill = '#FFF';
          }
  
         else if (temp < minTemp || temp > maxTemp){
           buttonTemp.style.fill = alarmClima;
           textTempp.style.stroke = '#2C2C2C';
           textTempp.style.fill = '#474747';
          }
  
         else if (temp === NaN){
           buttonTemp.style.fill = fallaColor;
           textTempp.style.stroke = '#000';
           textTempp.style.fill = '#FFF';
          }
  
          else{ 
            buttonTemp.style.fill = okClima;
            textTempp.style.stroke = '#000';
            textTempp.style.fill = '#FFF';
          }
        } else {
          if (temp < minTemp || temp > maxTemp){ 
            buttonTemp.style.fill = alertClima
            textTempp.style.stroke = '#000';
            textTempp.style.fill = '#FFF';
          }
  
         else if (temp === NaN){
           buttonTemp.style.fill = fallaColor;
           textTempp.style.stroke = '#000';
           textTempp.style.fill = '#FFF';
          }
  
          else{ 
            buttonTemp.style.fill = okClima;
            textTempp.style.stroke = '#000';
            textTempp.style.fill = '#FFF';
          }
        }


        if (minAHum !== 0 && maxAHum !== 0){
          if (hum < minAHum || hum > maxAHum){ 
            buttonHum.style.fill = alertClima;
            textHumm.style.stroke = '#000';
            textHumm.style.fill = '#FFF';
          }
  
          else if (hum < minHum || hum > maxHum){ 
            buttonHum.style.fill = alarmClima;
            textHumm.style.stroke = '#2C2C2C';
            textHumm.style.fill = '#2C2C2C';
          }
  
          else if (hum === NaN){ 
            buttonHum.style.fill = fallaColor;
            textHumm.style.stroke = '#000';
            textHumm.style.fill = '#FFF';
          }
  
          else{ 
            buttonHum.style.fill = okClima;
            textHumm.style.stroke = '#000';
            textHumm.style.fill = '#FFF';
          }
        } else {
  
           if (hum < minHum || hum > maxHum){ 
            buttonHum.style.fill = alarmClima;
            textHumm.style.stroke = '#2C2C2C';
            textHumm.style.fill = '#2C2C2C';
          }
  
          else if (hum === NaN){ 
            buttonHum.style.fill = fallaColor;
            textHumm.style.stroke = '#000';
            textHumm.style.fill = '#FFF';
          }
  
          else{ 
            buttonHum.style.fill = okClima;
            textHumm.style.stroke = '#000';
            textHumm.style.fill = '#FFF';
          }
        }


          //se define el boton objeto de la humedadAbs
          const buttonEnt = document.getElementById(botonEnt);
          //se obtienen los datos previamente obtenido de la base de datos
          const minEnt = datos.minHumAbs;
          const maxEnt = datos.maxHumAbs;
          const humAbs = datos.humedadAbs;
          // armado de string para mostrar en la web
          const infoEnt = `${parseInt(humAbs)} g/Kg`;
          // inserccion del string en el objeto texto del svg de la web
          document.getElementById(textEnt).textContent = infoEnt;

          // se define a traves de los limites el estado y los colores de la instalacion
          humAbs < minEnt || humAbs > maxEnt
            ? (buttonEnt.style.fill = alertClima)
            : (buttonEnt.style.fill = okClima);

    }
    // en caso de no existir los datos 'false', esta en modo offline
    else {
      document.getElementById(textTemp).textContent = 'offline';
      document.getElementById(textHum).textContent = 'offline';
        // se parametriza todo en modo offline
         buttonTemp.style.fill = offline;
         textTempp.style.stroke = '#000'
         textTempp.style.fill = '#FFF';
         buttonHum.style.fill = offline;
         textHumm.style.stroke = '#000';
         textHumm.style.fill = '#FFF';

        
        document.getElementById(textEnt).textContent = 'offline';
           buttonEnt.style.fill = offline;
    }

};

const puestoClima = (botonTemp, botonHum, textTemp, textHum, data, instalacion) => {  //this function is for show status now information is not references installations (grey installations)
    const buttonTemp = document.getElementById(botonTemp);
    const buttonHum = document.getElementById(botonHum);
    let datos;

    for (let i = 0; i < data.length; i++){
      if (data[i].nombre === instalacion){
        datos = data[i];
        break
      }
    }
      if (datos){
        const temp = parseInt(datos.temperatura);
        const hum = parseInt(datos.humedad);
        const infoTemp = `${temp}°C`;
        const infoHum = `${hum}% H.r`;

        document.getElementById(textTemp).textContent = infoTemp;
        document.getElementById(textHum).textContent = infoHum;

        buttonTemp.style.fill = neutral;
        buttonHum.style.fill = neutral;
      } else {
        document.getElementById(textTemp).textContent = 'offline';
        document.getElementById(textHum).textContent = 'offline';

        buttonTemp.style.fill = offline;
        buttonHum.style.fill = offline;
      }

};

const carrier = (direccion) =>{ // here interacted with 'sala de chillers' object, whit data registered in dataBase
  const carrier1Button = document.getElementById("carrier1");
  const carrier1Text = document.getElementById('carrier1Text');
  const carrier2Button = document.getElementById("carrier2");
  const carrier2Text = document.getElementById('carrier2Text');
  const carrier3Button = document.getElementById("carrier3");
  const carrier3Text = document.getElementById('carrier3Text');
  const carrier4Button = document.getElementById("carrier4");
  const carrier4Text = document.getElementById('carrier4Text');
  const carrier5Button = document.getElementById("carrier5");
  const carrier5Text = document.getElementById('carrier5Text');

  const sector = new XMLHttpRequest();

  sector.onreadystatechange = () => {
    if (sector.readyState == XMLHttpRequest.DONE){
      if (sector.status == 200) {
        const date = JSON.parse(sector.responseText);
        if(date.datos[0].carrier1 === 100) {
          carrier1Button.style.fill = okClima;
          carrier1Text.style.stroke = '#000';
          carrier1Text.style.fill = '#FFF';
        }

        else if(date.datos[0].carrier1 === 50){ 
          carrier1Button.style.fill = alertClima;
          carrier1Text.style.stroke = '#000';
          carrier1Text.style.fill = '#FFF';
        }

        else if(date.datos[0].carrier1 === 0){ 
          carrier1Button.style.fill = preAlertClima;
          carrier1Text.style.stroke = '#000';
          carrier1Text.style.fill = '#000';
        }

        if(date.datos[0].carrier2 === 100) {
          carrier2Button.style.fill = okClima;
          carrier2Text.style.stroke = '#000';
          carrier2Text.style.fill = '#FFF';
        }

        else if(date.datos[0].carrier2 === 50){ 
          carrier2Button.style.fill = alertClima;
          carrier2Text.style.stroke = '#000';
          carrier2Text.style.fill = '#FFF';
        }

        else if(date.datos[0].carrier2 === 0){ 
          carrier2Button.style.fill = preAlertClima;
          carrier2Text.style.stroke = '#000';
          carrier2Text.style.fill = '#000';
        }

        if(date.datos[0].carrier3 === 100){ 
          carrier3Button.style.fill = okClima;
          carrier3Text.style.stroke = '#000';
          carrier3Text.style.fill = '#FFF';
        }

        else if(date.datos[0].carrier3 === 50){ 
          carrier3Button.style.fill = alertClima;
          carrier3Text.style.stroke = '#000';
          carrier3Text.style.fill = '#FFF';
        }

        else if(date.datos[0].carrier3 === 0){ 
          carrier3Button.style.fill = preAlertClima;
          carrier3Text.style.stroke = '#000';
          carrier3Text.style.fill = '#000';
        }

        if(date.datos[0].carrier4 === 100){ 
          carrier4Button.style.fill = okClima;
          carrier4Text.style.stroke = '#000';
          carrier4Text.style.fill = '#FFF';
        }

        else if(date.datos[0].carrier4 === 50){ 
          carrier4Button.style.fill = alertClima;
          carrier4Text.style.stroke = '#000';
          carrier4Text.style.fill = '#FFF';
        }

        else if(date.datos[0].carrier4 === 0){ 
          carrier4Button.style.fill =  preAlertClima;
          carrier4Text.style.stroke = '#000';
          carrier4Text.style.fill = '#000';
        }

        if(date.datos[0].carrier5 === 100){ 
          carrier5Button.style.fill = okClima;
          carrier5Text.style.stroke = '#000';
          carrier5Text.style.fill = '#FFF';
        }

        else if(date.datos[0].carrier5 === 50){ 
          carrier5Button.style.fill = alertClima;
          carrier5Text.style.stroke = '#000';
          carrier5Text.style.fill = '#FFF'
        }

        else if(date.datos[0].carrier5 === 0){ 
          carrier5Button.style.fill = preAlertClima;
          carrier5Text.style.stroke = '#000';
          carrier5Text.style.fill = '#000';
        }
      }
    }
  };
  sector.open("GET", direccion, true);
  sector.send();
};

const botonF = (botonFiltro, textBoton, data, instalacion) => { // here interacted filter status if is 0 or 1, is 0 = not good (red colour), is 1 = good (green colour) 

    const buttonFiltro = document.getElementById(botonFiltro);
    const textBotonFil = document.getElementById(textBoton);
    let datos;
    for (let i = 0; i < data.length; i++){
      if (data[i].nombre === instalacion){
        datos = data[i]; 
      }
    }
    
    if (datos){
        const estadoFiltro = datos.estado;
        if (estadoFiltro == 3) buttonFiltro.style.stroke = offline;

        else if (estadoFiltro === 1) buttonFiltro.style.stroke = okFiltro;

        else buttonFiltro.style.stroke = alertFiltro
    }
    else {
      buttonFiltro.style.stroke = offline;
      //textBotonFil.textContent = 'offline';
      //textBotonFil.style.fontSize = '16px';
    }

};




const actualizarDatos = () => {  // this function, have petticion GET server is the latest data from dataBase server

  http.open('GET', direccion, true);
  http.send();

  http.onreadystatechange=function(){
    if(this.readyState==4 && this.status==200){
      datos = JSON.parse(http.responseText);
      //console.log(datos);
  let datosClima = datos.clima;
  let datosFiltros = datos.filtros;

  const carrierUp = carrier(`${server}/dataCarrierEstado`);

  const climaExterior = climaExt(`${server}/dataFab9exterior`);

  const fab6PrepClima = puestoClimaRef(
    "climaPrepTFab6",
    "climaPrepHFab6",
    "tempPrepFab6",
    "humPrepFab6",
    datosClima,
    `fab6_preparacion_clima`,
    "climaPrepEFab6",
    "climaETprepFab6"
  );

  const fab6PrepFiltro = botonF(
    "filtroPrepFab6",
    'filtrosTtprepFab6',
    datosFiltros,
    'fab6_preparacion_filtro'
  );

  const fab6ContClima = puestoClimaRef(
    "climaContTFab6",
    "climaContHFab6",
    "tempContFab6",
    "humContFab6",
    datosClima,
    'fab6_continuas_clima',
    "climaContEFab6",
    "climaETcontFab6"
  );
  const fab6ContFiltro = botonF(
    "filtroContFab6",
    'filtrosTtcontFab6',
    datosFiltros,
    'fab6_continuas_filtro'
  );

 const fab6BobinajeClima = puestoClimaRef(
    "climaBobTFab6",
    "climaBobHFab6",
    "tempBobFab6",
    "humBobFab6",
    datosClima,
    'fab6_bobinaje_clima',
    "climaBobEFab6",
    "climaETbobFab6"
  );
  const fab6BobinajeFiltro = botonF(
    "filtroBobFab6",
    'filtrosTtbobFab6',
    datosFiltros,
    'fab6_bobinaje_filtro'
  );


  
   const fab4PreparacionClima = puestoClimaRef(
    "climaPrepTFab4",
    "climaPrepHFab4",
    "tempPrepFab4",
    "humPrepFab4",
    datosClima,
    'fab4_preparacion_clima',
    "climaPrepHFab4-1",
    "climaTEprepFab4"
  );

  const fab4BatanFiltro = botonF(
    "filtroBatanFab4",
    'filtrosTtbatanFab4',
    datosFiltros,
    'fab4_batan_filtro'
  );

  const fab4CardasFiltro = botonF(
    "filtroCardaFab4",
    'filtrosTtcardaFab4',
    datosFiltros,
    'fab4_cardas_filtro'
  );

  const fab4ClimaFiltro = botonF(
    "filtroClimaFab4",
    'filtrosTtclimaFab4',
    datosFiltros,
    'fab4_clima_filtro'
  );

  const fab4OpenEndClima = puestoClima(
    "climaOpen-EndTFab4",
    "climaOpen-EndHFab4",
    "tempOpenEndFab4",
    "humOpenEndFab4",
    datosClima,
    'fab4_open_end_clima'
  );

  const fab4RetorFiltro = botonF(
    "filtroRetorFab4",
    'filtrosTretorFab4',
    datosFiltros,
    'fab4_retorcidos_filtro'
  );
  const fab4RetorcidoClima = puestoClima(
    "climaRetorTFab4",
    "climaRetorHFab4",
    "tempRetorFab4",
    "humRetorFab4",
    datosClima,
    'fab4_retorcidos_clima'
  );

  const fab9Carda1 = puestoClimaRef(
    "climaPrepTFab9-1",
    "climaPrepHFab9-1",
    "tempCardaFab9",
    "humCardaFab9",
    datosClima,
    'fab9_cardas1_clima',
    "climaPrepEFab9-1",
    "climaEprepFab9-1"
  );
  const fab9Carda2 = puestoClima(
    "climaPrepTFab9-2",
    "climaPrepHFab9-2",
    "tempCardas-2Fab9",
    "humCardas-2Fab9",
    datosClima,
    'fab9_cardas2_clima'
  );

  const fab9CardasAFiltro = botonF(
    "filtroCardasAFab9",
    'filtrosTtcardasAFab9',
    datosFiltros,
    'fab9_cardasA_filtro'
    );

  const fab9CardasBFiltro = botonF(
    "filtroCardasBFab9",
    'filtrosTtcardasBFab9',
    datosFiltros,
    'fab9_cardasB_filtro'
    );
  
  const fab9LuwaFiltro = botonF(
    "filtroLuwaFab9",
    'filtrosTtluwaFab9',
    datosFiltros,
    'fab9_batan_luwa_filtro'
  );

  const fab9PrepFiltro = botonF(
    "filtroPrepFab9",
    'filtrosTtprepFab9',
    datosFiltros,
    'fab9_preparacion_filtro'
  );
  const fab9PrepClima = puestoClima(
    "climaPrepTFab9-3",
    "climaPrepHFab9-3",
    "tempPrepFab9",
    "humPrepFab9",
    datosClima,
    'fab9_preparacion_clima'
  );

  const fab9OpenEndClima = puestoClimaRef(
    "climaOpenEndTFab9",
    "climaOpenEndHFab9",
    "tempOpenEndFab9",
    "humOpenEndFab9",
    datosClima,
    'fab9_open_end_clima',
    "climaOpenEndEFab9",
    "climaEprepFab9-3"
  );
  const fab9OpenFiltro = botonF(
    "filtroOpenEndFab9",
    'filtrosTopenEndFab9',
    datosFiltros,
    'fab9_open_end_filtro'
  );

  const fab9Empaque = puestoClimaRef(
    "climaEmpaqueTFab9",
    "climaEmpaqueHFab9",
    "tempEmpaqueFab9",
    "humEmpaqueFab9",
    datosClima,
    'fab9_empaque_clima',
    "climaEmpaqueEFab9",
    "climaEempaqueFab9"
  );

  const fab3Ex8Filtro = botonF(
    "filtroEX-8Fab3", 
    'filtrosTtex8Fab3',
    datosFiltros,
    'fab3_ex8_filtro'
    );
  const fab3C80Clima = puestoClima(
    "climaC80TFab3",
    "climaC80HFab3",
    "tempC80Fab3",
    "humC80Fab3",
    datosClima,
    'fab3_c80_clima'
  );

  const fab3C50Clima = puestoClimaRef(
    "climaCardasTFab3",
    "climaCardasHFab3",
    "tempc50Fab3",
    "humc50Fab3",
    datosClima,
    'fab3_c50_clima',
    "climaManHFab3-9-4",
    "climaEcardasFab3"
  );

  const fab3PeinadorasClima = puestoClimaRef(
    "climaPeiTFab3",
    "climaPeiHFab3",
    "tempPeiFab3",
    "humPeiFab3",
    datosClima,
    'fab3_peinadorasE95_clima',
    "climaPeiEFab3",
    "climaETpeiFab3"
  );
  const fab3PeinadorasFiltro = botonF(
    "filtroPrepFab3-5",
    'filtrosTtpeinadorasFab3',
    datosFiltros,
    'fab3_peinadoras_filtro'
  );

  const fab3ManuaresClima = puestoClimaRef(
    "climaManTFab3",
    "climaManHFab3",
    "tempManFab3",
    "humManFab3",
    datosClima,
    'fab3_peinadorasE65_clima',
    "climaManHFab3-9",
    "climaEmanFab3"
  );

  const fab3LaboratorioClima = puestoClimaRef(
    "climaLabTFab3",
    "climaLabHFab3",
    "tempLabFab3",
    "humLabFab3",
    datosClima,
    'fab3_laboratorio_clima',
    "climaLaboratorioEFab3",
    "climaElaboratorioFab3"
  );

  const fab3MecherasClima = puestoClimaRef(
    "climaMecheraTFab3",
    "climaMecheraHFab3",
    "tempMechFab3",
    "humMechFab3",
    datosClima,
    'fab3_mecheras_clima',
    "climaMecheraEFab3",
    "climaEmecheraFab3"
  );

  const fab3PrepaFiltro = botonF(
    "filtroPrepFab3",
    'filtrosTtprepFab3',
    datosFiltros,
    'fab3_preparacion_filtro'
  );

  const fab3CardaFiltro = botonF(
    "filtroCardasFab3",
    'filtrosTtcardasFab3',
    datosFiltros,
    'fab3_cardas_filtro'
  );

  const fab3G30Clima = puestoClimaRef(
    "climaG30TFab3",
    "climaG30HFab3",
    "tempG30Fab3",
    "humG30Fab3",
    datosClima,
    'fab3_g30_clima',
    "climaG30EFab3",
    "climaEg30Fab3"
  );
  const fab3G30Filtro = botonF(
    "filtroContFab3", 
    'filtrosTtcontFab3',
    datosFiltros,
    'fab3_g30_filtro'
  );

  const fab33ZClima = puestoClimaRef(
    "clima3zTFab3",
    "clima3zHFab3",
    "temp3zFab3",
    "hum3zFab3",
    datosClima,
    `fab3_3z_clima`,
    "clima3zHFab3-5",
    "climaE3zFab3"
  );

  const fab3G33Clima = puestoClimaRef(
    "climaG33TFab3",
    "climaG33HFab3",
    "tempG33Fab3",
    "humG33Fab3",
    datosClima,
    `fab3_g33_clima`,
    "climaG33HFab3-5",
    "climaEg33iFab3"
  );
  const fab3G33Filtro = botonF(
    "filtroG33Fab3", 
    'filtrosTtg33Fab3',
    datosFiltros,
    'fab3_g33_filtro'
  );

  const fab3BobClima = puestoClimaRef(
    "climaBobinajeTFab3",
    "climaBobinajeHFab3",
    "tempBobinajeFab3",
    "humBobinajeFab3",
    datosClima,
    `fab3_bobinaje_clima`,
    "climaBobinajeEFab3",
    "climaEbobFab3"
  );
  const fab3BobFiltro = botonF(
    "filtroBobFab3",
    'filtrosTTbobFab3',
    datosFiltros,
    'fab3_bobinaje_filtro'
  );

  const fab3TejClima = puestoClimaRef(
    "climaTejeduriaTFab3",
    "climaTejeduriaHFab3",
    "tempTejeduriaFab3",
    "humTejeduriaFab3",
    datosClima,
    `fab3_tejeduria_clima`,
    "climaTejeduriaEFab3",
    "climaEtejFab3"
  );

  const fab1ColorClima = puestoClimaRef(
    "climaColorTFab1",
    "climaColorHFab1",
    "tempColorFab1",
    "humColorFab1",
    datosClima,
    `fab1_color_clima`,
    "climaColorEFab1",
    "climaEcolorFab1"
  );
  const fab1ColorFiltro = botonF(
    "filtroColorFab1",
    'filtrosTttcolorFab1',
    datosFiltros,
    'fab1_color_filtro'
  );

  const fab1PeinadorasClima = puestoClimaRef(
    "climaPeinadorasTFab1",
    "climaPeinadorasHFab1",
    "tempPeiFab1",
    "humPeiFab1",
    datosClima,
    `fab1_preparacion_clima`,
    "climaPeinadorasEFab1",
    "climaEpeinadorasFab1"
  );
  const fab1ManuaresClima = puestoClima
  (
    "climaManuaresTFab1",
    "climaManuaresHFab1",
    "tempManuaresFab1",
    "humManuaresFab1",
    datosClima,
    `fab1_manuares_clima`
  );
  const fab1PrepFiltro = botonF(
    "filtroPrepFab1",
    'filtrosTtprepFab1',
    datosFiltros,
    'fab1_preparacion_filtro'
  );

  const fab1CardasClima = puestoClima
  (
    "climaT.cardasTFab1",
    "climaT.cardasHFab1",
    "tempTCardasFab1",
    "humTCardasFab1",
    datosClima,
    `fab1_taller_cardas_clima`
  );

  const fab1TallCardasClima = puestoClima
  (
    "climaCardasTFab1",
    "climaCardasHFab1",
    "tempCardasFab1",
    "humCardasFab1",
    datosClima,
    `fab1_cardas_clima`
  );

  const fab1CardasFiltro = botonF(
    "filtroCardasFab1",
    'filtrosTtcardasFab1',
    datosFiltros,
    'fab1_cardas_filtro'
  );

  const fab1BobFiltro = botonF(
    "filtroBobinajeFab1",
    'filtrosTtbobinajeFab1',
    datosFiltros,
    'fab1_bobinaje_filtro'
    );

  const fab1ContFiltro = botonF(
    "filtroContinuasFab1",
    'filtrosTtcontinuasFab1',
    datosFiltros,
    'fab1_continuas_filtro'
  );
  const fab1Continuas1Clima = puestoClima(
    "climaContinuasTFab1-1",
    "climaContinuasHFab1-1",
    "tempContFab1-1",
    "humContFab1-1",
    datosClima,
    `fab1_continuas1_clima`
  );
  const fab1Continuas2Clima = puestoClimaRef(
    "climaContinuasTFab1-2",
    "climaContinuasHFab1-2",
    "tempContFab1-2",
    "humContFab1-2",
    datosClima,
    `fab1_continuas2_clima`,
    "climaContinuasEFab1",
    "climaEcontinuasFab1"
  );

  const fab1EmpaqueClima = puestoClimaRef(
    "climaEmpaqueTFab1",
    "climaEmpaqueHFab1",
    "tempEmpaqueFab1",
    "humEmpaqueFab1",
    datosClima,
    `fab1_empaque_clima`,
    "climaEmpaqueEFab1",
    "climaEempaqueFab1"
  );
  const fab1VortexClima = puestoClima(
    "climaVortexTFab1",
    "climaVortexHFab1",
    "tempVortexFab1",
    "humVortexFab1",
    datosClima,
    `fab1_vortex4_clima`
  );
  const fab1Vortex1Clima = puestoClima(
    "climaVortexTFab1-1",
    "climaVortexHFab1-1",
    "tempVortexFab1-1",
    "humVortexFab1-1",
    datosClima,
    `fab1_vortex1_clima`
  );
  const fab1Vortex2Clima = puestoClima(
    "climaVortexTFab1-2",
    "climaVortexHFab1-2",
    "tempVortexFab1-2",
    "humVortexFab1-2",
    datosClima,
    `fab1_vortex2_clima`
  );
  const fab1Vortex3Clima = puestoClima(
    "climaVortexTFab1-3",
    "climaVortexHFab1-3",
    "tempVortexFab1-3",
    "humVortexFab1-3",
    datosClima,
    `fab1_vortex3_clima`
  );
  const fab1BobinajeClima = puestoClimaRef(
    "climaBobinajeTFab1",
    "climaBobinajeHFab1",
    "tempBobinajeFab1",
    "humBobinajeFab1",
    datosClima,
    `fab1_bobinaje_clima`,
    "climaBobinajeEFab1",
    "climaEbobFab1"
  );
  const fab1Batan = botonF(
  "filtroBatanFab1", 
  'filtrosTtbatanFab1',
  datosFiltros,
  'fab1_batan_filtro'
  );
  const fab1Cotonia = botonF(
    "filtroCotoniaFab1", 
    'filtrosTtcotoniaFab1',
    datosFiltros,
    'fab1_cotonia_filtro'
    );
/**/
  }
}
};

////////////////////// Events ////////////////////

//window.addEventListener('resize', detecPant);


///////// Fabrica 6


//En esta instalncia se llaman a los objetos previamente declarados al inicio, para interactuar con el usuario, Llamando a las
//funciones de control de ventanas flotantes
botonLogin.addEventListener('click',(e) =>{
  window.location.href = `${serverApp}`;
}); 


fab6FiltroPrep.addEventListener("mouseover", (e) => {
  const fab6prepFilV = ventanaFlotanteFiltro(
    'fab6_preparacion_filtro',
    fab6FiltroPrep,
    e
  );
  /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab6FiltroPrep.addEventListener("mouseout", (e) => {
  const fab6prepFilVo = mouseOutf(e, fab6FiltroPrep);
});

/*
fab6FiltroPrep.addEventListener("mouseover", () => {
  window.location.href = "filtroPrepFab6/index.html";
});*/

fab6ClimaPrepT.addEventListener("mouseover", (e) => {
  const fab6prepTClimaV = ventanaFlotanteClima(
    'fab6_preparacion_clima',
    'temperatura',
    fab6ClimaPrepT,
    e
  );
});

fab6ClimaPrepT.addEventListener("mouseout", (e) => {
  const fab6prepTClimaVo = mouseOutfCl(e, fab6ClimaPrepT);
});

fab6ClimaPrepH.addEventListener("mouseover", (e) => {
  const fab6prepHClimaV = ventanaFlotanteClima(
    'fab6_preparacion_clima',
    'humedad',
    fab6ClimaPrepH,
    e
  );
});

fab6ClimaPrepH.addEventListener("mouseout", (e) => {
  const fab6prepHClimaVo = mouseOutfCl(e, fab6ClimaPrepH);
});

fab6HumAbsPrep.addEventListener("mouseover", (e) => {
  const fab6prepHumAbsV = ventanaFlotanteClima(
    'fab6_preparacion_clima',
    'humAbsoluta',
    fab6HumAbsPrep,
    e
  );
});

fab6HumAbsPrep.addEventListener("mouseout", (e) => {
  const fab6prepHumAbsVo = mouseOutfCl(e, fab6HumAbsPrep);
});

fab6FiltroCont.addEventListener("mouseover", (e)=> {
  const fab6ContFiltV = ventanaFlotanteFiltro(
    'fab6_continuas_filtro',
    fab6FiltroCont,
    e
  );
});

fab6FiltroCont.addEventListener("mouseout", (e) => {
  const fab6contFilVo = mouseOutf(e, fab6FiltroCont);
});

fab6ClimaContT.addEventListener("mouseover", (e) => {
  const fab6contTClimaV = ventanaFlotanteClima(
    'fab6_continuas_clima',
    'temperatura',
    fab6ClimaContT,
    e
  );
   /* console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab6ClimaContT.addEventListener("mouseout", (e) => {
  const fab6contTClimaVo = mouseOutfCl(e, fab6ClimaContT);
});

fab6ClimaContH.addEventListener("mouseover", (e) => {
  const fab6contHClimaV = ventanaFlotanteClima(
    'fab6_continuas_clima',
    'humedad',
    fab6ClimaContH,
    e
  );
   /* console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab6ClimaContH.addEventListener("mouseout", (e) => {
  const fab6contHClimaVo = mouseOutfCl(e, fab6ClimaContH);
});

fab6HumAbsCont.addEventListener("mouseover", (e) => {
  const fab6contHumAbsV = ventanaFlotanteClima(
    'fab6_continuas_clima',
    'humAbsoluta',
    fab6HumAbsCont,
    e
  );
   /* console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab6HumAbsCont.addEventListener("mouseout", (e) => {
  const fab6contHumAbsVo = mouseOutfCl(e, fab6HumAbsCont);
});


fab6FiltroBob.addEventListener("mouseover", (e)=> {
  const fab6BobFiltV = ventanaFlotanteFiltro(
    'fab6_bobinaje_filtro',
    fab6FiltroBob,
    e
  );
});

fab6FiltroBob.addEventListener("mouseout", (e) => {
  const fab6BobFilVo = mouseOutf(e, fab6FiltroBob);
});

fab6ClimaBobT.addEventListener("mouseover", (e) => {
  const fab6bobTClimaV = ventanaFlotanteClima(
    'fab6_bobinaje_clima',
    'temperatura',
    fab6ClimaBobT,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab6ClimaBobT.addEventListener("mouseout", (e) => {
  const fab6bobTClimaVo = mouseOutfCl(e, fab6ClimaBobT);
});

fab6ClimaBobH.addEventListener("mouseover", (e) => {
  const fab6BobHClimaV = ventanaFlotanteClima(
    'fab6_bobinaje_clima',
    'humedad',
    fab6ClimaBobH,
    e
  );
   /* console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab6ClimaBobH.addEventListener("mouseout", (e) => {
  const fab6bobHClimaVo = mouseOutfCl(e, fab6ClimaBobH);
});

fab6HumAbsBob.addEventListener("mouseover", (e) => {
  const fab6BobHumedadAbsV = ventanaFlotanteClima(
    'fab6_bobinaje_clima',
    'humAbsoluta',
    fab6HumAbsBob,
    e
  );
   /* console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab6HumAbsBob.addEventListener("mouseout", (e) => {
  const fab6bobHumAbsVo = mouseOutfCl(e, fab6HumAbsBob);
});

//////Fabrica 4

fab4FiltroBatan.addEventListener("mouseover", (e)=> {
  const fab4batanFiltV = ventanaFlotanteFiltro(
    'fab4_batan_filtro',
    fab4FiltroBatan,
    e
  );

  /* console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab4FiltroBatan.addEventListener("mouseout", (e) => {
  const fab4batanFilVo = mouseOutf(e, fab4FiltroBatan);
});


fab4FiltroCardas.addEventListener("mouseover", (e)=> {
  const fab4cardasFiltV = ventanaFlotanteFiltro(
    'fab4_cardas_filtro',
    fab4FiltroCardas,
    e
  );

    console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);
});

fab4FiltroCardas.addEventListener("mouseout", (e) => {
  const fab4cardasFilVo = mouseOutf(e, fab4FiltroCardas);
});

fab4FiltroClima.addEventListener("mouseover", (e)=> {
  const fab4climaFiltV = ventanaFlotanteFiltro(
    'fab4_clima_filtro',
    fab4FiltroClima,
    e
  );
});

fab4FiltroClima.addEventListener("mouseout", (e) => {
  const fab4climaFilVo = mouseOutf(e, fab4FiltroClima);
});

fab4ClimaPrepT.addEventListener("mouseover", (e) => {
  const fab4prepTClimaV = ventanaFlotanteClima(
    'fab4_preparacion_clima',
    'temperatura',
    fab4ClimaPrepT,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab4ClimaPrepT.addEventListener("mouseout", (e) => {
  const fab6bobTClimaVo = mouseOutfCl(e, fab4ClimaPrepT);
});

fab4ClimaPrepH.addEventListener("mouseover", (e) => {
  const fab4prepHClimaV = ventanaFlotanteClima(
    'fab4_preparacion_clima',
    'humedad',
    fab4ClimaPrepH,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab4ClimaPrepH.addEventListener("mouseout", (e) => {
  const fab4prepTClimaVo = mouseOutfCl(e, fab4ClimaPrepH);
});

fab4HumAbsPrep.addEventListener("mouseover", (e) => {
  const fab4PrepHumedadAbsV = ventanaFlotanteClima(
    'fab4_preparacion_clima',
    'humAbsoluta',
    fab4HumAbsPrep,
    e
  );
   /* console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab4HumAbsPrep.addEventListener("mouseout", (e) => {
  const fab4prepHumAbsVo = mouseOutfCl(e, fab4HumAbsPrep);
});

fab4ClimaOpenEndT.addEventListener("mouseover", (e) => {
  const fab4openEndTClimaV = ventanaFlotanteClima(
    'fab4_open_end_clima',
    'temperatura',
    fab4ClimaOpenEndT,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab4ClimaOpenEndT.addEventListener("mouseout", (e) => {
  const fab6openEndTClimaVo = mouseOutfCl(e, fab4ClimaOpenEndT);
});

fab4ClimaOpenEndH.addEventListener("mouseover", (e) => {
  const fab4prepHClimaV = ventanaFlotanteClima(
    'fab4_open_end_clima',
    'humedad',
    fab4ClimaOpenEndH,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab4ClimaOpenEndH.addEventListener("mouseout", (e) => {
  const fab4prepTClimaVo = mouseOutfCl(e, fab4ClimaOpenEndH);
});

fab4FiltroRetor.addEventListener("mouseover", (e)=> {
  const fab4retorFiltV = ventanaFlotanteFiltro(
    'fab4_retorcidos_filtro',
    fab4FiltroRetor,
    e
  );
  /*console.log(`X: ${e.clientX}`);
  console.log(`Y: ${e.clientY}`);*/
});

fab4FiltroRetor.addEventListener("mouseout", (e) => {
  const fab4retorFilVo = mouseOutf(e, fab4FiltroRetor);
});

fab4ClimaRetorT.addEventListener("mouseover", (e) => {
  const fab4retorcidoTClimaV = ventanaFlotanteClima(
    'fab4_retorcidos_clima',
    'temperatura',
    fab4ClimaRetorT,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab4ClimaRetorT.addEventListener("mouseout", (e) => {
  const fab4retorcidoTClimaVo = mouseOutfCl(e, fab4ClimaRetorT);
});

fab4ClimaRetorH.addEventListener("mouseover", (e) => {
  const fab4retorcidoHClimaV = ventanaFlotanteClima(
    'fab4_retorcidos_clima',
    'humedad',
    fab4ClimaRetorH,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab4ClimaRetorH.addEventListener("mouseout", (e) => {
  const fab4retorcidoTClimaVo = mouseOutfCl(e, fab4ClimaRetorH);
});


//fabrica 3/////////////////////


fab3FiltroEx8.addEventListener("mouseover", (e)=> {
  const fab3ex8FiltV = ventanaFlotanteFiltro(
    'fab3_ex8_filtro',
    fab3FiltroEx8,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3FiltroEx8.addEventListener("mouseout", (e) => {
  const fab3ex8FilVo = mouseOutf(e, fab3FiltroEx8);
});

fab3ClimaC80T.addEventListener("mouseover", (e) => {
  const fab3c80TClimaV = ventanaFlotanteClima(
    'fab3_c80_clima',
    'temperatura',
    fab3ClimaC80T,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3ClimaC80T.addEventListener("mouseout", (e) => {
  const fab4retorcidoTClimaVo = mouseOutfCl(e, fab3ClimaC80T);
});

fab3ClimaC80H.addEventListener("mouseover", (e) => {
  const fab3c80HClimaV = ventanaFlotanteClima(
    'fab3_c80_clima',
    'humedad',
    fab3ClimaC80H,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3ClimaC80H.addEventListener("mouseout", (e) => {
  const fab3C80HClimaVo = mouseOutfCl(e, fab3ClimaC80H);
});

fab3ClimaC50T.addEventListener("mouseover", (e) => {
  const fab3c50TClimaV = ventanaFlotanteClima(
    'fab3_c50_clima',
    'temperatura',
    fab3ClimaC50T,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3ClimaC50T.addEventListener("mouseout", (e) => {
  const fab3peiTClimaVo = mouseOutfCl(e, fab3ClimaC50T);
});

fab3ClimaC50H.addEventListener("mouseover", (e) => {
  const fab3c50HClimaV = ventanaFlotanteClima(
    'fab3_c50_clima',
    'humedad',
    fab3ClimaC50H,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3ClimaC50H.addEventListener("mouseout", (e) => {
  const fab3c50HClimaVo = mouseOutfCl(e, fab3ClimaC50H);
});

fab3C50HumAbs.addEventListener("mouseover", (e) => {
  const fab3peiEClimaV = ventanaFlotanteClima(
    'fab3_c50_clima',
    'humAbsoluta',
    fab3C50HumAbs,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3C50HumAbs.addEventListener("mouseout", (e) => {
  const fab3c50EClimaVo = mouseOutfCl(e, fab3C50HumAbs);
});

fab3ClimaPeiT.addEventListener("mouseover", (e) => {
  const fab3peiTClimaV = ventanaFlotanteClima(
    'fab3_peinadorasE95_clima',
    'temperatura',
    fab3ClimaPeiT,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3ClimaPeiT.addEventListener("mouseout", (e) => {
  const fab3peiTClimaVo = mouseOutfCl(e, fab3ClimaPeiT);
});

fab3ClimaPeiH.addEventListener("mouseover", (e) => {
  const fab3peiHClimaV = ventanaFlotanteClima(
    'fab3_peinadorasE95_clima',
    'humedad',
    fab3ClimaPeiH,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3ClimaPeiH.addEventListener("mouseout", (e) => {
  const fab3peiHClimaVo = mouseOutfCl(e, fab3ClimaPeiH);
});

fab3PeiHumAbs.addEventListener("mouseover", (e) => {
  const fab3peiEClimaV = ventanaFlotanteClima(
    'fab3_peinadorasE95_clima',
    'humAbsoluta',
    fab3PeiHumAbs,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3PeiHumAbs.addEventListener("mouseout", (e) => {
  const fab3peiEClimaVo = mouseOutfCl(e, fab3PeiHumAbs);
});

fab3ClimaManT.addEventListener("mouseover", (e) => {
  const fab3peiTClimaV = ventanaFlotanteClima(
    'fab3_peinadorasE65_clima',
    'temperatura',
    fab3ClimaManT,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3ClimaManT.addEventListener("mouseout", (e) => {
  const fab3peiTClimaVo = mouseOutfCl(e, fab3ClimaManT);
});


fab3ClimaManH.addEventListener("mouseover", (e) => {
  const fab3manHClimaV = ventanaFlotanteClima(
    'fab3_peinadorasE65_clima',
    'humedad',
    fab3ClimaManH,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3ClimaManH.addEventListener("mouseout", (e) => {
  const fab3manHClimaVo = mouseOutfCl(e, fab3ClimaManH);
});

fab3Pei65HumAbs.addEventListener("mouseover", (e) => {
  const fab3pei65EClimaV = ventanaFlotanteClima(
    'fab3_peinadorasE65_clima',
    'humAbsoluta',
    fab3Pei65HumAbs,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3Pei65HumAbs.addEventListener("mouseout", (e) => {
  const fab3pei65EClimaVo = mouseOutfCl(e, fab3Pei65HumAbs);
});

fab3ClimaLabT.addEventListener("mouseover", (e) => {
  const fab3labTClimaV = ventanaFlotanteClima(
    'fab3_laboratorio_clima',
    'temperatura',
    fab3ClimaLabT,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3ClimaLabT.addEventListener("mouseout", (e) => {
  const fab3labTClimaVo = mouseOutfCl(e, fab3ClimaLabT);
});

fab3ClimaLabH.addEventListener("mouseover", (e) => {
  const fab3labHClimaV = ventanaFlotanteClima(
    'fab3_laboratorio_clima',
    'humedad',
    fab3ClimaLabH,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3ClimaLabH.addEventListener("mouseout", (e) => {
  const fab3labHClimaVo = mouseOutfCl(e, fab3ClimaLabH);
});

fab3LabHumAbs.addEventListener("mouseover", (e) => {
  const fab3labEClimaV = ventanaFlotanteClima(
    'fab3_laboratorio_clima',
    'humAbsoluta',
    fab3C50HumAbs,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3LabHumAbs.addEventListener("mouseout", (e) => {
  const fab3labTClimaVo = mouseOutfCl(e, fab3LabHumAbs);
});

fab3ClimaMechT.addEventListener("mouseover", (e) => {
  const fab3mechTClimaV = ventanaFlotanteClima(
    'fab3_mecheras_clima',
    'temperatura',
    fab3ClimaMechT,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3ClimaMechT.addEventListener("mouseout", (e) => {
  const fab3peiTClimaVo = mouseOutfCl(e, fab3ClimaMechT);
});

fab3ClimaMechH.addEventListener("mouseover", (e) => {
  const fab3mechHClimaV = ventanaFlotanteClima(
    'fab3_mecheras_clima',
    'humedad',
    fab3ClimaMechH,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3ClimaMechH.addEventListener("mouseout", (e) => {
  const fab3mechHClimaVo = mouseOutfCl(e, fab3ClimaMechH);
});

fab3MechHumAbs.addEventListener("mouseover", (e) => {
  const fab3mechEClimaV = ventanaFlotanteClima(
    'fab3_mecheras_clima',
    'humAbsoluta',
    fab3MechHumAbs,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3MechHumAbs.addEventListener("mouseout", (e) => {
  const fab3mechEClimaVo = mouseOutfCl(e, fab3MechHumAbs);
});

fab3FiltroPei.addEventListener("mouseover", (e)=> {
  const fab3ex8FiltV = ventanaFlotanteFiltro(
    'fab3_peinadoras_filtro',
    fab3FiltroPei,
    e
  );
  /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3FiltroPei.addEventListener("mouseout", (e) => {
  const fab3ex8FilVo = mouseOutf(e, fab3FiltroPei);
});

fab3FiltroPrep.addEventListener("mouseover", (e)=> {
  const fab3prepFiltV = ventanaFlotanteFiltro(
    'fab3_preparacion_filtro',
    fab3FiltroPrep,
    e
  );
});

fab3FiltroPrep.addEventListener("mouseout", (e) => {
  const fab3prepFilVo = mouseOutf(e, fab3FiltroPrep);
});

fab3FiltroCardas.addEventListener("mouseover", (e)=> {
  const fab3prepFiltV = ventanaFlotanteFiltro(
    'fab3_cardas_filtro',
    fab3FiltroCardas,
    e
  );
});

fab3FiltroCardas.addEventListener("mouseout", (e) => {
  const fab3prepFilVo = mouseOutf(e, fab3FiltroCardas);
});

fab3FiltroCont.addEventListener("mouseover", (e)=> {
  const fab3contFiltV = ventanaFlotanteFiltro(
    'fab3_g30_filtro',
    fab3FiltroCont,
    e
  );
   /* console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3FiltroCont.addEventListener("mouseout", (e) => {
  const fab3contFilVo = mouseOutf(e, fab3FiltroCont);
});

fab3ClimaG30T.addEventListener("mouseover", (e) => {
  const fab3g30TClimaV = ventanaFlotanteClima(
    'fab3_g30_clima',
    'temperatura',
    fab3ClimaG30T,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3ClimaG30T.addEventListener("mouseout", (e) => {
  const fab3g30TClimaVo = mouseOutfCl(e, fab3ClimaG30T);
});

fab3ClimaG30H.addEventListener("mouseover", (e) => {
  const fab3g30HClimaV = ventanaFlotanteClima(
    'fab3_g30_clima',
    'humedad',
    fab3ClimaG30H,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3ClimaG30H.addEventListener("mouseout", (e) => {
  const fab3g30HClimaVo = mouseOutfCl(e, fab3ClimaG30H);
});

fab3G30HumAbs.addEventListener("mouseover", (e) => {
  const fab3g30EClimaV = ventanaFlotanteClima(
    'fab3_g30_clima',
    'humAbsoluta',
    fab3G30HumAbs,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3G30HumAbs.addEventListener("mouseout", (e) => {
  const fab3g30EClimaVo = mouseOutfCl(e, fab3G30HumAbs);
});

fab3Clima3ZT.addEventListener("mouseover", (e) => {
  const fab3g30TClimaV = ventanaFlotanteClima(
    'fab3_3z_clima',
    'temperatura',
    fab3Clima3ZT,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3Clima3ZT.addEventListener("mouseout", (e) => {
  const fab3g30TClimaVo = mouseOutfCl(e, fab3Clima3ZT);
});

fab3Clima3ZH.addEventListener("mouseover", (e) => {
  const fab3g30HClimaV = ventanaFlotanteClima(
    'fab3_3z_clima',
    'humedad',
    fab3Clima3ZH,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3Clima3ZH.addEventListener("mouseout", (e) => {
  const fab3g30HClimaVo = mouseOutfCl(e, fab3Clima3ZH);
});

fab3z3HumAbs.addEventListener("mouseover", (e) => {
  const fab3z3EClimaV = ventanaFlotanteClima(
    'fab3_3z_clima',
    'humAbsoluta',
    fab3z3HumAbs,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3z3HumAbs.addEventListener("mouseout", (e) => {
  const fab3z3EClimaVo = mouseOutfCl(e, fab3z3HumAbs);
});

fab3FiltroBob.addEventListener("mouseover", (e)=> {
  const fab3bobFiltV = ventanaFlotanteFiltro(
    'fab3_bobinaje_filtro',
    fab3FiltroBob,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3FiltroBob.addEventListener("mouseout", (e) => {
  const fab3contFilVo = mouseOutf(e, fab3FiltroBob);
});

fab3ClimaBobT.addEventListener("mouseover", (e) => {
  const fab3bobTClimaV = ventanaFlotanteClima(
    'fab3_bobinaje_clima',
    'temperatura',
    fab3ClimaBobT,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3ClimaBobT.addEventListener("mouseout", (e) => {
  const fab3bobTClimaVo = mouseOutfCl(e, fab3ClimaBobT);
});

fab3ClimaBobH.addEventListener("mouseover", (e) => {
  const fab3bobHClimaV = ventanaFlotanteClima(
    'fab3_bobinaje_clima',
    'humedad',
    fab3ClimaBobH,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3ClimaBobH.addEventListener("mouseout", (e) => {
  const fab3bobHClimaVo = mouseOutfCl(e, fab3ClimaBobH);
});

fab3bobHumAbs.addEventListener("mouseover", (e) => {
  const fab3bobEClimaV = ventanaFlotanteClima(
    'fab3_bobinaje_clima',
    'humAbsoluta',
    fab3bobHumAbs,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3bobHumAbs.addEventListener("mouseout", (e) => {
  const fab3bobEClimaVo = mouseOutfCl(e, fab3bobHumAbs);
});

fab3ClimaTejT.addEventListener("mouseover", (e) => {
  const fab3tejTClimaV = ventanaFlotanteClima(
    'fab3_tejeduria_clima',
    'temperatura',
    fab3ClimaTejT,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3ClimaTejT.addEventListener("mouseout", (e) => {
  const fab3tejTClimaVo = mouseOutfCl(e, fab3ClimaTejT);
});

fab3ClimaTejH.addEventListener("mouseover", (e) => {
  const fab3tejHClimaV = ventanaFlotanteClima(
    'fab3_tejeduria_clima',
    'humedad',
    fab3ClimaTejH,
    e
  );
    console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);
});

fab3ClimaTejH.addEventListener("mouseout", (e) => {
  const fab3tejHClimaVo = mouseOutfCl(e, fab3ClimaTejH);
});

fab3tejHumAbs.addEventListener("mouseover", (e) => {
  const fab3bobEClimaV = ventanaFlotanteClima(
    'fab3_tejeduria_clima',
    'humAbsoluta',
    fab3tejHumAbs,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3tejHumAbs.addEventListener("mouseout", (e) => {
  const fab3bobEClimaVo = mouseOutfCl(e, fab3tejHumAbs);
});


fab3FiltroG33.addEventListener("mouseover", (e)=> {
  const fab3g33FiltV = ventanaFlotanteFiltro(
    'fab3_g33_filtro',
    fab3FiltroG33,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3FiltroG33.addEventListener("mouseout", (e) => {
  const fab3g33FilVo = mouseOutf(e, fab3FiltroG33);
});

fab3ClimaG33T.addEventListener("mouseover", (e) => {
  const fab3g33TClimaV = ventanaFlotanteClima(
    'fab3_g33_clima',
    'temperatura',
    fab3ClimaG33T,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3ClimaG33T.addEventListener("mouseout", (e) => {
  const fab3g33TClimaVo = mouseOutfCl(e, fab3ClimaG33T);
});

fab3ClimaG33H.addEventListener("mouseover", (e) => {
  const fab3g33HClimaV = ventanaFlotanteClima(
    'fab3_g33_clima',
    'humedad',
    fab3ClimaG33H,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3ClimaG33H.addEventListener("mouseout", (e) => {
  const fab3g33HClimaVo = mouseOutfCl(e, fab3ClimaG33H);
});

fab3G33HumAbs.addEventListener("mouseover", (e) => {
  const fab3g33EClimaV = ventanaFlotanteClima(
    'fab3_g33_clima',
    'humAbsoluta',
    fab3G33HumAbs,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab3G33HumAbs.addEventListener("mouseout", (e) => {
  const fab3g33EClimaVo = mouseOutfCl(e, fab3G33HumAbs);
});

//fabrica 9 //////////////

fab9FiltroLuwa.addEventListener("mouseover", (e)=> {
  const fab9luwaFiltV = ventanaFlotanteFiltro(
    'fab9_batan_luwa_filtro',
    fab9FiltroLuwa,
    e
  );
    console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);
});

fab9FiltroLuwa.addEventListener("mouseout", (e) => {
  const fab9luwaFilVo = mouseOutf(e, fab9FiltroLuwa);
});

fab9FiltroPrep.addEventListener("mouseover", (e)=> {
  const fab9prepFiltV = ventanaFlotanteFiltro(
    'fab9_preparacion_filtro',
    fab9FiltroPrep,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab9FiltroPrep.addEventListener("mouseout", (e) => {
  const fab9prepFilVo = mouseOutf(e, fab9FiltroPrep);
});

fab9ClimaPrepT.addEventListener("mouseover", (e) => {
  const fab9prepTClimaV = ventanaFlotanteClima(
    'fab9_preparacion_clima',
    'temperatura',
    fab9ClimaPrepT,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab9ClimaPrepT.addEventListener("mouseout", (e) => {
  const fab9prepTClimaVo = mouseOutfCl(e, fab9ClimaPrepT);
});

fab9ClimaPrepH.addEventListener("mouseover", (e) => {
  const fab9prepHClimaV = ventanaFlotanteClima(
    'fab9_preparacion_clima',
    'humedad',
    fab9ClimaPrepH,
    e
  );
   /* console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab9ClimaPrepH.addEventListener("mouseout", (e) => {
  const fab9prepHClimaVo = mouseOutfCl(e, fab9ClimaPrepH);
});

fab9FiltroCardaA.addEventListener("mouseover", (e)=> {
  const fab9CardaaFiltV = ventanaFlotanteFiltro(
    'fab9_cardasA_filtro',
    fab9FiltroCardaA,
    e
  );
    console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);
});

fab9FiltroCardaA.addEventListener("mouseout", (e) => {
  const fab9CardaaFilVo = mouseOutf(e, fab9FiltroCardaA);
});

fab9FiltroCardaB.addEventListener("mouseover", (e)=> {
  const fab9CardabFiltV = ventanaFlotanteFiltro(
    'fab9_cardasB_filtro',
    fab9FiltroCardaB,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab9FiltroCardaB.addEventListener("mouseout", (e) => {
  const fab9CardabFilVo = mouseOutf(e, fab9FiltroCardaB);
});

fab9ClimaCarda1T.addEventListener("mouseover", (e) => {
  const fab9carda1TClimaV = ventanaFlotanteClima(
    'fab9_cardas1_clima',
    'temperatura',
    fab9ClimaCarda1T,
    e
  );
    console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);
});

fab9ClimaCarda1T.addEventListener("mouseout", (e) => {
  const fab9carda1TClimaVo = mouseOutfCl(e, fab9ClimaCarda1T);
});

fab9ClimaCarda1H.addEventListener("mouseover", (e) => {
  const fab9carda1HClimaV = ventanaFlotanteClima(
    'fab9_cardas1_clima',
    'humedad',
    fab9ClimaCarda1H,
    e
  );
   /* console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab9ClimaCarda1H.addEventListener("mouseout", (e) => {
  const fab9carda1HClimaVo = mouseOutfCl(e, fab9ClimaCarda1H);
});

fab9car1HumAbs.addEventListener("mouseover", (e) => {
  const fab9car1EClimaV = ventanaFlotanteClima(
    'fab9_cardas1_clima',
    'humAbsoluta',
    fab9car1HumAbs,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab9car1HumAbs.addEventListener("mouseout", (e) => {
  const fab9car1EClimaVo = mouseOutfCl(e, fab9car1HumAbs);
});

fab9ClimaCarda2T.addEventListener("mouseover", (e) => {
  const fab9carda2TClimaV = ventanaFlotanteClima(
    'fab9_cardas2_clima',
    'temperatura',
    fab9ClimaCarda2T,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab9ClimaCarda2T.addEventListener("mouseout", (e) => {
  const fab9carda2TClimaVo = mouseOutfCl(e, fab9ClimaCarda1T);
});

fab9ClimaCarda2H.addEventListener("mouseover", (e) => {
  const fab9carda2HClimaV = ventanaFlotanteClima(
    'fab9_cardas2_clima',
    'humedad',
    fab9ClimaCarda2H,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab9ClimaCarda2H.addEventListener("mouseout", (e) => {
  const fab9carda2TClimaVo = mouseOutfCl(e, fab9ClimaCarda2H);
});

fab9FiltroOE.addEventListener("mouseover", (e)=> {
  const fab9oeFiltV = ventanaFlotanteFiltro(
    'fab9_open_end_filtro',
    fab9FiltroOE,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab9FiltroOE.addEventListener("mouseout", (e) => {
  const fab9oeFilVo = mouseOutf(e, fab9FiltroOE);
});

fab9ClimaOET.addEventListener("mouseover", (e) => {
  const fab9oeTClimaV = ventanaFlotanteClima(
    'fab9_open_end_clima',
    'temperatura',
    fab9ClimaOET,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab9ClimaOET.addEventListener("mouseout", (e) => {
  const fab9oeTClimaVo = mouseOutfCl(e, fab9ClimaOET);
});

fab9ClimaOEH.addEventListener("mouseover", (e) => {
  const fab9oeHClimaV = ventanaFlotanteClima(
    'fab9_open_end_clima',
    'humedad',
    fab9ClimaOEH,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab9ClimaOEH.addEventListener("mouseout", (e) => {
  const fab9oeHClimaVo = mouseOutfCl(e, fab9ClimaOEH);
});

fab9OEHumAbs.addEventListener("mouseover", (e) => {
  const fab9oeEClimaV = ventanaFlotanteClima(
    'fab9_open_end_clima',
    'humAbsoluta',
    fab9OEHumAbs,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab9OEHumAbs.addEventListener("mouseout", (e) => {
  const fab9oeEClimaVo = mouseOutfCl(e, fab9OEHumAbs);
});

fab9ClimaEmpT.addEventListener("mouseover", (e) => {
  const fab9empTClimaV = ventanaFlotanteClima(
    'fab9_empaque_clima',
    'temperatura',
    fab9ClimaEmpT,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab9ClimaEmpT.addEventListener("mouseout", (e) => {
  const fab9empTClimaVo = mouseOutfCl(e, fab9ClimaEmpT);
});

fab9ClimaEmpH.addEventListener("mouseover", (e) => {
  const fab9empHClimaV = ventanaFlotanteClima(
    'fab9_empaque_clima',
    'humedad',
    fab9ClimaEmpH,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab9ClimaEmpH.addEventListener("mouseout", (e) => {
  const fab9empHClimaVo = mouseOutfCl(e, fab9ClimaEmpH);
});

fab9empHumAbs.addEventListener("mouseover", (e) => {
  const fab9empEClimaV = ventanaFlotanteClima(
    'fab9_empaque_clima',
    'humAbsoluta',
    fab9empHumAbs,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab9empHumAbs.addEventListener("mouseout", (e) => {
  const fab9empEClimaVo = mouseOutfCl(e, fab9empHumAbs);
});

/// fabrica 1/////////////

fab1FiltroCard.addEventListener("mouseover", (e)=> {
  const fab1cardasFiltV = ventanaFlotanteFiltro(
    'fab1_cardas_filtro',
    fab1FiltroCard,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1FiltroCard.addEventListener("mouseout", (e) => {
  const fab1cardasFilVo = mouseOutf(e, fab1FiltroCard);
});

fab1FiltroPrep.addEventListener("mouseover", (e)=> {
  const fab1prepFiltV = ventanaFlotanteFiltro(
    'fab1_preparacion_filtro',
    fab1FiltroPrep,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1FiltroPrep.addEventListener("mouseout", (e) => {
  const fab1prepFilVo = mouseOutf(e, fab1FiltroPrep);
});

fab1ClimaPeiT.addEventListener("mouseover", (e) => {
  const fab1peiTClimaV = ventanaFlotanteClima(
    'fab1_preparacion_clima',
    'temperatura',
    fab1ClimaPeiT,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1ClimaPeiT.addEventListener("mouseout", (e) => {
  const fab1peiTClimaVo = mouseOutfCl(e, fab1ClimaPeiT);
});

fab1ClimaPeiH.addEventListener("mouseover", (e) => {
  const fab1peiHClimaV = ventanaFlotanteClima(
    'fab1_preparacion_clima',
    'humedad',
    fab1ClimaPeiH,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1ClimaPeiH.addEventListener("mouseout", (e) => {
  const fab1peiHClimaVo = mouseOutfCl(e, fab1ClimaPeiH);
});

fab1peiHumAbs.addEventListener("mouseover", (e) => {
  const fab1peiEClimaV = ventanaFlotanteClima(
    'fab1_preparacion_clima',
    'humAbsoluta',
    fab1peiHumAbs,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1peiHumAbs.addEventListener("mouseout", (e) => {
  const fab1peiEClimaVo = mouseOutfCl(e, fab1peiHumAbs);
});

fab1ClimaManT.addEventListener("mouseover", (e) => {
  const fab1manTClimaV = ventanaFlotanteClima(
    'fab1_manuares_clima',
    'temperatura',
    fab1ClimaManT,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1ClimaManT.addEventListener("mouseout", (e) => {
  const fab1manTClimaVo = mouseOutfCl(e, fab1ClimaManT);
});

fab1ClimaManH.addEventListener("mouseover", (e) => {
  const fab1manHClimaV = ventanaFlotanteClima(
    'fab1_manuares_clima',
    'humedad',
    fab1ClimaManH,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1ClimaManH.addEventListener("mouseout", (e) => {
  const fab1manHClimaVo = mouseOutfCl(e, fab1ClimaManH);
});

fab1FiltroCont.addEventListener("mouseover", (e)=> {
  const fab1contFiltV = ventanaFlotanteFiltro(
    'fab1_continuas_filtro',
    fab1FiltroCont,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1FiltroCont.addEventListener("mouseout", (e) => {
  const fab1contFilVo = mouseOutf(e, fab1FiltroCont);
});

fab1FiltroBob.addEventListener("mouseover", (e)=> {
  const fab1bobFiltV = ventanaFlotanteFiltro(
    'fab1_bobinaje_filtro',
    fab1FiltroBob,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1FiltroBob.addEventListener("mouseout", (e) => {
  const fab1bobFilVo = mouseOutf(e, fab1FiltroBob);
});

fab1ClimaCont1T.addEventListener("mouseover", (e) => {
  const fab1cont1TClimaV = ventanaFlotanteClima(
    'fab1_continuas1_clima',
    'temperatura',
    fab1ClimaCont1T,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1ClimaCont1T.addEventListener("mouseout", (e) => {
  const fab1cont1TClimaVo = mouseOutfCl(e, fab1ClimaCont1T);
});

fab1ClimaCont1H.addEventListener("mouseover", (e) => {
  const fab1cont1HClimaV = ventanaFlotanteClima(
    'fab1_continuas1_clima',
    'humedad',
    fab1ClimaCont1H,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1ClimaCont1H.addEventListener("mouseout", (e) => {
  const fab1cont1HClimaVo = mouseOutfCl(e, fab1ClimaCont1H);
});

fab1ClimaCont2T.addEventListener("mouseover", (e) => {
  const fab1cont2TClimaV = ventanaFlotanteClima(
    'fab1_continuas2_clima',
    'temperatura',
    fab1ClimaCont2T,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1ClimaCont2T.addEventListener("mouseout", (e) => {
  const fab1cont2TClimaVo = mouseOutfCl(e, fab1ClimaCont2T);
});

fab1ClimaCont2H.addEventListener("mouseover", (e) => {
  const fab1cont2HClimaV = ventanaFlotanteClima(
    'fab1_continuas2_clima',
    'humedad',
    fab1ClimaCont2H,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1ClimaCont2H.addEventListener("mouseout", (e) => {
  const fab1cont2HClimaVo = mouseOutfCl(e, fab1ClimaCont2H);
});

fab1cont2HumAbs.addEventListener("mouseover", (e) => {
  const fab1cont2EClimaV = ventanaFlotanteClima(
    'fab1_continuas2_clima',
    'humAbsoluta',
    fab1cont2HumAbs,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1cont2HumAbs.addEventListener("mouseout", (e) => {
  const fab1cont2EClimaVo = mouseOutfCl(e, fab1cont2HumAbs);
});


fab1ClimaVortex1T.addEventListener("mouseover", (e) => {
  const fab1vortex1TClimaV = ventanaFlotanteClima(
    'fab1_vortex1_clima',
    'temperatura',
    fab1ClimaVortex1T,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1ClimaVortex1T.addEventListener("mouseout", (e) => {
  const fab1vortex1TClimaVo = mouseOutfCl(e, fab1ClimaVortex1T);
});

fab1ClimaVortex1H.addEventListener("mouseover", (e) => {
  const fab1vortex1HClimaV = ventanaFlotanteClima(
    'fab1_vortex1_clima',
    'humedad',
    fab1ClimaVortex1H,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1ClimaVortex1H.addEventListener("mouseout", (e) => {
  const fab1vortex1HClimaVo = mouseOutfCl(e, fab1ClimaVortex1H);
});

fab1ClimaVortex2T.addEventListener("mouseover", (e) => {
  const fab1vortex2TClimaV = ventanaFlotanteClima(
    'fab1_vortex2_clima',
    'temperatura',
    fab1ClimaVortex2T,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1ClimaVortex2T.addEventListener("mouseout", (e) => {
  const fab1vortex2TClimaVo = mouseOutfCl(e, fab1ClimaVortex2T);
});

fab1ClimaVortex2H.addEventListener("mouseover", (e) => {
  const fab1vortex2HClimaV = ventanaFlotanteClima(
    'fab1_vortex2_clima',
    'humedad',
    fab1ClimaVortex2H,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1ClimaVortex2H.addEventListener("mouseout", (e) => {
  const fab1vortex2HClimaVo = mouseOutfCl(e, fab1ClimaVortex2H);
});

fab1ClimaVortex3T.addEventListener("mouseover", (e) => {
  const fab1vortex3TClimaV = ventanaFlotanteClima(
    'fab1_vortex3_clima',
    'temperatura',
    fab1ClimaVortex3T,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1ClimaVortex3T.addEventListener("mouseout", (e) => {
  const fab1vortex3TClimaVo = mouseOutfCl(e, fab1ClimaVortex3T);
});

fab1ClimaVortex3H.addEventListener("mouseover", (e) => {
  const fab1vortex3TClimaV = ventanaFlotanteClima(
    'fab1_vortex3_clima',
    'humedad',
    fab1ClimaVortex3H,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1ClimaVortex3H.addEventListener("mouseout", (e) => {
  const fab1vortex3TClimaVo = mouseOutfCl(e, fab1ClimaVortex3H);
});

fab1ClimaVortex4T.addEventListener("mouseover", (e) => {
  const fab1vortex3TClimaV = ventanaFlotanteClima(
    'fab1_vortex4_clima',
    'temperatura',
    fab1ClimaVortex4T,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1ClimaVortex4T.addEventListener("mouseout", (e) => {
  const fab1vortex3TClimaVo = mouseOutfCl(e, fab1ClimaVortex4T);
});

fab1ClimaVortex4H.addEventListener("mouseover", (e) => {
  const fab1vortex4TClimaV = ventanaFlotanteClima(
    'fab1_vortex4_clima',
    'humedad',
    fab1ClimaVortex4H,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1ClimaVortex4H.addEventListener("mouseout", (e) => {
  const fab1vortex4TClimaVo = mouseOutfCl(e, fab1ClimaVortex4H);
});


fab1FiltroColor.addEventListener("mouseover", (e)=> {
  const fab1colorFiltV = ventanaFlotanteFiltro(
    'fab1_color_filtro',
    fab1FiltroColor,
    e
  );
});

fab1FiltroColor.addEventListener("mouseout", (e) => {
  const fab1colorFilVo = mouseOutf(e, fab1FiltroColor);
});

fab1ClimaColorT.addEventListener("mouseover", (e) => {
  const fab1colorTClimaV = ventanaFlotanteClima(
    'fab1_color_clima',
    'temperatura',
    fab1ClimaColorT,
    e
  );
});

fab1ClimaColorT.addEventListener("mouseout", (e) => {
  const fab1colorTClimaVo = mouseOutfCl(e, fab1ClimaColorT);
});

fab1ClimaColorH.addEventListener("mouseover", (e) => {
  const fab1colorHClimaV = ventanaFlotanteClima(
    'fab1_color_clima',
    'humedad',
    fab1ClimaColorH,
    e
  );
});

fab1ClimaColorH.addEventListener("mouseout", (e) => {
  const fab1colorHClimaVo = mouseOutfCl(e, fab1ClimaColorH);
});

fab1colHumAbs.addEventListener("mouseover", (e) => {
  const fab1colEClimaV = ventanaFlotanteClima(
    'fab1_color_clima',
    'humAbsoluta',
    fab1colHumAbs,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1colHumAbs.addEventListener("mouseout", (e) => {
  const fab1col2EClimaVo = mouseOutfCl(e, fab1colHumAbs);
});

fab1ClimaBobT.addEventListener("mouseover", (e) => {
  const fab1bobTClimaV = ventanaFlotanteClima(
    'fab1_bobinaje_clima',
    'temperatura',
    fab1ClimaBobT,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1ClimaBobT.addEventListener("mouseout", (e) => {
  const fab1bobTClimaVo = mouseOutfCl(e, fab1ClimaBobT);
});

fab1ClimaBobH.addEventListener("mouseover", (e) => {
  const fab1bobHClimaV = ventanaFlotanteClima(
    'fab1_bobinaje_clima',
    'humedad',
    fab1ClimaBobH,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1ClimaBobH.addEventListener("mouseout", (e) => {
  const fab1bobHClimaVo = mouseOutfCl(e, fab1ClimaBobH);
});

fab1bobHumAbs.addEventListener("mouseover", (e) => {
  const fab1bobEClimaV = ventanaFlotanteClima(
    'fab1_bobinaje_clima',
    'humAbsoluta',
    fab1bobHumAbs,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1bobHumAbs.addEventListener("mouseout", (e) => {
  const fab1bob2EClimaVo = mouseOutfCl(e, fab1bobHumAbs);
});

fab1ClimaEmpT.addEventListener("mouseover", (e) => {
  const fab1empTClimaV = ventanaFlotanteClima(
    'fab1_empaque_clima',
    'temperatura',
    fab1ClimaEmpT,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1ClimaEmpT.addEventListener("mouseout", (e) => {
  const fab1empTClimaVo = mouseOutfCl(e, fab1ClimaEmpT);
});

fab1ClimaEmpH.addEventListener("mouseover", (e) => {
  const fab1empHClimaV = ventanaFlotanteClima(
    'fab1_empaque_clima',
    'humedad',
    fab1ClimaEmpH,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1ClimaEmpH.addEventListener("mouseout", (e) => {
  const fab1empHClimaVo = mouseOutfCl(e, fab1ClimaEmpH);
});

fab1empHumAbs.addEventListener("mouseover", (e) => {
  const fab1empEClimaV = ventanaFlotanteClima(
    'fab1_empaque_clima',
    'humAbsoluta',
    fab1empHumAbs,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1empHumAbs.addEventListener("mouseout", (e) => {
  const fab1empEClimaVo = mouseOutfCl(e, fab1empHumAbs);
});

fab1ClimaTCardT.addEventListener("mouseover", (e) => {
  const fab1TcardTClimaV = ventanaFlotanteClima(
    'fab1_taller_cardas_clima',
    'temperatura',
    fab1ClimaTCardT,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1ClimaTCardT.addEventListener("mouseout", (e) => {
  const fab1TcardTClimaVo = mouseOutfCl(e, fab1ClimaTCardT);
});

fab1ClimaTCardH.addEventListener("mouseover", (e) => {
  const fab1TcardHClimaV = ventanaFlotanteClima(
    'fab1_taller_cardas_clima',
    'humedad',
    fab1ClimaTCardH,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1ClimaTCardH.addEventListener("mouseout", (e) => {
  const fab1empHClimaVo = mouseOutfCl(e, fab1ClimaTCardH);
});

fab1FiltroBatan.addEventListener("mouseover", (e)=> {
  const fab1batanFiltV = ventanaFlotanteFiltro(
    'fab1_batan_filtro',
    fab1FiltroBatan,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1FiltroBatan.addEventListener("mouseout", (e) => {
  const fab1batanFilVo = mouseOutf(e, fab1FiltroBatan);
});

fab1filtroCoton.addEventListener("mouseover", (e)=> {
  const fab1cotonFiltV = ventanaFlotanteFiltro(
    'fab1_cotonia_filtro',
    fab1filtroCoton,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1filtroCoton.addEventListener("mouseout", (e) => {
  const fab1cotonFilVo = mouseOutf(e, fab1filtroCoton);
});

fab1FiltroPrensa.addEventListener("mouseover", (e) => {
  const fab1prensaFiltroV = ventanaFlotanteClima(
    `${server}/dataFabxprensaFiltro24hs`,
    fab1FiltroPrensa,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab1FiltroPrensa.addEventListener("mouseout", (e) => {
  const fab1prensaFiltroVo = mouseOutfCl(e, fab1FiltroPrensa);
});


fab9ClimaExtT.addEventListener("mouseover", (e) => {
  const fab9ExtClimaV = ventanaFlotanteClima(
    'fab9_exterior_clima',
    'temperatura',
    fab9ClimaExtT,
    e
  );
    /*console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);*/
});

fab9ClimaExtT.addEventListener("mouseout", (e) => {
  const fab9ClimaExtClimaVo = mouseOutfCl(e, fab9ClimaExtT);
});


fab9ClimaExtH.addEventListener("mouseover", (e) => {
  const fab9ExtClimaV = ventanaFlotanteClima(
    'fab9_exterior_clima',
    'humedad',
    fab9ClimaExtH,
    e
  );
    console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);
});

fab9ClimaExtH.addEventListener("mouseout", (e) => {
  const fab9ExtClimaVo = mouseOutfCl(e, fab9ClimaExtH);
});

fab9ClimaExtE.addEventListener("mouseover", (e) => {
  const fab9ExtClimaV = ventanaFlotanteClima(
    'fab9_exterior_clima',
    'entalpia',
    fab9ClimaExtE,
    e
  );
    console.log(`X: ${e.clientX}`);
    console.log(`Y: ${e.clientY}`);
});

fab9ClimaExtE.addEventListener("mouseout", (e) => {
  const fab9ClimaExtClimaVo = mouseOutfCl(e, fab9ClimaExtE);
});



detecPant();


actualizarDatos();

setInterval(actualizarDatos, 60000);
