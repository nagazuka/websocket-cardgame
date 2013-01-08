import unittest
import logging

from game import CardGame
from cards import Card

class GameTest(unittest.TestCase):

    def testPickBestSuit(self):

        cards = []
        cards.append(Card('D',1))
        cards.append(Card('D',2))
        cards.append(Card('D',3))
        cards.append(Card('S',1))
        cards.append(Card('C',13))
        trump = CardGame.pickBestSuit(cards)
        print(trump) 
        self.assertEqual(trump, 'D', "trump is not D")

if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG, 
                        format='%(asctime)s %(levelname)s %(message)s')

    unittest.main()
