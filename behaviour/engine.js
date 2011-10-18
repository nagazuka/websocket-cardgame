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
    this.canvas = Raphael('canvas', WIDTH, HEIGHT);
    this.handler = new MessageHandler();
}

Game.prototype = {

  init: function() {
    this.setupWebSocket();
    this.setupCanvas();
  },

  setupWebSocket: function() {
    var self = this;
   
    if (window.WebSocket) {
      this.ws = new WebSocket(conf.network.wsURL);
    }
    else if (window.MozWebSocket) { 
      this.ws = new MozWebSocket(conf.network.wsURL);
    } else {
      alert('No WebSocket support');
    }

    this.ws.onopen = function() {
        self.start();
    };

    this.ws.onmessage = function(evt) {
        self.handler.handleMessage(evt.data);
    };

  },

  start : function() {
    this.sendMessage({'command' : 'startGame', 'playerName' : 'Shanny Anoep'});
  },

  dealFirstCards : function() {
    this.sendMessage({ 'command' : 'dealFirstCards', 'playerIndex' : 0});
  },

  chooseTrump : function (suit) {
    this.sendMessage({'command' : 'chooseTrump', 'suit': suit, 'playerIndex' : 0});
  },

  sendReady : function() {
    this.sendMessage({'command' : 'isReady'});
  },

  setupCanvas: function() {
    var bg = this.canvas.rect(0, 0, WIDTH, HEIGHT);
    bg.attr({fill: '45-#000-#555'});
    var table = this.canvas.image('images/green_poker_skin.png', TABLE_X, TABLE_Y, TABLE_WIDTH, TABLE_HEIGHT);
    var cardArea = this.canvas.rect(0, CARD_AREA_Y, WIDTH, CARD_AREA_HEIGHT);
    cardArea.attr({'fill': '90-#161:5-#000:95', 'fill-opacity': 0.5, 'stroke-width': 0, 'opacity': 0.1});
  },

  addCard: function(card) {
    this.cards.push(card);
  },

  clearCards: function() {
    var i;
    for (i = 0; i < this.cards.length; i += 1) {
        this.cards[i].remove();
    }
  },

  sendMessage: function(msg) {
    var messageStr = JSON.stringify(msg);
    $('#infoBlock').html(messageStr);
    this.ws.send(messageStr);
  },

  getCanvas: function() {
    return this.canvas;
  }
};

function Card(rank, suit) {
    this.rank = rank;
    this.suit = suit;
}

Card.prototype = {
  SUIT_TRANSLATION_TABLE : { 'DIAMONDS' : 'd', 'CLUBS' : 'c', 'SPADES' : 's', 'HEARTS' : 'h'},

  RANK_TRANSLATION_TABLE : [undefined, undefined, '2', '3', '4', '5', '6', '7', '8', '9', 'j', 'q', 'k', 'a'],

  draw: function(x, y, width, height) {
    var self = this;

    this.cardImage = game.getCanvas().image(this.getCardImage(this.rank, this.suit), x, y, width, height);

    this.cardImage.mouseover(function(event) {
        this.attr({'height': CARD_HEIGHT * 2, 'width': CARD_WIDTH * 2});
    });
    this.cardImage.mouseout(function(event) {
        this.attr({'height': CARD_HEIGHT, 'width': CARD_WIDTH});
    });
    this.cardImage.click(function(event) {
        game.chooseTrump(self.suit);
    });
  },

  remove: function() {
    this.cardImage.remove();
  },
  
  getCardImage : function(rank, suit) {
    return 'images/cards/simple_' + this.SUIT_TRANSLATION_TABLE[suit] + '_' + this.RANK_TRANSLATION_TABLE[rank] + '.png';
  }
};

function Player(index, name) {
  this.index = index;
  this.name = name;
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
    var table = game.getCanvas().image(this.getPlayerImage(), x, y, PLAYER_SIZE, PLAYER_SIZE);
    var nameTxt = game.getCanvas().text(x + PLAYER_SIZE / 2, y + PLAYER_SIZE + PLAYER_PADDING, this.name);
    nameTxt.attr({'fill' : '#fff', 'font-size' : '14', 'font-family' : 'Helvetica', 'font-weight' : 'bold', 'fill-opacity' : '50%'});
  },

  getPlayerImage : function() {
    return 'images/avatars/O0' + (this.index + 1) + '.png';
  }
};

function MessageHandler() {
}

MessageHandler.prototype = {

  handleMessage : function(msg) {
    $('#warningBlock').html(msg);
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
      default:
        alert('Unknown response: ' + response);
    }
  },
  
  handleStartGameResponse : function (response) {
    var playerList = response.players;
    var i;
    for (i = 0; i < playerList.length; i += 1) {
      var player = new Player(playerList[i].index, playerList[i].name);
      player.draw();
    }
    game.dealFirstCards();
  },

  handleDealFirstCardsResponse : function (response) {
    drawCards(response.cards);
  },

  handleAllCardsResponse : function (response) {
    var cards = response.cards;
    game.clearCards();
    drawCards(cards);
    game.sendReady();
  }

};

function drawCards(cards) {
    var offset = 2 * CARD_AREA_PADDING;
    var stepSize = (CARD_AREA_WIDTH - offset) / cards.length;
    var i;
    for (i = 0; i < cards.length; i += 1) {
      var card = new Card(cards[i].rank, cards[i].suit);
      game.addCard(card);
      card.draw(i * stepSize + offset, CARD_AREA_Y + CARD_AREA_PADDING, CARD_WIDTH, CARD_HEIGHT);
    }
}


$(document).ready(function() {
    game = new Game();
    game.init();
});
