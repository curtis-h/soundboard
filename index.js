var express = require('express');
var app     = express();
var server  = app.listen(8002, function() {
    var host = server.address().address;
    var port = server.address().port;
    
    console.log('Dnd Soundboard listening on http://%s:%s', host, port);
});

var db;
var MongoClient = require('mongodb').MongoClient;
var ObjectId    = require('mongodb').ObjectID;

MongoClient.connect('mongodb://localhost:27017/soundboard', function(err, database) {
    if(!err)
        console.log("Connected correctly to server.");
    
    db = database;
});



var io      = require('socket.io')(server);
io.on('connection', function(socket) {
    
    var cats = [];
    var find = db.collection('categories').find();
    
    find.each(function(err, doc) {
        if(doc != null) {
           console.dir(doc);
           cats.push(doc);
        }
        else if(err == null) {
            console.log(cats);
            socket.emit('categories', cats);
        }
     });
    
    
    socket.on('save', function(data) {
        console.log('save');
        console.log(data);
        
        if(!data._id) {
            data._id = ObjectId().toString();
            
            db.collection('categories').insertOne(data, function(err, result) {
                console.log('result', err);
                if(!err) {
                    console.log('saved cat', result.ops[0]);
                    io.emit('saved', result.ops[0]);
                }
            });
        }
        else {
            var id = {'_id' : data._id};
            delete(data._id);
            
            console.log('delete id');
            console.log(data);
            
            db.collection('categories').updateOne(id,
                {$set: data},
                function(err, results) {
                    console.log(results);
                }
            );
            
        }
    });
});


app.use(express.static(__dirname + '/public'));