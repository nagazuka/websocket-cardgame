/**
 * External configuration file. 
 */ 
var conf = {
  lang: 'nl',

  font: 'Ubuntu',	

	network: {
    wsURL : 'ws://nagazuka.nl:8080/websocket'
	},
  
  imageDir: 'images/',
  avatarDirectory: 'images/avatars/',  
  flagDirectory: 'images/flags/64/', 
  suitsDirectory: 'images/suits/', 
  cardsDirectory: 'images/cards/', 
  
  suitIcons: {
    'SPADES': 'Spades64.png',
    'CLUBS': 'Clubs64.png',
    'DIAMONDS': 'Diamond64.png',
    'HEARTS': 'Hearts64.png',
    'default': 'default.png'
  },

  teamFlags: {
    'Team Suriname': 'Suriname.png',
    'Team Nederland': 'Netherlands.png',
    'default': 'default.png'
  },
	
	// my skins
	skins: {		
		gray:  {
			backgroundColor: '#666666',
			buttonColor: '#333333',
			opacity: 0,
			time: false,
			autoHide: false
		}
	}
	
};
