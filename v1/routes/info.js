/**
 * 
 */

var version = "1.0";


function muestraVersiones(req, res){
	var muestra={"E":0};
	res.send( muestra );
}

function monitoriza (req, res){
	res.render('index');
}




exports.version = version;
exports.muestraVersiones = muestraVersiones;
exports.monitoriza = monitoriza;