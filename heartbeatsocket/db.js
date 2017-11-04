var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root@mysql",
  database: "trial"
});

con.connect(function(err) {
  if (err) throw err;
  con.query("SELECT * FROM heartbeat", function (err, result, fields) {
      if (err) throw err;
      console.log(result);
    });
});


con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  var sql = "INSERT INTO socketinfo (username,quizid,roomid,socketid,ip) VALUES ('Company Inc', 'Highway 37')";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("record inserted");
  });
});
