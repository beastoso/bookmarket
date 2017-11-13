'use strict';

require('dotenv').config();

var http = require('http');
var express = require('express');
var routes = require('./app/routes/index.js');
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
var bodyParser = require('body-parser');
var socket = require('socket.io');

var app = express();
require('./app/config/passport')(passport);

mongoose.connect(process.env.MONGO_URI);
mongoose.Promise = global.Promise;

app.use('/controllers', express.static(process.cwd() + '/app/controllers'));
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/common', express.static(process.cwd() + '/app/common'));

app.use(session({
	secret: 'secretClementine',
	resave: false,
	saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

routes(app, passport);

var port = process.env.PORT || 8080;
var server = http.createServer(app);
app.server = server;
server.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});

var io = socket(server);

var clients = [];

io.on('connection', function (socket) {
  console.log('new websocket client connected');
  socket.userId = socket.request._query['userId'];
  var n = clients.length;
  clients.push(socket);
  
  socket.on('trade-request', function (data) {
    var message = JSON.parse(data);
    if (message.userId) {
      var response = "You have a new trade request<br/>Visit your profile page for more details";
      var json = JSON.stringify(response);
      for (var i=0; i < clients.length; i++) {
        if (message.userId == clients[i].userId) {
          clients[i].emit('news',json);
        }
      }
    }
  });
  
  socket.on('trade-accept', function (data) {
    var message = JSON.parse(data);
    if (message.userId) {
      var response = "You have a trade request accepted<br/>Visit your profile page for more details";
      var json = JSON.stringify(response);
      for (var i=0; i < clients.length; i++) {
        if (message.userId == clients[i].userId) {
          clients[i].emit('news',json);
        }
      }
    }
  });
  
  socket.on('recommendation', function (data) {
    var message = JSON.parse(data);
    if (message.userId) {
      var response = "You have a new recommendation<br/>Visit your profile page for more details";
      var json = JSON.stringify(response);
      for (var i=0; i < clients.length; i++) {
        if (!clients[i]) {
          continue;
        }
        if (message.userId == clients[i].userId) {
          clients[i].emit('news',json);
        }
      }
    }
  });
  
  socket.on('close', function() {
    clients[n] = false;
  });
});