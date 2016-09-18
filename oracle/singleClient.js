Error.stackTraceLimit = Infinity;
var Web3 = require('web3');
var fs = require('fs');
var http = require('http');
var Wallet = require("ethers-wallet");

deployment=JSON.parse(fs.readFileSync("../gsi/js/current.deployment.json"));
gsi_abi=JSON.parse(fs.readFileSync("../gsi/build/GSI.abi"));
var pk=fs.readFileSync("../../pk").toString();
gsi = {};

function doOracle(orcalizefor) {
	console.log("Oracalize For",orcalizefor);	
	gsi.contract.lastReading(orcalizefor).then(function (v) {
	    gsi.lastReading=v[1].toString()*1;
	    
	    gsi.contract.requestReading(orcalizefor).then(function (w) {
	        gsi.requestReading=w[1].toString()*1;
	        console.log("Last",gsi.lastReading);
	        console.log("Request",gsi.requestReading);
	        if((gsi.lastReading<gsi.requestReading)&&(gsi.lastReading!=0)) {
	             var distr=gsi.requestReading-gsi.lastReading;
	            if(distr>25000) distr=25000;
	            if(distr<1) distr=0;
	       	// HTTP Request http://mix.stromhaltig.de/gsi/json/json_avg.php?plz=69256&t1=
    		var options = {
    			host: 'mix.stromhaltig.de',
    			port: 80,
    			path: '/gsi/json/json_avg.php?plz='+w[2]+'&t1='+(v[0].toString())
    		};
    		http.request(options, function(response) {
    			var str = ''
    			  response.on('data', function (chunk) {
    				str += chunk;
    			  });
    
    			  response.on('end', function () {
    				var gsi_obj=JSON.parse(str);
    				if(gsi_obj.gsi) {
    						var gsi_val=gsi_obj.gsi-0.5;
    						gsi_val*=1;
    						gsi_val*=distr;
    						console.log("Oracle GSI_VAL",orcalizefor,gsi_val);
    						if(gsi_val<0) {
    							gsi.contract.mintGrey(orcalizefor,Math.round(gsi_val*(-1))).then(function(e,r) { console.log(e,r);});
    						} else {
    							gsi.contract.mintGreen(orcalizefor,Math.round(gsi_val)).then(function(e,r) { console.log(e,r);});
    						}	
    						gsi.contract.commitReading(orcalizefor).then(function(e) {console.log("Commit:",e);});
    				}
    			  });
    		}).end();
	            
	        }  else {
	            console.log("Unexcepted Read or No Read");
	            if(v[1].toString()<w[1].toString()) {
	                console.log("-> Commit");
	                gsi.contract.commitReading(orcalizefor).then(function(e) {console.log("Commit:",e);});
	            }
	            // Commit Request in case someone forgot...
	        }
	        
	    });
	}); 
}


var o4= '0xD87064f2CA9bb2eC333D4A0B02011Afdf39C4fB0';

gsi.wallet = new Wallet(pk, new Wallet.providers.EtherscanProvider({testnet: false}));
gsi.contract =gsi.wallet.getContract(deployment.gsi, gsi_abi);
console.log("Oracle Service on ",gsi.wallet.address);
doOracle(o4);