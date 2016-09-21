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

 if (typeof web3 !== 'undefined') {
    // Use Mist/MetaMask's provider
    web3 = new Web3(web3.currentProvider);
	//gsi.provider=web3;
  } else {
    console.log('No web3? You should consider trying MetaMask! or Mist...')    
	// Not Supported!
}
if(!gsi.provider) {
	gsi.provider= new Wallet.providers.EtherscanProvider({testnet: false});
}

/************************************************************/
/*  Login/Account Management Related Functions				*/
/************************************************************/
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
		gsi.wallet=new Wallet(private_key, gsi.provider);
		window.localStorage.setItem("gsi.address",gsi.wallet.address);
		gsi.address=gsi.wallet.address;			
		$.getJSON("https://zoernert.github.io/js/current.deployment.json",function(data) {
			gsi.deployment=data;	
			$.getJSON("https://zoernert.github.io/build/GSI.abi",function(abi_code) {
					gsi.obj.GSI = gsi.wallet.getContract(gsi.deployment.gsi,abi_code);
					gsi.status.login=true;	
					
					$.getJSON("https://zoernert.github.io/build/GSIToken.abi",function(token_abi) {
						gsi.obj.GSI.greenToken().then(function(r) {		
								gsi.obj.greenToken=gsi.wallet.getContract(r[0],token_abi);							
						});	
						gsi.obj.GSI.greyToken().then(function(r) {		
								gsi.obj.greyToken=gsi.wallet.getContract(r[0],token_abi);							
						});	
					});
			});
		});
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
		var wallet = new Wallet(pk, gsi.provider);					
		window.localStorage.setItem("gsi.pk",wallet.privateKey);
		gsi.status.login=false;
		return wallet.privateKey;		
}

/** 
	Called by other methods to ensure that we have a valid Wallet object (user is logged in)
	Calls Callback as soon as user is logged in and SmartContract is loaded.
*/
gsi.app.forceLogin=function(cb) {
		if((!gsi.obj.GSI)||(!gsi.obj.greenToken)||(!gsi.obj.greyToken)) {
			private_key=window.localStorage.getItem("gsi.pk");
			if(private_key.length!=66) {
				private_key=gsi.app.newKey();
			}
			gsi.app.login(private_key);
			setTimeout(function() {gsi.app.forceLogin(cb);},500);
		} else {
			cb();
		}
}

/************************************************************/
/*  Balance Related Functions								*/
/************************************************************/

/**
	Returns Green-Power Balance of Address to callback cb(num)
*/
gsi.app.balanceOfGreen=function(address,cb) {
		if(!gsi.obj.greenToken) {  gsi.app.forceLogin(function() { gsi.app.balanceOfGreen(address,cb); });} 
		else {
			gsi.obj.greenToken.balanceOf(address).then(function(v) {
							cb(v.toString()*1);
			});
		}
}

/**
	Returns Green-Power Balance of Address to callback cb(num)
*/
gsi.app.balanceOfGrey=function(address,cb) {
		if(!gsi.obj.greyToken) {  gsi.app.forceLogin(function() { gsi.app.balanceOfGrey(address,cb); });} 
		else {
			gsi.obj.greyToken.balanceOf(address).then(function(v) {
							cb(v.toString()*1);
			});
		}
}


/************************************************************/
/*  Meter Reading related Functions							*/
/************************************************************/

/**
	Commits MeterReading and returns transaction hash to callback. 
*/
gsi.app.commitReading=function(reading,cb) {
		if(!gsi.obj.GSI) {  gsi.app.forceLogin(function() { gsi.app.commitReading(reading,cb); }); return;} 
		var options = {
			value:gsi.gas
		};
		gsi.obj.GSI.oracalizeReading(reading*1,options).then(function(e)  {			
			cb(e);
		});
}

/**
	Sets Postleitzahl (ZIP-Code in Germany) for account and returns transaction hash to callback
*/

gsi.app.setPLZ=function(plz,cb) {
		if(plz.length!=5) return;
		if(!gsi.obj.GSI) {  gsi.app.forceLogin(function() { gsi.app.setPLZ(reading,cb); }); return;} 
		gsi.obj.GSI.setPlz(plz).then(function(e) {cb(e);});
}

