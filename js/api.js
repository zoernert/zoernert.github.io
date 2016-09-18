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

gsi.app.login = function(private_key) {
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

gsi.app.logout = function() {
		gsi.status.login=false;
		window.localStorage.setItem("gsi.pk","");
		window.localStorage.setItem("gsi.address","");
		gsi.address="";
		gsi.wallet=null;
}

gsi.app.newKey = function() {
		var array = new  Uint16Array(32);
		var pk = new Wallet.utils.Buffer(window.crypto.getRandomValues(array));
		window.localStorage.setItem("gsi.pk",pk);
		gsi.status.login=false;
		return pk;		
}

