/**
 * External configuration file. 
 */ 
var conf = {
  lang: 'nl',	
	// default clip configuration
	defaults: {
		
		autoPlay: false,
		autoBuffering: true,
		baseUrl: 'http://blip.tv/file/get',
	
		// functions are also supported
		onBegin: function() {
			
			// make controlbar visible, fade lasts 4 seconds
			this.getControls().fadeIn(4000);
		}
		
	},

	network: {
    wsURL : 'ws://localhost:8888/websocket'
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
		
		// setup additional skins here ...		
	}
	
};

var messages = {
  nl: {
    noWebSocketSupport: 'No WebSocket support',
    chooseTrump:  'Kies je troef',
    yourTurn:  'Jij bent aan de beurt...',
    youWinHand:  'Jij hebt deze hand gemaakt!',
    otherWinsHand: '\nheeft deze hand gemaakt!',
    errorMessage:  'Ai ai ai!\nEr is een fout opgetreden.'
  }
};
