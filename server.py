import tornado.ioloop
import tornado.web
import tornado.websocket

import json

from game import CardGame
from player import HumanPlayer, Player

class GameServer():
  def __init__(self, socket):
    self.socket = socket
  
  def createPlayers(self, playerName="John Doe"):
    p1 = HumanPlayer(playerName, "A")
    p2 = Player("Elvis Presley","A")
    p3 = Player("Bob Marley", "B")
    p4 = Player("Amy Winehouse", "B")
    return [p1,p3,p2,p4]

  def startGame(self, playerName):
    jsonResponse = {}
    try:
      self.players = self.createPlayers(playerName)
      self.cardGame = CardGame(self.players)

      jsonResponse['resultCode'] = 'SUCCESS'
      
      self.cardGame.decideOrder()
     
      playersList = []
      i = 0
      for player in self.cardGame.getPlayersInOrder():
        playersList.append( {'index' : i, 'name': player.name} )
        i = i + 1

      jsonResponse['startingPlayerIndex'] = self.cardGame.startingPlayerIndex
      jsonResponse['players'] = playersList
      jsonResponse['gameId'] = str(self.cardGame.id)

    except Exception as ex:
      jsonResponse['resultCode'] = 'FAILURE' 
      jsonResponse['resultMessage'] = str(ex)
      self.socket.write_message(jsonResponse)
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
