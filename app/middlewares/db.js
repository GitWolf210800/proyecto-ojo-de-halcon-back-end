import mysql from "mysql";
const dbConfig = {
	host :  'localhost',
	user : 'root',
	password : '',
	database : 'climaV2_0'
};

/*export const connection = mysql.createConnection(dbConfig);  //Configuracion Antigua

connection.connect((error) => {
	if (error) throw error;
	console.log("Base de datos conectada");
});*/

export let connection;

 function handleDisconnect() {
	 connection = mysql.createConnection(dbConfig);

	connection.connect((error)=>{
		if (error) {
			console.error('Error al conectar con la base de datos', error);
			setTimeout(handleDisconnect, 2000); //intentando reconectar en 2 segundos
		}
		console.log('Base de Datos Conectada');
	});
};

handleDisconnect();