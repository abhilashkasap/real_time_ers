var express = require('express');
var app = express();
var morgan = require('morgan');
var path = require('path');
var http = require('http').Server(app);
var Pool = require('pg').Pool;
var bodyParser = require('body-parser');
var session = require('express-session');
var io = require('socket.io')(http);

var config = {
    user: 'postgres',
    database: 'real_time_ERS',
    host: 'localhost',
    port: '5432',
    password: 'abhilash'
};
var pool = new Pool(config);

app.use(morgan('short'));
app.use(bodyParser.json());
app.use(session({
    secret: 'real_time_ers',
    cookie: { maxAge: 1000 * 60 * 60 }

}));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname,'html','login.html'));
});

app.get('/html/:filename',function(req,res){
    res.sendFile(path.join(__dirname,'html',req.params.filename));
});
app.get('/css/:filename',function(req,res){
    res.sendFile(path.join(__dirname,'css',req.params.filename));
});
app.get('/script/:filename',function(req,res){
    res.sendFile(path.join(__dirname,'script',req.params.filename));
});
app.get('/res/:filename',function(req,res){
    res.sendFile(path.join(__dirname,'res',req.params.filename));
});

app.post('/createuser', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    console.log(username);
    pool.query('insert into userdetail (username,password) values ($1,$2)', [username, password], function(err, result) {
        if (err) {
            res.status(500).send(err.toString());
        } else {
            res.send('user created' + username);
        }

    });

});
app.post('/clogin',function(req,res){
   var username=req.body.username;
    var password= req.body.password;
    console.log(username);
   // console.log(password);
    pool.query('select * from user_info where username = $1',[username],function(err,result){
       if(err)
           {
               res.status(500).send(err.toString());
           }
        else
            {
                if(result.rows.length===1)
                    {
                if(result.rows[0].password===password)
                    {
                        req.session.auth= { username: result.rows[0].username};
                        console.log('logged in');
                        //res.send('credentials correct');
                        res.redirect('/html/index.html');
                    }
                else
                    {
                        
                        res.status(403).send('  Password not correct !!');
                    }
            }
                else{
                    res.send('Username Incorrect !!!');
                }
            }
    });
    
});
/*app.post('/ulogin', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    console.log(username);
    pool.query('select * from userdetail where username = $1', [username], function(err, result) {
        if (err) {
            res.status(500).send(err.toString());
        } else {
            if (result.rows.length === 0) {
                res.status(403).send('username/password is invalid');
            } else {
                var passcode = result.rows[0].password;
                if (passcode === password) {
                    req.session.auth = { username: result.rows[0].username };
                    res.send('credentials correct');
                } else {
                    res.status(403).send('username/password is invalid');
                }
            }
        }
    });
});*/
app.get('/check-login', function(req, res) {
    if (req.session && req.session.auth && req.session.auth.username) {
        pool.query('select * from user_info where username = $1', [req.session.auth.username], function(err, result) {
            if (err) {
                res.status(500).send(err.toString());

            } else {
                res.send(result.rows[0].username);
            }

        });
    } else {
        res.status(400).send('You are not logged in');
    }
});
app.get('/logout', function(req, res) {
    delete req.session.auth;
    res.send('<http><head><meta http-equiv="Refresh" content="1; /"><h1>Logged Out</h1></head>');
});
io.on('connection', function(socket) {
    socket.on('chat message', function(msg) {
        console.log(msg);
        socket.broadcast.emit('chat message', msg);
    });
});


app.get('/lgtemp/:username', function(req, res) {
    var template = `<html>
                     <head>
                     <title>
                        New Temp</title>
                        </head>
                        <body >
                        <h1>` + req.params.username + `</h1>
                         is logged in with socket
                         <br>
                          <input type="submit" value="I'm in Danger !!!" id="danger"><br>
                          <span id="mg">  </span>
                          <div id="sound"></div>
                         <script src="https://cdn.socket.io/socket.io-1.2.0.js"></script>
    <script>
        var socket = io();
        
        socket.on('chat message', function(msg){
        //document.getElementById('mg').innerHTML=msg;
        playSound();
      });
      var submit =document.getElementById('danger');
      submit.onclick=function(){
          socket.emit('chat message', ' Plzz save ${req.params.username} is in danger');
      }
      function playSound() {
       // document.getElementById("sound").innerHTML = '<audio autoplay="autoplay"><source src="' + 'audio' + '.mp3" type="audio/mpeg" /><embed hidden="true" autostart="true" loop="false" src="' + 'audio' + '.mp3" /></audio>';
    
var audio = new Audio('/audio.mp3');
audio.play();

}

    </script>
                         </body>
                         </html>`;
    res.send(template);
})

var port = process.env.PORT || 8082;
http.listen(port, function() {
    console.log('listening on *:8082');
});