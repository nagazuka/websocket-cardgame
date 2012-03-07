'use strict';

var WEB_SOCKET_SWF_LOCATION = "behaviour/WebSocketMain.swf";

var logger;

function Logger() {
}

Logger.prototype = {
  debug : function(message) {
    console.log("DEBUG " + message);
  },

  error : function(message) {
    console.log("ERROR " + message);
  }
};

function Game() {
    this.view = null;
    this.handler = new MessageHandler();

    this.cards = [];
    this.players = [];
    this.playerMoves = [];

    this.selectedCard = null;
    this.playerName = null;
    this.playerTeam = null;
    this.cpuTeam = null;
}

Game.prototype = {

  init: function() {
    this.handler.init(this);
    this.view.init();
    this.initScores();
  },

  start: function() {
    this.handler.sendMessage({'command' : 'startGame', 'playerName' : this.playerName, 'playerTeam': this.playerTeam, 'opponentTeam': this.cpuTeam});
  },

  nextGame: function() {
    this.handler.sendMessage({'command' : 'nextGame', 'playerName' : this.playerName, 'playerTeam': this.playerTeam, 'opponentTeam': this.cpuTeam});
  },

  askFirstCards: function fn_askFirstCards () {
    this.handler.sendMessage({ 'command' : 'dealFirstCards', 'playerId' : this.humanPlayer.id});
  },

  chooseTrump: function fn_chooseTrump (card) {
    this.trumpSuit = card.suit;
    this.handler.sendMessage({'command' : 'chooseTrump', 'suit': card.suit, 'playerId' : this.humanPlayer.id});
  },
  
  makeMove: function fn_makeMove (card) {
    this.handler.sendMessage({'command' : 'makeMove', 'rank' : card.rank, 'suit': card.suit, 'playerIndex' : 0, 'playerId' : this.humanPlayer.id});
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
    this.cards = _.without(this.cards, card);
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

  drawError: function(heading, text) {
    this.view.drawError(heading, text);
  },

  clearError: function(text) {
    this.view.clearError(text);
  },

  drawPlayer: function(player) {
    this.view.drawPlayer(player);
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
    this.view.drawInitialScores([this.playerTeam, this.cpuTeam]);
  },

  updateScores: function(scores) {
    this.view.updateScores(scores);
  },

  handleFirstCards: function(cards) {
    this.addCards(cards);
    this.view.drawDeck();
    this.view.drawPlayerCards(this.cards);
    this.drawText(messages[conf.lang].chooseTrumpHeading);
    this.setCardClickHandler(this.chooseTrump);
  },

  handleAllCards: function(cards, trumpSuit) {
    this.drawTrumpSuit(trumpSuit);
    this.clearCards();
    this.addCards(cards);
    this.view.drawPlayerCards(this.cards);
    this.view.clearDeck();
    this.sendReady();
  },

  handleAskMove: function (playerMoves) {
    this.clearMoves();
    this.addAndDrawMoves(playerMoves);

    this.drawText(messages[conf.lang].yourTurn);
    this.setCardClickHandler(this.makeMove);
  },
  
  handleInvalidMove: function (response) {
    this.drawError(messages[conf.lang].invalidMoveHeading, messages[conf.lang].invalidMove); 
    this.setCardClickHandler(this.makeMove);
  },

  handleHandPlayed: function (playerMoves, winningPlayerId, scores) {
    this.removeSelectedCard();
    this.clearError();

    this.addAndDrawMoves(playerMoves);

    var winningPlayer = this.getPlayerById(winningPlayerId);
    if (winningPlayer.id == this.humanPlayer.id) {
      this.drawText(messages[conf.lang].youWinHand);
    } else {
      this.drawText(winningPlayer.name + messages[conf.lang].otherWinsHand);
    }
    
    this.updateScores(scores);
    this.view.waitForNextHand();
  },  

  handleGameDecided: function (winningTeam, scores) {
    this.drawText(messages[conf.lang].gameDecided + winningTeam);
    this.updateScores(scores);
    this.view.waitForNextGame();
  },

  handleNextGame: function(cards) {
    this.clearCards();
    this.clearMoves();
    this.view.clearTrumpSuit();
    this.askFirstCards();
  },

  handleCardClicked : function(card) {
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
  },

  setView: function(view) {
    this.view = view;
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
 
    this.ws = new WebSocket(conf.network.wsURL);
    
    this.ws.onopen = function() {
        self.game.start();
        logger.debug("Websocket opened, game started");
    };

    this.ws.onclose = function() {
        logger.debug("Websocket closed, game suspended");
        $('#disconnectModal').modal('show');
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
  
  startGame: function (response) {
    var self = this;
    var playerList = response.players;

    _.each(response.players, function (p) {
      var player = new Player(p.id, p.index, p.name, p.isHuman, p.team);
      self.game.addPlayer(player);
      self.game.drawPlayer(player);
    });

    this.game.askFirstCards();
  },

  nextGame: function(response) {
    this.game.handleNextGame();
  },

  dealFirstCards: function (response) {
    var cards = this.transformCards(response.cards);
    this.game.handleFirstCards(cards);
  },

  allCards: function (response) {
    var cards = this.transformCards(response.cards);
    var trumpSuit = response.trumpSuit
    this.game.handleAllCards(cards, trumpSuit);
  },

  askMove: function (response) {
    var playerMoves = this.transformPlayerMoves(response.hand);
    this.game.handleAskMove(playerMoves);
  },

  invalidMove: function (response) {
    this.game.handleInvalidMove();
  },

  handPlayed: function (response) {
    var playerMoves = this.transformPlayerMoves(response.hand);
    var winningPlayerId = response.winningPlayerId;
    var scores = response.scores;

    this.game.handleHandPlayed(playerMoves, winningPlayerId, scores);
  },

  gameDecided: function (response) {
    var winningTeam = response.winningTeam;
    var scores = response.scores;

    this.game.handleGameDecided(winningTeam, scores);
  },
  
  exception: function (response) {
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

    this.game = new Game();
    this.view = new View();
    
    this.game.setView(this.view);
    this.view.setGame(this.game);

    var playerName = this.getStoredValue('playerName');
    
    if (playerName == null) {
      $('#welcomeModal').modal('show');
      $('#closePlayerName').click(function(event) {
        event.preventDefault();
        self.startGame('');
      });
      $('#formPlayerName').submit(function(event) {
        event.preventDefault();
        var playerName =  $('#inputPlayerName').val();
        self.storeValue('playerName', playerName);
        self.startGame(playerName);
      });
    } else {
      self.startGame(playerName);
    }
    
    this.view.preload();
  },

  getStoredValue: function(key) {  
    return $.cookie(key);
  },

  storeValue: function(key, value) {
    $.cookie(key, value, {expires: 7, path: '/' });
  },

  startGame: function(playerName) {
    $('#welcomeModal').modal('hide');

    this.game.setPlayerName(playerName);
    this.game.setPlayerTeam("Team Suriname");
    this.game.setCpuTeam("Team Nederland");

    this.game.init();
  }
};

$(document).ready(function() {
    logger = new Logger();
    var application = new Application();
    application.init();
});
