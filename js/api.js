/**
	JavaScript API to work with GrünStromJetons
	Author: Thorsten Zoerner <me@thorsten-zoerner.com>
	Version: 0.1
	License: MIT
	Dependency: EthersWallet
	
	Demo and Documentation: https://zoernert.github.io/samples/
*/

var call_delay=10000;

Number.prototype.format = function(n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&.');
};

gsi = {};
gsi.obj = [];
calls = [];
gsi.logs = [];
gsi.gas=20000;
gsi.app = {};
gsi.status = {};

/**
	Performs a pseudo login using a given private key (length=66 bytes) 
	If no private key is present - it tries to open existing key from localStorage	
	Changes gsi.status.login to true if login was successful
*/
gsi.app.login = function(private_key) {
		if(!private_key) {
			private_key=window.localStorage.getItem("gsi.pk");
		}
		if(private_key.length!=66) {
			gsi.status.login=false;
			throw "Invalid Key Length";
			return;  
		}
		window.localStorage.setItem("gsi.pk",private_key);
		gsi.wallet=new Wallet(private_key, new Wallet.providers.EtherscanProvider({testnet: false}));
		window.localStorage.setItem("gsi.address",gsi.wallet.address);
		gsi.address=gsi.wallet.address;
		gsi.status.login=true;		
}

/**
	Performs a pseudo logout by removing private key from localStorage
	There is no option to get it back!
*/
gsi.app.logout = function() {
		gsi.status.login=false;
		window.localStorage.setItem("gsi.pk","");
		window.localStorage.setItem("gsi.address","");
		gsi.address="";
		gsi.wallet=null;
}

/**
	Performs a pseudo registration by creating a new key and saves it to localStorage
	Returns new key created.
	Does not login user.
*/
gsi.app.newKey = function() {
		var array = new  Uint16Array(32);
		var pk = new Wallet.utils.Buffer(window.crypto.getRandomValues(array));										
		var wallet = new Wallet(pk, new Wallet.providers.EtherscanProvider({testnet: false}));					
		window.localStorage.setItem("gsi.pk",wallet.privateKey);
		gsi.status.login=false;
		return wallet.privateKey;		
}

