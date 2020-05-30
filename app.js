var express		= require("express");
var bodyParser	= require("body-parser");
var app			= express();
var path		= require("path");
var mongose		= require("mongoose");


app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded


var api = require("./routes/api")

// mongose.connect('mongodb+srv://admin:admin@firstdb-boc4g.mongodb.net/test?retryWrites=true&w=majority');

app.use(bodyParser.json());

app.use('/api',api)





// app.use('/html', express.static(__dirname + '/html'));

// app.get('/', function (req, res) {
// 	res.sendFile(path.join(__dirname+'/html/index.html'));
// });

// app.get('/video/:ID', function (req, res) {
	
// 	filmStreamer.streamer(req, res);

// });




module.exports = app;