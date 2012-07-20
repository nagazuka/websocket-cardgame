'use strict';

(function(window, $, undefined) {

window.Card = Backbone.Model.extend({
});

var CardList = Backbone.Collection.extend({
  model: Card
});

window.cards = new CardList();

window.Player = Backbone.Model.extend({
  isHuman: function() {
    return this.get('isHuman');
  }
});

var PlayerList = Backbone.Collection.extend({
  model: Player
});

window.players = new PlayerList();


var PlayerMove = Backbone.Model.extend({
});

var PlayerMoveList = Backbone.Collection.extend({
  model: PlayerMove
});

window.playerMoves = new PlayerMoveList();

var Game = Backbone.Model.extend({

  defaults: {
    view : null,
    handler : null,
    cards : [],
    players : [],
    playerMoves : [],
    playingOrder : [],
    selectedCard : null,
    playerName : "Anoniem",
    playerTeam : null,
    cpuTeam : null
  },

  init: function() {
    this.handler.connect();
    this.view.drawBackground();
    this.initScores();
  },

  start: function() {
    this.handler.sendMessage({'command' : 'startGame', 'playerName' : this.get('playerName'), 'playerTeam': this.playerTeam, 'opponentTeam': this.cpuTeam});
  },

  nextGame: function() {
    this.handler.sendMessage({'command' : 'nextGame', 'playerName' : this.get('playerName'), 'playerTeam': this.playerTeam, 'opponentTeam': this.cpuTeam});
  },

  askFirstCards: function fn_askFirstCards () {
    this.handler.sendMessage({ 'command' : 'dealFirstCards', 'playerId' : this.get('humanPlayer').get('id')});
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
    var cards = this.get('cards');
    console.debug("Before addCards cards size: " + cards.length);
    cards = cards.concat(newCards);
    //TODO: why the unique?
    cards = _.uniq(cards, false, function(c) {
      return c.suit + '_' + c.rank;
    });
    this.set({'cards': cards});
    console.debug("After addCards cards size: " + this.get('cards').length);
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
    if (player.isHuman()) {
      this.set({'humanPlayer': player});
    }
    this.get('players').push(player);
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
  
  drawText: function(text, subscript) {
    this.view.drawText(text, subscript);
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
    this.view.drawPlayerCards(this.get('cards'), this.playingOrder);
    this.drawText(messages[conf.lang].chooseTrumpHeading, "");
    this.setCardClickHandler(this.chooseTrump);
  },

  handleAllCards: function(cards, trumpSuit) {
    this.drawTrumpSuit(trumpSuit);
    this.addCards(cards);
    this.view.drawPlayerCards(this.get('cards'), this.playingOrder);
    this.view.clearDeck();
    this.sendReady();
  },

  handleAskMove: function (playerMoves) {
    this.clearMoves();
    this.addAndDrawMoves(playerMoves);

    this.drawText(messages[conf.lang].yourTurn, "");
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
      this.drawText(messages[conf.lang].youWinHand, messages[conf.lang].clickToAdvance);
    } else {
      this.drawText(winningPlayer.name + messages[conf.lang].otherWinsHand, messages[conf.lang].clickToAdvance);
    }
    
    this.updateScores(scores);
    this.view.waitForNextHand();
  },  

  handleGameDecided: function (winningTeam, scores) {
    this.drawText(messages[conf.lang].gameDecided + winningTeam, "");
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
    console.debug("Setting cardClickHandler to: " + handler.name);
    this.cardClickHandler = handler;
  },
  
  setPlayerTeam: function(playerTeam) {
    this.playerTeam = playerTeam;
  },
  
  setCpuTeam: function(cpuTeam) {
    this.cpuTeam = cpuTeam;
  },
  
  setPlayerName: function(playerName) {
    var pName;
    if (playerName != null && playerName != '') {
      pName = playerName;
    } else {
      var code = "" + (Math.floor(Math.random() * 2500) + 1);
      pName = messages[conf.lang].playerPrefix + code;
    }
    this.set({'playerName': pName});
  },

  setView: function(view) {
    this.view = view;
  },

  setMessageHandler: function(handler) {
    this.handler = handler;
  }

});

window.game = new Game();

})(window, jQuery);
