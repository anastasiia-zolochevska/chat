var azure = require('azure-storage');
var Guid = require('Guid');
var tableService = azure.createTableService();
var queueService = azure.createQueueService();

const QueueMessageEncoder = azure.QueueMessageEncoder;
console.log(queueService.messageEncoder);
queueService.messageEncoder = new QueueMessageEncoder.TextBase64QueueMessageEncoder();
console.log(queueService.messageEncoder);


function getPredifinedMatches() {
    predifinedMatches = {}
    var query = new azure.TableQuery().top(100);

    return new Promise(function (resolve, reject) {
        tableService.queryEntities('usermappings', query, null, function (error, result, response) {
            if (!error) {
                result.entries.forEach(entry => {
                    username1 = entry.User1._;
                    username2 = entry.User2._;
                    predifinedMatches[username1] = username2;
                    predifinedMatches[username2] = username1;
                })
                resolve(predifinedMatches);
            }
            else {
                reject(error);
            }
        })
    })

}

function addMessageToTable(from, chatId, message) {
    var entity = {
        PartitionKey: "chatroulette",
        ChatId: chatId,
        UserId: from,
        Time: new Date(),
        RowKey: Guid.raw(),
        Message: message,
    };
    tableService.insertEntity('messages', entity, function (error, result, response) {
        console.log(error)
        if (!error) {
            console.log("success")
        }
    });
}
function addMessageToQueue(from, chatId, message) {
    var entity = {
        ChatId: chatId,
        UserId: from,
        Time: new Date(),
        Message: message,
    };

    queueService.createMessage('messagesqueue', JSON.stringify(entity), function (error) {
        console.log(error)
        if (!error) {
            console.log("success")
        }
    });
}
module.exports = {
    getPredifinedMatches: getPredifinedMatches,
    addMessageToQueue: addMessageToQueue,
    addMessageToTable: addMessageToTable
}