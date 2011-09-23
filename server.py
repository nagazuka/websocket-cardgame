import tornado.ioloop
import tornado.web
import tornado.websocket

import json

from game import CardGame
from player import HumanPlayer, Player

class GameServer():
  def __init__(self, socket):
    self.socket = socket

  def writeError(self, exception):
    jsonResponse = {}
    jsonResponse['resultCode'] = 'FAILURE' 
    jsonResponse['resultMessage'] = str(exception)
    self.socket.write_message(jsonResponse)
  
  def createPlayers(self, playerName="John Doe"):
    p1 = Player(playerName, "A")
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
      self.writeError(ex)
      raise

    self.socket.write_message(jsonResponse)

  def dealFirstCards(self, jsonReq):
    jsonResponse = {'response' : 'dealFirstCards'}
    try:
      index = int(jsonReq['playerIndex'])
      self.cardGame.dealFirstCards()
      firstCards = self.cardGame.players[index].getCards()
      
      jsonResponse['cards'] = [{'rank' : card.rank, 'suit' : card.suit} for card in firstCards]
    except Exception as ex:
      self.writeError(ex)
      raise

    self.socket.write_message(jsonResponse)

class MainHandler(tornado.web.RequestHandler):
  def get(self):
    self.render("index.html")

class SocketHandler(tornado.websocket.WebSocketHandler):
  def open(self):
    print "Websocket opened"
    self.gameServer = GameServer(self)

  def on_message(self, message):
    json = tornado.escape.json_decode(message) 
    print "Message received: %s" % json
  
    if (json['command'] == 'startGame'):
      self.gameServer.startGame(json['playerName'])
    elif (json['command'] == 'dealFirstCards'):
      self.gameServer.dealFirstCards(json)

  def on_close(self):
    print "Websocket closed"

application = tornado.web.Application([
  (r"/", MainHandler),
  (r"/websocket", SocketHandler),
  (r"/presentation/(.*)", tornado.web.StaticFileHandler, {"path": "presentation"}),
  (r"/behaviour/(.*)", tornado.web.StaticFileHandler, {"path": "behaviour"}),
  (r"/images/(.*)", tornado.web.StaticFileHandler, {"path": "images"}),
  ], debug=True)

if __name__ == "__main__":
  application.listen(8888)
  tornado.ioloop.IOLoop.instance().start()
