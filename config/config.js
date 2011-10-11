/**
 * External configuration file. 
 */ 
var conf = {
	
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
		hostName: 'localhost',
		portNumber: 8888
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
	
}

