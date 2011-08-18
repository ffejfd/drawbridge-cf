var db_service = JSON.parse(process.env.VCAP_SERVICES)["mysql-5.1"][0];
//var db_service = { "credentials" : ""};
var dbhost = db_service.credentials.hostname || "localhost";
var dbname = db_service.credentials.name || "drawbridge";
var db_username = db_service.credentials.user || "root";
var db_password = db_service.credentials.password || "foobar";
var db_port = db_service.credentials.port || '3306';

exports.database =  {
	host: dbhost,
	name: dbname,
	username: db_username,
	password: db_password,
	port: db_port
};
	
