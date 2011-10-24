import tornado.ioloop
import tornado.web
import tornado.websocket

import json

from game import CardGame
from cards import Card, Deck, HandInfo, PlayerMove
from player import HumanPlayer, Player

class MessageEncoder(json.JSONEncoder):

  def default(self, obj):
    if isinstance(obj, Card):
      return {'rank' : obj.rank, 'suit' : obj.suit}
    elif isinstance(obj, HandInfo):
      moves = [ {'card' : self.default(move.card), 'player' : move.player.id } for move in obj.playerMoves]
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

class GameServer():
  def __init__(self, handler):
    self.handler = handler
  
  def createPlayers(self, playerName="John Doe"):
    p1 = HumanPlayer(1, playerName, "A", self.handler)
    p2 = Player(2, "Elvis Presley","A")
    p3 = Player(3, "Bob Marley", "B")
    p4 = Player(4, "Amy Winehouse", "B")
    return [p1,p3,p2,p4]

  def startGame(self, playerName):
    jsonResponse = {'response' : 'startGame'}
    try:
      self.players = self.createPlayers(playerName)
      self.cardGame = CardGame(self.players)

      jsonResponse['resultCode'] = 'SUCCESS'

      #self.cardGame.decideOrder()
      # override to set humanplayer as first
      self.cardGame.startingPlayerIndex = 0
      self.cardGame.setPlayingOrder()
     
      playersList = []
      i = 0
      for player in self.cardGame.getPlayers():
        playersList.append( {'index' : i, 'name': player.name, 'id' : player.id} )
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

  def askPlayers(self, req):
    while not self.hand.isComplete():
      player = self.cardGame.getNextPlayer(self.hand.getStep())

        # asynchronous via websocket
      if isinstance(player, HumanPlayer):
          message = {}
          message['response'] = 'askMove'
          message['hand'] = self.hand
          self.handler.sendMessage(message)
          break
      else:
          card = player.getNextMove(hand)
          self.hand.addPlayerMove(PlayerMove(player, card))
          print "%s played %s" % (player.name,card)

      if self.hand.isComplete():
        winningMove = self.hand.decideWinner(self.cardGame.trumpSuit)
        winningPlayer = winningMove.getPlayer()

        self.cardGame.scores.registerWin(winningPlayer)
        self.cardGame.startingPlayerIndex = self.players.index(winningPlayer)

        jsonResponse['hand'] = hand
        jsonResponse['winningCard'] = winningMove.card
        jsonResponse['winningPlayer'] = winningPlayer.id
        self.handler.sendMessage(jsonResponse)

  def madeMove(self, req):
    jsonResponse = {'response' : 'handPlayed'}

    player = self.cardGame.getPlayerById(req.id) 
    playedCard = Card(req.suit, req.rank)

    try:
      self.hand.append(PlayerMove(player, card))
      self.askPlayers(req)
    except Exception as ex:
      self.handler.sendError(ex)
      raise
  
  def playHand(self, req):
    jsonResponse = {'response' : 'handPlayed'}
    try:
      self.hand = HandInfo()
      self.askPlayers(req)
    except Exception as ex:
      self.handler.sendError(ex)
      raise

class MainHandler(tornado.web.RequestHandler):
  def get(self):
    self.render("index.html")

class SocketHandler(tornado.websocket.WebSocketHandler):
  def open(self):
    print "Websocket opened"
    writer = MessageWriter(self)
    self.gameServer = GameServer(writer)

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
