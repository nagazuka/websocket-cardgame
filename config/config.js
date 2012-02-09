/**
 * External configuration file. 
 */ 
var conf = {
  lang: 'nl',

  font: 'Helvetica',	

	network: {
    wsURL : 'ws://nagazuka.nl:8080/websocket'
	},

  avatarDirectory: 'images/avatars/',  
  flagDirectory: 'images/flags/64/', 

  teamFlags: {
    'Team Suriname': 'Suriname.png',
    'Team Nederland': 'Netherlands.png',
    'default': 'default.png',
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
