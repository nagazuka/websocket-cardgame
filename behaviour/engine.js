$(document).ready(function() {
    var WIDTH = 650
    var HEIGHT = 450
    var paper = Raphael("canvas", WIDTH, HEIGHT);
    
    // rectangle with rounded corrners
    var bg = paper.rect(0, 0, WIDTH, HEIGHT);
    bg.attr({fill: "45-#000-#555"});

    var TABLE_WIDTH = 500;
    var TABLE_HEIGHT = 350;
    var TABLE_X = (WIDTH - TABLE_WIDTH) / 2
    var TABLE_Y = (HEIGHT - TABLE_HEIGHT) / 2
    var table = paper.image("images/green_poker_skin.png", TABLE_X, TABLE_Y, TABLE_WIDTH, TABLE_HEIGHT);

    for (i=2; i < 10; i++) {
      var card = paper.image("images/cards/simple_c_" + i + ".svg.png", TABLE_X + i*20, TABLE_Y + TABLE_HEIGHT - 50, 45, 70);
    }

    var ws = new WebSocket("ws://localhost:8888/websocket");
    ws.onopen = function() {
      message = { "command" : "startGame", 'playerName' : 'Shanny Anoep'};
      messageStr = JSON.stringify(message)
      $("#infoBlock").html(messageStr);
      ws.send(messageStr);
    };

    ws.onmessage = function (evt) {
      $("#warningBlock").html(evt.data);
    };
});
