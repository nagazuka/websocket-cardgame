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

function View() {
    this.canvas = Raphael('canvas', WIDTH, HEIGHT);
}

View.prototype = {
    getCanvas: function() {
      return this.canvas;
    }
};
