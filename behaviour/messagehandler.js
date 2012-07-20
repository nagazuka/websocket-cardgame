var WEB_SOCKET_SWF_LOCATION = "behaviour/lib/WebSocketMain.swf";

function MessageHandler() {
}

MessageHandler.prototype = {

  connect: function() {
    var self = this;
 
    this.ws = new WebSocket(conf.network.wsURL);
   
    this.ws.onopen = function() {
        game.start();
        console.debug("Websocket opened, game started");
    };

    this.ws.onclose = function() {
        console.debug("Websocket closed, game suspended");
        $('#disconnectModal').modal('show');
    }; 

    this.ws.onmessage = function(evt) {
        self.receiveMessage(evt.data);
    };
  },
  
  sendMessage: function(message) {
    var messageStr = JSON.stringify(message);
    this.ws.send(messageStr);

    console.debug("Sent: " + messageStr);
  },

  receiveMessage : function(msg) {
    console.debug("Received: " + msg);

    var json = JSON.parse(msg);
    var handlerName = json.response;
    var functionCall = this[handlerName];

    //check whether handler function exists
    if (typeof functionCall != 'function') {
        console.error('Unknown response: ' + handlerName);
    } else {
        console.debug('Calling method handler: ' + handlerName);
    }

    //call handler function
    this[handlerName](json);
  },
  
  startGame: function (response) {
    var self = this;
    var playerList = response.players;
    game.playingOrder = response.playingOrder;
    _.each(response.players, function (p) {
      var player = new Player({'id': p.id, 'index': p.index, 'name': p.name, 'isHuman': p.isHuman, 'team': p.team});
      game.addPlayer(player);
      game.drawPlayer(player);
    });
    game.askFirstCards();
  },

  nextGame: function(response) {
    game.handleNextGame();
  },

  dealFirstCards: function (response) {
    var cards = this.transformCards(response.cards);
    game.handleFirstCards(cards);
  },

  allCards: function (response) {
    var cards = this.transformCards(response.cards);
    var trumpSuit = response.trumpSuit
    game.handleAllCards(cards, trumpSuit);
  },

  askMove: function (response) {
    var playerMoves = this.transformPlayerMoves(response.hand);
    game.handleAskMove(playerMoves);
  },

  invalidMove: function (response) {
    game.handleInvalidMove();
  },

  handPlayed: function (response) {
    var playerMoves = this.transformPlayerMoves(response.hand);
    var winningPlayerId = response.winningPlayerId;
    var scores = response.scores;

    game.handleHandPlayed(playerMoves, winningPlayerId, scores);
  },

  gameDecided: function (response) {
    var winningTeam = response.winningTeam;
    var scores = response.scores;

    game.handleGameDecided(winningTeam, scores);
  },
  
  exception: function (response) {
    game.drawText(messages[conf.lang].errorMessage);
    console.error(response.resultMessage);
  },
  
  transformPlayerMoves : function (hand) {
    var self = this;
    var moves = [];
    var sorted = _.sortBy(hand, function(playerMove) { return playerMove.sequenceNumber; });
    _.each(sorted, function(move) {
        var jsonCard = move['card'];
        var seqNo = move['sequenceNumber'];
        var card = new Card(jsonCard['rank'], jsonCard['suit']);
        var player = game.getPlayerById(move['playerId']);
        moves.push(new PlayerMove({'player': player, 'card': card, 'seqNo': seqNo}));
    });
    return moves;
  },

  transformCards : function (cards) {
    return _.map(cards, function (c) { return  new Card({'rank': c.rank, 'suit': c.suit}); });
  }
};
