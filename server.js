// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var Guid = require('Guid');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var azure = require('azure-storage');
var port = process.env.PORT || 3000;


var tableService = azure.createTableService();
var queueService = azure.createQueueService();

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

app.use(express.static('public'));

sockets = []


function addMessageToTable(from, chatId, message){
  var entity = {
    PartitionKey: "chatroulette",
    ChatId: chatId,
    UserId: from,
    Time: new Date(),
    RowKey: Guid.raw(),
    Message: message,
  };
  tableService.insertEntity('messages', entity, function(error, result, response) {
    console.log(error)
    if (!error) {
      console.log("success")
    }
  });
}

function addMessageToQueue(from, chatId, message){
  var entity = {
    ChatId: chatId,
    UserId: from,
    Time: new Date(),
    Message: message,
  };
  console.log(JSON.stringify(entity));

  queueService.createMessage('messagesqueue', JSON.stringify(entity), function(error) {
    console.log(error)
    if (!error) {
      console.log("success")
    }
  });
}

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
      addMessageToTable(socket.username, socket.chatId, data);
      addMessageToQueue(socket.username, socket.chatId, data);
    }
  });

  function printConnections() {
    sockets.forEach(socket => {
      if (socket.partner) {
        console.log(socket.username + " is talking to " + socket.partner.username)
      }
      else {
        if (!socket.chatId) {
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

    var waitingSocket = sockets.find(element => {
      return !element.chatId
    });
    if (waitingSocket) {
      chatId = Guid.raw();
      waitingSocket.partner = socket;
      socket.partner = waitingSocket;
      socket.chatId = chatId;
      socket.partner.chatId = chatId;
      console.log("chatId", chatId);
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
