var WIDTH = 650
var HEIGHT = 600

var TABLE_WIDTH = 500;
var TABLE_HEIGHT = 350;

var CARD_WIDTH = 45;
var CARD_HEIGHT = 70;

var CARD_AREA_WIDTH = WIDTH
var CARD_AREA_HEIGHT = CARD_WIDTH * 2
var CARD_AREA_Y = HEIGHT - CARD_AREA_HEIGHT
var CARD_AREA_PADDING = 10

var TABLE_X = (WIDTH - TABLE_WIDTH) / 2
var TABLE_Y = (HEIGHT - TABLE_HEIGHT - CARD_AREA_HEIGHT) / 2

var PLAYER_PADDING = 10;
var PLAYER_SIZE = 100;

var SUIT_TRANSLATION_TABLE = new Array()
  SUIT_TRANSLATION_TABLE["DIAMONDS"] = "d"
  SUIT_TRANSLATION_TABLE["CLUBS"] = "c"
  SUIT_TRANSLATION_TABLE["SPADES"] = "s"
  SUIT_TRANSLATION_TABLE["HEARTS"] = "h"

var RANK_TRANSLATION_TABLE = [undefined, undefined,"2","3","4","5","6","7","8","9","j","q","k","a"]

var wsURL = "ws://" + conf.network.hostName + ":" + conf.network.portNumber + "/websocket";
var ws = new WebSocket(wsURL);

var paper;

function initGame() {

  ws.onopen = function() {
    startGame();
  };

  ws.onmessage = function (evt) {
    handleMessage(evt.data);
  };
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
  playerList = response.players;
  for(i=0; i<playerList.length; i++) {
    drawPlayer(playerList[i].index, playerList[i].name);
  }

  dealFirstCards();
}

function handleDealFirstCardsResponse(response) {
  cards = response.cards
  drawCards(cards)
}

function handleAllCardsResponse(response) {
  cards = response.cards
  drawCards(cards)
}

function getCardImageFileName(card) {
  return "images/cards/simple_" + SUIT_TRANSLATION_TABLE[card.suit] + "_" + RANK_TRANSLATION_TABLE[card.rank] + ".png"
}

function drawCards(cards) {
    var offset = 2 * CARD_AREA_PADDING;
    var stepSize = (CARD_AREA_WIDTH - offset) / cards.length;
    alert(offset);
    alert(stepSize);
    for (i=0; i < cards.length; i++) {

      var cardImage = paper.image(getCardImageFileName(cards[i]), i*stepSize + offset, CARD_AREA_Y + CARD_AREA_PADDING, CARD_WIDTH, CARD_HEIGHT);
      cardImage.card = cards[i] 

      cardImage.mouseover(function (event) {
        this.attr({'height': CARD_HEIGHT * 2, 'width': CARD_WIDTH * 2});
      });
      cardImage.mouseout(function (event) {
        this.attr({'height': CARD_HEIGHT, 'width': CARD_WIDTH});
      });
      cardImage.click(function (event) {
        alert("Chosen " + this.card.rank + " " + this.card.suit);
        chooseTrump(this.card.suit);
      });
    }
}

function drawPlayer(index, name) {
    var middleHeight = (CARD_AREA_Y / 2) - (PLAYER_SIZE / 2);
    var middleWidth = (WIDTH / 2) - (PLAYER_SIZE / 2);
    var endWidth = WIDTH - PLAYER_SIZE - PLAYER_PADDING;
    var endHeight = CARD_AREA_Y - PLAYER_SIZE - (4 * PLAYER_PADDING);

    var xLoc = [middleWidth, PLAYER_PADDING, middleWidth, endWidth]; 
    var yLoc = [PLAYER_PADDING, middleHeight, endHeight, middleHeight]; 

    var x = xLoc[i]
    var y = yLoc[i]
    var table = paper.image("images/avatars/O0" + (index+1) + ".png", x, y, PLAYER_SIZE, PLAYER_SIZE);
    var name = paper.text(x + PLAYER_SIZE / 2, y + PLAYER_SIZE + PLAYER_PADDING, name);
    name.attr({'fill' : '#fff', 'font-size' : '14', 'font-family' : 'Helvetica', 'font-weight' : 'bold', 'fill-opacity' : '50%'});
}

function startGame() {
    message = { "command" : "startGame", 'playerName' : 'Shanny Anoep'};
    sendMessage(this, message);
}

function dealFirstCards() {
    message = { "command" : "dealFirstCards", 'playerIndex' : 0};
    sendMessage(this, message);
}

function chooseTrump(suit) {
    message = { "command" : "chooseTrump", "suit": suit, 'playerIndex' : 0};
    sendMessage(this, message);
}

$(document).ready(function() {
    paper = Raphael("canvas", WIDTH, HEIGHT);

    // rectangle with rounded corrners
    var bg = paper.rect(0, 0, WIDTH, HEIGHT);
    bg.attr({fill: "45-#000-#555"});

    var table = paper.image("images/green_poker_skin.png", TABLE_X, TABLE_Y, TABLE_WIDTH, TABLE_HEIGHT);
    var cardArea = paper.rect(0, CARD_AREA_Y, WIDTH, CARD_AREA_HEIGHT);
    cardArea.attr({"fill": "90-#161:5-#000:95","fill-opacity": 0.5, "stroke-width": 0, "opacity": 0.1});
    initGame();
});
