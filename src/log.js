function printConnectionsToConsole(sockets) {
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


module.exports = {
    printConnectionsToConsole: printConnectionsToConsole
}
