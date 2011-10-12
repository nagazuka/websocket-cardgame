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

var SUIT_TRANSLATION_TABLE = { 'DIAMONDS' : 'd', 'CLUBS' : 'c', 'SPADES' : 's', 'HEARTS' : 'h'};
var RANK_TRANSLATION_TABLE = [undefined, undefined, '2', '3', '4', '5', '6', '7', '8', '9', 'j', 'q', 'k', 'a'];

var wsURL = 'ws://' + conf.network.hostName + ':' + conf.network.portNumber + '/websocket';

var paper;
var game;


function Game() {
    this.cards = [];
    this.ws = new WebSocket(wsURL);
}

Game.prototype = {

  init: function() {
    this.ws.onopen = function() {
        startGame();
    };

    this.ws.onmessage = function(evt) {
        handleMessage(evt.data);
    };
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
  }
};

function Card(rank, suit) {
    this.rank = rank;
    this.suit = suit;
}

Card.prototype = {
  draw: function(x, y, width, height) {
    var self = this;

    this.cardImage = paper.image(this.getCardImage(this.rank, this.suit), x, y, width, height);

    this.cardImage.mouseover(function(event) {
        this.attr({'height': CARD_HEIGHT * 2, 'width': CARD_WIDTH * 2});
    });
    this.cardImage.mouseout(function(event) {
        this.attr({'height': CARD_HEIGHT, 'width': CARD_WIDTH});
    });
    this.cardImage.click(function(event) {
        chooseTrump(self.suit);
    });
  },

  remove: function() {
    this.cardImage.remove();
  },
  
  getCardImage : function(rank, suit) {
    return 'images/cards/simple_' + SUIT_TRANSLATION_TABLE[suit] + '_' + RANK_TRANSLATION_TABLE[rank] + '.png';
  }
};

function handleMessage(msg) {
    $('#warningBlock').html(msg);
    var json = JSON.parse(msg);
    var response = json.response;
    switch (response) {
      case 'startGame':
        handleStartGameResponse(json);
        break;
      case 'dealFirstCards':
        handleDealFirstCardsResponse(json);
        break;
      case 'allCards':
        handleAllCardsResponse(json);
        break;
      default:
        alert('Unknown response: ' + response);
    }
}

function handleStartGameResponse(response) {
  var playerList = response.players;
  var i;
  for (i = 0; i < playerList.length; i += 1) {
    drawPlayer(playerList[i].index, playerList[i].name);
  }

  dealFirstCards();
}

function handleDealFirstCardsResponse(response) {
  drawCards(response.cards);
}

function handleAllCardsResponse(response) {
  var cards = response.cards;
  game.clearCards();
  drawCards(cards);
}


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

function drawPlayer(index, name) {
    var middleHeight = (CARD_AREA_Y / 2) - (PLAYER_SIZE / 2);
    var middleWidth = (WIDTH / 2) - (PLAYER_SIZE / 2);
    var endWidth = WIDTH - PLAYER_SIZE - PLAYER_PADDING;
    var endHeight = CARD_AREA_Y - PLAYER_SIZE - (4 * PLAYER_PADDING);

    var xLoc = [middleWidth, PLAYER_PADDING, middleWidth, endWidth];
    var yLoc = [PLAYER_PADDING, middleHeight, endHeight, middleHeight];

    var x = xLoc[index];
    var y = yLoc[index];
    var table = paper.image('images/avatars/O0' + (index + 1) + '.png', x, y, PLAYER_SIZE, PLAYER_SIZE);
    var name = paper.text(x + PLAYER_SIZE / 2, y + PLAYER_SIZE + PLAYER_PADDING, name);
    name.attr({'fill' : '#fff', 'font-size' : '14', 'font-family' : 'Helvetica', 'font-weight' : 'bold', 'fill-opacity' : '50%'});
}

function startGame() {
    var message = { 'command' : 'startGame', 'playerName' : 'Shanny Anoep'};
    game.sendMessage(message);
}

function dealFirstCards() {
    var message = { 'command' : 'dealFirstCards', 'playerIndex' : 0};
    game.sendMessage(message);
}

function chooseTrump(suit) {
    var message = { 'command' : 'chooseTrump', 'suit': suit, 'playerIndex' : 0};
    game.sendMessage(message);
}

$(document).ready(function() {
    paper = Raphael('canvas', WIDTH, HEIGHT);

    // rectangle with rounded corrners
    var bg = paper.rect(0, 0, WIDTH, HEIGHT);
    bg.attr({fill: '45-#000-#555'});

    var table = paper.image('images/green_poker_skin.png', TABLE_X, TABLE_Y, TABLE_WIDTH, TABLE_HEIGHT);
    var cardArea = paper.rect(0, CARD_AREA_Y, WIDTH, CARD_AREA_HEIGHT);
    cardArea.attr({'fill': '90-#161:5-#000:95', 'fill-opacity': 0.5, 'stroke-width': 0, 'opacity': 0.1});

    game = new Game();
    game.init();
});
