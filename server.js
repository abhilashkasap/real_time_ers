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
app.post('/create_trip',function(req,res){
   console.log('here');
    var username = req.session.auth.username;
    var vehicle_no = req.body.vehicle_no;
    var trip_date = req.body.trip_date;
    var trip_time = req.body.trip_time;
    var src_lat=   req.body.src_lat;
    var src_long = req.body.src_long;
    pool.query('insert into trip_detail (trip_user,trip_date,trip_time,src_lat,src_long,trip_vehicle_no) values ($1,$2,$3,$4,$5,$6)',[username,trip_date,trip_time,src_lat,src_long,vehicle_no],function(err,result){
       if(err)
           {
               
               res.status(500).send(err.toString());
           }
        else
            {
                
                res.send('done!');
            }
    });
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



var port = process.env.PORT || 8082;
http.listen(port, function() {
    console.log('listening on *:8082');
});