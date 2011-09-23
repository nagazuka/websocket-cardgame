import tornado.ioloop
import tornado.web
import tornado.websocket

import json

from game import CardGame

class MainHandler(tornado.web.RequestHandler):
  def get(self):
    self.render("index.html")

class SocketHandler(tornado.websocket.WebSocketHandler):
  def open(self):
    print "Websocket opened"
    self.cardGame = CardGame()

  def on_message(self, message):
    json = tornado.escape.json_decode(message) 
    print "Message received: %s" % json
  
    jsonResponse = {}
    if (json['command'] == 'startGame'):
      self.cardGame.decideOrder()
      players = []
      for player in self.cardGame.players:
        players.append({'name' : player.name}) 
      jsonResponse['startingPlayerIndex'] = self.cardGame.startingPlayerIndex
      jsonResponse['players'] = players

    self.write_message("%s" % jsonResponse)

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
