

function gtfsrealtime(req, res)
{
	console.log( '->> vehicleposition.gtfsrealtime IPorigen:'+req.connection.remoteAddress );
	// Tomamos el elemento global.entidadesAjson y generamos el GTFSRealtime como texto
	var ahora = new Date();
	var respuesta = "header {\n" +
						"gtfs_realtime_version: \"2.0\" \n" +
						"incrementality: FULL_DATASET \n" +
						"timestamp: "+ ahora.getTime() +" \n" +
						"}\n";
	for( var elto of global.entidadesAjson )
	{
		respuesta += "entity { \n" +
						"id:\""+ elto.id + "\" \n"+
						"  vehicle { \n"+
						"    trip { \n" +
						"      trip_id: \"3_"+ elto.vehicle.trip.trip_id +"\" \n"+
  						"      start_time: \""+ elto.vehicle.trip.start_time +"\" \n" +
  						"      start_date: \""+ elto.vehicle.trip.start_date +"\" \n" +
  						"      schedule_relationship: "+ elto.vehicle.trip.schedule_relationship +" \n" +
  						"      route_id: \""+ elto.vehicle.trip.route_id +" \" \n "+
  						"      direction_id: "+ elto.vehicle.trip.direction_id +"\n" +
						"    }\n"+
						"    position {\n" +
						"      latitude: "+ elto.vehicle.position.latitude +" \n" +
						"      longitude: "+ elto.vehicle.position.longitude +"\n" +
						"    }\n" +
						"    timestamp: "+ elto.vehicle.timestamp +"\n" +
						"    vehicle {\n" +
						"      id: \""+ elto.vehicle.vehicle.id +"\"\n" +
						"    }\n" +
						"    occupancy_status: "+ elto.vehicle.occupancy_status +"\n" +
						"  }\n" +
						"}\n";
	}	
	res.send(respuesta);
	console.log( '    vehicleposition.gtfsrealtime.res ' );
}

function realTimeCtagr(req, res)
{
	console.log( '->> vehicleposition.realTimeCtagr IPorigen:'+req.connection.remoteAddress );
	res.send( global.posiciones );
	console.log( '    vehicleposition.realTimeCtagr.res ' );
}

function tpcsXlineaXservicio(req, res)
{
	
}


exports.gtfsrealtime = gtfsrealtime;
exports.realTimeCtagr = realTimeCtagr;