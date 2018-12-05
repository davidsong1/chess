var board, game;

// initializes gameboard on start of game
window.onload = function () {
  initGame('start');
};

var socket = io();

var removeGreySquares = function() {
  $('#board .square-55d63').css('background', '');
};

var greySquare = function(square) {
  var squareEl = $('#board .square-' + square);
  
  var background = '#a9a9a9';
  if (squareEl.hasClass('black-3c85d') === true) {
    background = '#696969';
  }

  squareEl.css('background', background);
};

//Prevents dragging pieces when it's not the player's turn or if the game is over
var onDragStart = function(source, piece, position, orientation) {
  if (random) {
    return true;
  } else if (game.game_over() === true ||
      (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
      (game.turn() !== color) || endTimer){
        
    return false;
  }
};

// chooses random move. only for game vs. random computer mode
var makeRandomMove = function() {

  var possibleMoves = game.moves();

  // game over
  if (possibleMoves.length === 0) return;

  var randomIndex = Math.floor(Math.random() * possibleMoves.length);
  game.move(possibleMoves[randomIndex]);
  board.position(game.fen());

};

//After piece is dropped, emits the move to the server if the move is legal
var handleMove = function(source, target) {
    removeGreySquares();
    var move = game.move({from: source, to: target, promotion: 'q'});
    
    //Illegal move
    if (move === null) {
      return 'snapback';
    } else {
      socket.emit('move_to_server', move);

    }
    if (random)  window.setTimeout(makeRandomMove, 250);
};

var onMouseoverSquare = function(square, piece) {
  // get list of possible moves for this square
  var moves = game.moves({
    square: square,
    verbose: true
  });
  
  //Pieces don't highlight if it is not your turn
  if (!random) {
    if ((piece.charAt(0) !== color) || endTimer) return;
  }

  // exit if there are no moves available for this square
  if (moves.length === 0) return;

  // highlight the square they moused over
  greySquare(square);

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to);
  }
};

var onMouseoutSquare = function(square, piece) {
  removeGreySquares();
};

//Updates board position after castling, en passant, and pawn promotion
var onSnapEnd = function() {
  board.position(game.fen());
};

//Initializes the chess game with the correct configurations
function initGame(position) {
    var cfg = {
        draggable: true,
        position: position,
        onDragStart: onDragStart,
        onDrop: handleMove,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare,
        onSnapEnd: onSnapEnd
    };
    
    board = new ChessBoard('board', cfg);
    game = new Chess();
};

// allows user to enter username
var user = prompt("What's your username?");

var color = '';

let current = false;
let random = false;

// callback to create game 
function createGame() {
    socket.emit("newgame_created", {player1: user, player2: '', position: 'start'});
    random = false;
}

// lists all games created on the server
socket.on("list_of_games", function(data) {
  document.getElementById("gameList").innerHTML = "";
  if (data.length != 0) {
    for (var i = 1; i < data.length; i++) {
      var btn = document.createElement("button");
      btn.innerHTML = data[i].player1 + " vs. " + data[i].player2;
      btn.id = "game" + data[i].name;
      btn.addEventListener("click",  function(){
          switchRoom(data[i].name);
      });
      document.getElementById("gameList").appendChild(btn);
    }
  }
});

// client-side after game has been created on server
socket.on("game_created", function(data) {
  var btn = document.createElement("button");
  btn.innerHTML = data.player1 + " vs. " + data.player2;
  btn.id = "game" + data.name;
  btn.addEventListener("click",  function(){
      switchRoom(data.name);
  });
  document.getElementById("gameList").appendChild(btn);
  if (user === data.player1) {
    color = 'w';
  } else if (user === data.player2) {
    color = 'b';
  }
});

// triggers process of switching rooms
function switchRoom(room) {
  socket.emit("switchroom_server", {user: user, target: room});
}

// private messaging function
function sendPM() {
  var msg = document.getElementById("message").value;
  document.getElementById("message").value = "";
  socket.emit("msg_to_server", {user: user, message: msg});
}

// prints private message
socket.on("msg_to_client", function(data) {
  document.getElementById("chat").innerHTML += '<p><strong>' + data.user + '<strong> says: ' + data.message + '</p>';
});

// initializes settings after switching rooms
socket.on('rooms_switched', function(data){
  document.getElementById("chat").innerHTML = "";
  let gameID = "game" + data.name;
  document.getElementById(gameID).innerHTML = data.player1 + " vs. " + data.player2;
  if (user === data.player1) {
    color = 'w';
  } else if (user === data.player2) {
    color = 'b';
  }
});

// sets board after person has switched rooms
socket.on('set_board', function(data) {
  initGame(data.position);
});

//Listens for a move from the server and updates the board
socket.on('move_to_client', function (msg) {

    game.move(msg);
    board.position(game.fen());
    socket.emit("board_to_server", {position: game.fen()});
    current = (game.turn() === color);
    
});

// Alerts winner after they have won
socket.on("winner", ()=>{
  if (game.game_over()) {
    if (game.in_checkmate()) {
      alert("You won!");
    } else if ((game.in_draw()) || (game.in_stalemate()) || (game.in_threefold_repitition())) {
    } else {
      alert("You lost!");
    }
  }
});

// trigger random play against
function playRandom() {
  random = true;
  initGame('start');

}
