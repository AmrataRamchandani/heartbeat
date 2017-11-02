var express = require('express');
var app=express();
var session = require('express-session');
var http = require('http').Server(app);
var io = require('socket.io')(http);
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


app.get('/username', function(req, res) {
res.send(req.session.username);
})


app.get('/',function(req,res){
	// Check if roomid is set in the session.
	// If it is, we will redirect to the attempt/roomid page.
	if(req.session.username) {
	    res.redirect('/home');
	}
	else {
	   res.sendFile(__dirname + '/login.html');
	}
});

app.post('/login', function (req, res) {
  // var roomid=req.body.username+req.body.quizid;
  // req.session.quizid = req.body.quizid;
	req.session.username = req.body.username;
  res.redirect('/home');
//  res.sendFile(__dirname + '/a.html');


  res.end();
});

app.get('/home', function (req, res) {
  if(req.session.username) {
      res.write('<h1>Welcome ' + req.session.username+' !</h1>' )
      var quiz1roomidlink=("/attempt/"+req.session.username+'1').split(' ').join('');
      var quiz2roomidlink=("/attempt/"+req.session.username+'2').split(' ').join('');;
      var quiz3roomidlink=("/attempt/"+req.session.username+'3').split(' ').join('');;

      res.write('<h3><a href='+quiz1roomidlink+' >Quiz 1</a></h3>');
      res.write('<h3><a href='+quiz2roomidlink+' >Quiz 2</a></h3>');
      res.write('<h3><a href='+quiz3roomidlink+' >Quiz 3</a></h3>');
      res.write('<a href="/logout">Logout</a>');
      res.end();
  }else{
    res.write('<h1>Please Login first.</h1>');
    res.write('<a href="/">Login</a>');
    res.end();
  }
});


// app.get('/attemptquiz', function(req,res){
//   if(req.session.username) {
//     res.sendFile(__dirname + '/attempt.html');
// }else{
//   res.write('<h1>Please Login first.</h1>');
//   res.write('<a href="/">Login</a>');
//   res.end();
// }

// app.post('/attempt', function(req,res){
//   req.session.quizid = req.body.quizid;
//   var roomid=req.session.username+req.body.quizid;
//   req.session.roomid=roomid;
//   res.redirect('/attempt/'+roomid);
// });


  // });
app.get('/attempt/:roomid', function(req,res){
res.sendFile(__dirname + '/attempt.html');

  // if(req.session.roomid) {
//  res.write('<h1>Welcome ' + req.session.username+' !</h1>' );
//  res.write('<h2>You have choosed to attempt quiz : ' + req.session.quizid + '</h2>');
//res.redirect('/attempt/'+roomid);
//  res.write('<a href="/finish">Finish Attempt</a>');
//  res.end();
  // }else{
  //   res.write('<h1>Please Login first.</h1>');
  //   res.write('<a href="/">Login</a>');
  //   res.end();
  // }

});

app.get('/finish',function(req,res){
  res.redirect('/home');
});


app.get('/logout',function(req,res){
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

var connectedSockets =[];
io.on('connection', function(socket){
  console.log(socket.id+' Socket id connected');

  socket.on('attempt', function(data){
    // socket.username=data.username;
  //   socket.quizid=data.quizid;
  //   console.log(data);
  var socketobject = {username:data.username,quizid:data.quizid,socketid:socket.id};
  connectedSockets.push(socketobject);
    });


//  connectedSockets.push(socket.id);

  socket.on('disconnect', function(){
    console.log(socket.id+' Socket id disconnected');
    deletedSockets.push(socket.id);
  //  connectedSockets.splice(connectedSockets.indexOf(socket.id), 1);
  // find the index of the object having socket id which left.
  var index = connectedSockets.findIndex(function(o){
      return o.id === socket.id;
  });
  // Remove the socket object from the connected array.
  if (index !== -1) connectedSockets.splice(index, 1);
  });

});
var deletedSockets =[];
// Send deletedsockets array to the admin page.
app.get('/deletedsocketids', function(req, res) {
res.send(deletedSockets);
})
http.listen(3000, function(){
  console.log('listening on *:3000');
});
