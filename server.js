// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var Guid = require('Guid');
var storage = require('./src/storage.js')
var logging = require('./src/log.js')
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;


server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

app.use(express.static('public'));

sockets = []
predifinedMatches = {};


storage.getPredifinedMatches().then((result) => {
  predifinedMatches = result;
}, (error) => {
  console.log(error);
});

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    if (socket.partner) {
      socket.partner.emit('new message', {
        username: socket.username,
        message: data
      });
      storage.addMessageToQueue(socket.username, socket.chatId, data);
    }
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;

    var waitingSocket = sockets.find(potentialMatch => {
      if (potentialMatch.chatId) { //potential match is already talking to someone
        return false
      }
      if (predifinedMatches[socket.username] || predifinedMatches[potentialMatch.username]) {
        return predifinedMatches[socket.username] == potentialMatch.username
      }
      return true;
    });

    if (waitingSocket) {
      chatId = Guid.raw();
      waitingSocket.partner = socket;
      socket.partner = waitingSocket;
      socket.chatId = chatId;
      socket.partner.chatId = chatId;
    }
    sockets.push(socket);

    logging.printConnectionsToConsole(sockets);

    addedUser = true;
    socket.emit('login', {
      partner: socket.partner ? socket.partner.username : undefined
    });

    if (socket.partner) {
      socket.partner.emit('user joined', {
        username: socket.username
      });
    }
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {

      if (socket.partner) {

        socket.partner.emit('user left', {
          username: socket.username
        });
        delete socket.partner.partner;
      }

      sockets.splice(sockets.findIndex(element => {
        return element.username == socket.username
      }), 1);
    }
  })

});
