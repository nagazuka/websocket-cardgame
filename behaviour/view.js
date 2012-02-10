var WIDTH = 750;
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
var TRUMPSUIT_PADDING = 18;

var PLAYER_MIDDLE_Y = (CARD_AREA_Y / 2) - (PLAYER_SIZE / 2);
var PLAYER_MIDDLE_X = (WIDTH / 2) - (PLAYER_SIZE / 2);
var PLAYER_END_X = WIDTH - PLAYER_SIZE - PLAYER_HORIZ_PADDING;
var PLAYER_END_Y = CARD_AREA_Y - PLAYER_SIZE - (4 * PLAYER_VERT_PADDING);

var PLAYER_X_ARR = [PLAYER_MIDDLE_X, PLAYER_END_X, PLAYER_MIDDLE_X, PLAYER_HORIZ_PADDING];
var PLAYER_Y_ARR = [PLAYER_VERT_PADDING, PLAYER_MIDDLE_Y, PLAYER_END_Y, PLAYER_MIDDLE_Y];

var CARD_MIDDLE_Y = (CARD_AREA_Y / 2) - (CARD_HEIGHT / 2);
var CARD_MIDDLE_X = (WIDTH / 2) - (CARD_WIDTH / 2);
var CARD_X_ARR = [CARD_MIDDLE_X, CARD_MIDDLE_X + 2*CARD_WIDTH, CARD_MIDDLE_X, CARD_MIDDLE_X - 2*CARD_WIDTH];
var CARD_Y_ARR = [CARD_MIDDLE_Y - 0.75*CARD_HEIGHT, CARD_MIDDLE_Y, CARD_MIDDLE_Y + 0.5*CARD_HEIGHT, CARD_MIDDLE_Y];

var PLAYER_MOVE_ANIMATE_TIME = 1000;

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


function View() {
    this.canvas = Raphael('canvas', WIDTH, HEIGHT);
    this.repository = new Repository();
}

View.prototype = {

    getCanvas: function() {
      return this.canvas;
    },
    
    getRepository: function() {
      return this.repository;
    },

    init: function() {
      var bg = this.getCanvas().rect(0, 0, WIDTH, HEIGHT);
      bg.attr({fill: '45-#000-#555'});

      var table = this.getCanvas().image('images/green_poker_skin.png', TABLE_X, TABLE_Y, TABLE_WIDTH, TABLE_HEIGHT);
      
      var cardArea = this.getCanvas().rect(0, CARD_AREA_Y, WIDTH, CARD_AREA_HEIGHT);
      cardArea.attr({'fill': '90-#161:5-#000:95', 'fill-opacity': 0.5, 'stroke-width': 0, 'opacity': 0.1});
    },
 
  //TODO: don't remove and create, set text to ""
  //TODO: use repository to store text component 
  //or init this.text to null
  drawText : function(content) {
    var x = WIDTH / 2;
    var y = HEIGHT / 2;

    if (this.text) {
      this.text.remove();
    }

    this.text = this.getCanvas().text(x, y, content);
    this.text.attr({'fill' : '#fff', 'font-size' : '24', 'font-family' : conf.font, 'font-weight' : 'bold', 'fill-opacity' : '100%', 'stroke' : '#aaa', 'stroke-width' : '1', 'stroke-opacity' : '100%'});
  },

  drawTrumpSuit: function(trumpSuit) {
    var content = "Troef"; 
    var trumpSuitText = this.getCanvas().text(TRUMPSUIT_PADDING, TRUMPSUIT_PADDING, content);
    trumpSuitText.attr({'font-size': 20,'text-anchor': 'start','fill': '#fff','font-family' : conf.font, 'font-weight' : 'bold'});

    var iconImage = conf.suitsDirectory + conf.suitIcons[trumpSuit];
    var trumpSuitIcon = this.getCanvas().image(iconImage, TRUMPSUIT_X, TRUMPSUIT_Y, TRUMPSUIT_SIZE, TRUMPSUIT_SIZE);

    this.repository.addElement(trumpSuitText, "trumpSuitText");
    this.repository.addElement(trumpSuitIcon, "trumpSuitIcon");
  },
};
