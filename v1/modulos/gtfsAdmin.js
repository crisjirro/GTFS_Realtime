/**
 * drodriguez
 */
var fs = require('fs'); 
var path = require('path');
var config = require('../../config/config.json');

// Se carque al principio y reiniciar todos los días el servicio.
// debe llamar al api.ctan.es para descargar el gtfs
// descomprimir archivo resultante
// y dejarlo en carpeta local donde acceder

function actualizaGTFS()
{
	console.log("gtfsAdmin.actualizaGTFS -----------------------");
	return new Promise( function( resolve, reject){
		// debe llamar al api.ctan.es para descargar el gtfs
		descargaGTFS()
		.then( function() {
			// una vez descargado, hay que descomprimir
			descomprime()
			.then( function(){
				console.log(" - Terminado");
				resolve();
			})
			.catch( function(){
				// el tratamiento del error (mostrarlo) ya se ha hecho internamente
				reject();	
			});
		}) 
		.catch( function() {
			// el tratamiento del error (mostrarlo) ya se ha hecho internamente
			reject();
		});
	});
	
}

function descargaGTFS()
{
	console.log(" - gtfsAdmin.descargaGTFS");
	return new Promise( function( resolve, reject){
		try{
			const axios = require('axios');
		
			var url = config.gtfsUrl;
			axios( url ,{metod:'get', responseType: 'stream'})
			.then(function (response)
			{
				try{
					response.data
					.pipe(fs.createWriteStream("./data/GTFS.zip"))
					.on('finish', () => {
					      console.log("   gtfsAdmin.descargaGTFS. Descargado ");
						  resolve();
					    })
					.on('error', (error) => {
					      console.error("   gtfsAdmin.descargaGTFS. Error datos ", error);
						  reject();
					});
					
				}
				catch( error ){
					console.error("   gtfsAdmin.descargaGTFS. Error escribiendo ", error);
					reject();
				}
			})
			.catch( function( error ){
				console.error("   gtfsAdmin.descargaGTFS. Error descargando ", error);
				reject();
			});	
		}
		catch( error )
		{
			console.error("   gtfsAdmin.descargaGTFS. ", error);
			reject();
		}
	});	
}

function descomprime()
{
	console.log(" - gtfsAdmin.descomprime");
	return new Promise( function( resolve, reject){
		var StreamZip = require('node-stream-zip');
	
		var zip = new StreamZip({
		  file: './data/GTFS.zip'
		, storeEntries: true
		});
	
		zip.on('error', function (err) { 
			console.error(' gtfsAdmin.descomprime ', err);
			reject(); 
		});
	
		zip.on('ready', function () {
		  console.log('   descomprimidos ' + zip.entriesCount + " archivos");
		  //console.log(zip.entries());
		  resolve();
		});
	
		zip.on('entry', function (entry) {
		  var pathname = path.resolve('./data/gtfs', entry.name);
		  if (/\.\./.test(path.relative('./data/gtfs', pathname))) {
		      console.warn("[zip warn]: ignoring maliciously crafted paths in zip file:", entry.name);
		      return;
		  }
	
		  if ('/' === entry.name[entry.name.length - 1]) {
		    //console.log('[DIR]', entry.name);
		    return;
		  }
	
		  //console.log('[FILE]', entry.name);
		  zip.stream(entry.name, function (err, stream) {
		    if (err) { 
				console.error(' gtfsAdmin.descomprime :', err.toString()); 
				return; 
			}
	
		    stream.on('error', function (err) { console.error('gtfsAdmin.descomprime ', err); return; });
	
		    fs.mkdir(
		      path.dirname(pathname),
		      { recursive: true },
		      function (err) {
		        stream.pipe(fs.createWriteStream(pathname));
		      }
		    );
		  });
		});
	});
}

//descargaGTFS();
//descomprime();
//actualizaGTFS();

exports.actualizaGTFS = actualizaGTFS;