/**
 * 
 */

function limpiaRegistrosUrl(req, res)
{
	console.log( '->> limpieza.limpiaRegistrosUrl IPorigen:'+req.connection.remoteAddress );
	limpiaRegistros();
	res.send({"E":0});
}

function limpiaRegistros()
{
	// Procesamos los registros de gtfs y posicionamiento para eliminar aquellos muy antiguos
	//GTFS realtime, hay un objeto que contiene directmente un array de objetos (cada vehiculo)
	var antiguedad = 1800;	// si el dato tiene más de 30min de antigüedad, se elimina
	var hoy = new Date();
	console.log( 'limpieza.limpiaRegistros INI ' + hoy.toString() );
	
	var hoy = new Date();
	var hoys = Math.ceil(hoy.valueOf() / 1000); // devuelve nº de milisegundos desde 1 ene 1970. Queremos nº de segundos
	for( var i=0; i < global.entidadesAjson.length; i++ )
	{
		var ho = global.entidadesAjson[i].horaoperacion;
		var hos = Math.ceil(ho.valueOf() / 1000); // devuelve nº de milisegundos desde 1 ene 1970. Queremos nº de segundos
		var tiempo = hoys - hos; // diferencia de tiempo entre la fecha actual y la de la operación en segundos
		if( tiempo > antiguedad )
		{
			// si el dato tiene más de antigüedad, se elimina
			global.entidadesAjson.splice( i, 1 );		
		}
	}
	
	//posiciones, hay un elemento por cada consorcio, dentro de cada consorcio un array de registros (uno por cada tpc)
	var consorcios = ["1","2","3","4","5","6","7","8","9"];
	for( var consorcio of consorcios )
	{
		for( var i = 0; i < global.posiciones[consorcio].length; i++ )
		{
			var ho = global.posiciones[consorcio][i].horaoperacion;
			var hos = Math.ceil(ho.valueOf() / 1000); // devuelve nº de milisegundos desde 1 ene 1970. Queremos nº de segundos
			var tiempo = hoys - hos; // diferencia de tiempo entre la fecha actual y la de la operación en segundos
			if( tiempo > antiguedad )
			{
				// si el dato tiene más de antigüedad, se elimina
				global.posiciones[consorcio].splice( i, 1 );		
			}
		}	
	}
	hoy = new Date();
	console.log( 'limpieza.limpiaRegistros FIN ' +hoy.toString() );
	return true;
}

exports.limpiaRegistros = limpiaRegistros;
exports.limpiaRegistrosUrl = limpiaRegistrosUrl;