var express = require('express');
var app     = express();
var server  = app.listen(8002, function() {
    var host = server.address().address;
    var port = server.address().port;
    
    console.log('Dnd Soundboard listening on http://%s:%s', host, port);
});

var io      = require('socket.io')(server);

io.on('connection', function(socket) {
    socket.on('save', function(data) {
        console.log(data);
      
        io.emit('saved', data);
    });
});


app.use(express.static(__dirname + '/public'));