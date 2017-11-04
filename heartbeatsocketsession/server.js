var express = require('express');
var app=express();
var session = require('express-session');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root@mysql",
  database: "trial"
});

con.connect(function(err) {
  if (err) throw err;
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'uitisawesome',
  resave: true,
  saveUninitialized: true
}));

app.get('/admin-socketinfo', function (req, res) {
res.sendFile(__dirname + '/admin-socketinfo.html');
});

app.get('/admin-userstatus', function (req, res) {
res.sendFile(__dirname + '/admin-userstatus.html');
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
	req.session.username = (req.body.username).split(' ').join('');
  res.redirect('/home');
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


app.get('/attempt/:roomid', function(req,res){
if(req.session.username) {
res.sendFile(__dirname + '/attempt.html');
}else{
    res.redirect('/home');
}
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
//Why this is not getting set here ? but getting set on client side and inside socket.on()
    //  socket.username="Amrata";
    //  console.log(socket.username);
    socket.on('attempt', function(data){
    socket.username="'"+data.username+"'";
    socket.quizid=data.quizid;
    socket.roomid="'"+data.roomid+"'";
    socket.socketid="'"+socket.id+"'";
    socket.statusConnected="'Connected'";
    socket.timestampC=socket.handshake.issued;
    socket.ip="'"+socket.request.connection.remoteAddress+"'";
    var socketobject = {username:socket.username,quizid:socket.quizid,roomid:socket.roomid,socketid:socket.id,
                        ip:socket.ip};

    connectedSockets.push(socketobject);
    var sql = "INSERT INTO socketsession (username,quizid,roomid,socketid,socketstatus,ip,timestamp) VALUES" +
              "("+socket.username+","+socket.quizid+","+socket.roomid+","+socket.socketid+","
                 +socket.statusConnected+","+socket.ip+","+socket.timestampC+")";

    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log('Record for Connected Socket ID : '+socket.socketid+' is inserted into DB');
    });

});

  socket.on('disconnect', function(){
      socket.timestampD=new Date().getTime();
      socket.statusDisconnected="'Disconnected'";
      console.log(socket.id+' Socket id disconnected');
      deletedSockets.push(socket.id);

      // find the index of the object having socket id which got disconnected.
      var index = connectedSockets.findIndex(function(o){
          return o.id === socket.id;
      });
      // Remove the disconnected socket object from the connectedSockets array.
      if (index !== -1) connectedSockets.splice(index, 1);

      var sql = "INSERT INTO socketsession (username,quizid,roomid,socketid,socketstatus,ip,timestamp) VALUES" +
               "("+socket.username+","+socket.quizid+","+socket.roomid+","+socket.socketid+","
                  +socket.statusDisconnected+","+socket.ip+","+socket.timestampD+")";

      con.query(sql, function (err, result) {
        if (err) throw err;
        console.log('Record for Disconnected Socket ID : '+socket.socketid+' is inserted into DB');
    });
});
});

// Send deletedsockets array to the admin page.
var deletedSockets =[];
app.get('/deletedsocketids', function(req, res) {
res.send(deletedSockets);
})

app.get('/livestatus', function(req, res) {
var sql = "select username,quizid,roomid, "+
            "count(case when socketstatus = 'Connected' then socketid end) as count_connected_socketid, "+
            "count(case when socketstatus = 'Disconnected' then socketid end) as count_disconnected_socketid, "+
            "max(case when socketstatus = 'Connected' then timestamp end) as max_connected_timestamp, "+
            "max(case when socketstatus = 'Disconnected' then timestamp end) as max_disconnected_timestamp "+
          "from socketsession "+
          "group by username,quizid,roomid";
  con.query(sql, function (err, result,fields) {
    if (err) throw err;
  res.send(result);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
