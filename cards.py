import logging
import random


class Card:

    def __init__(self, suit=None, rank=None):
        assert suit != None and rank != None
        self.rank = rank
        self.suit = suit

    def __str__(self):
        return "[%s %s]" % (self.suit, self.rank)


class Deck:

    def __init__(self):
        self.cards = Deck.createDeck()

    @staticmethod
    def createDeck():
        values = range(2, 15)
        types = ["SPADES", "CLUBS", "HEARTS", "DIAMONDS"]

        deck = []
        for value in values:
            for type in types:
                deck.append(Card(type, value))
        return deck

    def sample(self, size):
        return random.sample(self.cards, size)

    def shuffle(self):
        random.shuffle(self.cards)

    def size(self):
        return len(self.cards)

    def removeCard(self):
        nextCard = self.cards.pop()
        return nextCard

    def removeCards(self, num=1):
        poppedElements = 0
        nextCards = []
        while poppedElements < num and self.hasNext():
            nextCard = self.cards.pop()
            nextCards.append(nextCard)
            poppedElements = poppedElements + 1
        return nextCards

    def hasNext(self):
        return len(self.cards) > 0


class PlayerMove:
    def __init__(self, player, card):
        self.player = player
        self.card = card

    def getPlayer(self):
        return self.player

    def getCard(self):
        return self.card


class HandInfo:
    def __init__(self):
        self.playerMoves = []
        self.index = 0

    def addPlayerMove(self, move):
        move.index = self.index
        self.playerMoves.append(move)
        self.index = self.index + 1

    def getMove(self, index=0):
        return self.playerMoves[index]

    def isComplete(self):
        return len(self.playerMoves) == 4

    def size(self):
        return len(self.playerMoves)

    def getAskedSuit(self):
        assert len(self.playerMoves) > 0
        return self.playerMoves[0].card.suit

    def getStep(self):
        return len(self.playerMoves)

    def decideWinner(self, trumpSuit):
        winningMove = self.playerMoves[0]
        for otherMove in self.playerMoves[1:]:
            winningCard = winningMove.getCard()
            otherCard = otherMove.getCard()
            if winningCard.suit == otherCard.suit and  \
                winningCard.rank < otherCard.rank:
                winningMove = otherMove
            elif winningCard.suit != otherCard.suit and \
                    otherCard.suit == trumpSuit:
                winningMove = otherMove
                logging.debug("CUT WITH TRUMP!")

        return winningMove
