import random

class Player:
 
  def __init__(self, name=None, team=None):
    self.name = name
    self.team = team
    self.cards = []

  def selectTrump(self):
    assert len(self.cards) > 0
    return self.cards[0].suit

  def chooseCutPosition(self, deckSize=52):
    return random.randint(1,52)

  def addCard(self, card=None):
    assert card != None
    self.cards.append(card) 
  
  def addCards(self, cards=None):
    assert cards != None
    self.cards.extend(cards) 

  def getCards(self):
    return self.cards

  def getNumberOfCards(self):
    return len(self.cards)

  def getNextMove(self, hand):
    choice = random.choice(self.cards)
    self.cards.remove(choice)
    return choice

  def __str__(self):
    return "Player %s (%s)" % (self.name, self.team)

class HumanPlayer(Player):
 
  def __init__(self, name=None, team=None, handler=None):
    self.name = name
    self.team = team
    self.cards = []
    self.handler = None

  def getNextMove(self, hand):
    choice = random.choice(self.cards)
    self.cards.remove(choice)
    return choice

  pass

class AIPlayer(Player):
  pass
