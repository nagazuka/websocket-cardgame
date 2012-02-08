import logging

import tornado.ioloop
import tornado.web
import tornado.websocket

from message import MessageWriter
from game import CardGame, ScoreKeeper
from cards import Card, HandInfo, PlayerMove
from player import HumanPlayer, Player
import settings


class GameServer:
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
        p1 = HumanPlayer(1, playerName, "Team Suriname")
        p2 = Player(2, "Elvis Presley", "Team Suriname")
        p3 = Player(3, "Bob Marley", "Team Nederland")
        p4 = Player(4, "Jimi Hendrix", "Team Nederland")
        return [p1, p3, p2, p4]

    def startGame(self, req):
        jsonResponse = {'response': 'startGame'}
        try:
            playerName = req['playerName']
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
            logging.debug("Total nr of cards: %s", len(firstCards))

            response['cards'] = [{'rank': card.rank, 'suit': card.suit}
                           for card in firstCards]
        except Exception as ex:
            self.writer.sendError(ex)
            raise

        self.writer.sendMessage(response)

    def chooseTrump(self, request):
        response = {'response': 'allCards'}
        try:
            trumpSuit = request['suit']
            self.cardGame.chooseTrump(trumpSuit)
            self.cardGame.dealCards()

            player = self.cardGame.getPlayerById(request['playerId'])
            allCards = player.getCards()
            logging.debug("Total nr of cards: %s", len(allCards))
            response['cards'] = [{'rank': card.rank, 'suit': card.suit}
                               for card in allCards]
            response['trumpSuit'] = trumpSuit

            self.writer.sendMessage(response)

        except Exception as ex:
            self.writer.sendError(ex)
            raise


    def askPlayers(self):
        jsonResponse = {'response': 'handPlayed'}
        while not self.hand.isComplete():
            player = self.cardGame.getNextPlayer(self.hand.getStep())

            logging.debug("Asking player %s for move", player.name)

            # asynchronous via websocket
            if isinstance(player, HumanPlayer):
                message = {}
                message['response'] = 'askMove'
                message['hand'] = self.hand
                self.writer.sendMessage(message)
                break
            else:
                card = player.getNextMove(self.hand)
                self.hand.addPlayerMove(PlayerMove(player, card, []))
                logging.debug("%s played %s", player.name, card)

        if self.hand.isComplete():
            winningMove = self.hand.decideWinner(self.cardGame.trumpSuit)
            winningPlayer = winningMove.getPlayer()

            logging.debug("Winner is %s\n", winningPlayer)

            self.scores.registerWin(winningPlayer)
            self.cardGame.changePlayingOrder(winningPlayer)

            jsonResponse['hand'] = self.hand
            jsonResponse['winningCard'] = winningMove.card
            jsonResponse['winningPlayerId'] = winningPlayer.id
            self.writer.sendMessage(jsonResponse)

    def makeMove(self, req):
        try:
            player = self.cardGame.getPlayerById(req['playerId'])
            playedCard = Card(req['suit'], req['rank'])
            remainingCards = [ Card(c['suit'], c['rank']) for c in req['remainingCards']]
            logging.debug("remainingCards: %s", remainingCards)

            playerMove = PlayerMove(player, playedCard, remainingCards)
            validMove = self.hand.validatePlayerMove(playerMove, self.cardGame.trumpSuit)
            if not validMove:
                response = {'response': 'invalidMove', 'playerId': req['playerId']}
                self.writer.sendMessage(response)
            else:
                self.hand.addPlayerMove(playerMove)
                self.askPlayers()

        except Exception as ex:
            self.writer.sendError(ex)
            raise

    def isReady(self, req):
        try:
            if self.scores.isGameDecided():
                scores = self.scores.getScores()
                winningTeam = self.scores.getWinningTeam()
                response = {'response': 'gameDecided', 'scores': scores,
                            'winningTeam': winningTeam}
                self.writer.sendMessage(response)
            else:
                self.hand = HandInfo()
                self.askPlayers()

        except Exception as ex:
            self.writer.sendError(ex)
            raise

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("template/index.html")

class AboutHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("template/about.html")

class ContactHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("template/contact.html")

class MessageHandler(tornado.websocket.WebSocketHandler):

    def open(self):
        logging.info("Websocket opened")

        self.gameServer = GameServer()
        writer = MessageWriter(self)
        self.gameServer.setWriter(writer)

    def on_message(self, message):
        req = tornado.escape.json_decode(message)
        logging.debug("Message received: %s", req)
        methodName = req['command']
        if hasattr(self.gameServer, methodName):
            getattr(self.gameServer, methodName)(req)
        else:
            logging.error("Received unknown command [%s]", methodName)

    def on_close(self):
        logging.info("Websocket closed")
        self.gameServer = None

if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)

    gameServer = GameServer()

    application = tornado.web.Application([
    (r"/", MainHandler),
    (r"/index.html", MainHandler),
    (r"/about.html", AboutHandler),
    (r"/contact.html", ContactHandler),
    (r"/websocket", MessageHandler),
    (r"/presentation/(.*)", tornado.web.StaticFileHandler,
     {"path": "presentation"}),
    (r"/behaviour/(.*)", tornado.web.StaticFileHandler, {"path": "behaviour"}),
    (r"/config/(.*)", tornado.web.StaticFileHandler, {"path": "config"}),
    (r"/images/(.*)", tornado.web.StaticFileHandler, {"path": "images"}),
], debug=True)

    application.listen(settings.PORT_NUMBER)
    tornado.ioloop.IOLoop.instance().start()
