import tornado.ioloop
import tornado.web

from message import MessageHandler
from game import CardGame, ScoreKeeper
from cards import Card, HandInfo, PlayerMove
from player import HumanPlayer, Player


class GameServer():
    def __init__(self):
        self.players = []
        self.writer = None
        self.cardGame = None
        self.scores = None 
        self.hand = None

    def setWriter(self, writer):
        self.writer = writer

    @staticmethod
    def createPlayers(playerName="John Doe"):
        p1 = HumanPlayer(1, playerName, "A")
        p2 = Player(2, "Elvis Presley", "A")
        p3 = Player(3, "Bob Marley", "B")
        p4 = Player(4, "Jimi Hendrix", "B")
        return [p1, p3, p2, p4]

    def startGame(self, playerName):
        jsonResponse = {'response': 'startGame'}
        try:
            self.players = GameServer.createPlayers(playerName)
            self.cardGame = CardGame(self.players)
            self.scores = ScoreKeeper(self.players)

            jsonResponse['resultCode'] = 'SUCCESS'

            #self.cardGame.decideOrder()
            # override to set humanplayer as first
            self.cardGame.startingPlayerIndex = 0
            self.cardGame.setPlayingOrder()

            playersList = []
            i = 0
            for player in self.cardGame.getPlayers():
                playersList.append({'index': i, 'name': player.name,
                                    'id': player.id,
                                    'isHuman': isinstance(player,
                                                          HumanPlayer)})
                i = i + 1

            jsonResponse['players'] = playersList
            jsonResponse['playingOrder'] = self.cardGame.getOrder()
            jsonResponse['gameId'] = str(self.cardGame.id)

        except Exception as ex:
            self.writer.sendError(ex)
            raise

        self.writer.sendMessage(jsonResponse)

    def dealFirstCards(self, request):
        response = {'response': 'dealFirstCards'}
        try:
            self.cardGame.dealFirstCards()
            player = self.cardGame.getPlayerById(request['playerId'])
            firstCards = player.getCards()
            print "Total nr of cards: %s" % len(firstCards)

            response['cards'] = [{'rank': card.rank, 'suit': card.suit}
                           for card in firstCards]
        except Exception as ex:
            self.writer.sendError(ex)
            raise

        self.writer.sendMessage(response)

    def chooseTrump(self, request):
        jsonResponse = {'response': 'allCards'}
        try:
            trumpSuit = request['suit']
            self.cardGame.chooseTrump(trumpSuit)
            self.cardGame.dealCards()

            player = self.cardGame.getPlayerById(request['playerId'])
            allCards = player.getCards()
            print "Total nr of cards: %s" % len(allCards)
            jsonResponse['cards'] = [{'rank': card.rank, 'suit': card.suit}
                               for card in allCards]

        except Exception as ex:
            self.writer.sendError(ex)
            raise

        self.writer.sendMessage(jsonResponse)

    def askPlayers(self):
        jsonResponse = {'response': 'handPlayed'}
        while not self.hand.isComplete():
            player = self.cardGame.getNextPlayer(self.hand.getStep())

            print "Asking player %s for move" % player.name

            # asynchronous via websocket
            if isinstance(player, HumanPlayer):
                message = {}
                message['response'] = 'askMove'
                message['hand'] = self.hand
                self.writer.sendMessage(message)
                break
            else:
                card = player.getNextMove(self.hand)
                self.hand.addPlayerMove(PlayerMove(player, card))
                print "%s played %s" % (player.name, card)

        if self.hand.isComplete():
            winningMove = self.hand.decideWinner(self.cardGame.trumpSuit)
            winningPlayer = winningMove.getPlayer()

            print "Winner is %s\n" % winningPlayer

            self.scores.registerWin(winningPlayer)
            self.cardGame.changePlayingOrder(winningPlayer)

            jsonResponse['hand'] = self.hand
            jsonResponse['winningCard'] = winningMove.card
            jsonResponse['winningPlayerId'] = winningPlayer.id
            self.writer.sendMessage(jsonResponse)

    def madeMove(self, req):
        player = self.cardGame.getPlayerById(req['playerId'])
        playedCard = Card(req['suit'], req['rank'])

        try:
            self.hand.addPlayerMove(PlayerMove(player, playedCard))
            self.askPlayers()
        except Exception as ex:
            self.writer.sendError(ex)
            raise

    def playHand(self):
        try:
            if self.scores.isGameDecided():
                scores = self.scores.getScores()
                response = {'response': 'gameDecided', 'scores' : scores}
                self.writer.sendMessage(response)
            else:
                self.hand = HandInfo()
                self.askPlayers()

        except Exception as ex:
            self.writer.sendError(ex)
            raise


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html")

gameServer = GameServer()

application = tornado.web.Application([
    (r"/", MainHandler),
    (r"/websocket", MessageHandler, {"gameServer": gameServer}),
    (r"/presentation/(.*)", tornado.web.StaticFileHandler,
     {"path": "presentation"}),
    (r"/behaviour/(.*)", tornado.web.StaticFileHandler, {"path": "behaviour"}),
    (r"/config/(.*)", tornado.web.StaticFileHandler, {"path": "config"}),
    (r"/images/(.*)", tornado.web.StaticFileHandler, {"path": "images"}),
], debug=True)

if __name__ == "__main__":
    application.listen(8888)
    tornado.ioloop.IOLoop.instance().start()
