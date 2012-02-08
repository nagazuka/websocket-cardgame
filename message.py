import json
import logging

from cards import Card, HandInfo

class MessageEncoder(json.JSONEncoder):

    def default(self, obj):
        if isinstance(obj, Card):
            return {'rank': obj.rank, 'suit': obj.suit}
        elif isinstance(obj, HandInfo):
            moves = [{'sequenceNumber': move.sequenceNumber, 'card': self.default(move.card),
                      'playerId': move.player.id} for move in obj.playerMoves]
            return moves
        return MessageEncoder.convert_to_builtin_type(obj)

    @staticmethod
    def convert_to_builtin_type(obj):
        # Convert objects to a dictionary of their representation
        d = {'__class__': obj.__class__.__name__,
           '__module__': obj.__module__,
          }
        d.update(obj.__dict__)
        return d


class MessageWriter():
    def __init__(self, socket):
        self.socket = socket

    def sendMessage(self, message):
        logging.debug("Sending message: %s", message)
        self.socket.write_message(json.dumps(message, cls=MessageEncoder))

    def sendError(self, exception):
        jsonResponse = {}
        jsonResponse['response'] = 'exception'
        jsonResponse['resultMessage'] = str(exception)
        self.socket.write_message(jsonResponse)
