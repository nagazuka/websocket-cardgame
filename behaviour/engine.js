'use strict';

(function(window, $, undefined) {

window.Card = Backbone.Model.extend({
});

window.CardList = Backbone.Collection.extend({
  model: Card,

  subList: function(start, end) {
    var slicedArr = _.toArray(this).slice(start,end);
    return new CardList(slicedArr);
  },

  addCards: function(newCards) {
    var self = this;
    _.each(newCards, function(card) {
      self.add(card);
    });
  }
});

window.CardList.prototype.add = function(card) {
  var isDupe = this.any(function(_card) { 
    return _card.get('rank') === card.get('rank') 
      && _card.get('suit') === card.get('suit');
  });
  if (isDupe) {
    return false;
  }
  Backbone.Collection.prototype.add.call(this, card);
};
    

window.Player = Backbone.Model.extend({
  isHuman: function() {
    return this.get('isHuman');
  }
});

window.PlayerList = Backbone.Collection.extend({
  model: Player
});

window.PlayerMove = Backbone.Model.extend({
});

window.PlayerMoves = Backbone.Collection.extend({
  model: PlayerMove
});



window.Game = Backbone.Model.extend({

  defaults: {
    view : null,
    handler : null,
    playingOrder : [],
    selectedCard : null,
    playerName : "Anoniem",
    playerTeam : null,
    cpuTeam : null
  },

  init: function() {
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
    this.trumpSuit = card.get('suit');
    this.handler.sendMessage({'command' : 'chooseTrump', 'suit': card.get('suit'), 'playerId' : this.get('humanPlayer').get('id')});
  },
  
  makeMove: function fn_makeMove (card) {
    this.handler.sendMessage({'command' : 'makeMove', 'rank' : card.get('rank'), 'suit': card.get('suit'), 'playerIndex' : 0, 'playerId' :this.get('humanPlayer').get('id')});
    this.selectedCard = card;
    this.setCardClickHandler(this.noAction);
  },

  noAction: function fn_noAction (card) {
    this.view.drawText('Nu even niet :-)\nChill for a bit amigo...','');
  },

  sendReady: function() {
    this.handler.sendMessage({'command' : 'isReady'});
  },

  sortCards: function() {
    var grouped = _.groupBy(this.get('cards'), 'suit'); 
    _.each(grouped, function(cardList, index, list) {
      var sorted = _.sortBy(cardList, function(c) { return c.rank; });
      list[index] = sorted; 
    });
    var flattened = _.flatten(grouped);
    this.set('cards', flattened);
  },
  
  addPlayer: function(player) {
    if (player.isHuman()) {
      this.set({'humanPlayer': player});
    }
    this.get('players').push(player);
  },

  getPlayerById: function(id) {
    var player = _.find(this.get('players'), function (p) { return p.get('id') == id;});
    return player;
  },

  removeSelectedCard: function() {
    this.removeCard(this.selectedCard);
  },

  removeCard: function(card) {
    this.view.removePlayerCard(card);
    var allCards = this.get('cards');
    this.set('cards', _.without(allCards, card));
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

  addAndDrawMoves : function(newMoves) {
    var self = this;
    var currentStep = window.playerMoveList.length;
    _.each(newMoves, function(move, index, list) {
      if (move.get('seqNo') > currentStep) {
        window.playerMoveList.add(move);
        self.view.drawPlayerMove(move);
      }
    });
    this.drawText(messages[conf.lang].yourTurn, "");
  },
  
  initScores: function() {
    this.view.drawInitialScores([this.playerTeam, this.cpuTeam]);
  },

  updateScores: function(scores) {
    this.view.updateScores(scores);
  },

  handleFirstCards: function(cards) {
    playerCardList.addCards(cards);
    this.trigger('deal:firstCards', this.playingOrder);
    this.setCardClickHandler(this.chooseTrump);
  },

  handleAllCards: function(cards, trumpSuit) {
    playerCardList.addCards(cards);
    this.trigger('trump:chosen', trumpSuit);
    this.trigger('deal:restOfCards',this.playingOrder);
    this.sendReady();
  },

  handleAskMove: function (newMoves) {
    this.trigger('game:askMove');
    this.addAndDrawMoves(newMoves);
    this.setCardClickHandler(this.makeMove);
  },
  
  handleInvalidMove: function (response) {
    this.drawError(messages[conf.lang].invalidMoveHeading, messages[conf.lang].invalidMove); 
    this.setCardClickHandler(this.makeMove);
  },

  handleHandPlayed: function (newMoves, winningPlayerId, scores) {
    this.removeSelectedCard();
    this.clearError();

    this.addAndDrawMoves(newMoves);

    var winningPlayer = this.getPlayerById(winningPlayerId);
    if (winningPlayer.get('id') == this.get('humanPlayer').get('id')) {
      this.drawText(messages[conf.lang].youWinHand, messages[conf.lang].clickToAdvance);
    } else {
      this.drawText(winningPlayer.get('name') + messages[conf.lang].otherWinsHand, messages[conf.lang].clickToAdvance);
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
    this.trigger("game:next");
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


})(window, jQuery);
