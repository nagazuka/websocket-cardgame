var WIDTH = 650
var HEIGHT = 500
var TABLE_WIDTH = 500;
var TABLE_HEIGHT = 350;

var ws = new WebSocket("ws://localhost:8888/websocket");
var paper;

function initGame() {

  ws.onopen = function() {
    startGame();
  };

  ws.onmessage = function (evt) {
    handleMessage(evt.data);
  };

  return ws;
}

function sendMessage(msg) {
    messageStr = JSON.stringify(message)
    $("#infoBlock").html(messageStr);
    ws.send(messageStr);
}

function handleMessage(msg) {
    $("#warningBlock").html(msg);

    json = JSON.parse(msg);
    response = json.response;
    switch (response) {
      case 'startGame':
        handleStartGameResponse(json);
        break;
      default:
        alert('Unknown response: ' + response);
    }
}

function handleStartGameResponse(response) {
  playerList = response.players;
  for(i=0; i<playerList.length; i++) {
    drawPlayer(playerList[i].index, playerList[i].name);
  }
}

function drawPlayer(index, name) {
    var padding = 5;
    var size = 100;
    var middleHeight = (HEIGHT / 2) - (size / 2);
    var middleWidth = (WIDTH / 2) - (size / 2);
    var endWidth = WIDTH - size - padding;
    var endHeight = HEIGHT - size - (4 * padding);

    var xLoc = [middleWidth, padding, middleWidth, endWidth]; 
    var yLoc = [padding, middleHeight, endHeight, middleHeight]; 

    var x = xLoc[i]
    var y = yLoc[i]
    var table = paper.image("images/avatars/A0" + (index+1) + ".png", x, y, size, size);
    var name = paper.text(x + size / 2, y + size + padding, name);
    name.attr({'fill' : '#fff', 'font-size' : '14', 'font-family' : 'Helvetica', 'font-weight' : 'bold', 'fill-opacity' : '50%'});
}

function startGame() {
    message = { "command" : "startGame", 'playerName' : 'Shanny Anoep'};
    sendMessage(this, message);
}

$(document).ready(function() {
    paper = Raphael("canvas", WIDTH, HEIGHT);

    // rectangle with rounded corrners
    var bg = paper.rect(0, 0, WIDTH, HEIGHT);
    bg.attr({fill: "45-#000-#555"});

    var TABLE_X = (WIDTH - TABLE_WIDTH) / 2
    var TABLE_Y = (HEIGHT - TABLE_HEIGHT) / 2
    var table = paper.image("images/green_poker_skin.png", TABLE_X, TABLE_Y, TABLE_WIDTH, TABLE_HEIGHT);

    for (i=2; i < 10; i++) {
    var card = paper.image("images/cards/simple_c_" + i + ".svg.png", i*20, TABLE_Y + TABLE_HEIGHT - 50, 45, 70);
    }

    var ws = initGame();
});
