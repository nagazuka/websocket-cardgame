import tornado.ioloop
import tornado.web
import tornado.websocket

import json

from game import CardGame
from cards import Card, Deck, HandInfo, PlayerMove
from player import HumanPlayer, Player

class MessageHandler():
  def __init__(self, socket):
    self.socket = socket

  def convert_to_builtin_type(self, obj):
    print 'default(', repr(obj), ')'
    # Convert objects to a dictionary of their representation
    d = { '__class__':obj.__class__.__name__, 
          '__module__':obj.__module__,
          }
    d.update(obj.__dict__)
    return d

  def sendMessage(self, message):
    self.socket.write_message(json.dumps(message, default=self.convert_to_builtin_type))
  
  def sendError(self, exception):
    jsonResponse = {}
    jsonResponse['resultCode'] = 'FAILURE' 
    jsonResponse['resultMessage'] = str(exception)
    self.socket.sendMessage(jsonResponse)

class GameServer():
  def __init__(self, handler):
    self.handler = handler

  
  def createPlayers(self, playerName="John Doe"):
    p1 = HumanPlayer(playerName, "A", self.handler)
    p2 = Player("Elvis Presley","A")
    p3 = Player("Bob Marley", "B")
    p4 = Player("Amy Winehouse", "B")
    return [p1,p3,p2,p4]

  def startGame(self, playerName):
    jsonResponse = {'response' : 'startGame'}
    try:
      self.players = self.createPlayers(playerName)
      self.cardGame = CardGame(self.players)

      jsonResponse['resultCode'] = 'SUCCESS'

      self.cardGame.decideOrder()
     
      playersList = []
      i = 0
      for player in self.cardGame.getPlayers():
        playersList.append( {'index' : i, 'name': player.name} )
        i = i + 1

      jsonResponse['players'] = playersList
      jsonResponse['playingOrder'] = self.cardGame.getOrder()
      jsonResponse['gameId'] = str(self.cardGame.id)

    except Exception as ex:
      self.handler.sendError(ex)
      raise

    self.handler.sendMessage(jsonResponse)

  def dealFirstCards(self, jsonReq):
    jsonResponse = {'response' : 'dealFirstCards'}
    try:
      index = int(jsonReq['playerIndex'])
      self.cardGame.dealFirstCards()
      firstCards = self.cardGame.players[index].getCards()
      
      jsonResponse['cards'] = [{'rank' : card.rank, 'suit' : card.suit} for card in firstCards]
    except Exception as ex:
      self.handler.sendError(ex)
      raise

    self.handler.sendMessage(jsonResponse)
  
  def chooseTrump(self, jsonReq):
    jsonResponse = {'response' : 'allCards'}
    try:
      index = int(jsonReq['playerIndex'])
      trumpSuit = jsonReq['suit']
      self.cardGame.chooseTrump(trumpSuit)
      self.cardGame.dealCards() 

      allCards = self.cardGame.players[index].getCards()
      jsonResponse['cards'] = [{'rank' : card.rank, 'suit' : card.suit} for card in allCards]

    except Exception as ex:
      self.handler.sendError(ex)
      raise

    self.handler.sendMessage(jsonResponse)
  
  def registerReady(self, jsonReq):
    jsonResponse = {'response' : 'handPlayed'}
    try:
      hand = HandInfo()
      for player in self.cardGame.getPlayersInOrder():
        card = player.getNextMove(hand)
        hand.addPlayerMove(PlayerMove(player, card))
        print "%s played %s" % (player.name,card)
        
      winningMove = hand.decideWinner(self.cardGame.trumpSuit)
      winningPlayer = winningMove.getPlayer()

      self.cardGame.scores.registerWin(winningPlayer)
      self.cardGame.startingPlayerIndex = self.players.index(winningPlayer)
      
      jsonResponse['hand'] = hand
      jsonResponse['winningCard'] = winningMove.card
      jsonResponse['winningPlayer'] = winningPlayer.name

    except Exception as ex:
      self.handler.sendError(ex)
      raise

    self.handler.sendMessage(jsonResponse)

class MainHandler(tornado.web.RequestHandler):
  def get(self):
    self.render("index.html")

class SocketHandler(tornado.websocket.WebSocketHandler):
  def open(self):
    print "Websocket opened"
    messageHandler = MessageHandler(self)
    self.gameServer = GameServer(messageHandler)

  def on_message(self, message):
    json = tornado.escape.json_decode(message) 
    print "Message received: %s" % json
  
    if (json['command'] == 'startGame'):
      self.gameServer.startGame(json['playerName'])
    elif (json['command'] == 'dealFirstCards'):
      self.gameServer.dealFirstCards(json)
    elif (json['command'] == 'chooseTrump'):
      self.gameServer.chooseTrump(json)
    elif (json['command'] == 'isReady'):
      self.gameServer.registerReady(json)

  def on_close(self):
    print "Websocket closed"

application = tornado.web.Application([
  (r"/", MainHandler),
  (r"/websocket", SocketHandler),
  (r"/presentation/(.*)", tornado.web.StaticFileHandler, {"path": "presentation"}),
  (r"/behaviour/(.*)", tornado.web.StaticFileHandler, {"path": "behaviour"}),
  (r"/config/(.*)", tornado.web.StaticFileHandler, {"path": "config"}),
  (r"/images/(.*)", tornado.web.StaticFileHandler, {"path": "images"}),
  ], debug=True)

if __name__ == "__main__":
  application.listen(8888)
  tornado.ioloop.IOLoop.instance().start()
