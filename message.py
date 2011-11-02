import tornado.websocket
import json

from cards import Card, HandInfo

class MessageHandler(tornado.websocket.WebSocketHandler):

  def initialize(self, gameServer):
    self.gameServer = gameServer
    writer = MessageWriter(self)
    self.gameServer.setWriter(writer)

  def open(self):
    print "Websocket opened"

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
      self.gameServer.playHand(json)
    elif (json['command'] == 'makeMove'):
      self.gameServer.madeMove(json)

  def on_close(self):
    print "Websocket closed"

class MessageEncoder(json.JSONEncoder):

  def default(self, obj):
    if isinstance(obj, Card):
      return {'rank' : obj.rank, 'suit' : obj.suit}
    elif isinstance(obj, HandInfo):
      moves = [ {'index': move.index, 'card': self.default(move.card), 'player': move.player.id } for move in obj.playerMoves]
      return moves

    return self.convert_to_builtin_type(obj)

  def convert_to_builtin_type(self, obj):
    # Convert objects to a dictionary of their representation
    d = { '__class__':obj.__class__.__name__, 
          '__module__':obj.__module__,
          }
    d.update(obj.__dict__)
    return d

class MessageWriter():
  def __init__(self, socket):
    self.socket = socket

  def sendMessage(self, message):
    print "Sending message: %s" % message
    self.socket.write_message(json.dumps(message, cls=MessageEncoder))
  
  def sendError(self, exception):
    jsonResponse = {}
    jsonResponse['resultCode'] = 'FAILURE' 
    jsonResponse['resultMessage'] = str(exception)
    self.socket.write_message(jsonResponse)
