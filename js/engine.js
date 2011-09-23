$(document).ready(function() {
    var paper = Raphael("canvas", 550, 450);
    // rectangle with rounded corrners
    //
    var bg = paper.rect(0, 0, 550, 450);
    bg.attr({fill: "45-#000-#555"});
    var table = paper.image("images/ft_green_poker_skin.png", 20, 30, 500, 350);

    for (i=2; i < 10; i++) {
      var card = paper.image("images/cards/simple_c_" + i + ".svg.png", 100 + i*20, 320, 45, 70);
    }

});
