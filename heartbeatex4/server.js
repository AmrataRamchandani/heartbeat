var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/client.html');
});

app.get('/admin', function(req, res){
  res.sendFile(__dirname + '/admin.html');

});


io.on('connection', function(socket){
//  console.log('a user connected');
//  console.log(socket.id);
//  var socketid = socket.id;
 io.emit('to admin online', socket.id,' Online');

  socket.on('disconnect', function(){
  //  console.log('user disconnected');
//    console.log(socket.id+' Socket id disconnected');
    io.emit('to admin offline', socket.id,'Offline');
  });

  socket.on('to server', function(msg){
//    console.log('message from: '+socket.id+'->' + msg);
		 io.emit('to client', msg);
  });

});



http.listen(3000, function(){
//  console.log('listening on *:3000');

});
