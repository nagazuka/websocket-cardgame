'use strict';

var WIDTH = 650;
var HEIGHT = 600;

var TABLE_WIDTH = 500;
var TABLE_HEIGHT = 350;

var CARD_WIDTH = 45;
var CARD_HEIGHT = 70;

var CARD_AREA_WIDTH = WIDTH;
var CARD_AREA_HEIGHT = CARD_WIDTH * 2;
var CARD_AREA_Y = HEIGHT - CARD_AREA_HEIGHT;
var CARD_AREA_PADDING = 10;

var TABLE_X = (WIDTH - TABLE_WIDTH) / 2;
var TABLE_Y = (HEIGHT - TABLE_HEIGHT - CARD_AREA_HEIGHT) / 2;

var PLAYER_PADDING = 10;
var PLAYER_SIZE = 100;
var TEAM_FLAG_SIZE = 64;
var TRUMPSUIT_SIZE = 64;

var TRUMPSUIT_X = 10;
var TRUMPSUIT_Y = 10;

var PLAYER_MIDDLE_Y = (CARD_AREA_Y / 2) - (PLAYER_SIZE / 2);
var PLAYER_MIDDLE_X = (WIDTH / 2) - (PLAYER_SIZE / 2);
var PLAYER_END_X = WIDTH - PLAYER_SIZE - PLAYER_PADDING;
var PLAYER_END_Y = CARD_AREA_Y - PLAYER_SIZE - (4 * PLAYER_PADDING);

var PLAYER_X_ARR = [PLAYER_MIDDLE_X, PLAYER_END_X, PLAYER_MIDDLE_X, PLAYER_PADDING];
var PLAYER_Y_ARR = [PLAYER_PADDING, PLAYER_MIDDLE_Y, PLAYER_END_Y, PLAYER_MIDDLE_Y];

var CARD_MIDDLE_Y = (CARD_AREA_Y / 2) - (CARD_HEIGHT / 2);
var CARD_MIDDLE_X = (WIDTH / 2) - (CARD_WIDTH / 2);
var CARD_X_ARR = [CARD_MIDDLE_X, CARD_MIDDLE_X + 2*CARD_WIDTH, CARD_MIDDLE_X, CARD_MIDDLE_X - 2*CARD_WIDTH];
var CARD_Y_ARR = [CARD_MIDDLE_Y - 0.75*CARD_HEIGHT, CARD_MIDDLE_Y, CARD_MIDDLE_Y + 0.5*CARD_HEIGHT, CARD_MIDDLE_Y];

var PLAYER_MOVE_ANIMATE_TIME = 1000;

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
    this.cards = [];
    this.players = [];
    this.repository = new Repository();
    this.canvas = Raphael('canvas', WIDTH, HEIGHT);
    this.handler = new MessageHandler();
    this.selectedCard = null;
    this.playerName = null;
    this.playerTeam = null;
    this.cpuTeam = null;
}

Game.prototype = {

  init: function() {
    this.handler.init(this);
    this.setupCanvas();
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
    this.drawText('Nu even niet :-)\nChill for a bit amigo...');
  },

  sendReady: function() {
    this.handler.sendMessage({'command' : 'isReady'});
  },

  waitForEvent: function() {
    var self = this;
    var overlay = this.canvas.rect(0, 0, WIDTH, HEIGHT);
    overlay.attr({fill: "#000", stroke: "none", opacity: '0.1'}); 
    overlay.mouseup(function(event) {
      self.sendReady(); 
      overlay.remove();
    }); 
  },

  setupCanvas: function() {
    var bg = this.canvas.rect(0, 0, WIDTH, HEIGHT);
    bg.attr({fill: '45-#000-#555'});
    bg.mouseup(function(event) {
      logger.debug("Event " + event);
    });
    var table = this.canvas.image('images/green_poker_skin.png', TABLE_X, TABLE_Y, TABLE_WIDTH, TABLE_HEIGHT);
    var cardArea = this.canvas.rect(0, CARD_AREA_Y, WIDTH, CARD_AREA_HEIGHT);
    cardArea.attr({'fill': '90-#161:5-#000:95', 'fill-opacity': 0.5, 'stroke-width': 0, 'opacity': 0.1});
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
    card.clear();
    var index = _.indexOf(this.cards, card);
    if (index != -1) {
      this.cards.splice(index,1);
    }
   },

  clearCards: function() {
    _.each(this.cards, function(c) { c.clear(); });
    this.cards.length = 0;
  },

  drawTrumpSuit: function() {
    var content = "Troef"; 
    var trumpSuitText = this.canvas.text(0, 0, content);
    trumpSuitText.attr({'font-size': 20,'text-anchor': 'start','fill': '#fff','font-family' : conf.font, 'font-weight' : 'bold'});

    var iconImage = conf.suitsDirectory + conf.suitIcons[this.trumpSuit];
    var trumpSuitIcon = this.canvas.image(iconImage, TRUMPSUIT_X, TRUMPSUIT_Y, TRUMPSUIT_SIZE, TRUMPSUIT_SIZE);

    this.repository.addElement(trumpSuitText, "trumpSuitText");
    this.repository.addElement(trumpSuitIcon, "trumpSuitIcon");
  },

  drawCards : function() {
    if (this.cards.length > 0) {
      var offset = 2 * CARD_AREA_PADDING;
      var stepSize = (CARD_AREA_WIDTH - offset) / this.cards.length;
      _.each(this.cards, function(card, i) {
        card.draw(i * stepSize + offset, CARD_AREA_Y + CARD_AREA_PADDING, CARD_WIDTH, CARD_HEIGHT);
      });
    }
  },

  clearMoves: function(moves) {
    var moves = this.repository.getElementsByCategory("moves");
    _.each(moves, function(m) {
      m.clear(); 
    });
    this.repository.clearCategory("moves");
  },
  
  addMoves : function(moves) {
    var currentSequenceNumber = 0;
    var existingMoves = this.repository.getElementsByCategory("moves");
    
    if (existingMoves.length > 0) { 
      currentSequenceNumber = _.reduce(existingMoves, function (memo, move) { 
                                  return Math.max(memo, move.sequenceNumber);
                                }, 0);
    }

    console.log("current sequence number: " + currentSequenceNumber);

    var self = this;
    _.each(moves, function(move, index, list) {
      if (move.sequenceNumber > currentSequenceNumber) {
        self.repository.addElement(move, "moves");
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

  drawMoves : function() {
    var moves = this.repository.getElementsByCategory("moves");
    console.log("drawMoves, number of #moves: " + moves.length);

    _.each(moves, function(move, index, list) {
      move.draw();
    });
  },

  drawText : function(content) {
    var x = WIDTH / 2;
    var y = HEIGHT / 2;

    if (this.text) {
      this.text.remove();
    }

    this.text = this.canvas.text(x, y, content);
    this.text.attr({'fill' : '#fff', 'font-size' : '24', 'font-family' : conf.font, 'font-weight' : 'bold', 'fill-opacity' : '100%', 'stroke' : '#aaa', 'stroke-width' : '1', 'stroke-opacity' : '100%'});
  },

  getCanvas: function() {
    return this.canvas;
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
  }
};

function Repository() {
}

Repository.prototype = {

  getElementsByCategory: function(category) {
      return this[category];
  },

  clearCategory: function(category) {
      this[category] = [];
  },

  createIfEmpty: function(category) {
    if (!(this.hasOwnProperty(category))) {
      this[category] = [];
    }
  },

  addElement: function(element, category) {
    this.createIfEmpty(category);
    this[category].push(element);
  }
};

function Card(rank, suit) {
    this.rank = rank;
    this.suit = suit;
}

Card.prototype = {
  SUIT_TRANSLATION_TABLE : { 'DIAMONDS' : 'd', 'CLUBS' : 'c', 'SPADES' : 's', 'HEARTS' : 'h'},
  RANK_TRANSLATION_TABLE : [undefined, undefined, '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a'],

  animate: function(srcX, srcY, width, height, destX, destY, time) {
    this.draw(srcX, srcY, width, height);
    this.cardImage.stop().animate({x: destX, y: destY}, time);
  },

  draw: function(x, y, width, height) {
    var self = this;

    this.cardImage = game.getCanvas().image(this.getCardImageFile(this.rank, this.suit), x, y, width, height);

    this.cardImage.mouseover(function(event) {
        this.attr({'height': CARD_HEIGHT * 2, 'width': CARD_WIDTH * 2});
    });
    this.cardImage.mouseout(function(event) {
        this.attr({'height': CARD_HEIGHT, 'width': CARD_WIDTH});
    });
    this.cardImage.click(function(event) {
        game.handleCardClicked(self);
    });
  },

  clear: function() {
    this.cardImage.remove();
  },
  
  getCardImageFile : function(rank, suit) {
    return 'images/cards/simple_' + this.SUIT_TRANSLATION_TABLE[suit] + '_' + this.RANK_TRANSLATION_TABLE[rank] + '.png';
  },

  toJSON: function() {
    return { 'rank' : this.rank, 'suit': this.suit }; 
  }

};

function Player(id, index, name, isHuman, teamName) {
  this.index = index;
  this.id = id;
  this.name = name;
  this.teamName = teamName;
  this.isHuman = Boolean(isHuman);

  this.playerX = PLAYER_X_ARR[this.index];
  this.playerY = PLAYER_Y_ARR[this.index];
  this.flagX = this.playerX - 0.25*TEAM_FLAG_SIZE;
  this.flagY = this.playerY - 0.25*TEAM_FLAG_SIZE;
}

Player.prototype = {
  draw: function() {
    var canvas = game.getCanvas();

    var teamFlag = canvas.image(this.getTeamImageFile(), this.flagX, this.flagY,  TEAM_FLAG_SIZE, TEAM_FLAG_SIZE);
    var player = canvas.image(this.getPlayerImageFile(), this.playerX, this.playerY, PLAYER_SIZE, PLAYER_SIZE);
    var nameTxt = canvas.text(this.playerX + PLAYER_SIZE / 2, this.playerY + PLAYER_SIZE + PLAYER_PADDING, this.name);
    nameTxt.attr({'fill' : '#fff', 'font-size' : '14', 'font-family' : conf.font, 'font-weight' : 'bold', 'fill-opacity' : '50%'});
  },

  getPlayerImageFile: function() {
    var charCode = Math.floor(Math.random() * 15) + 65;
    var letter = String.fromCharCode(charCode);
    var number = Math.floor(Math.random() * 5) + 1;
    return conf.avatarDirectory + letter + '0' + number + '.png';
  },

  getTeamImageFile: function() {
    var teamName;

    if (this.teamName in conf.teamFlags) {
      teamName = this.teamName;
    } else {
      teamName = 'default';
    }

    return conf.flagDirectory + conf.teamFlags[teamName];
  },

  getIndex: function() {
    return this.index;
  }
};

function PlayerMove(player, card, sequenceNumber) {
  this.player = player;
  this.card = card;
  this.sequenceNumber = sequenceNumber;
  this.animationFinished = false;
 
  var playerIndex = this.player.getIndex(); 
  this.startX = this.player.playerX;
  this.startY = this.player.playerY;

  this.endX = CARD_X_ARR[playerIndex];
  this.endY = CARD_Y_ARR[playerIndex];
}

PlayerMove.prototype = {
  draw: function() {
    if (!this.animationFinished) {
      this.card.animate(this.startX, this.startY, CARD_WIDTH, CARD_HEIGHT, this.endX, this.endY, PLAYER_MOVE_ANIMATE_TIME);
      this.animationFinished = true;
    }
  },

  clear: function() {
      this.card.clear();
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
      player.draw();
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
    this.game.addMoves(playerMoves);
    this.game.drawMoves();

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
    this.game.addMoves(playerMoves);
    this.game.drawMoves();

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
