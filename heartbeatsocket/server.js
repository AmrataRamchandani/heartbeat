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
  //   console.log('Record for Connected Socket ID : '+socket.socketid+' is inserted into DB');
    });

    var liveordead = "select username,quizid,roomid,"+
                "count(case when socketstatus = 'Connected' then socketid end) as count_connected_socketid, "+
                "count(case when socketstatus = 'Disconnected' then socketid end) as count_disconnected_socketid "+
              "from socketinfo where roomid="+socket.roomid+
              "group by username,quizid,roomid";
    con.query(liveordead, function (err, result) {
        if (err) throw err;
         for(i in result){
           countC=result[i].count_connected_socketid;
           countD=result[i].count_disconnected_socketid;
         }

         if(countC > countD)
         {
           socket.livestatus="'Live'";
           socket.livetime=0;
           socket.deadtime=0;
           socket.maxdisconnecttime=0;
         var liverecordexistsql ="Select * from livetable where roomid="+socket.roomid;
         con.query(liverecordexistsql, function (err, result){
           if (err) throw err;
           if(result.length > 0 ){

             for(i in result){
               status=result[i].status;
               maxdisconnecttime=result[i].maxdisconnecttime;
              var deadtime=result[i].deadtime;
              console.log(socket.roomid+': Previous deadtime: '+humanise(deadtime));
             }

             if(status=='Dead'){
               console.log(socket.roomid+': Current Deadtime is :'+humanise(socket.timestampC-maxdisconnecttime));
                deadtime=parseInt(deadtime)+parseInt(socket.timestampC-maxdisconnecttime);
                 console.log(socket.roomid+': After cumulation,deadtime is : '+humanise(deadtime));

               var updatelivetablesql = "Update livetable set status="+socket.livestatus+",deadtime="+deadtime+
               ",minconnecttime="+socket.timestampC+" where roomid="+socket.roomid;
               con.query(updatelivetablesql, function (err, result){
                    if (err) throw err;
                });
             }

           }
           else{
             var livetablesql = "INSERT INTO livetable (roomid,status,minconnecttime,maxdisconnecttime,livetime,deadtime) VALUES" +
                        "("+socket.roomid+","+socket.livestatus+","+socket.timestampC+",0,0,0 )";
             con.query(livetablesql, function (err, result){
                  if (err) throw err;
              });
           }
         });
       }
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
        //console.log('Record for Disconnected Socket ID : '+socket.socketid+' is inserted into DB');
    });

    var liveordead = "select username,quizid,roomid,"+
                "count(case when socketstatus = 'Connected' then socketid end) as count_connected_socketid, "+
                "count(case when socketstatus = 'Disconnected' then socketid end) as count_disconnected_socketid "+
              "from socketinfo where roomid="+socket.roomid+
              "group by username,quizid,roomid";
    con.query(liveordead, function (err, result) {
        if (err) throw err;
         for(i in result){
           countC=result[i].count_connected_socketid;
           countD=result[i].count_disconnected_socketid;
         }

         if(countC == countD)
         {
           socket.livestatus="'Dead'";
           var fetchmintimesql="select minconnecttime,livetime from livetable where roomid="+socket.roomid;
           con.query(fetchmintimesql, function (err, result) {
               if (err) throw err;
                for(i in result){
                  var minconnecttime=result[i].minconnecttime;
                  var livetime=result[i].livetime;
                  console.log(socket.roomid+':Previous livetime: '+humanise(livetime));
                }
                //  here socket.timestampD is the maxdisconnecttime;

                console.log(socket.roomid+':Current livetime is :'+humanise(socket.timestampD-minconnecttime));
                    livetime=parseInt(livetime)+parseInt(socket.timestampD-minconnecttime);
                    console.log(socket.roomid+':After cumulation,livetime  is :'+humanise(livetime));

                    var updatelivetablesql = "Update livetable set status="+socket.livestatus+", maxdisconnecttime= "+
                   socket.timestampD+",livetime="+livetime+"  where roomid="+socket.roomid;

                    con.query(updatelivetablesql, function (err, result){
                         if (err) throw err;
                     });
              });
         }
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

function humanise(difference){
  var days = Math.floor(difference / (1000 * 60 * 60 * 24));
  var hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((difference % (1000 * 60)) / 1000);
  var time = days+' days, '+hours+' hrs, '+minutes+' mins, '+seconds+' secs' ;
  return time;
}

http.listen(3000, function(){
  console.log('listening on *:3000');
});
