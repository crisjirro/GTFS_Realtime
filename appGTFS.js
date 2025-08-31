/**
 * Module dependencies.
 */
var express 			= require('express')
	, compression 		= require('compression')
	, infoSocket		= require('./v1/modulos/infoSocket')
	, infoGTFS			= require('./v1/modulos/infoGTFS')
	, gtfsAdmin			= require('./v1/modulos/gtfsAdmin')
	, vehicleposition 	= require('./v1/routes/vehicleposition')
	, limpieza			= require('./v1/routes/limpieza')	
	, config			= require('./config/config.json')	
;

/**
 * Creación servidor web
 */
const host = config.server;

var app = express();
app.use(compression());

// Rutas para el servidor http
app.get ('/v1/gtfsRealtime', vehicleposition.gtfsrealtime );
app.get ('/v1/posiciones', vehicleposition.realTimeCtagr );		//Eliminar esto de tu proyecto, esto es para nuestra web, para no ser tan estrictos como el GTFS
app.get ('/v1/limpiaRegistros', limpieza.limpiaRegistrosUrl );

// Para capturar resto de urls y contestar con un error formateado
app.use(function(req, res, next) {
    res.status(404);
    res.send({"error":"Error en url"})
});
// Escuchamos las peticiones en el puerto indicado
app.listen(config.porthttp, host, () => {
    console.log('GTFS Server is running on port '+config.porthttp);
});

// iniciamos la escucha de mensajes en el websocket
function iniciarEscucha()
{
	global.consorcios = ["1","2","3","4","5","6","7","8","9"];
	infoGTFS.tratamientoFicheros();
	// para un único consorcio infoGTFS.tratamientoFicheros("3"); 
	infoSocket.inicioEscucha();
}

// Actualizamos la información del GTFS estático. 
// Pensado para un reinicio del sistema cada día y así tomar actualizaciones del GTFS
gtfsAdmin.actualizaGTFS()
.then( function() {
	console.log("GTFS actualizado");
	iniciarEscucha();
})
.catch( function(){
	console.log("No se ha podido actualizar la información GTFS ");
	iniciarEscucha();
})
