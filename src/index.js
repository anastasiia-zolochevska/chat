// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

app.use(express.static('public'));

sockets = []

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
    }
  });

  function printConnections() {
    sockets.forEach(socket => {
      if (socket.partner) {
        console.log(socket.username + " is talking to " + socket.partner.username)
      }
      else {
        if (socket.waiting) {
          console.log(socket.username + " is waiting")
        }
        else {
          console.log(socket.username + " is left alone in chat")
        }
      }
    })
    console.log("_____________________________________")
  }

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;

    socket.waiting = true;
    var waitingSocket = sockets.find(element => {
      return element.waiting
    });
    if (waitingSocket) {
      waitingSocket.partner = socket;
      socket.partner = waitingSocket;
      socket.waiting = false;
      socket.partner.waiting = false;
    }
    sockets.push(socket);

    printConnections();

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
