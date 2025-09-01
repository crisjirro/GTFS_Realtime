/**
  * Conexión con MongoDB
  */
 

var MongoClient = require('mongodb').MongoClient;
 
class Mongodb{
	constructor()
	{
		this.version = "1.0";
		//this.url = 'mongodb://192.168.54.118:27017';
		this.url = 'mongodb://localhost:27017';
		this.cliente = null;
		
	}
	
	insertarOperacion = function(arrayDatos,indice)
	{
		var cliente = this.cliente;
		return new Promise( function( resolve, reject)
		{
			cliente.collection('gtfs').insertOne(arrayDatos)
			.then(function(){
				//console.log("Mongodb insertado");
				resolve("Mongodb insertado"+indice);
			})
			.catch(function(error){
				reject("Mongodb error al insertar " + indice);
			});
		});
	}
	
	consulta = function(condiciones)
	{
		var obj = this.cliente;
		return new Promise( function( resolve, reject){
			try
			{
				obj.collection('gtfs').find(condiciones).toArray()
				.then( function( busqueda ){
					resolve(busqueda);
				})
				.catch( function(){
					reject( {"E": "Fichero no encontrado" } );
				});	
			}catch( err )
			{
				console.log(err.stack);
				reject(err);
			}		
		});
	}

	static creaConexion = function()
	{
		return new Promise( function( resolve, reject)
		{
			try
			{
				var mongoObj = new Mongodb();
				MongoClient.connect(mongoObj.url)
				.then( function(client){
					console.log("Mongodb conectado");
					mongoObj.cliente = client.db('pruebas');
					resolve(mongoObj);					
				})
				.catch( function( err ){
					console.log("Mongodb error al conectar " + err);
					reject();
				});
			}catch( err )
			{
				console.log(err.stack);
				reject(err);
			}
		})
	}
	
}

exports.Mongodb = Mongodb;
	