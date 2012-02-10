'use strict';

var application;
var game;
var logger;

function Logger() {
}

Logger.prototype = {
  debug : function(message) {
    console.log("DEBUG " + message);
    $('#debug-content').append("<p>" + message + "</p>");
  },

  error : function(message) {
    console.log("ERROR " + message);
    $('#error-content').append("<p>" + message + "</p>");
  }
};

function Game() {
    this.view = new View(this);
    this.handler = new MessageHandler();

    this.cards = [];
    this.players = [];
    this.playerMoves = [];

    this.selectedCard = null;
    this.playerName = null;
    this.playerTeam = null;
    this.cpuTeam = null;
    this.currentStep = -1;
}

Game.prototype = {

  init: function() {
    this.handler.init(this);
    this.view.init();
    this.initScores();
  },

  start : function() {
    this.handler.sendMessage({'command' : 'startGame', 'playerName' : this.playerName, 'playerTeam': this.playerTeam, 'opponentTeam': this.cpuTeam});
  },

  dealFirstCards : function fn_dealFirstCards () {
    this.handler.sendMessage({ 'command' : 'dealFirstCards', 'playerId' : this.humanPlayer.id});
  },

  chooseTrump : function fn_chooseTrump (card) {
    this.trumpSuit = card.suit;
    this.handler.sendMessage({'command' : 'chooseTrump', 'suit': card.suit, 'playerId' : this.humanPlayer.id});
  },
  
  makeMove : function fn_makeMove (card) {
    this.handler.sendMessage({'command' : 'makeMove', 'rank' : card.rank, 'suit': card.suit, 'playerIndex' : 0, 'playerId' : this.humanPlayer.id, 'remainingCards': this.cards});
    this.selectedCard = card;
    this.setCardClickHandler(this.noAction);
  },

  noAction: function fn_noAction (card) {
    this.view.drawText('Nu even niet :-)\nChill for a bit amigo...');
  },

  sendReady: function() {
    this.handler.sendMessage({'command' : 'isReady'});
  },

  addCards: function(newCards) {
    this.cards = this.cards.concat(newCards);
    this.sortCards();
  },

  sortCards: function() {
    var grouped = _.groupBy(this.cards, 'suit'); 
    _.each(grouped, function(cardList, index, list) {
      var sorted = _.sortBy(cardList, function(c) { return c.rank; });
      list[index] = sorted; 
    });
    var flattened = _.flatten(grouped);
    this.cards = flattened;
  },
  
  addPlayer: function(player) {
    if (player.isHuman) {
      this.humanPlayer = player;
    }
    this.players.push(player);
  },

  getPlayerById: function(id) {
    var player = _.find(this.players, function (p) { return p.id == id;});
    return player;
  },

  removeSelectedCard: function() {
    this.removeCard(this.selectedCard);
  },

  removeCard: function(card) {
    this.view.removePlayerCard(card);

    var index = _.indexOf(this.cards, card);
    if (index != -1) {
      this.cards.splice(index,1);
    }
   },

  clearCards: function() {
    this.view.clearPlayerCards();
    this.cards.length = 0;
  },

  drawTrumpSuit: function(trumpSuit) {
    this.view.drawTrumpSuit(this.trumpSuit);
  },
  
  drawText: function(text) {
    this.view.drawText(text);
  },
  
  drawPlayer: function(player) {
    this.view.drawPlayer(player);
  },

  drawCards : function() {
    this.view.drawPlayerCards(this.cards);
  },
  
  waitForEvent: function() {
    this.view.waitForEvent();
  },


  clearMoves: function(moves) {
    this.view.clearPlayerMoves();
    this.playerMoves.length = 0;
  },
  
  addAndDrawMoves : function(moves) {
    var self = this;
    var existingMoves = this.playerMoves;
    var currentStep = existingMoves.length;

    _.each(moves, function(move, index, list) {
      if (move.sequenceNumber > currentStep) {
        self.playerMoves.push(move);
        self.view.drawPlayerMove(move);
      }
    });
  },
  
  initScores: function() {
    $('#team-name-1').text(this.playerTeam);
    $('#team-name-2').text(this.cpuTeam);

    $('#team-score-1').text('0');
    $('#team-score-2').text('0');
  },

  updateScores: function(scores) {
    var teamScores = scores['teamScore'];
    var playerScores = scores['playerScore'];

    $('#team-score-1').text(teamScores[this.playerTeam]);
    $('#team-score-2').text(teamScores[this.cpuTeam]);
   
    var player; 
    var count = 1;
    for (player in playerScores) {
      $('#player-name-' + count).text(player);
      $('#player-score-' + count).text(playerScores[player]);
      count += 1;
    }
  },


  getCanvas: function() {
    return this.view.getCanvas();
  },
  
  handleCardClicked : function(card) {
        console.log("DEBUG in game handleCardClicked");
    this.cardClickHandler(card);
  },

  setCardClickHandler : function(handler) {
    logger.debug("Setting cardClickHandler to: " + handler.name);
    this.cardClickHandler = handler;
  },
  
  setPlayerTeam: function(playerTeam) {
    this.playerTeam = playerTeam;
  },
  
  setCpuTeam: function(cpuTeam) {
    this.cpuTeam = cpuTeam;
  },
  
  setPlayerName: function(playerName) {
    if (playerName != null && playerName != '') {
      this.playerName = playerName;
    } else {
      var code = "" + (Math.floor(Math.random() * 2500) + 1);
      this.playerName = messages[conf.lang].playerPrefix + code;
    }
  }
};



function MessageHandler() {
}

MessageHandler.prototype = {

  init: function(game) {
    this.game = game;
    this.setupWebSocket();
  },

  setupWebSocket: function() {
    var self = this;
   
    if (window.WebSocket) {
      this.ws = new WebSocket(conf.network.wsURL);
    }
    else if (window.MozWebSocket) { 
      this.ws = new MozWebSocket(conf.network.wsURL);
    } else {
      logger.error(messages[conf.lang].noWebSocketSupport);
    }

    this.ws.onopen = function() {
        self.game.start();
        logger.debug("Websocket opened, game started");
    };

    this.ws.onmessage = function(evt) {
        self.receiveMessage(evt.data);
    };
  },
  
  sendMessage: function(message) {
    var messageStr = JSON.stringify(message);
    this.ws.send(messageStr);

    logger.debug("Sent: " + messageStr);
  },

  receiveMessage : function(msg) {
    logger.debug("Received: " + msg);

    var json = JSON.parse(msg);
    var handlerName = json.response;
    var functionCall = this[handlerName];

    //check whether handler function exists
    if (typeof functionCall != 'function') {
        logger.error('Unknown response: ' + handlerName);
    } else {
        logger.debug('Calling method handler: ' + handlerName);
    }

    //call handler function
    this[handlerName](json);
  },
  
  startGame : function (response) {
    var self = this;
    var playerList = response.players;

    _.each(response.players, function (p) {
      var player = new Player(p.id, p.index, p.name, p.isHuman, p.team);
      self.game.addPlayer(player);
      self.game.drawPlayer(player);
    });

    this.game.dealFirstCards();
  },

  dealFirstCards : function (response) {
    var cards = this.transformCards(response.cards);
    this.game.addCards(cards);
    this.game.drawCards();
    this.game.drawText(messages[conf.lang].chooseTrump);
    this.game.setCardClickHandler(this.game.chooseTrump);
  },

  allCards : function (response) {
    var cards = this.transformCards(response.cards);
    var trumpSuit = response.trumpSuit
    this.game.drawTrumpSuit(trumpSuit);
    this.game.clearCards();
    this.game.addCards(cards);
    this.game.drawCards();
    this.game.sendReady();
  },

  askMove : function (response) {
    var playerMoves = this.transformPlayerMoves(response.hand);

    this.game.clearMoves();
    this.game.addAndDrawMoves(playerMoves);

    this.game.drawText(messages[conf.lang].yourTurn);
    this.game.setCardClickHandler(this.game.makeMove);
  },

  invalidMove : function (response) {
    this.game.drawText(messages[conf.lang].invalidMove);
    $(".alert-message").alert();
 
    this.game.setCardClickHandler(this.game.makeMove);
  },

  handPlayed : function (response) {
    this.game.removeSelectedCard();

    var playerMoves = this.transformPlayerMoves(response.hand);
    this.game.addAndDrawMoves(playerMoves);

    var winningPlayer = this.game.getPlayerById(response.winningPlayerId);
    if (winningPlayer.id == this.game.humanPlayer.id) {
      this.game.drawText(messages[conf.lang].youWinHand);
    } else {
      this.game.drawText(winningPlayer.name + messages[conf.lang].otherWinsHand);
    }
    
    this.game.updateScores(response.scores);

    this.game.waitForEvent();
  },
  
  gameDecided : function (response) {
    var winningTeam = response.winningTeam;
    this.game.drawText("Spel afgelopen!.\n Winaar is " + winningTeam);
    this.game.updateScores(response.scores);
  },
  
  exception : function (response) {
    this.game.drawText(messages[conf.lang].errorMessage);
    logger.error(response.resultMessage);
  },
  
  transformPlayerMoves : function (hand) {
    var self = this;
    var moves = [];
    var sorted = _.sortBy(hand, function(playerMove) { return playerMove.sequenceNumber; });
    _.each(sorted, function(move) {
        var jsonCard = move['card'];
        var seqNo = move['sequenceNumber'];
        var card = new Card(jsonCard['rank'], jsonCard['suit']);
        var player = self.game.getPlayerById(move['playerId']);
        
        moves.push(new PlayerMove(player, card, seqNo));
    });
    return moves;
  },

  transformCards : function (cards) {
    return _.map(cards, function (c) { return  new Card(c.rank, c.suit); });
  }
};

function Application() {
}

Application.prototype = {
  init: function() {
    var self = this;
    $('#welcomeModal').modal('show');

    $('#closePlayerName').click(function(event) {
        event.preventDefault();
        $('#welcomeModal').modal('hide');
        self.startGame('');
    });

    $('#formPlayerName').submit(function(event) {
        event.preventDefault();
        var playerName =  $('#inputPlayerName').val();
        $('#welcomeModal').modal('hide');
        self.startGame(playerName);
      });
  },

  startGame: function(playerName) {
    game = new Game();
    game.setPlayerName(playerName);
    game.setPlayerTeam("Team Suriname");
    game.setCpuTeam("Team Nederland");

    game.init();
  }
};

$(document).ready(function() {
    logger = new Logger();
    application = new Application();
    application.init();
});
