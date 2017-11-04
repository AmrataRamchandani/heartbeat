var express = require('express');
var app=express();
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

app.get('/admin-socketinfo', function (req, res) {
res.sendFile(__dirname + '/admin-socketinfo.html');
});

app.get('/admin-userstatus', function (req, res) {
res.sendFile(__dirname + '/admin-userstatus.html');
});

// Send connectedsockets array to the admin-socketinfo page.
var connectedSockets =[];
app.get('/connectedsocketids', function(req, res) {
res.send(connectedSockets);
})

// Send deletedsockets array to the admin-socketinfo page.
var deletedSockets =[];
app.get('/deletedsocketids', function(req, res) {
res.send(deletedSockets);
})

app.get('/',function(req,res){
res.sendFile(__dirname + '/quizlogin.html');
});


io.on('connection', function(socket){
  console.log(socket.id+' Socket id connected');

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

    var sql = "INSERT INTO socketinfo (username,quizid,roomid,socketid,socketstatus,ip,timestamp) VALUES" +
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

      var sql = "INSERT INTO socketinfo (username,quizid,roomid,socketid,socketstatus,ip,timestamp) VALUES" +
               "("+socket.username+","+socket.quizid+","+socket.roomid+","+socket.socketid+","
                  +socket.statusDisconnected+","+socket.ip+","+socket.timestampD+")";

      con.query(sql, function (err, result) {
        if (err) throw err;
        console.log('Record for Disconnected Socket ID : '+socket.socketid+' is inserted into DB');
    });
});
});


app.get('/livestatus', function(req, res) {
var sql = "select username,quizid,roomid, "+
            "count(case when socketstatus = 'Connected' then socketid end) as count_connected_socketid, "+
            "count(case when socketstatus = 'Disconnected' then socketid end) as count_disconnected_socketid, "+
            "max(case when socketstatus = 'Connected' then timestamp end) as max_connected_timestamp, "+
            "max(case when socketstatus = 'Disconnected' then timestamp end) as max_disconnected_timestamp "+
          "from socketinfo "+
          "group by username,quizid,roomid";
  con.query(sql, function (err, result,fields) {
    if (err) throw err;
  res.send(result);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
