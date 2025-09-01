var io 			= require('socket.io-client');
var infoGTFS	= require('./infoGTFS');
var config = require('../../config/config.json');

/**
 * Conexión al socket
 */
//var server = "10.52.250.105";
var server = config.socketUrl;
var port = config.socketPort;

var index=0;
function conversionCoordenadasDecimales( coordenadas )
{
	var decimal =0;
	if( coordenadas.substring(0,1) == 'N')
	{
		var n1 = parseInt(coordenadas.substring(1,3));
		var n2 = parseInt(coordenadas.substring(3,5))/60;
		var n3 = parseFloat(coordenadas.substring(5,11))/3600;
		decimal = n1+n2+n3;
	}
	else if( coordenadas.substr(0,1) == 'W' )
	{
		var n1 = parseInt(coordenadas.substring(1,4));
		var n2 = parseInt(coordenadas.substring(4,6))/60;
		var n3 = parseFloat(coordenadas.substring(6,12))/3600;
		decimal = (n1+n2+n3)*(-1);
	}
	return decimal;
}

/**
 * formatea una cadena de texto con formato yyMMddHHmm a HH:mm:00 
 * */ 
function formateaHora( fechahora )
{
	var hora = fechahora.substr(6,2)+":"+fechahora.substr(8,2)+":00";	//HH:mm:ss
	return hora;
}

/**
 * formatea una cadena de texto con formato yyMMddHHmmss a yyyy-MM-dd HH:mm:ss 
 * */ 
function formateaFechaHora( fechahora )
{
	var fh= '20'+fechahora.substr(0,2)+"-"+fechahora.substr(2,2)+"-"+fechahora.substr(4,2) + " "+fechahora.substr(6,2)+":"+fechahora.substr(8,2)+":"+fechahora.substr(10,2);
	return fh;
}


function buscaVehiculo( ajson, tpc )
{
	var index = -1;
	for(var i=0; i < ajson.length; i ++)
	{
		var elto = ajson[i];
		if( elto.vehicle.vehicle.id == tpc )
			index = i;
		else{
			// comprobamos fecha, si es anterior a 90 segundos la eliminamos
			var hoy = new Date();
			var hoys = Math.ceil(hoy.valueOf() / 1000);
			if( (hoys - elto.vehicle.timestamp) > 90 )
			{
				ajson.slice(i,1);
			}
		}
		
	}
	return index;
}

function buscaVehiculoCTAGR( jsonCompleto, idconsorcio, tpc )
{
	var index = -1;
	var ajson = jsonCompleto[idconsorcio];
	if( ajson != undefined )
	{
		for(var i=0; i < ajson.length; i ++)
		{
			var elto = ajson[i];
			if( elto.idtpc == tpc )
				index = i;
			else{
				// comprobamos fecha, si es anterior a 90 segundos la eliminamos
				var hoy = new Date();
				var hoys = Math.ceil(hoy.valueOf() / 1000);
				if( (hoys - elto.timestamp) > 90 )
				{
					ajson.slice(i,1);
				}
			}
			
		}
		jsonCompleto[idconsorcio] = ajson;
	}
	return index;
}

function procesaMensajeGTFS( valores )
{
	var parametros = {};
		
	for(var valor of valores )
	{		
		if(valor.tipotrama == '2' && valor.E<=2)
		{
			var hoy = new Date();
			var cs=new Date("20"+valor.cs.substr(0,2)+"-"+valor.cs.substr(2,2)+"-"+valor.cs.substr(4,2));
			var fechaRT="20"+ valor.cs.substr(0,6);	//yyyyMMdd
			var ho=new Date("20"+valor.hora.substr(0,2)+"-"+valor.hora.substr(2,2)+"-"+valor.hora.substr(4,2) + "T"+valor.hora.substr(6,2)+":"+valor.hora.substr(8,2)+":"+valor.hora.substr(10,2)+".000");
			var hoys = Math.ceil(hoy.valueOf() / 1000); // devuelve nº de milisegundos desde 1 ene 1970. Queremos nº de segundos
			var hos = Math.ceil(ho.valueOf() / 1000); // devuelve nº de milisegundos desde 1 ene 1970. Queremos nº de segundos
			var servicio = valor.cs.substr(6,2)+":"+valor.cs.substr(8,2)+":00";	//HH:mm:ss
			
			var tiempo = hoys - hos; // diferencia de tiempo entre la fecha actual y la de la operación en segundos
			
			if( valor.datosvalidados != undefined && tiempo<90 )
			{
				// Solo se muestra la información del GTFSRealtime, si la posición tiene menos de 90 segundos de antiguedad (recomendación GTFS Realtime)
				parametros.consorcio=valor.idconsorcio;
				parametros.linea=valor.datosvalidados.linea;
				parametros.diasemana=cs.getDay();
				parametros.sentido=(valor.sentido)-1;
				parametros.hora=servicio;	// HH:mm:ss
				//Ya tengo los parámetros, buscar el trip id con tratamientoficheros de infoGTFS
				trip_id = infoGTFS.obtenerTripId(parametros);
				
				// Hay que traducir las coordenadas que llegan como N
				var latitud = conversionCoordenadasDecimales(valor.latitud.toUpperCase());
				var longitud = conversionCoordenadasDecimales(valor.longitud.toUpperCase())
				
				//Ya tengo trip_id, genero el formato GTFS Realtime
				if(valor.tpc != 0 && fechaRT != undefined && trip_id != undefined )
				{
					var elemento = {};
					
					var vehiculo = {};
					var vehiculoid = {};
					var viaje = {};
					var posicion = {};
					
					viaje.trip_id = trip_id;
					viaje.start_time = servicio;
					viaje.start_date = fechaRT;
					viaje.schedule_relationship = 'SCHEDULED';
					viaje.route_id = parametros.consorcio+"_"+ parametros.linea;
					viaje.direction_id= parametros.sentido;
					
					posicion.latitude = latitud;
					posicion.longitude = longitud;
					
					vehiculoid.id = valor.idconsorcio +"_"+ valor.tpc;
					 
					vehiculo.trip = viaje;
					vehiculo.position = posicion;
					vehiculo.vehicle = vehiculoid;
					vehiculo.timestamp = hos;
					vehiculo.occupancy_status = 'MANY_SEATS_AVAILABLE';
					
					elemento.id = index;
					elemento.vehicle = vehiculo;
					elemento.horaoperacion = ho;

					var indice = buscaVehiculo(global.entidadesAjson, valor.idconsorcio +"_"+ valor.tpc );
					if( indice>=0 )
					{
						//console.log( " actualizado tpc "+ valor.tpc +", index " + indice);
						global.entidadesAjson[indice] = elemento;		
					}
					else
					{
						//console.log( " insertado tpc "+ valor.tpc +", tamaño "+ entidadesAjson.length);
						global.entidadesAjson.push(elemento);
					}
					index += 1;
				}
			}
		}
	}	
}

function procesaMensajeCTAGR( valores )
{
	var parametros = {};
		
	for(var valor of valores )
	{		
		if(valor.tipotrama == '2' && valor.E<=2)
		{
			var hoy = new Date();
			var ho=new Date("20"+valor.hora.substr(0,2)+"-"+valor.hora.substr(2,2)+"-"+valor.hora.substr(4,2) + "T"+valor.hora.substr(6,2)+":"+valor.hora.substr(8,2)+":"+valor.hora.substr(10,2)+".000");
			var hoys = Math.ceil(hoy.valueOf() / 1000); // devuelve nº de milisegundos desde 1 ene 1970. Queremos nº de segundos
			var hos = Math.ceil(ho.valueOf() / 1000); // devuelve nº de milisegundos desde 1 ene 1970. Queremos nº de segundos
			var tiempo = hoys - hos; // diferencia de tiempo entre la fecha actual y la de la operación en segundos
			
			var posicion = {};
			if( tiempo<90 )
			{
				// Solo se muestra la información del GTFSRealtime, si la posición tiene menos de 90 segundos de antiguedad (recomendación GTFS Realtime)
				posicion.idtpc=valor.tpc;
				posicion.route_id=valor.idconsorcio + '_' + valor.linea;
				posicion.sentido=valor.sentido;
				posicion.codigoservicio = formateaHora(valor.cs);
				posicion.horaoperacion = ho;
				posicion.timestamp = hos;
				// Hay que traducir las coordenadas que llegan como N
				var latitud = conversionCoordenadasDecimales(valor.latitud.toUpperCase());
				var longitud = conversionCoordenadasDecimales(valor.longitud.toUpperCase())
				
				// buscamos si el tpc ya está insertado en el consorcio indicado
				var indice = buscaVehiculoCTAGR( global.posiciones, valor.idconsorcio, valor.tpc );
				if( indice>=0 )
				{
					//console.log( "   actualizado tpc "+ valor.tpc +", index " + indice);
					global.posiciones[valor.idconsorcio][indice] = posicion;		
				}
				else
				{
					//console.log( "   insertado tpc "+ valor.tpc +", tamaño "+ entidadesAjson.length);
					if( global.posiciones[valor.idconsorcio] == undefined )
						global.posiciones[valor.idconsorcio] = [];
					global.posiciones[valor.idconsorcio].push(posicion);
				}
			}
			//else
				//console.log( "   Posicion no insertada. Antigua");
		}
	}	
}



function inicioEscucha()
{
	console.log("infoSocket.inicioEscucha -----------------------");
	var socket = io('https://'+server+':'+port, { 'forceNew': true , 'transports': ['websocket'], 'rejectUnauthorized' : false });
	 
	socket.on("connect",()=>{console.log("Conectado al CT a través del socket: "+socket.id);});
	socket.on("connect_error",function(E){
		console.log("Error de conexión");});

	var index=0;
	global.entidadesAjson = [];
	global.posiciones = {};
	/* PARA UN SOLO CONSORCIO 
	var elto = "RU_FIN_"+ 3;
	socket.on( elto, function( valores ){//Lee los elementos del socket y busco generar los parametros para infoGTFS
		procesaMensaje( valores );
	});
	*/
	/* PARA TODOS CONSORCIOS */
	
	for( var consorcio of global.consorcios )
	{
		var elto = "RU_FIN_"+ consorcio;
		socket.on( elto, function( valores ){//Lee los elementos del socket y busco generar los parametros para infoGTFS
			procesaMensajeGTFS( valores );
			procesaMensajeCTAGR(valores);
		});
	}
}

exports.inicioEscucha = inicioEscucha;
