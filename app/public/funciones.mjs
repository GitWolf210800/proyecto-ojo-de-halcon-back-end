import { server, 
        paroManual, 
        serverNodeRed,
        tempoColdExt,
        tempOkExt,
        tempMhotExt,
        tempHotExt,
        fallaColor,
        humOkExt,
        textOk,
        textNotOk,
        mouseOut,
        alarmClima,
        alertClima,
        preAlertClima,
        okClima,
        offline,
        neutral,
        neutClima,
        alertFiltro,
        okFiltro
      } from "./variables.mjs";

var http = new XMLHttpRequest();

///////////////////////////// popUp windows, Chart variable global, and Colours ///////////////////////


const mouseOver = "#58B7D3";
const ventanaFlotanteclima = document.getElementById("ventanaClima"); 
const ventanaFlotante = document.getElementById("ventanaFlotante");                 // Here declared in popUp windows, previosly developed in CSS and HTML
var chartCl;
var chart;
var ctxCL = document.getElementById("myChartClima");
var pasoCl = 1;
var paso = 1;

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

function climaExt (direccion) {                        /// This function is for interact in object SVG clima Extern
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
        const tempExtdate = `${(date.datos[0].temperatura).toFixed(0)} °C`;
        const humExtdata = `${(date.datos[0].humedad).toFixed(0)} %`;
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

function mouseOutfCl  (e, boton) {  // This function is for disguise popUp windows Clima installations
  //boton.style.fill = "#333";
  ventanaFlotanteclima.style.display = "none";
  document.getElementById("myChartClima").style.display = "none";
  pasoCl = 1;
  if(chartCl) window.chartCl.destroy();

};

function ventanaFlotanteClima (nombre, medicion, boton, e, estandar, tabla, min, max) {  /// This function is for show data in clima installation and popUp windows adjusted automatically
    //let ctxCL = document.getElementById("myChartClima");
      //const instalacion = document.getElementById("instalacionclima");
    const nameInst = document.getElementById("nombre");
    // Definir la URL del servidor
    let url = `${server}/clima24hs`;
    let requestData;
    // Definir el objeto JSON con los detalles de los datos a solicitar
    if (estandar){
      requestData = {
        instalacion: nombre,
        medir: medicion,
        estandar,
        tabla,
        min,
        max
      };
    } 
    else {
      requestData = {
        instalacion: nombre,
        medir: medicion
      };
    }
    
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
              if (estandar){
                nameInst.textContent = `${date.instalacion}, 24Hs`;
              } 
              else if (nombre.startsWith('carrier')) nameInst.textContent = `carrier, 24Hs`;
              else nameInst.textContent = `${date.instalacion}, ${date.nombre} 24Hs`;
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

              //console.log(datos);
    
    
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
                    historial.push({ x: horaText, y: `${datos[i].temperatura}` });
                    limiteInterSup.push ({ x: horaText, y: `${datos[i].maxTemp}` });
                    limiteSup.push({ x: horaText, y: `${datos[i].max_Atemp}` });
                  } 
                  else if (date.medicion === "humedad") {
                    limiteInf.push({ x: horaText, y: `${datos[i].min_Ahum}` });
                    limiteInterInf.push({ x: horaText, y: `${datos[i].minHum}` });
                    historial.push({ x: horaText, y: `${datos[i].humedad}` });
                    limiteInterSup.push({ x: horaText, y: `${datos[i].maxHum}` });
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
                  else if (estandar){
                    limiteInterInf.push({ x: horaText, y: `${datos[i][`min_${medicion}`]}` });
                    historial.push({ x: horaText, y: `${datos[i][medicion]}` });
                    limiteInterSup.push({ x: horaText, y: `${datos[i][`max_${medicion}`]}` });
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
              else if (estandar && date[`min_${medicion}`] !== null && date[`max_${medicion}`] === null){
                limiteInterInfT = `Limite MIN ${medicion}: ${dataTempRealcl[`min_${medicion}`]}`;
                colorG = "#417CDF";
                limiteInterColor = '#E7C101';
              }
              else if (estandar && date[`min_${medicion}`] === null && date[`max_${medicion}`] !== null){
                limiteInterSupT = `Limite MAX ${medicion}: ${dataTempRealcl[`max_${medicion}`]}`;
                colorG = "#417CDF";
                limiteInterColor = '#E7C101';
              }
              else if (estandar && date[`min_${medicion}`] !== null && date[`max_${medicion}`] !== null){
                limiteInterSupT = `Limite MAX ${medicion}: ${dataTempRealcl[`max_${medicion}`]}`;
                colorG = "#417CDF";
                limiteInterInfT = `Limite MIN ${medicion}: ${dataTempRealcl[`min_${medicion}`]}`;
                limiteInterColor = '#E7C101';
              }
              else if (date.medicion === 'entalpia' || estandar) colorG = "#0076E5";

    
              // Aqui se da vuelta los datos del array para representarlo en la grafica
              limiteInterInf.reverse();
              limiteInf.reverse();
              historial.reverse();
              limiteSup.reverse();
              limiteInterSup.reverse();

              // Aqui se destruye la grafica en caso de haberse utilizado previamente
              if(window.chartCl) window.chartCl.destroy();

              let datasets = [];
              let y = {};

              if (estandar && dataTempRealcl[`min_${medicion}`] === undefined && dataTempRealcl[`max_${medicion}`] === undefined){
                datasets = [
                  {
                    label: `${date.medicion}`,
                    borderColor: colorG,
                    borderWidth: 2,
                    data: historial,
                  }
                ];
                y = {
                  min : 0
                };
              }
              else if (estandar && dataTempRealcl[`min_${medicion}`] !== null && dataTempRealcl[`max_${medicion}`] !== null){
                datasets = [
                  {
                    label : limiteInterInfT,
                    borderColor : limiteInterColor,
                    borderWidth: 1.5,
                    data: limiteInterInf
                  },
                  {
                    label: `${date.medicion}`,
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
                ];
              }
              
              else if (estandar && dataTempRealcl[`min_${medicion}`] !== null){
                  datasets = [
                    {
                      label : limiteInterInfT,
                      borderColor : limiteInterColor,
                      borderWidth: 1.5,
                      data: limiteInterInf
                    },
                    {
                      label: `${date.medicion}`,
                      borderColor: colorG,
                      borderWidth: 2,
                      data: historial,
                    }
                  ];
              } else if (estandar && dataTempRealcl[`max_${medicion}`] !== null){
                datasets = [
                  {
                    label: `${date.medicion}`,
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
                ];
              }
              else if (estandar && dataTempRealcl[`min_${medicion}`] === null && dataTempRealcl[`max_${medicion}`] === null){
                datasets = [
                  {
                    label: `${date.medicion}`,
                    borderColor: colorG,
                    borderWidth: 2,
                    data: historial,
                  }
                ];
                y = {
                  min : 0
                };
              }

    
              //Aqui es donde se arma la grafica, pero antes se define si es medida simple o medida de doble limite
              if ((date.medicion === 'temperatura' && tempMaxA !== 0 && tempMinA !== 0) || (date.medicion === 'humedad' && humMaxA !== 0 && humMinA !== 0)){
                window.chartCl = new Chart(ctxCL, {
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
                window.chartCl = new Chart(ctxCL, {
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
              else if (!estandar) {
                window.chartCl = new Chart(ctxCL, {
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
              else if (estandar){
                window.chartCl = new Chart(ctxCL, {
                  type: "line",
                  data: {
                    datasets
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
                      },
                      y
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
    //boton.style.fill = mouseOver;
    
    // definir la posicion de la ventana en la pantalla del usuario/cliente, en base a la posicion del eje x e y del mouse donde se
    // esta seleccionando el objeto
    //if(isMobile()){
      if (e.clientY >= 45 && e.clientY < 100) {
        x = x - 300; 
        y = y + 30;
      }
      
      else if (e.clientY >= 50 && e.clientY < 300 && e.clientX >= 800 && e.clientX <= 1900) {
        y = y - 100;
        x = x - 620;
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
    //}
    
    //aca se define en el CSS los px de posicion de la ventana flotante, y el modo de la ventana, en este caso 'block'
    if (isMobile()){
      //alert('es un celular');
      const chart = document.getElementById('myChartClima');
      const titleInst = document.getElementById('nombre');
      titleInst.style.color = '#FFF';
      titleInst.style.background = 'linear-gradient(to bottom, solid, #FFF)';
      chart.style.display = 'flex';
      ventanaFlotanteclima.style.background = 'linear-gradient(0deg, transparent, #232638)';
      ventanaFlotanteclima.style.border = 'none';
      ventanaFlotanteclima.style.position = 'fixed';
      ventanaFlotanteclima.style.width = '97vw';
      ventanaFlotanteclima.style.height = '95vh';
      ventanaFlotanteclima.style.left = 0 + 'px';
      ventanaFlotanteclima.style.top = '-7vh';
      ventanaFlotanteclima.style.zIndex = 999;
      ventanaFlotanteclima.style.marginTop = '7vh';
      ventanaFlotanteclima.style.display = "block";
    } else {
      ventanaFlotanteclima.style.left = x + "px";
      ventanaFlotanteclima.style.top = y + "px";
      ventanaFlotanteclima.style.display = "block";
    }
    
    // Enviar la solicitud al servidor
    http.send();
};

function mouseOutf (e, boton) {   // This function is for disguise popUp windows filters
      boton.style.fill = mouseOut;
      ventanaFlotante.style.display = "none";
      paso = 1;
      if(chart) window.chart.destroy();
};

function ventanaFlotanteFiltro  (nombre, boton, e) {    /// This function is for show data in filters installation and popUp windows adjusted automatically
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

            for (let x in dataTempReal){
              if (dataTempReal[x] !== null && typeof dataTempReal[x] !== 'string' && !x.startsWith('lim')){
                dataTempReal[x] = dataTempReal[x].toFixed(2);
              }
            }
            
            if (nombre !== 'fabx_prensa_filtro'){
              const infoTVent = `Ventilador: (Limite Inf: ${dataTempReal.limVent} Pa)`;
              const infoVent = `${dataTempReal.ventilador} Pa`;
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
                const infoFiltroVent = `${dataTempReal.filtroVentilador} Pa`;
                const infoTpicos = `Picos: (Limite Inf: ${dataTempReal.limPicos} Pa)`;
                const infoPicos = `${dataTempReal.picos} Pa`;
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
      
      
      if (isMobile()){
        if(window.innerHeight < window.innerWidth){
          const dataDiv = document.getElementById('dataFiltroo');
          const chartFil = document.querySelector('.grafica');
          ventanaFlotante.style.border = 'none';
          ventanaFlotante.style.background = 'linear-gradient(0deg, transparent, #232638)';
          ventanaFlotante.style.position = 'fixed';
          ventanaFlotante.style.display = 'flex';
          ventanaFlotante.style.flexWrap = 'wrap';
          ventanaFlotante.style.width = '98vw';
          ventanaFlotante.style.height = '100%';
          ventanaFlotante.style.left = '0vw';
          ventanaFlotante.style.top = '0vh';
          ventanaFlotante.style.zIndex = 999;
          chartFil.style.position = 'absolute';
          chartFil.style.left = '.5vw';
          chartFil.style.right = '.5vw';
          chartFil.style.height = '65vh';
          chartFil.style.width = '87vw';
          dataDiv.style.position = 'absolute';
          dataDiv.style.top = '8vh';
          dataDiv.style.right = '.5vw';
          dataDiv.style.width = '25vw';
          dataDiv.style.height = '70vh';
          ventanaFlotante.style.display = "block";
        } else {
          const dataDiv = document.getElementById('dataFiltroo');
          const chartFil = document.querySelector('.grafica');
          ventanaFlotante.style.border = 'none';
          ventanaFlotante.style.background = 'linear-gradient(180deg, transparent, #232638)';
          ventanaFlotante.style.display = 'flex';
          ventanaFlotante.style.flexWrap = 'wrap';
          ventanaFlotante.style.justifyContent = 'center';
          ventanaFlotante.style.width = '98vw';
          ventanaFlotante.style.height = '100%';
          ventanaFlotante.style.left = '0vw';
          ventanaFlotante.style.top = 0 + 'px';
          ventanaFlotante.style.zIndex = 999;
          chartFil.style.position = 'absolute';
          chartFil.style.left = '.5vw';
          chartFil.style.height = '85vh';
          chartFil.style.width = '100vw';
          dataDiv.style.position = 'absolute';
          dataDiv.style.display = 'inline';
          //dataDiv.style.flexWrap = 'wrap';
          //dataDiv.style.justifyContent = 'center';
          dataDiv.style.top = '35vh';
          dataDiv.style.right = '25vw';
          dataDiv.style.left = '25vw';
          dataDiv.style.width = '90%';
          dataDiv.style.height = '70vh';
          ventanaFlotante.style.display = "block";
        }
      } else {
        ventanaFlotante.style.left = x + "px";
        ventanaFlotante.style.top = y + "px";
        ventanaFlotante.style.display = "block";
      }
      
};

function puestoClimaRef (botonTemp, botonHum, textTemp, textHum, data, instalacion, botonEnt, textEnt) {  // This function is for intected witch objects SVG, in map installations adjustement colors according to, limits and show now status data information
  
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
        const temp = (datos.temperatura).toFixed(0);
        const hum = (datos.humedad).toFixed(0);
        const minATemper = datos.min_Atemp;
        const minTemp = datos.minTemp;
        const maxTemp = datos.maxTemp;
        const maxATemper = datos.max_Atemp;
        const minAHum = datos.min_Ahum;
        const minHum = datos.minHum;
        const maxHum = datos.maxHum;
        const maxAHum = datos.max_Ahum;
        // armando la cadena de texto para mostrar en el objeto
        const infoTemp = `${temp}°C`;
        const infoHum = `${hum}% H.r`;

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
          const humAbs = (datos.humedadAbs).toFixed(0);
          // armado de string para mostrar en la web
          const infoEnt = `${humAbs} g/Kg`;
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

function puestoClima (botonTemp, botonHum, textTemp, textHum, data, instalacion) {  //this function is for show status now information is not references installations (grey installations)
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
      const temp = (datos.temperatura).toFixed(0);
      const hum = (datos.humedad).toFixed(0);
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

function carrier (direccion){ // here interacted with 'sala de chillers' object, whit data registered in dataBase
  const sector = new XMLHttpRequest();

  sector.onreadystatechange = () => {
    if (sector.readyState == XMLHttpRequest.DONE){
      if (sector.status == 200) {
        const date = JSON.parse(sector.responseText);
        const datoss = date.datos;
    
        for (let i = 0; i < datoss.length; i++){
          const carrierText = document.getElementById(`${datoss[i].nombre}Text`);
          const carrierButton = document.getElementById(datoss[i].nombre);

          carrierText.textContent = `${datoss[i].nombre}  ${Math.abs(datoss[i].demanda.toFixed(0))} %`;

          if(datoss[i].estado === 100) {
            carrierButton.style.fill = okClima;
            carrierText.style.stroke = '#000';
            carrierText.style.fill = '#FFF';
          }
  
          else if(datoss[i].estado === 50){ 
            carrierButton.style.fill = paroManual;
            carrierText.style.stroke = '#000';
            carrierText.style.fill = '#FFF';
          }
  
          else if(datoss[i].estado === 0){ 
            carrierButton.style.fill = alertClima;
            carrierText.style.stroke = '#000';
            carrierText.style.fill = '#FFF';
          }

          try{
            const iterar = ['entrada_agua_fria_principal', 'salida_agua_fria_principal', 'tanque_agua_fria_carrier'];
            for (let i = 0; i < iterar.length; i++){
              document.getElementById(iterar[i]).addEventListener('mouseover', (e) => {
                const funcion = ventanaFlotanteClima(
                  `${datoss[i].nombre}`,
                  iterar[i],
                  false,
                  e,
                  true,
                  'mediciones_carrier'
                );
              });
              document.getElementById(iterar[i]).addEventListener('mouseout', (e) => {
                const funcionOut = mouseOutfCl(e, document.getElementById(iterar[i]));
               });
               const number = datoss[i][iterar[i]];
              if (Number.isInteger(number)){
                document.getElementById(iterar[i]).textContent = number;
                if (iterar[i] === 'tanque_agua_fria_carrier'){
                  const objeto = document.getElementById(`${iterar[i]}_grafico`);
                  if (number >= 50){
                    objeto.style.fill = okClima;
                  }
                  else if (number < 50) {
                    objeto.style.fill = alarmClima;
                  } 
                  else if (number < 20) {
                    objeto.style.fill = alertClima;
                  }
                }
              } else {
                document.getElementById(iterar[i]).textContent = number.toFixed(1);
              }
            }
          } catch {
            console.log(`error en ${datoss[i].nombre}`);
          }

          document.getElementById(`${datoss[i].nombre}Vinf`).addEventListener('click', (e) => {
            window.location.href = `/${datoss[i].nombre}`;
          });

        }
      }
    }
  };
  sector.open("GET", direccion, true);
  sector.send();
};

 function botonF (botonFiltro, textBoton, data, instalacion) { // here interacted filter status if is 0 or 1, is 0 = not good (red colour), is 1 = good (green colour) 

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

 function decodeJWT(token) {
  if(token){
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    return JSON.parse(jsonPayload);
  } else return false;
  
}

async function datosCarrier(instalacion) {

  const carrierUp = carrier(`${serverNodeRed}/dataCarrierEstado`);

  const res = await fetch(`${serverNodeRed}/carrier`, {
      method: 'POST',
      headers: {
          'Content-Type' : 'application/json'
      },
      body : JSON.stringify({instalacion})
  });
  const resJson = await res.json();
  const data = resJson.datos[0];
  
      for (let x in data){
          if(data[x] === null) continue;
          try {
            const datoDom = document.getElementById(x);
            if( x.startsWith('filtro') || x.startsWith('bomba_') || x.startsWith('ventilador') || x === 'estado'){
              if(data[x] === 100) datoDom.style.fill = okClima;

              else if(data[x] === 50) datoDom.style.fill = paroManual;

              else if(data[x] === 0) datoDom.style.fill = alertClima;

              else if (x === 'bomba_pileta' && data[x] === 5) datoDom.style.fill = '#D5A200';
             }
            if( x === 'pileta' || x.startsWith('valvula_')){
              if(data[x] === 100) datoDom.style.stroke = okClima;

              else if(data[x] === 80) datoDom.style.stroke = '#E9EC03'

              else if(data[x] === 5) datoDom.style.stroke = paroManual;

              else if(data[x] === 50) datoDom.style.stroke = paroManual;
            }

            if(x !== 'id_medicion' && x !== 'id_instalacion' && x !== 'fecha' && x !== 'alave' && !x.startsWith('min_') && !x.startsWith('max_') && !x.startsWith('tanque_')){
                  datoDom.textContent = data[x].toFixed(1);
                  datoDom.addEventListener('mouseover', (e) => {
                    const funcion = ventanaFlotanteClima(
                      instalacion,
                      x,
                      datoDom,
                      e,
                      true,
                      'mediciones_carrier',
                      true,
                      true
                    );
                  });
                 datoDom.addEventListener('mouseout', (e) => {
                  const funcionOut = mouseOutfCl(e, datoDom);
                 });
             } 
          } 
          catch {
              console.log(`error en:${x}, ${data[x]}`);
          };
      }

}

export {
    decodeJWT, 
    botonF, 
    carrier, 
    puestoClima, 
    puestoClimaRef, 
    ventanaFlotanteFiltro, 
    mouseOutf, 
    ventanaFlotanteClima, 
    mouseOutfCl, 
    climaExt,
    datosCarrier
  };
