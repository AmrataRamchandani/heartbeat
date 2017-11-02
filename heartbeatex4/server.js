var app = require('express')();
var session = require('express-session');
var http = require('http').Server(app);
//var io = require('socket.io')(http);
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'uitisawesome',
  resave: true,
  saveUninitialized: true
}));

app.get('/admin', function (req, res) {
res.sendFile(__dirname + '/admin.html');
});

app.get('/connectedsocketids', function(req, res) {
res.send(connectedSockets);
})

app.get('/',function(req,res){
	// Check if roomid is set in the session.
	// If it is, we will redirect to the attempt/roomid page.
	if(req.session.roomid) {
	    res.redirect('/attempt/'+req.session.roomid);
	}
	else {
	   res.sendFile(__dirname + '/attempt.html');
	}
});

app.post('/attempt', function (req, res) {
  var roomid=req.body.username+req.body.quizid;
  req.session.quizid = req.body.quizid;
	req.session.username = req.body.username;
  req.session.roomid=roomid;
  res.redirect('/attempt/'+roomid);
  res.end();
});

app.get('/attempt/:roomid', function(req,res){

  if(req.session.roomid) {
  res.write('<h1>Welcome ' + req.session.username+' !</h1>' );
  res.write('<h2>You have choosed to attempt quiz : ' + req.session.quizid + '</h2>');
  res.write('<a href="/finish">Finish Attempt</a>');
  res.end();
  }else{
    res.write('<h1>Please Login first.</h1>');
    res.write('<a href="/">Login</a>');
    res.end();
  }

});

app.get('/finish',function(req,res){

	// if the user logs out, destroy all of their individual session
	// information
	req.session.destroy(function(err) {
		if(err) {
			console.log(err);
		} else {
			res.redirect('/');
		}
	});

});


// var connectedSockets =[];
// io.on('connection', function(socket){
//   console.log(socket.id+' Socket id connected');
//   connectedSockets.push(socket.id);
//
//   socket.on('disconnect', function(){
//     console.log(socket.id+' Socket id disconnected');
//     connectedSockets.splice(connectedSockets.indexOf(socket.id), 1);
//   });
//
//   // socket.on('to server', function(msg){
// 	// 	 io.emit('to client', msg);
//   // });
//
//   socket.on('to server quizid', function(quizid){
//   //   io.emit('to client', msg);
//   });
//
//   socket.on('to server username', function(username){
//   //   io.emit('to client', msg);
//   });
//
// });


http.listen(3000, function(){
  console.log('listening on *:3000');
});
