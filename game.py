import uuid
from player import Player, HumanPlayer, AIPlayer
from cards import Card, Deck, HandInfo, PlayerMove

class ScoreKeeper:

  def __init__(self, players=None):
    self.teamScore = {}
    self.playerScore = {}
    for player in players:
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
  
  def __init__(self):
    self.id = uuid.uuid1()
    self.deck = self.createDeck()
    self.players = self.createPlayers()
    self.startingPlayerIndex = 0
    self.scores = ScoreKeeper(self.players)
    self.state = "INITIALIZED"

  def createDeck(self):
    deck = Deck()
    deck.shuffle()
    return deck 
  
  def createPlayers(self, playerName="John Doe"):
    p1 = HumanPlayer(playerName, "A")
    p2 = Player("Elvis Presley","A")
    p3 = Player("Bob Marley", "B")
    p4 = Player("Amy Winehouse", "B")
    return [p1,p3,p2,p4]

  def getHighestCard(self, cards):
    def getHigherCard(card1, card2):
      if card1.rank > card2.rank:
        return card1
      else:
        return card2
    return reduce(getHigherCard, cards)

  def getStartingPlayer(self):
    return self.players[self.startingPlayerIndex]
  
  def decideOrder(self):
    cards = self.deck.sample(len(self.players))
    
    for i in range(0,len(self.players)):
      print "%s drew %s" % (self.players[i], cards[i])

    highestCard = self.getHighestCard(cards)
    self.startingPlayerIndex = cards.index(highestCard)
    print "Starting player is: %s\n" % self.getStartingPlayer()

    self.state = "ORDER_DECIDED"
  
  def chooseTrump(self):
    for player in self.getPlayersInOrder():
      firstCards = self.deck.removeCards(5)
      player.addCards(firstCards)

    firstPlayer = self.getStartingPlayer()
    self.trumpSuit = firstPlayer.selectTrump()
  
    print "Trump is chosen as %s" % self.trumpSuit
    
    self.state = "TRUMP_CHOSEN"

  def dealCards(self):
    while self.deck.hasNext():
      for player in self.players:
        nextCard = self.deck.removeCard()
        player.addCard(nextCard)
    
    self.state = "DEALT"
  
  def playHand(self):
    hand = HandInfo()

    for player in self.getPlayersInOrder():
      card = player.getNextMove()
      hand.addPlayerMove(PlayerMove(player, card))
      print "%s played %s" % (player.name,card)

    winningMove = hand.decideWinner(self.trumpSuit)
    winningPlayer = winningMove.getPlayer()
    self.scores.registerWin(winningPlayer)
    self.startingPlayerIndex = self.players.index(winningPlayer)

    print "Winner is %s\n" % winningPlayer

    if self.scores.isGameDecided() or self.players[0].getNumberOfCards() == 0:
      self.state = "FINISHED"

  def getPlayersInOrder(self):
   numPlayers = len(self.players)
   playingOrder =  [ (self.startingPlayerIndex + i) % numPlayers for i in range(0, numPlayers) ]
   for i in playingOrder:
     yield self.players[i]

  
  def loop(self):
    self.state = "INITIALIZED"
    print "Game started..."
    while self.state != "FINISHED":
      if self.state == "INITIALIZED":
        self.decideOrder()
      if self.state == "ORDER_DECIDED":
        self.chooseTrump()
      if self.state == "TRUMP_CHOSEN":
        self.dealCards()
      elif self.state == "DEALT":
        self.playHand()
    
    print "Game finished...\n"
    print self.scores.getScores()

  def start(self):
    self.loop()

if __name__ == "__main__":
  game = CardGame()
  game.start()

