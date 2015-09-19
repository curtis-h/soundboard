var express = require('express');
var app     = express();

app.use(express.static(__dirname + '/public'));

var server = app.listen(8002, function() {
    var host = server.address().address;
    var port = server.address().port;
    
    console.log('Dnd Soundboard listening on http://%s:%s', host, port);
})