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
        logging.debug("Removing card %s" % card)
        logging.debug("Before remove card %s", len(self.cards))
        for c in self.cards:
          logging.debug("%s", c)
        #self.cards = [c for c in self.cards if c.rank != card.rank and  c.suit != card.suit]
        self.cards.remove(card)
        logging.debug("After remove card %s", len(self.cards))
        for c in self.cards:
          logging.debug("%s", c)

    def getCards(self):
        return self.cards

    def getNumberOfCards(self):
        return len(self.cards)

    def getNextMove(self, hand):
        choice = None
        if hand.size() > 0:
            candidates = [c for c in self.cards if c.suit ==
                          hand.getAskedSuit()]
            if len(candidates) > 0:
                choice = random.choice(candidates)
        if choice == None:
            choice = random.choice(self.cards)

        self.cards.remove(choice)
        return choice

    def __str__(self):
        return "Player %s (%s)" % (self.name, self.team)


class HumanPlayer(Player):

    pass
