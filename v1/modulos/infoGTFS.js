var fs 			= require('fs');
var parse		= require('csv-parse');
let csvToJson 	= require('convert-csv-to-json');

var dataurl = './data/gtfs/';

var horaServicio = [];
var serviciosXdiasemana = []; // Será una array de 7 eltos, donde cada elto contendrá los servicios de un día de la semana (empezando en lunes y terminando en domingo)
								// subelto 0 al 5 contendrá elk desglose de service_id, el 6 será start_date y el 7 end_date
var tripsjson = [];

function tratamientoFicheros(consorcio)
{
	console.log("infoGTFS.tratamientoFicheros -----------------------");
	horaServicio = obtenerHoraServicios(consorcio);
	serviciosXdiasemana = obtenerServiciosXdiasemana( consorcio );
	tripsjson = obtenerTrips(consorcio);
}

function obtenerHoraServicios(consorcio)
{
	var timescompleto = csvToJson.fieldDelimiter(',').getJsonFromCsv(dataurl + "stop_times.txt");
	var times = [];
	var trip_id = "";
	for(let i=0; i<timescompleto.length;i++){
		if (consorcio != undefined)
		{
			if(timescompleto[i].stop_sequence==1 && timescompleto[i].trip_id.substr(0,1) == consorcio)
			{
				times.push(timescompleto[i]);
				trip_id = timescompleto[i].trip_id;
			}
			if( timescompleto[i].stop_sequence>=1 && trip_id == timescompleto[i].trip_id )
				times[times.length -1].end_time = timescompleto[i].arrival_time;
			
		}
		else
		{
			if(timescompleto[i].stop_sequence==1)
			{
				times.push(timescompleto[i]);
				trip_id = timescompleto[i].trip_id;
			}
			if( timescompleto[i].stop_sequence>=1 && trip_id == timescompleto[i].trip_id )
				times[times.length -1].end_time = timescompleto[i].arrival_time;
		}
	}
	return times;
}

function obtenerServiciosXdiasemana( consorcio )
{
	//Consulta fichero calendar para extraer el service_id con el consorcio, línea  y día de la semana
	var calendarjson = csvToJson.fieldDelimiter(',').getJsonFromCsv(dataurl + "calendar.txt");
	
	// serviciosxdiasemana tendrá 7 elementos; empezando en lunes y terminando en domingo
	var serviciosxdiasemana = [[],[],[],[],[],[],[]];
	var indice = 0;
	for(let i=0; i<calendarjson.length;i++)
	{
		var dato = {};
		if (consorcio != undefined)
		{
			if( calendarjson[i].service_id.substr(0,1) == consorcio)
				dato = calendarjson[i];
		}
		else
			dato = calendarjson[i];
		
		if( Object.keys(dato).length > 0 )
		{
			var adatoAux = dato.service_id.split("_");
			var adato = {};
			adato.service_id = dato.service_id;
			adato.consorcio = adatoAux[0];
			adato.linea = adatoAux[4];
			adato.start_date = dato.start_date; 
			adato.end_date =  dato.end_date ;
					
	 		if (calendarjson[i].monday == 1)
			 	serviciosxdiasemana[0].push(adato);
			if (calendarjson[i].tuesday == 1)
				serviciosxdiasemana[1].push(adato);
			if (calendarjson[i].wednesday == 1)
				serviciosxdiasemana[2].push(adato);
			if (calendarjson[i].thursday == 1)
				serviciosxdiasemana[3].push(adato);
			if (calendarjson[i].friday == 1)
				serviciosxdiasemana[4].push(adato);
			if (calendarjson[i].saturday == 1)
				serviciosxdiasemana[5].push(adato);
			if (calendarjson[i].sunday == 1)
				serviciosxdiasemana[6].push(adato);
		}
	}
	
	return serviciosxdiasemana;
}

function obtenerTrips( consorcio )
{
	//Consulta fichero trips para extraer todos los servicios relacionados con la línea y el sentido
  	var tripsjs = csvToJson.fieldDelimiter(',').getJsonFromCsv(dataurl + "trips.txt");
  	var trips = [];
  	for(let i=0; i<tripsjs.length;i++)
	{
		var dato = tripsjs[i];
		if (consorcio != undefined)
		{
			if( dato.route_id.substr(0,1) == consorcio)
				trips.push( dato );
		}
		else
			trips.push( dato );
    }
	return trips
}

function obtenerTripId(parametros)
{	
	//console.log("infoGTFS.obtenerTripId -----------------------");
	var servicio = serviciosXdiasemana[ parametros.diasemana-1 ];
	
	var servicioselec = [];
	var fecha = new Date();
    var mes ="0" + (fecha.getMonth()+1);
	var dia ="0" + fecha.getDate();
	var hoy = fecha.getFullYear() + mes.substring(mes.length-2) + dia.substring(dia.length-2);
	//Me traigo la plantilla de servicio para el consorcio, línea y día de la semana y la fecha actual entre fecha inicio y fin
	for(let i=0; i<servicio.length;i++){
		if(servicio[i].consorcio == parametros.consorcio && servicio[i].linea == parametros.linea && hoy>=servicio[i].start_date && hoy<servicio[i].end_date)
			servicioselec.push(servicio[i].service_id);
	}
	
	//Consulta fichero trips para extraer todos los servicios relacionados con la línea y el sentido
  	var trip = [];
  	for(let i=0; i<tripsjson.length;i++){
		if (tripsjson[i].service_id == servicioselec[0] && tripsjson[i].direction_id==parametros.sentido)
  	  		trip.push(tripsjson[i].trip_id);
    }
	
   	// horaServicio es el fichero grande de las paradas con solo las de secuencia 1
	var trip_id = [];
	for(let i=0;i<horaServicio.length;i++)
	{
		for(let j=0;j<trip.length;j++)
	    {
			if( horaServicio[i].trip_id==trip[j] && parametros.hora>= horaServicio[i].arrival_time &&  parametros.hora <= horaServicio[i].end_time )
				trip_id.push(horaServicio[i].trip_id);
		}
	}
  return trip_id[0];

  }
  /*
  var parametros = {consorcio:3, linea:1047, diasemana:2, sentido:0, hora:"23:00:00" }
  var trip_id;
  var ficherotratado = ficherogrande("3");
  trip_id = tratatamientoficheros(parametros,ficherotratado);
  */
 exports.tratamientoFicheros = tratamientoFicheros;
 exports.obtenerTripId = obtenerTripId;