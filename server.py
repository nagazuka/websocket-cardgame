import tornado.ioloop
import tornado.web
import tornado.websocket

from message import MessageHandler, MessageEncoder, MessageWriter
from game import CardGame
from cards import Card, Deck, HandInfo, PlayerMove
from player import HumanPlayer, Player


class GameServer():
  def __init__(self, handler):
    self.handler = handler
  
  def createPlayers(self, playerName="John Doe"):
    p1 = HumanPlayer(1, playerName, "A", self.handler)
    p2 = Player(2, "Elvis Presley","A")
    p3 = Player(3, "Bob Marley", "B")
    p4 = Player(4, "Jimi Hendrix", "B")
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
        playersList.append( {'index' : i, 'name': player.name, 'id' : player.id, 'isHuman' : isinstance(player, HumanPlayer)} )
        i = i + 1

      jsonResponse['players'] = playersList
      jsonResponse['playingOrder'] = self.cardGame.getOrder()
      jsonResponse['gameId'] = str(self.cardGame.id)

    except Exception as ex:
      self.handler.sendError(ex)
      raise

    self.handler.sendMessage(jsonResponse)

  def dealFirstCards(self, request):
    response = {'response' : 'dealFirstCards'}
    try:
      self.cardGame.dealFirstCards()
      player = self.cardGame.getPlayerById(request['playerId']) 
      firstCards = player.getCards()
      print "Total nr of cards: %s" % len(firstCards)
      
      response['cards'] = [{'rank' : card.rank, 'suit' : card.suit} for card in firstCards]
    except Exception as ex:
      self.handler.sendError(ex)
      raise

    self.handler.sendMessage(response)
  
  def chooseTrump(self, request):
    jsonResponse = {'response' : 'allCards'}
    try:
      trumpSuit = request['suit']
      self.cardGame.chooseTrump(trumpSuit)
      self.cardGame.dealCards() 

      player = self.cardGame.getPlayerById(request['playerId']) 
      allCards = player.getCards()
      print "Total nr of cards: %s" % len(allCards)
      jsonResponse['cards'] = [{'rank' : card.rank, 'suit' : card.suit} for card in allCards]

    except Exception as ex:
      self.handler.sendError(ex)
      raise

    self.handler.sendMessage(jsonResponse)

  def askPlayers(self, req):
    jsonResponse = {'response' : 'handPlayed'}
    while not self.hand.isComplete():
      player = self.cardGame.getNextPlayer(self.hand.getStep())
      
      print "Asking player %s for move" % player.name

        # asynchronous via websocket
      if isinstance(player, HumanPlayer):
          message = {}
          message['response'] = 'askMove'
          message['hand'] = self.hand
          self.handler.sendMessage(message)
          break
      else:
          card = player.getNextMove(self.hand)
          self.hand.addPlayerMove(PlayerMove(player, card))
          print "%s played %s" % (player.name,card)

      if self.hand.isComplete():
        winningMove = self.hand.decideWinner(self.cardGame.trumpSuit)
        winningPlayer = winningMove.getPlayer()
    
        print "Winner is %s\n" % winningPlayer

        self.cardGame.scores.registerWin(winningPlayer)
        self.cardGame.changePlayingOrder(winningPlayer)

        jsonResponse['hand'] = self.hand
        jsonResponse['winningCard'] = winningMove.card
        jsonResponse['winningPlayerId'] = winningPlayer.id
        self.handler.sendMessage(jsonResponse)

  def madeMove(self, req):
    jsonResponse = {'response' : 'handPlayed'}
    player = self.cardGame.getPlayerById(req['playerId']) 
    playedCard = Card(req['suit'], req['rank'])

    try:
      self.hand.addPlayerMove(PlayerMove(player, playedCard))
      self.askPlayers(req)
    except Exception as ex:
      self.handler.sendError(ex)
      raise
  
  def playHand(self, req):
    try:
      if self.cardGame.isDecided():
        response = {'response' : 'gameDecided'}
        self.handler.sendMessage(response)
      else:
        self.hand = HandInfo()
        self.askPlayers(req)

    except Exception as ex:
      self.handler.sendError(ex)
      raise
    
class MessageHandler(tornado.websocket.WebSocketHandler):
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

class MainHandler(tornado.web.RequestHandler):
  def get(self):
    self.render("index.html")

application = tornado.web.Application([
  (r"/", MainHandler),
  (r"/websocket", MessageHandler),
  (r"/presentation/(.*)", tornado.web.StaticFileHandler, {"path": "presentation"}),
  (r"/behaviour/(.*)", tornado.web.StaticFileHandler, {"path": "behaviour"}),
  (r"/config/(.*)", tornado.web.StaticFileHandler, {"path": "config"}),
  (r"/images/(.*)", tornado.web.StaticFileHandler, {"path": "images"}),
  ], debug=True)

if __name__ == "__main__":
  application.listen(8888)
  tornado.ioloop.IOLoop.instance().start()
