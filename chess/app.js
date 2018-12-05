var express = require('express');
var app = express();
app.use(express.static('public'));
var http = require('http').Server(app);
var port = process.env.PORT || 3000;

var io = require('socket.io')(http);

//app.get('/', function(req, res) {
//    res.sendFile(_dirname + '/public/default.html');
//});

http.listen(port, function() {
    console.log('listening to requests on port: ' + port);
});

// initializes empty array and counter for indexing
let games = [];
let counter = 0;

io.on('connection', function(socket) {
    console.log('new connection');
    socket.emit("list_of_games", games);

    // takes move from user and sends it back to all connected sockets 
    socket.on('move_to_server', function(msg) {
        io.in(socket.room).emit('move_to_client',msg);
        socket.emit("winner");
    });

    // updates position stored for each game
    socket.on('board_to_server', function(data) {
        games[socket.room].position = data.position;
    });

    // processes message sent to server
    socket.on("msg_to_server", function(data) {
        io.in(socket.room).emit("msg_to_client",data);
    });

    // creates new game and puts it into the array of games
    socket.on("newgame_created", function(data){
        console.log("new room created: " + data.player1 + " vs. " + data.player2);
        socket.leave(socket.room);
        counter++;
        socket.room = counter;
        games[socket.room] = {player1: data.player1, player2: data.player2, position: 'start'};
        socket.join(socket.room);
        io.sockets.emit("game_created", {name: socket.room, player1: data.player1, player2: data.player2}); 
        socket.emit("set_board", {position: 'start'});
    }); 

    // handles switching rooms on the server side
    socket.on("switchroom_server", function(data) {
        socket.leave(socket.room);
        socket.room = data.target;
        socket.join(socket.room);
        console.log("new user joined: " + data.user);
        let info = games[socket.room];
        if (info != null) {
            if ((info.player1 != "") || (info.player1 != null) || (info.player2 == "") || (info.player2 == null)) {
                if (info.player1 != info.player2) {
                    if ((info.player1 == "") || (info.player1 == null)) {
                        info.player1 = data.user;
                    } else if ((info.player2 == "") || (info.player2 == null)) {
                        info.player2 = data.user;
                    }
                }
            }
            io.sockets.emit("rooms_switched", {name: socket.room, player1: info.player1, player2: info.player2}); 
            socket.emit("set_board", {position: info.position});   
        }
    });
});
