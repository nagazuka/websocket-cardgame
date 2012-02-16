import logging
import random


class Card:

    def __init__(self, suit=None, rank=None):
        assert suit != None and rank != None
        self.rank = rank
        self.suit = suit

    def __str__(self):
        return "[%s %s]" % (self.suit, self.rank)

    def getRank(self):
        return self.rank

    def getSuit(self):
        return self.suit

class Deck:

    def __init__(self):
        self.cards = Deck.createDeck()

    @staticmethod
    def createDeck():
        values = range(2, 15)
        suits = ["SPADES", "CLUBS", "HEARTS", "DIAMONDS"]

        deck = []
        for value in values:
            for suit in suits:
                deck.append(Card(suit, value))
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
        self.sequenceNumber = -1

    def getPlayer(self):
        return self.player

    def getCard(self):
        return self.card

    def setSequenceNumber(self, seqNo):
        self.sequenceNumber = seqNo

class HandInfo:
    def __init__(self):
        self.playerMoves = []
        self.count = 0
    
    def addPlayerMove(self, move):
        self.count = self.count + 1
        move.setSequenceNumber(self.count)

        self.playerMoves.append(move)

    def getMove(self, index):
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

    def validatePlayerMove(self, move, trumpSuit):
        #the first move is always valid
        if len(self.playerMoves) == 0:
            return True

        firstCard = self.playerMoves[0].getCard() 
        askedSuit = firstCard.suit
       
        player = move.getPlayer()
        remainingCards = player.getCards() 
        logging.debug("Asked suit %s", askedSuit)
        logging.debug("Remaining cards %s", len(remainingCards))
        remainingAskedSuit = [card for card in remainingCards if card.suit == askedSuit]
        logging.debug("Remaining askedSuit %s", len(remainingAskedSuit))
        if len(remainingAskedSuit) == 0:
            return True

        moveCard = move.getCard()
        moveSuit = moveCard.suit
        if moveSuit == askedSuit:
            return True

        logging.debug("PlayedMove %s not valid for current hand %s", move, self)
        return False

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
