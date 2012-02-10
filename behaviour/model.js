function Player(id, index, name, isHuman, teamName) {
  this.index = index;
  this.id = id;
  this.name = name;
  this.teamName = teamName;
  this.isHuman = Boolean(isHuman);
}

Player.prototype = {
  
  getTeamName: function() {
    return this.teamName;
  },

  getName: function() {
    return this.name;
  },

  getIndex: function() {
    return this.index;
  }
};
