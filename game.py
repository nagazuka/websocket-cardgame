import uuid
from player import Player
from cards import Card, Deck, HandInfo, PlayerMove

class ScoreKeeper:

  def __init__(self, players=None):
    self.teamScore = {}
    self.playerScore = {}
    for player in players:
      print player
      self.playerScore[player.name] = 0
      self.teamScore[player.team] = 0

  def registerWin(self, player):
    self.teamScore[player.team] = self.teamScore[player.team] + 1
    self.playerScore[player.name] = self.playerScore[player.name] + 1

  def isGameDecided(self):
    for score in self.teamScore.values():
      if score > 6:
        return True
    return False

  def getScores(self):
    scores = "Team Scores\n--------------\n"
    for team, score in self.teamScore.iteritems():
      scores = scores + "Team %s: %s\n" % (team, score)
    scores = scores + "\nPlayer Scores\n--------------\n"
    for player, score in self.playerScore.iteritems():
      scores = scores + "Player %s: %s\n" % (player, score)
    return scores

class CardGame:
  
  def __init__(self, players=None):
    self.id = uuid.uuid1()
    self.deck = self.createDeck()
    self.players = players
    self.startingPlayerIndex = 0
    self.scores = ScoreKeeper(self.players)
    self.state = "INITIALIZED"

  def createDeck(self):
    deck = Deck()
    deck.shuffle()
    return deck 
  
  def getHighestCard(self, cards):
    def getHigherCard(card1, card2):
      if card1.rank > card2.rank:
        return card1
      else:
        return card2
    return reduce(getHigherCard, cards)

  def getStartingPlayer(self):
    return self.players[self.startingPlayerIndex]
  
  def getNextPlayer(self, step):
    index = self.playingOrder[step]
    return self.players[index]
 
  def decideOrder(self):
    cards = self.deck.sample(len(self.players))
    
    for i in range(0,len(self.players)):
      print "%s drew %s" % (self.players[i], cards[i])

    highestCard = self.getHighestCard(cards)
    self.startingPlayerIndex = cards.index(highestCard)
    print "Starting player is: %s\n" % self.getStartingPlayer()
    self.setPlayingOrder()
  
    self.state = "ORDER_DECIDED"

  def dealFirstCards(self):
    print "Number of remaining cards: %s" % self.deck.size()
    for player in self.getPlayersInOrder():
      firstCards = self.deck.removeCards(5)
      player.addCards(firstCards)
    print "Number of remaining cards: %s" % self.deck.size()
  
  def chooseTrump(self, trumpSuit):
    self.trumpSuit = trumpSuit
    print "Trump is chosen as %s" % self.trumpSuit
    self.state = "TRUMP_CHOSEN"

  def dealCards(self):
    print "Number of remaining cards: %s" % self.deck.size()
    while self.deck.hasNext():
      for player in self.players:
        nextCard = self.deck.removeCard()
        player.addCard(nextCard)
    print "Number of remaining cards: %s" % self.deck.size()
    
    self.state = "DEALT"
  
  def isDecided(self):
    return self.scores.isGameDecided() or self.players[0].getNumberOfCards() == 0

  def getPlayers(self):
    return self.players
  
  def getPlayerById(self, id):
    player = filter(lambda p: p.id == id, self.players)[0]
    return player

  def getOrder(self):
   return self.playingOrder

  def setPlayingOrder(self):
    numPlayers = len(self.players)
    self.playingOrder =  [ (self.startingPlayerIndex + i) % numPlayers for i in range(0, numPlayers) ]

  def getPlayersInOrder(self):
    for i in self.getOrder():
      yield self.players[i]
  
if __name__ == "__main__":
  game = CardGame()
