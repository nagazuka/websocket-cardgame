import random
import logging


class Player:

    def __init__(self, playerId, name=None, team=None):
        self.id = playerId
        self.name = name
        self.team = team
        self.cards = []

    def selectTrump(self):
        assert len(self.cards) > 0
        return self.cards[0].suit

    @staticmethod
    def chooseCutPosition(deckSize=52):
        return random.randint(1, deckSize)

    def addCard(self, card=None):
        assert card != None
        self.cards.append(card)

    def addCards(self, cards=None):
        assert cards != None
        self.cards.extend(cards)

    def removeCard(self, card=None):
        assert card != None
        self.cards.remove(card)

    def getCards(self):
        return self.cards

    def getNumberOfCards(self):
        return len(self.cards)

    def getSameSuitCards(self, suit):
        return [c for c in self.cards if c.suit == suit]

    @staticmethod
    def getHighestRankedCard(cards):
        if (len(cards) > 0):
          cards.sort(key=lambda c: c.rank)
          return cards[0]
        else:
          return None 

    @staticmethod
    def getLowestRankedCard(cards):
        if (len(cards) > 0):
          cards.sort(key=lambda c: c.rank, reverse=True)
          return cards[0]
        else:
          return None 

    def getHighestCard(self, suit):
        sameSuit = self.getSameSuitCards(suit)
        return Player.getHighestRankedCard(sameSuit)

    def getLowestCard(self, suit):
        sameSuit = self.getSameSuitCards(suit)
        return Player.getLowestRankedCard(sameSuit)

    #TODO: check whether teammate is making this hand, adjust strategy
    #TODO: don't always use highest trump card, but keep slightly higher than required
    #TODO: don't play highest card when somebody already cut with trump
    def getNextMove(self, hand, trumpSuit):
        choice = None
        if hand.size() > 0:
            candidates = [c for c in self.cards if c.suit ==
                          hand.getAskedSuit()]
            if len(candidates) > 0:
                choice = Player.getHighestRankedCard(candidates)
            else:
                choice = self.getHighestCard(trumpSuit)
 
        if choice == None:
            choice = Player.getLowestRankedCard(self.cards)

        self.cards.remove(choice)
        return choice

    def __str__(self):
        return "Player %s (%s)" % (self.name, self.team)


class HumanPlayer(Player):

    pass
