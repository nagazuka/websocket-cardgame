import random


class Player:

    def __init__(self, id=1, name=None, team=None):
        self.id = id
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
