var WIDTH = 760;
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

var PLAYER_VERT_PADDING = 10;
var PLAYER_HORIZ_PADDING = 35;
var PLAYER_SIZE = 100;
var TEAM_FLAG_SIZE = 64;
var TRUMPSUIT_SIZE = 64;

var TRUMPSUIT_X = 10;
var TRUMPSUIT_Y = 35;
var TRUMPSUIT_PADDING = 16;

var PLAYER_MIDDLE_Y = (CARD_AREA_Y / 2) - (PLAYER_SIZE / 2);
var PLAYER_MIDDLE_X = (WIDTH / 2) - (PLAYER_SIZE / 2);
var PLAYER_END_X = WIDTH - PLAYER_SIZE - PLAYER_HORIZ_PADDING;
var PLAYER_END_Y = CARD_AREA_Y - PLAYER_SIZE - (4 * PLAYER_VERT_PADDING);

var PLAYER_X_ARR = [PLAYER_MIDDLE_X, PLAYER_HORIZ_PADDING, PLAYER_MIDDLE_X, PLAYER_END_X];
var PLAYER_Y_ARR = [PLAYER_END_Y, PLAYER_MIDDLE_Y, PLAYER_VERT_PADDING, PLAYER_MIDDLE_Y];

var CARD_MIDDLE_Y = (CARD_AREA_Y / 2) - (CARD_HEIGHT / 2);
var CARD_MIDDLE_X = (WIDTH / 2) - (CARD_WIDTH / 2);
var CARD_X_ARR = [CARD_MIDDLE_X, CARD_MIDDLE_X - 2*CARD_WIDTH,CARD_MIDDLE_X, CARD_MIDDLE_X + 2*CARD_WIDTH];
var CARD_Y_ARR = [CARD_MIDDLE_Y + 0.5*CARD_HEIGHT, CARD_MIDDLE_Y, CARD_MIDDLE_Y - 0.75*CARD_HEIGHT, CARD_MIDDLE_Y];

var PLAYER_MOVE_ANIMATE_TIME = 1000;
var SUIT_TRANSLATION_TABLE = { 'DIAMONDS' : 'd', 'CLUBS' : 'c', 'SPADES' : 's', 'HEARTS' : 'h'};
var RANK_TRANSLATION_TABLE = [undefined, undefined, '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a'];

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

  findElement: function(id, category) {
    var allElements = this.getElementsByCategory(category);
    var element =  _.find(allElements, function(e) { return e.id == id }); 
    return element;
  },

  addElement: function(element, category) {
    this.createIfEmpty(category);
    this[category].push(element);
  }
};


function View(game) {
    this.game = game;
    this.canvas = Raphael('canvas', WIDTH, HEIGHT);
    this.repository = new Repository();
    this.animationQueue = [];
    this.progressOverlay = null;
}

View.prototype = {

    setGame: function(game) {
      this.game = game;
    },

    getCanvas: function() {
      return this.canvas;
    },
    
    getRepository: function() {
      return this.repository;
    },

    preload: function() {
      this.drawProgressOverlay();
      var loader = this.initPxLoader(); 
      loader.start();
    },

    drawProgressOverlay: function() {
      $('#canvas').hide();
      $('#scoreContainer').hide();
      $('#progressOverlay').show();
    },

    updateProgressOverlay: function(e) {
      var loadStr = 'Loading';
      var i;
      for(i=0; i < e.completedCount % 3; i++) {
        loadStr += ".";
      }
      $('#txtLoading').text(loadStr);
    },

    clearProgressOverlay: function() {
      $('#progressOverlay').hide();
      $('#canvas').show();
      $('#scoreContainer').show();
    },

    init: function() {
      var bg = this.getCanvas().rect(0, 0, WIDTH, HEIGHT);
      bg.attr({fill: '45-#000-#555'});

      var table = this.getCanvas().image(this.getTableImageFile(), TABLE_X, TABLE_Y, TABLE_WIDTH, TABLE_HEIGHT);
      
      var cardArea = this.getCanvas().rect(0, CARD_AREA_Y, WIDTH, CARD_AREA_HEIGHT);
      cardArea.attr({'fill': '90-#161:5-#000:95', 'fill-opacity': 0.5, 'stroke-width': 0, 'opacity': 0.1});
      
      if (this.progressOverlay) {
        this.progressOverlay.toFront();
      }
    },
  
    initPxLoader: function() {
      var self = this;

      var loader = new PxLoader();
      var tableImage = this.getTableImageFile();
      loader.addImage(tableImage);
  
      var teamName; 
      for (teamName in conf.teamFlags) { 
        var teamImageFile = this.getTeamImageFile(teamName);
        loader.addImage(teamImageFile);
      }
      
      var suit; 
      var i;
      for (suit in SUIT_TRANSLATION_TABLE) {
        for(i=2; i < 13; i++) {
          var cardImageFile = this.getCardImageFile(i, suit);
          loader.addImage(cardImageFile);
        }
      }

      var trumpSuit;
      for (trumpSuit in conf.suitIcons) {
        var iconImage = this.getSuitImageFile(trumpSuit);
        loader.addImage(iconImage);
      }

      loader.addCompletionListener(function() {
          self.clearProgressOverlay();
      });

      loader.addProgressListener(function(e) {
          self.updateProgressOverlay(e);
      });

      return loader;
    },

  drawText : function(content) {
    var x = WIDTH / 2;
    var y = HEIGHT / 2;

    if (this.text) {
      this.text.attr({'text': content});
    } else {
      this.text = this.getCanvas().text(x, y, content);
      this.text.attr({'fill' : '#fff', 'font-size' : '24', 'font-family' : conf.font, 'font-weight' : 'bold', 'fill-opacity' : '100%', 'stroke' : '#aaa', 'stroke-width' : '1', 'stroke-opacity' : '100%'});
    }
    this.text.hide();
    this.animate(this.text, {'opacity': 1}, 100); 
  },

  drawTrumpSuit: function(trumpSuit) {
    var trumpSuitBg = this.getCanvas().rect(TRUMPSUIT_X, TRUMPSUIT_PADDING-10, TRUMPSUIT_X + TRUMPSUIT_SIZE, TRUMPSUIT_Y + TRUMPSUIT_SIZE+10, 25);
    trumpSuitBg.attr({'fill':'#0f0', 'fill-opacity':0.3,'stroke':'#555','stroke-width': 8});

    var content = "Troef"; 
    var trumpSuitText = this.getCanvas().text(TRUMPSUIT_PADDING, TRUMPSUIT_PADDING, content);
    trumpSuitText.attr({'font-size': 20,'text-anchor': 'start','fill': '#fff','font-family' : conf.font, 'font-weight' : 'bold'});
    var iconImage = this.getSuitImageFile(trumpSuit);
    var trumpSuitIcon = this.getCanvas().image(iconImage, TRUMPSUIT_X, TRUMPSUIT_Y, TRUMPSUIT_SIZE, TRUMPSUIT_SIZE);
    this.repository.addElement(trumpSuitText, "trumpSuit"); 
    this.repository.addElement(trumpSuitText, "trumpSuit");
    this.repository.addElement(trumpSuitIcon, "trumpSuit");
  },

  drawPlayerCards: function(cards) {
    var self = this;
    if (cards.length > 0) {
      var offset = 2 * CARD_AREA_PADDING;
      var stepSize = (CARD_AREA_WIDTH - offset) / cards.length;
      _.each(cards, function(card, i) {
        var cardImage = self.drawCard(card, i * stepSize + offset, CARD_AREA_Y + CARD_AREA_PADDING, CARD_WIDTH, CARD_HEIGHT, 'playerCards');
        self.repository.addElement(cardImage, 'playerCards');
      });
    }
  },

  processNextAnimation: function() {
    if (this.animationQueue.length > 0) {
      var obj = this.animationQueue[0].obj;
      var anim = this.animationQueue[0].animation;
      obj.show().stop().animate(anim);
    }
  }, 

  animate: function(obj, attr, time) {
    logger.debug("Animate object");
    var self = this;
    var callback = function () {
      self.animationQueue.shift();
      self.processNextAnimation();
    };
    var animation = Raphael.animation(attr, time, callback);
    
    this.animationQueue.push({'obj': obj, 'animation': animation});
    this.processNextAnimation();
  },

  drawPlayerMove: function(playerMove) {
    logger.debug("Drawing player move");

    var player = playerMove.getPlayer();
    var card = playerMove.getCard();
    var playerIndex = player.getIndex(); 

    var startX = PLAYER_X_ARR[playerIndex];
    var startY = PLAYER_Y_ARR[playerIndex];

    var endX = CARD_X_ARR[playerIndex];
    var endY = CARD_Y_ARR[playerIndex];

    var cardImage = this.drawCard(card, startX, startY, CARD_WIDTH, CARD_HEIGHT, 'playerMoves');
    cardImage.hide();
    this.animate(cardImage, {x: endX, y: endY}, PLAYER_MOVE_ANIMATE_TIME);
    this.repository.addElement(cardImage, 'playerMoves');
  },

  clearPlayerMoves: function() {
    logger.debug("Clearing all playerMoves");
    var playerMoves = this.repository.getElementsByCategory('playerMoves');
    _.each(playerMoves, function (pm) { 
      pm.remove(); 
    });
    this.repository.clearCategory('playerMoves');
  },

  getCardId: function(card, category) {
    var id = category + "_" + card.rank + "_" + card.suit;
    return id;
  },

  removePlayerCard: function(card) {
    var id = this.getCardId(card,'playerCards');
    var cardImage = this.repository.findElement(id, 'playerCards');
    cardImage.remove();
  },

  clearPlayerCards: function() {
    var playerCards = this.repository.getElementsByCategory('playerCards');
    _.each(playerCards, function(c) { c.remove(); });
    this.repository.clearCategory("playerCards");
  },

  drawCard: function(card, x, y, width, height, category) {
    var self = this;
    var cardImage = this.getCanvas().image(this.getCardImageFile(card.rank, card.suit), x, y, width, height);

    cardImage.mouseover(function(event) {
        this.attr({'height': CARD_HEIGHT * 2, 'width': CARD_WIDTH * 2});
    });
    cardImage.mouseout(function(event) {
        this.attr({'height': CARD_HEIGHT, 'width': CARD_WIDTH});
    });

    cardImage.click(function(event) {
        console.log("DEBUG in cardImage clickEventHandler");
        self.game.handleCardClicked(card);
    });

    cardImage.id = this.getCardId(card, category);
    return cardImage;
  },

  drawPlayer: function(player) {
    var canvas = this.getCanvas();
    var playerX = PLAYER_X_ARR[player.getIndex()];
    var playerY = PLAYER_Y_ARR[player.getIndex()];
    var flagX = playerX - 0.25*TEAM_FLAG_SIZE;
    var flagY = playerY - 0.25*TEAM_FLAG_SIZE;

    var teamName = player.getTeamName();
    var teamImage = this.getTeamImageFile(teamName);
    var teamFlag = canvas.image(teamImage, flagX, flagY,  TEAM_FLAG_SIZE, TEAM_FLAG_SIZE);

    var playerImage = canvas.image(this.getPlayerImageFile(), playerX, playerY, PLAYER_SIZE, PLAYER_SIZE);

    var playerName = player.getName();
    var nameTxt = canvas.text(playerX + PLAYER_SIZE / 2, playerY + PLAYER_SIZE + PLAYER_VERT_PADDING, playerName);
    nameTxt.attr({'fill' : '#fff', 'font-size' : '14', 'font-family' : conf.font, 'font-weight' : 'bold', 'fill-opacity' : '50%'});
  },
  
  waitForEvent: function() {
    var self = this;

    var overlay = this.getCanvas().rect(0, 0, WIDTH, HEIGHT);
    overlay.attr({fill: "#000", stroke: "none", opacity: '0.1'}); 
    overlay.hide();
    overlay.mouseup(function(event) {
      self.game.sendReady(); 
      overlay.remove();
    }); 
    this.animate(overlay, {opacity: '0.3'}, 100);
  },
  
  getCardImageFile : function(rank, suit) {
    return conf.cardsDirectory + 'simple_' + SUIT_TRANSLATION_TABLE[suit] + '_' + RANK_TRANSLATION_TABLE[rank] + '.png';
  },
  
  getPlayerImageFile: function() {
    var charCode = Math.floor(Math.random() * 15) + 65;
    var letter = String.fromCharCode(charCode);
    var number = Math.floor(Math.random() * 5) + 1;
    return conf.avatarDirectory + letter + '0' + number + '.png';
  },

  getTeamImageFile: function(teamName) {
    if (!(teamName in conf.teamFlags)) {
      teamName = 'default';
    }
    return conf.flagDirectory + conf.teamFlags[teamName];
  },

  getSuitImageFile: function(trumpSuit) {
    return conf.suitsDirectory + conf.suitIcons[trumpSuit];
  },

  getTableImageFile: function(trumpSuit) {
    return conf.imageDir + 'green_poker_skin.png';
  }
};
