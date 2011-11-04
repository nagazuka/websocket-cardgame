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

var game;

function Game() {
    this.cards = [];
    this.players = [];
    this.canvas = Raphael('canvas', WIDTH, HEIGHT);
    this.handler = new MessageHandler();
}

Game.prototype = {

  init: function() {
    this.handler.init(this);
    this.setupCanvas();
  },

  start : function() {
    this.handler.sendMessage({'command' : 'startGame', 'playerName' : 'Shanny Anoep'});
  },

  dealFirstCards : function() {
    this.handler.sendMessage({ 'command' : 'dealFirstCards', 'playerId' : this.humanPlayer.id});
  },

  chooseTrump : function (card) {
    this.handler.sendMessage({'command' : 'chooseTrump', 'suit': card.suit, 'playerId' : this.humanPlayer.id});
  },
  
  makeMove : function (card) {
    this.handler.sendMessage({'command' : 'makeMove', 'rank' : card.rank, 'suit': card.suit, 'playerIndex' : 0, 'playerId' : this.humanPlayer.id});
    this.removeCard(card);
    this.cardClickHandler = this.noAction;
  },

  noAction : function (card) {
    this.drawText('Nu even niet :-)\nChill for a bit amigo...');
  },

  sendReady : function() {
    this.handler.sendMessage({'command' : 'isReady'});
  },

  setupCanvas: function() {
    var bg = this.canvas.rect(0, 0, WIDTH, HEIGHT);
    bg.attr({fill: '45-#000-#555'});
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

  drawCards : function() {
    if (this.cards.length > 0) {
      var offset = 2 * CARD_AREA_PADDING;
      var stepSize = (CARD_AREA_WIDTH - offset) / this.cards.length;
      _.each(this.cards, function(card, i) {
        card.draw(i * stepSize + offset, CARD_AREA_Y + CARD_AREA_PADDING, CARD_WIDTH, CARD_HEIGHT);
      });
    }
  },

  drawMoves : function(moves) {
    var y = TABLE_Y + (TABLE_HEIGHT / 2) - (CARD_HEIGHT / 2);
    var padding = 30;
    var xOffset = TABLE_X + (TABLE_WIDTH / 2) - (2 * (CARD_WIDTH + padding));
    _.each(moves, function(move, index, list) {
      var card = move.card;
      card.draw(xOffset + 30*index, y, CARD_WIDTH, CARD_HEIGHT);
    });
  },

  drawText : function(content) {
    var x = WIDTH / 2;
    var y = HEIGHT / 2;

    if (this.text) {
      this.text.remove();
    }

    this.text = this.canvas.text(x, y, content);
    this.text.attr({'fill' : '#fff', 'font-size' : '24', 'font-family' : 'Helvetica', 'font-weight' : 'bold', 'fill-opacity' : '100%', 'stroke' : '#aaa', 'stroke-width' : '1', 'stroke-opacity' : '100%'});
  },

  getCanvas: function() {
    return this.canvas;
  },

  handleCardClicked : function(card) {
    this.cardClickHandler(card);
  }
};

function Card(rank, suit) {
    this.rank = rank;
    this.suit = suit;
}

Card.prototype = {
  SUIT_TRANSLATION_TABLE : { 'DIAMONDS' : 'd', 'CLUBS' : 'c', 'SPADES' : 's', 'HEARTS' : 'h'},
  RANK_TRANSLATION_TABLE : [undefined, undefined, '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a'],

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
  }
};

function Player(id, index, name, isHuman) {
  this.index = index;
  this.id = id;
  this.name = name;
  this.isHuman = Boolean(isHuman);
}

Player.prototype = {
  draw : function() {
    var middleHeight = (CARD_AREA_Y / 2) - (PLAYER_SIZE / 2);
    var middleWidth = (WIDTH / 2) - (PLAYER_SIZE / 2);
    var endWidth = WIDTH - PLAYER_SIZE - PLAYER_PADDING;
    var endHeight = CARD_AREA_Y - PLAYER_SIZE - (4 * PLAYER_PADDING);

    var xLoc = [middleWidth, PLAYER_PADDING, middleWidth, endWidth];
    var yLoc = [PLAYER_PADDING, middleHeight, endHeight, middleHeight];

    var x = xLoc[this.index];
    var y = yLoc[this.index];
    var table = game.getCanvas().image(this.getPlayerImageFile(), x, y, PLAYER_SIZE, PLAYER_SIZE);
    var nameTxt = game.getCanvas().text(x + PLAYER_SIZE / 2, y + PLAYER_SIZE + PLAYER_PADDING, this.name + ' (' + this.id + ')');
    nameTxt.attr({'fill' : '#fff', 'font-size' : '14', 'font-family' : 'Helvetica', 'font-weight' : 'bold', 'fill-opacity' : '50%'});
  },

  getPlayerImageFile : function() {
    var charCode = Math.floor(Math.random() * 15) + 65;
    var letter = String.fromCharCode(charCode);
    var number = Math.floor(Math.random() * 5) + 1;
    return 'images/avatars/' + letter + '0' + number + '.png';
  }
};

function PlayerMove(player, card) {
  this.player = player;
  this.card = card;
}

PlayerMove.prototype = {};

function MessageHandler() {
}

MessageHandler.prototype = {

  init: function(game) {
    this.setupWebSocket(game);
  },

  setupWebSocket: function(game) {
   
    if (window.WebSocket) {
      this.ws = new WebSocket(conf.network.wsURL);
    }
    else if (window.MozWebSocket) { 
      this.ws = new MozWebSocket(conf.network.wsURL);
    } else {
      alert('No WebSocket support');
    }

    this.ws.onopen = function() {
        game.start();
    };

    this.ws.onmessage = function(evt) {
        game.handler.receiveMessage(evt.data);
    };
  },
  
  sendMessage: function(message) {
    var messageStr = JSON.stringify(message);
    $('#debug-content').append('<p>' + messageStr + '</p>');
    this.ws.send(messageStr);
  },

  receiveMessage : function(msg) {
    $('#debug-content').append(msg);
    var json = JSON.parse(msg);
    var response = json.response;
    switch (response) {
      case 'startGame':
        this.handleStartGameResponse(json);
        break;
      case 'dealFirstCards':
        this.handleDealFirstCardsResponse(json);
        break;
      case 'allCards':
        this.handleAllCardsResponse(json);
        break;
      case 'askMove':
        this.handleAskMoveResponse(json);
        break;
      case 'handPlayed':
        this.handleHandPlayedResponse(json);
        break;
      case 'gameDecided':
        this.handleGameDecidedResponse(json);
        break;
      case 'exception':
        this.handleExceptionResponse(json);
        break;
      default:
        alert('Unknown response: ' + response);
        break;
    }
  },
  
  handleStartGameResponse : function (response) {
    var playerList = response.players;

    _.each(response.players, function (p) {
      var player = new Player(p.id, p.index, p.name, p.isHuman);
      game.addPlayer(player);
      player.draw();
    });

    game.dealFirstCards();
  },

  handleDealFirstCardsResponse : function (response) {
    var cards = this.transformCards(response.cards);
    game.addCards(cards);
    game.drawCards();
    game.drawText("Kies je troefkaart");
    game.cardClickHandler = game.chooseTrump;
  },

  handleAllCardsResponse : function (response) {
    var cards = this.transformCards(response.cards);
    game.clearCards();
    game.addCards(cards);
    game.drawCards();
    game.sendReady();
  },

  handleAskMoveResponse : function (response) {
    var playerMoves = this.transformPlayerMoves(response.hand);
    game.drawMoves(playerMoves);

    game.drawText("Je bent aan de beurt...");
    game.cardClickHandler = game.makeMove;
  },

  handleHandPlayedResponse : function (response) {
    var winningPlayer = game.getPlayerById(response.winningPlayerId);
    if (winningPlayer.id == game.humanPlayer.id) {
      game.drawText("Je hebt deze hand gemaakt!");
    } else {
      game.drawText(winningPlayer.name + "\nheeft deze hand gemaakt!");
    }

    var playerMoves = this.transformPlayerMoves(response.hand);
    game.drawMoves(playerMoves);

    game.sendReady();
  },
  
  handleGameDecidedResponse : function (response) {
    var winningTeam = response.winningTeam;
    game.drawText("Hand is gespeeld.\n Winaar is " + winningTeam);
  },
  
  handleExceptionResponse : function (response) {
    game.drawText("Ai ai ai!\nEr is een fout opgetreden.");
    $('#error-content').append('<p>' + response.resultMessage + '</p>');
  },
  
  transformPlayerMoves : function (hand) {
    var moves = [];
    var sorted = _.sortBy(hand, function(h) { return h.index; });
    _.each(sorted, function(move) {
        var jsonCard = move['card'];
        var card = new Card(jsonCard['rank'], jsonCard['suit']);
        var player = game.getPlayerById(move['playerId']);
        
        moves.push(new PlayerMove(player, card));
    });
    return moves;
  },

  transformCards : function (cards) {
    return _.map(cards, function (c) { return  new Card(c.rank, c.suit); });
  }
};

$(document).ready(function() {
    game = new Game();
    game.init();
});
